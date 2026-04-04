package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user in the system
type User struct {
	ID               uuid.UUID `json:"id" db:"id"`
	Email            string    `json:"email" db:"email"`
	PasswordHash     string    `json:"-" db:"password_hash"`
	FullName         string    `json:"full_name" db:"full_name"`
	DNI              string    `json:"dni" db:"dni"`
	Phone            string    `json:"phone" db:"phone"`
	Role             string    `json:"role" db:"role"`
	IsActive         bool      `json:"is_active" db:"is_active"`
	VerificationCode string    `json:"-" db:"verification_code"`
	IsVerified       bool      `json:"is_verified" db:"is_verified"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
	Age              int       `json:"age" db:"age"`
	HowFound         string    `json:"how_found" db:"how_found"`
}

// Token represents an exclusive membership token
type Token struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    *uuid.UUID `json:"user_id,omitempty" db:"user_id"` // Nullable if token not yet assigned
	TokenCode string     `json:"token_code" db:"token_code"`
	Tier      string     `json:"tier" db:"tier"` // GOLD, PLATINUM, DIAMOND
	IsActive  bool       `json:"is_active" db:"is_active"`
	IssuedAt  time.Time  `json:"issued_at" db:"issued_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty" db:"expires_at"`
}

// Spot represents a reservable space (plaza)
type Spot struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Capacity    int       `json:"capacity" db:"capacity"`
	Type        string    `json:"type" db:"type"` // SHARED, PRIVATE
	BasePrice   float64   `json:"base_price" db:"base_price"`
	IsAvailable bool      `json:"is_active" db:"is_available"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Reservation represents a booking made by a user
type Reservation struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     uuid.UUID `json:"user_id" db:"user_id"`
	SpotID     uuid.UUID `json:"spot_id" db:"spot_id"`
	StartDate  time.Time `json:"start_date" db:"start_date"`
	EndDate    time.Time `json:"end_date" db:"end_date"`
	TotalPrice float64   `json:"total_price" db:"total_price"`
	Status     string    `json:"status" db:"status"` // PENDING, CONFIRMED, CANCELLED, COMPLETED
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// ReservationRequest is the payload for creating a new booking
type ReservationRequest struct {
	UserID    string    `json:"user_id"` // Simplified: sending ID directly for now
	SpotID    string    `json:"spot_id"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	BasePrice float64   `json:"base_price"` // Should ideally come from Spot, but sending for simplicity
}

// ImpactLog represents an entry in the Regenerative Impact Index (IRB)
type ImpactLog struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	UserID        uuid.UUID  `json:"user_id" db:"user_id"`
	ReservationID *uuid.UUID `json:"reservation_id,omitempty" db:"reservation_id"`
	ActionType    string     `json:"action_type" db:"action_type"` // RESERVATION, WASTE_MANAGEMENT, LOCAL_CONSUMPTION
	Points        int        `json:"points" db:"points"`
	Description   string     `json:"description" db:"description"`
	LoggedAt      time.Time  `json:"logged_at" db:"logged_at"`
}

// GalleryItem represents a photo in the gallery system
type GalleryItem struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Titulo    string    `json:"titulo" db:"titulo"`
	Categoria string    `json:"categoria" db:"categoria"` // Obra, Entorno, Social
	ImagenURL string    `json:"imagen_url" db:"imagen_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Constants for Points
const (
	PointsReservation      = 100
	PointsWasteManagement  = 50
	PointsLocalConsumption = 20
)

// HuespedHistorico represents a guest record imported from historical CSV data (2023-2026)
type HuespedHistorico struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Nombre       string     `json:"nombre" db:"nombre"`
	DNI          string     `json:"dni" db:"dni"`
	Procedencia  string     `json:"procedencia" db:"procedencia"`
	CanalOrigen  string     `json:"canal_origen" db:"canal_origen"` // Airbnb, Booking, Amigo, Instagram, Directo
	FechaReserva time.Time  `json:"fecha_reserva" db:"fecha_reserva"`
	LinkedUserID *uuid.UUID `json:"linked_user_id,omitempty" db:"linked_user_id"` // Linked SaaS user (via DNI match)
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// CSVImportResult holds the result summary of a CSV import batch
type CSVImportResult struct {
	TotalRows    int      `json:"total_rows"`
	Imported     int      `json:"imported"`
	Duplicates   int      `json:"duplicates"`
	Errors       int      `json:"errors"`
	LinkedToUser int      `json:"linked_to_user"` // How many matched an existing SaaS user by DNI
	ErrorDetails []string `json:"error_details,omitempty"`
}

// SolicitudReserva represents a booking request pending manual approval
type SolicitudReserva struct {
	ID             uuid.UUID `json:"id" db:"id"`
	Nombre         string    `json:"nombre" db:"nombre"`
	DNI            string    `json:"dni" db:"dni"`
	Telefono       string    `json:"telefono" db:"telefono"`
	Email          string    `json:"email" db:"email"`
	TipoHabitacion string    `json:"tipo_habitacion" db:"tipo_habitacion"` // compartido, privada
	Plazas         int       `json:"plazas" db:"plazas"`
	CheckIn        time.Time `json:"check_in" db:"check_in"`
	CheckOut       time.Time `json:"check_out" db:"check_out"`
	Noches         int       `json:"noches" db:"noches"`
	PrecioTotal    float64   `json:"precio_total" db:"precio_total"`
	EsHistorico    bool      `json:"es_historico" db:"es_historico"`       // true if DNI matched huespedes_historicos
	BedIDs         string    `json:"bed_ids,omitempty" db:"bed_ids"`       // selected beds for compartido (comma separated)
	LinenCount     int       `json:"linen_count,omitempty" db:"linen_count"`
	Plataforma     string    `json:"plataforma,omitempty" db:"plataforma"` // airbnb, hostelworld, manual, etc
	OtrosHuespedes string    `json:"otros_huespedes,omitempty" db:"otros_huespedes"`
	Status         string    `json:"status" db:"status"`                   // PENDIENTE, CONFIRMADA, RECHAZADA
	NotasAdmin     string    `json:"notas_admin,omitempty" db:"notas_admin"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// Bed represents a specific bed/spot that can be reserved
type Bed struct {
	ID       int    `json:"id" db:"id"`
	RoomType string `json:"room_type" db:"room_type"` // 'compartido' or 'privado'
	Label    string `json:"label" db:"label"`         // e.g. "Cucheta 1 - Arriba"
	BunkNum  int    `json:"bunk_num" db:"bunk_num"`   // 1-4 for bunk number
	Level    string `json:"level" db:"level"`         // 'arriba' or 'abajo' (empty for privado)
	IsActive bool   `json:"is_active" db:"is_active"`
}

// BedBlock represents a date-specific block on a bed
type BedBlock struct {
	ID          int        `json:"id" db:"id"`
	BedID       int        `json:"bed_id" db:"bed_id"`
	BlockDate   string     `json:"block_date" db:"block_date"` // YYYY-MM-DD
	BlockType   string     `json:"block_type" db:"block_type"` // 'booking' or 'admin'
	SolicitudID *uuid.UUID `json:"solicitud_id,omitempty" db:"solicitud_id"`
	GuestName   string     `json:"guest_name,omitempty" db:"guest_name"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// BedAvailability combines a bed with its availability status for a date range
type BedAvailability struct {
	Bed
	BlockedDates []string `json:"blocked_dates"` // dates that are blocked within the queried range
	BlockType    string   `json:"block_type,omitempty"`
}
