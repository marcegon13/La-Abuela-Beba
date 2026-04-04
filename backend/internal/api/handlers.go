package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	csvparser "labeba/internal/csv"
	"labeba/internal/email"
	"labeba/internal/logic"
	"labeba/internal/models"
	"labeba/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ActionRequest struct {
	UserID     string `json:"user_id"`
	ActionType string `json:"action_type"`
}

type Handler struct {
	Repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{Repo: repo}
}

func (h *Handler) CreateBookingHandler(w http.ResponseWriter, r *http.Request) {
	var req models.ReservationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic Validation
	if req.UserID == "" || req.SpotID == "" {
		http.Error(w, "User ID and Spot ID are required", http.StatusBadRequest)
		return
	}
	if req.StartDate.After(req.EndDate) {
		http.Error(w, "Start date must be before end date", http.StatusBadRequest)
		return
	}

	// Parse UUIDs
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}
	spotID, err := uuid.Parse(req.SpotID)
	if err != nil {
		http.Error(w, "Invalid Spot ID format", http.StatusBadRequest)
		return
	}

	// Calculate Dynamic Price
	// Logic: Base Price * Days * Discount Factor based on lead time
	// Note: Logic package handles the discount factor
	days := req.EndDate.Sub(req.StartDate).Hours() / 24
	if days < 1 {
		days = 1
	}

	discountedUnitTestPrice := logic.CalculateDynamicPrice(req.BasePrice, req.StartDate)
	totalPrice := discountedUnitTestPrice * days

	// Prepare Model
	reservation := &models.Reservation{
		UserID:     userID,
		SpotID:     spotID,
		StartDate:  req.StartDate,
		EndDate:    req.EndDate,
		TotalPrice: totalPrice,
	}

	// Save to DB (Transaction)
	if err := h.Repo.CreateReservationWithImpact(reservation); err != nil {
		http.Error(w, "Failed to create reservation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Reserva confirmada con éxito",
		"reservation":   reservation,
		"impact_points": 100,
		"impact_desc":   "Reserva inicial: apoyo a economía local",
	})
}

// GetImpactHandler returns the total impact points and level for a user
func (h *Handler) GetImpactHandler(w http.ResponseWriter, r *http.Request) {
	userIdStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIdStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	totalPoints, err := h.Repo.GetUserTotalImpact(userID)
	if err != nil {
		http.Error(w, "Failed to get user impact", http.StatusInternalServerError)
		return
	}

	// Calculate Level
	var level string
	switch {
	case totalPoints >= 501:
		level = "Árbol"
	case totalPoints >= 201:
		level = "Brote"
	default:
		level = "Semilla" // 0-200
	}

	// Check for Token
	token, err := h.Repo.GetUserToken(userID)
	if err != nil {
		// Log error but continue, assuming no token or temporary failure
		// In a real app, use a logger
		fmt.Printf("Error checking token: %v\n", err)
	}

	isOwner := token != nil
	tokenCode := ""
	if isOwner {
		tokenCode = token.TokenCode
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id":           userID,
		"total_points":      totalPoints,
		"level":             level,
		"available_credits": logic.PointsToCredits(totalPoints),
		"is_owner":          isOwner,
		"token_code":        tokenCode,
	})
}

// LogActionHandler records a manual action and returns updated points
func (h *Handler) LogActionHandler(w http.ResponseWriter, r *http.Request) {
	var req ActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	newTotal, err := h.Repo.LogImpactAction(userID, req.ActionType)
	if err != nil {
		http.Error(w, "Failed to log action: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "Action logged successfully",
		"total_points": newTotal,
	})
}

// GetTokenStatsHandler returns token availability statistics
func (h *Handler) GetTokenStatsHandler(w http.ResponseWriter, r *http.Request) {
	total, claimed, err := h.Repo.GetTokenStats()
	if err != nil {
		http.Error(w, "Failed to get token stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{
		"total":     total,
		"claimed":   claimed,
		"remaining": total - claimed,
	})
}

