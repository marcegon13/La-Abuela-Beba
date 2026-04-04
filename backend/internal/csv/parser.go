package csv

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"
	"time"

	"labeba/internal/models"

	"github.com/google/uuid"
)

// DateFormats that we try to parse from the CSV files
var dateFormats = []string{
	"02/01/2006", // DD/MM/YYYY (Argentina standard)
	"2/1/2006",   // D/M/YYYY
	"2006-01-02", // YYYY-MM-DD (ISO)
	"01/02/2006", // MM/DD/YYYY (US)
	"02-01-2006", // DD-MM-YYYY
}

// ColumnMapping defines which CSV column index maps to which field.
// This is flexible: different CSVs may have columns in different orders.
type ColumnMapping struct {
	Nombre       int
	DNI          int
	Procedencia  int
	CanalOrigen  int
	FechaReserva int
}

// DefaultMapping assumes the CSV has columns in this order:
// nombre, dni, procedencia, canal_origen, fecha_reserva
func DefaultMapping() ColumnMapping {
	return ColumnMapping{
		Nombre:       0,
		DNI:          1,
		Procedencia:  2,
		CanalOrigen:  3,
		FechaReserva: 4,
	}
}

// DetectMapping reads the header row and auto-detects column positions.
// Returns a ColumnMapping with the detected positions, or an error if required columns are missing.
func DetectMapping(header []string) (ColumnMapping, error) {
	m := ColumnMapping{
		Nombre: -1, DNI: -1, Procedencia: -1, CanalOrigen: -1, FechaReserva: -1,
	}

	for i, col := range header {
		normalized := strings.ToLower(strings.TrimSpace(col))
		switch {
		case normalized == "nombre" || normalized == "name" || normalized == "huesped" || normalized == "huésped":
			m.Nombre = i
		case normalized == "dni" || normalized == "documento" || normalized == "doc":
			m.DNI = i
		case normalized == "procedencia" || normalized == "origen" || normalized == "ciudad" || normalized == "localidad":
			m.Procedencia = i
		case normalized == "canal" || normalized == "canal_origen" || normalized == "canal origen" || normalized == "fuente" || normalized == "source":
			m.CanalOrigen = i
		case normalized == "fecha" || normalized == "fecha_reserva" || normalized == "fecha reserva" || normalized == "check_in" || normalized == "checkin" || normalized == "check-in":
			m.FechaReserva = i
		}
	}

	// Validate required fields
	if m.Nombre == -1 {
		return m, fmt.Errorf("columna 'nombre' no encontrada en el header: %v", header)
	}
	if m.DNI == -1 {
		return m, fmt.Errorf("columna 'dni' no encontrada en el header: %v", header)
	}

	return m, nil
}

// ParseCSV reads a CSV from the given reader and returns a list of HuespedHistorico records.
// It auto-detects column mapping from the header row.
// If hasHeader is false, it uses the DefaultMapping.
func ParseCSV(reader io.Reader, hasHeader bool) ([]models.HuespedHistorico, *models.CSVImportResult, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true
	csvReader.LazyQuotes = true // Be lenient with quotes

	result := &models.CSVImportResult{}
	var records []models.HuespedHistorico
	var mapping ColumnMapping

	lineNum := 0
	for {
		row, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors++
			result.ErrorDetails = append(result.ErrorDetails, fmt.Sprintf("fila %d: error de lectura: %v", lineNum+1, err))
			continue
		}
		lineNum++

		// First row: detect header or use default mapping
		if lineNum == 1 {
			if hasHeader {
				detectedMapping, err := DetectMapping(row)
				if err != nil {
					return nil, result, fmt.Errorf("error detectando columnas: %w", err)
				}
				mapping = detectedMapping
				continue // Skip header row
			} else {
				mapping = DefaultMapping()
			}
		}

		result.TotalRows++

		// Extract fields safely
		nombre := safeGet(row, mapping.Nombre)
		dni := cleanDNI(safeGet(row, mapping.DNI))
		procedencia := safeGet(row, mapping.Procedencia)
		canalOrigen := safeGet(row, mapping.CanalOrigen)
		fechaStr := safeGet(row, mapping.FechaReserva)

		// Validate required fields
		if nombre == "" {
			result.Errors++
			result.ErrorDetails = append(result.ErrorDetails, fmt.Sprintf("fila %d: nombre vacío", lineNum))
			continue
		}
		if dni == "" {
			result.Errors++
			result.ErrorDetails = append(result.ErrorDetails, fmt.Sprintf("fila %d: DNI vacío para '%s'", lineNum, nombre))
			continue
		}

		// Parse date
		fecha, err := parseDate(fechaStr)
		if err != nil {
			// If date is unparseable, use epoch as placeholder
			fecha = time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)
			result.ErrorDetails = append(result.ErrorDetails, fmt.Sprintf("fila %d: fecha '%s' no reconocida, usando 2023-01-01", lineNum, fechaStr))
		}

		record := models.HuespedHistorico{
			ID:           uuid.New(),
			Nombre:       strings.TrimSpace(nombre),
			DNI:          dni,
			Procedencia:  strings.TrimSpace(procedencia),
			CanalOrigen:  normalizeCanalOrigen(canalOrigen),
			FechaReserva: fecha,
			CreatedAt:    time.Now(),
		}

		records = append(records, record)
		result.Imported++
	}

	return records, result, nil
}

// --- Helper Functions ---

// safeGet returns the value at index i in the row, or empty string if out of bounds.
func safeGet(row []string, i int) string {
	if i < 0 || i >= len(row) {
		return ""
	}
	return row[i]
}

// cleanDNI removes dots, dashes, and spaces from a DNI string.
func cleanDNI(raw string) string {
	cleaned := strings.ReplaceAll(raw, ".", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	return strings.TrimSpace(cleaned)
}

// parseDate tries multiple date formats and returns the first successful parse.
func parseDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, fmt.Errorf("fecha vacía")
	}
	for _, format := range dateFormats {
		t, err := time.Parse(format, s)
		if err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("formato no reconocido: %s", s)
}

// normalizeCanalOrigen standardizes the booking channel name.
func normalizeCanalOrigen(raw string) string {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.Contains(normalized, "airbnb"):
		return "Airbnb"
	case strings.Contains(normalized, "booking"):
		return "Booking"
	case strings.Contains(normalized, "amigo") || strings.Contains(normalized, "boca") || strings.Contains(normalized, "recomend"):
		return "Amigo"
	case strings.Contains(normalized, "instagram") || strings.Contains(normalized, "insta") || strings.Contains(normalized, "ig"):
		return "Instagram"
	case strings.Contains(normalized, "facebook") || strings.Contains(normalized, "fb"):
		return "Facebook"
	case strings.Contains(normalized, "direct") || strings.Contains(normalized, "whatsapp") || strings.Contains(normalized, "wa"):
		return "Directo"
	case normalized == "":
		return "Sin datos"
	default:
		return strings.Title(strings.TrimSpace(raw))
	}
}