// ClaimTokenHandler handles the request to assign a token to a user
func (h *Handler) ClaimTokenHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	token, err := h.Repo.AssignTokenToUser(userID)
	if err != nil {
		if err.Error() == "sold out" {
			http.Error(w, "Sold out", http.StatusConflict)
			return
		}
		if err.Error() == "user already owns a token" {
			http.Error(w, "User already owns a token", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to claim token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Token claimed successfully!",
		"token":   token,
	})
}

// Admin Methods

// AdminGetStatsHandler returns aggregated statistics for the dashboard
func (h *Handler) AdminGetStatsHandler(w http.ResponseWriter, r *http.Request) {
	// User Stats
	totalUsers, activeUsers, err := h.Repo.GetUserStats()
	if err != nil {
		http.Error(w, "Failed to get user stats", http.StatusInternalServerError)
		return
	}

	// Token Stats
	totalTokens, claimedTokens, err := h.Repo.GetTokenStats()
	if err != nil {
		http.Error(w, "Failed to get token stats", http.StatusInternalServerError)
		return
	}

	// Placeholder for financial/impact stats
	// In a real app these would query the DB
	mockRevenue := claimedTokens * 500 // Assuming $500 per token
	mockImpact := claimedTokens * 20   // Assuming 20m2 per token

	stats := map[string]interface{}{
		"users": map[string]int{
			"total":  totalUsers,
			"active": activeUsers,
		},
		"tokens": map[string]int{
			"total":     totalTokens,
			"claimed":   claimedTokens,
			"remaining": totalTokens - claimedTokens,
		},
		"impact": map[string]int{
			"revenue": mockRevenue,
			"sqm_bio": mockImpact,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// AdminGetUsersHandler returns a list of all users
func (h *Handler) AdminGetUsersHandler(w http.ResponseWriter, r *http.Request) {
	users, err := h.Repo.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to get users: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// AdminApproveUserHandler activates a user
func (h *Handler) AdminApproveUserHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	if err := h.Repo.ApproveUser(userID); err != nil {
		http.Error(w, "Failed to approve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch user details for email
	user, err := h.Repo.GetUserByID(userID)
	if err == nil {
		// Send Email (Async or Sync - for MVP Sync is fine)
		go email.SendApprovalEmail(user.Email, user.FullName)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User approved successfully"})
}

// ---- Gallery Handlers ----

// UploadGalleryHandler handles multi-file upload for gallery photos
func (h *Handler) UploadGalleryHandler(w http.ResponseWriter, r *http.Request) {
	// Max 50MB total
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "Files too large (max 50MB)", http.StatusBadRequest)
		return
	}

	categoria := r.FormValue("categoria")
	titulo := r.FormValue("titulo")
	if categoria == "" {
		http.Error(w, "categoria is required (Obra, Entorno, Social)", http.StatusBadRequest)
		return
	}
	if titulo == "" {
		titulo = categoria // Default title to category
	}

	// Ensure upload directory exists
	uploadDir := filepath.Join("uploads", "galeria")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		http.Error(w, "Failed to create upload directory", http.StatusInternalServerError)
		return
	}

	files := r.MultipartForm.File["fotos"]
	if len(files) == 0 {
		http.Error(w, "No files uploaded. Use field name 'fotos'", http.StatusBadRequest)
		return
	}

	var saved []models.GalleryItem
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		// Generate unique filename
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		uniqueName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
		destPath := filepath.Join(uploadDir, uniqueName)

		dst, err := os.Create(destPath)
		if err != nil {
			file.Close()
			continue
		}

		_, err = io.Copy(dst, file)
		file.Close()
		dst.Close()
		if err != nil {
			continue
		}

		// Save to DB
		item := &models.GalleryItem{
			Titulo:    titulo,
			Categoria: categoria,
			ImagenURL: "/uploads/galeria/" + uniqueName,
		}
		if err := h.Repo.CreateGalleryItem(item); err != nil {
			fmt.Printf("Failed to save gallery item to DB: %v\n", err)
			continue
		}
		saved = append(saved, *item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": fmt.Sprintf("%d fotos subidas correctamente", len(saved)),
		"items":   saved,
	})
}

// GetGalleryHandler returns gallery items, optionally filtered by category
func (h *Handler) GetGalleryHandler(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	items, err := h.Repo.GetGalleryItems(categoria)
	if err != nil {
		http.Error(w, "Failed to get gallery: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if items == nil {
		items = []models.GalleryItem{} // Return empty array, not null
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// ---- Huesped Historico / CSV Import Handlers ----

// UploadCSVHandler handles the upload of a CSV file with historical guest data.
// It parses the CSV, inserts records into huespedes_historicos, and runs DNI matching.
func (h *Handler) UploadCSVHandler(w http.ResponseWriter, r *http.Request) {
	// Max 10MB CSV file
	r.ParseMultipartForm(10 << 20)

	file, header, err := r.FormFile("archivo")
	if err != nil {
		http.Error(w, "CSV file required (field: 'archivo')", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".csv") {
		http.Error(w, "Only .csv files are allowed", http.StatusBadRequest)
		return
	}

	// Parse CSV
	records, result, err := csvparser.ParseCSV(file, true)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing CSV: %v", err), http.StatusBadRequest)
		return
	}

	// Insert into DB
	if len(records) > 0 {
		imported, duplicates, err := h.Repo.InsertHuespedHistoricoBatch(records)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error inserting records: %v", err), http.StatusInternalServerError)
			return
		}
		result.Imported = imported
		result.Duplicates += duplicates
	}

	// Run DNI matching automatically after import
	linked, err := h.Repo.MatchHuespedByDNI()
	if err == nil {
		result.LinkedToUser = linked
	}

	// Auto-classify: guests with 2+ distinct years → FUNDADOR
	promoted, _ := h.Repo.AutoClassifyFundadores()

	// Build response with promotion info
	resp := map[string]interface{}{
		"total_rows":           result.TotalRows,
		"imported":             result.Imported,
		"duplicates":           result.Duplicates,
		"errors":               result.Errors,
		"linked_to_user":       result.LinkedToUser,
		"promoted_to_fundador": promoted,
		"error_details":        result.ErrorDetails,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetHuespedHistoricoHandler returns historical guest records, optionally filtered by DNI.
func (h *Handler) GetHuespedHistoricoHandler(w http.ResponseWriter, r *http.Request) {
	dniFilter := r.URL.Query().Get("dni")
	records, err := h.Repo.GetHuespedHistorico(dniFilter)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	if records == nil {
		records = []models.HuespedHistorico{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(records)
}

// GetHuespedStatsHandler returns aggregate statistics about historical guest data.
func (h *Handler) GetHuespedStatsHandler(w http.ResponseWriter, r *http.Request) {
	stats, err := h.Repo.GetHuespedStats()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// ---- Solicitudes de Reserva Handlers ----

// CreateSolicitudHandler receives a public booking request
func (h *Handler) CreateSolicitudHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Nombre         string  `json:"nombre"`
		DNI            string  `json:"dni"`
		Telefono       string  `json:"telefono"`
		Email          string  `json:"email"`
		TipoHabitacion string  `json:"tipo_habitacion"`
		Plazas         int     `json:"plazas"`
		CheckIn        string  `json:"check_in"`
		CheckOut       string  `json:"check_out"`
		Noches         int     `json:"noches"`
		PrecioTotal    float64 `json:"precio_total"`
		BedIDs         []int   `json:"bed_ids"`
		LinenCount     int     `json:"linen_count"`
		Plataforma     string  `json:"plataforma"`
		Status         string  `json:"status"`
		OtrosHuespedes []struct {
			Nombre string `json:"nombre"`
			DNI    string `json:"dni"`
		} `json:"otros_huespedes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	checkIn, err := time.Parse("2006-01-02", req.CheckIn)
	if err != nil {
		http.Error(w, "Invalid check_in date format (use YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	checkOut, err := time.Parse("2006-01-02", req.CheckOut)
	if err != nil {
		http.Error(w, "Invalid check_out date format (use YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	// Check if DNI matches a historical guest
	esHistorico := false
	cleanDNI := strings.ReplaceAll(strings.ReplaceAll(req.DNI, ".", ""), "-", "")
	historicos, _ := h.Repo.GetHuespedHistorico(cleanDNI)
	if len(historicos) > 0 {
		esHistorico = true
	}

	// Marshal additional guests to JSON string
	otrosHuespedesJSON, _ := json.Marshal(req.OtrosHuespedes)

	// Convert bed IDs to comma-separated string
	bedIDsStr := ""
	if len(req.BedIDs) > 0 {
		var ids []string
		for _, id := range req.BedIDs {
			ids = append(ids, fmt.Sprintf("%d", id))
		}
		bedIDsStr = strings.Join(ids, ",")
	}

	solicitud := &models.SolicitudReserva{
		Nombre:         req.Nombre,
		DNI:            cleanDNI,
		Telefono:       req.Telefono,
		Email:          req.Email,
		TipoHabitacion: req.TipoHabitacion,
		Plazas:         req.Plazas,
		CheckIn:        checkIn,
		CheckOut:       checkOut,
		Noches:         req.Noches,
		PrecioTotal:    req.PrecioTotal,
		EsHistorico:    esHistorico,
		BedIDs:         bedIDsStr,
		LinenCount:     req.LinenCount,
		Plataforma:     req.Plataforma,
		Status:         req.Status,
		OtrosHuespedes: string(otrosHuespedesJSON),
	}

	if solicitud.Status == "" {
		solicitud.Status = "PENDIENTE"
	}

	if err := h.Repo.CreateSolicitud(solicitud); err != nil {
		http.Error(w, fmt.Sprintf("Error creating solicitud: %v", err), http.StatusInternalServerError)
		return
	}

	// Generar Código de Reserva (DNI-AÑO)
	codigoReserva := fmt.Sprintf("%s-%d", solicitud.DNI, time.Now().Year())

	// Notificación por correo (Configurada para info@laabuelabeba.cloud)
	go func() {
		// --- NUEVO: Webhook para Google Sheets ---
		googleSheetURL := "https://script.google.com/macros/s/AKfycbzu9v7ICgJfWvvdKAsKgi8Y38BFjfJ96upF0kso_n04pCbfumsDQBLv6Iv9dJKKRqF/exec"
		webhookData, _ := json.Marshal(map[string]interface{}{
			"codigo":           codigoReserva,
			"nombre":           solicitud.Nombre,
			"dni":              solicitud.DNI,
			"telefono":         solicitud.Telefono,
			"email":            solicitud.Email,
			"check_in":         solicitud.CheckIn.Format("2006-01-02"),
			"check_out":        solicitud.CheckOut.Format("2006-01-02"),
			"noches":           solicitud.Noches,
			"tipo_habitacion":  solicitud.TipoHabitacion,
			"precio_total":     solicitud.PrecioTotal,
			"plataforma":       solicitud.Plataforma,
			"linen_count":      solicitud.LinenCount,
		})

		// Google Apps Script redirecciona (302), necesitamos seguir la redirección
		// Usamos un loop simple para asegurar que el POST llegue con el Body
		client := &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Google redirecciona a un GET usualmente. 
				// Pero el POST original ya entregó el payload al nodo de ejecución.
				return nil 
			},
		}
		
		webhookReq, _ := http.NewRequest("POST", googleSheetURL, strings.NewReader(string(webhookData)))
		webhookReq.Header.Set("Content-Type", "application/json")
		
		resp, err := client.Do(webhookReq)
		if err != nil {
			fmt.Printf("   [WEBHOOK-ERROR] Error enviando a Google Sheets: %v\n", err)
		} else {
			fmt.Printf("   [WEBHOOK-OK] Respuesta de Google Sheets: %s\n", resp.Status)
			resp.Body.Close()
		}

		// Detección automática de Socio Fundador
		if esHistorico {
			fmt.Printf("\n🏆 [SOCIO FUNDADOR] El DNI %s ha sido detectado como histórico (2023-2026). Asignando etiqueta.\n", solicitud.DNI)
		}

		destinatario := "info@laabuelabeba.cloud"
		asunto := fmt.Sprintf("[Reserva] Solicitud de Plaza - Código: %s - %s", codigoReserva, solicitud.Nombre)

		huespedesDetalle := fmt.Sprintf("- %s (DNI: %s)", solicitud.Nombre, solicitud.DNI)
		if len(req.OtrosHuespedes) > 0 {
			for _, h := range req.OtrosHuespedes {
				huespedesDetalle += fmt.Sprintf("\n- %s (DNI: %s)", h.Nombre, h.DNI)
			}
		}

		cuerpo := fmt.Sprintf("Hola,\n\nSe ha recibido una nueva solicitud de reserva.\n\nCódigo: %s\nResponsable: %s\n\nHuéspedes:\n%s\n\nDatos de contacto:\nTel: %s\nEmail: %s\n\nReserva:\nPlazas: %d (%s)\nFechas: %s al %s\nPrecio Total: $%.2f\nLinen/Towels: %d sets\n\nEl Equipo de La Abuela Beba validará la solicitud a la brevedad.\n\nSaludos,\nLa Administración",
			codigoReserva, solicitud.Nombre, huespedesDetalle, solicitud.Telefono, solicitud.Email,
			solicitud.Plazas, solicitud.TipoHabitacion,
			solicitud.CheckIn.Format("02/01/2006"), solicitud.CheckOut.Format("02/01/2006"),
			solicitud.PrecioTotal, solicitud.LinenCount)

		fmt.Printf("\n📧 [NOTIFICATION] Enviando notificación de nueva reserva a: %s\n", destinatario)
		err = email.SendAdminNotificationEmail(asunto, cuerpo)
		if err != nil {
			fmt.Printf("   [ERROR] Falló el envío del correo: %v\n", err)
		} else {
			fmt.Printf("   [OK] Correo enviado exitosamente vía SMTP Zoho.\n")
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"id":           solicitud.ID,
		"es_historico": esHistorico,
		"codigo":       codigoReserva,
		"message":      "Solicitud de reserva recibida. Pendiente de confirmación.",
	})
}

// GetSolicitudesHandler returns reservation requests for admin review
func (h *Handler) GetSolicitudesHandler(w http.ResponseWriter, r *http.Request) {
	statusFilter := r.URL.Query().Get("status")
	solicitudes, err := h.Repo.GetSolicitudes(statusFilter)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	if solicitudes == nil {
		solicitudes = []models.SolicitudReserva{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(solicitudes)
}

// UpdateSolicitudHandler updates the status of a reservation request
func (h *Handler) UpdateSolicitudHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"` // CONFIRMADA or RECHAZADA
		Notas  string `json:"notas"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Status != "CONFIRMADA" && req.Status != "RECHAZADA" {
		http.Error(w, "Status must be CONFIRMADA or RECHAZADA", http.StatusBadRequest)
		return
	}

	if err := h.Repo.UpdateSolicitudStatus(id, req.Status, req.Notas); err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	// When confirming, block the bed(s) for the booking dates
	if req.Status == "CONFIRMADA" {
		// Read solicitud to get bed_id, dates, and guest name
		solicitudes, _ := h.Repo.GetSolicitudes("")
		for _, s := range solicitudes {
			if s.ID == id {
				// 1. Block Beds if applicable
				if s.BedIDs != "" {
					var bedIDs []int
					for _, part := range strings.Split(s.BedIDs, ",") {
						var bid int
						fmt.Sscanf(part, "%d", &bid)
						if bid > 0 {
							bedIDs = append(bedIDs, bid)
						}
					}

					if len(bedIDs) > 0 {
						fromDate := s.CheckIn.Format("2006-01-02")
						toDate := s.CheckOut.Format("2006-01-02")
						if err := h.Repo.BlockBedsForBooking(bedIDs, fromDate, toDate, id, s.Nombre); err != nil {
							fmt.Printf("⚠️ Warning: Failed to block beds %v for solicitud %s: %v\n", bedIDs, id, err)
						} else {
							fmt.Printf("🛏️ Beds %v blocked for %s → %s (Guest: %s)\n", bedIDs, fromDate, toDate, s.Nombre)
						}
					}
				}

				// 2. Send Voucher Email to Guest
				bookingCode := fmt.Sprintf("%s-%d", s.DNI, s.CheckIn.Year())
				go email.SendVoucherEmail(
					s.Email,
					s.Nombre,
					bookingCode,
					s.TipoHabitacion,
					s.CheckIn.Format("02/01/2006"),
					s.CheckOut.Format("02/01/2006"),
					s.Plazas,
					fmt.Sprintf("%.2f", s.PrecioTotal),
				)
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Solicitud %s actualizada a %s", id, req.Status),
	})
}

// UpdateUserRoleHandler updates a user's role (category)
func (h *Handler) UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Repo.UpdateUserRole(userID, req.Role); err != nil {
		http.Error(w, fmt.Sprintf("Error updating role: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
func (h *Handler) GoogleSheetsWebhookHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("📥 [WEBHOOK-INCOMING] Recibiendo actualización desde Google Sheets...")
	
	var req struct {
		Codigo string `json:"codigo"`
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("   [ERROR] Cuerpo de webhook inválido: %v\n", err)
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.Codigo == "" || req.Status == "" {
		fmt.Println("   [ERROR] Faltan campos 'codigo' o 'status' en el webhook.")
		http.Error(w, "Missing fields", http.StatusBadRequest)
		return
	}

	fmt.Printf("   [LOG] Actualizando reserva %s a estado: %s\n", req.Codigo, req.Status)

	// Aquí deberíamos tener un método en el Repo para actualizar por código de reserva.
	// La Beba usa DNI-AÑO como código.
	// Por ahora simulamos la actualización en la tabla solicitudes de reserva.
	// Nota: Si no existe el método UpdateSolicitudByCodigo, lo delegamos a una query directa o al repo.
	
	// Vamos a buscar la solicitud por el código (que es DNI-AÑO)
	// Para esto, vamos a asumir que el Repo tiene GetSolicitudes y luego filtramos, 
	// o mejor agregamos un método específico.
	
	// Por simplicidad en este paso, usamos el repo para actualizar.
	err := h.Repo.UpdateSolicitudStatusByCodigo(req.Codigo, req.Status)
	if err != nil {
		fmt.Printf("   [ERROR] No se pudo actualizar la reserva en DB: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	fmt.Println("   [OK] Webhook procesado exitosamente.")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// GetPricingConfigHandler returns the pricing and promotion configuration
func (h *Handler) GetPricingConfigHandler(w http.ResponseWriter, r *http.Request) {
	configs, err := h.Repo.GetConfiguracionPrecios()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching pricing: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(configs)
}

// UpdatePricingConfigHandler updates pricing and promotion configuration
func (h *Handler) UpdatePricingConfigHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RoomType         string  `json:"room_type"`
		BasePrice        float64 `json:"base_price"`
		DiscountNights   string  `json:"discount_nights"`
		DiscountGuests   string  `json:"discount_guests"`
		DiscountLeadTime string  `json:"discount_lead_time"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Repo.UpdateConfiguracionPrecio(req.RoomType, req.BasePrice, req.DiscountNights, req.DiscountGuests, req.DiscountLeadTime); err != nil {
		http.Error(w, fmt.Sprintf("Error updating pricing: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

