package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"labeba/internal/models"

	"github.com/google/uuid"
)

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// CreateReservationWithImpact creates a reservation and automatically logs impact points transactionally
func (r *Repository) CreateReservationWithImpact(reservation *models.Reservation) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	// Defer rollback in case of panic or error, Commit will clear this if successful
	defer tx.Rollback()

	// 1. Insert Reservation
	reservation.ID = uuid.New()
	reservation.CreatedAt = time.Now()
	reservation.Status = "CONFIRMED" // Auto-confirming for MVP

	queryRes := `
		INSERT INTO reservations (id, user_id, spot_id, start_date, end_date, total_price, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = tx.Exec(queryRes,
		reservation.ID,
		reservation.UserID,
		reservation.SpotID,
		reservation.StartDate,
		reservation.EndDate,
		reservation.TotalPrice,
		reservation.Status,
		reservation.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert reservation: %w", err)
	}

	// 2. Insert User Impact Log (+100 Points)
	impactID := uuid.New()
	queryImpact := `
		INSERT INTO impact_logs (id, user_id, reservation_id, action_type, points, description, logged_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.Exec(queryImpact,
		impactID,
		reservation.UserID,
		reservation.ID,
		"RESERVATION",
		100, // Points for reservation
		"Reserva inicial: apoyo a economía local",
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to log impact: %w", err)
	}

	return tx.Commit()
}

// GetUserTotalImpact sums all impact points for a specific user
func (r *Repository) GetUserTotalImpact(userID uuid.UUID) (int, error) {
	var totalPoints sql.NullInt64 // Handle NULL if no logs exist
	query := `SELECT SUM(points) FROM impact_logs WHERE user_id = $1`

	err := r.DB.QueryRow(query, userID).Scan(&totalPoints)
	if err != nil {
		return 0, fmt.Errorf("failed to query impact points: %w", err)
	}

	if !totalPoints.Valid {
		return 0, nil
	}

	return int(totalPoints.Int64), nil
}

// LogImpactAction records a manual impact action and returns the new total points
func (r *Repository) LogImpactAction(userID uuid.UUID, actionType string) (int, error) {
	var points int
	var description string

	switch actionType {
	case "WASTE_MANAGEMENT":
		points = 50
		description = "Separación de residuos certificada"
	case "LOCAL_CONSUMPTION":
		points = 20
		description = "Consumo de productos de la huerta local"
	default:
		return 0, fmt.Errorf("unknown action type: %s", actionType)
	}

	id := uuid.New()
	query := `
		INSERT INTO impact_logs (id, user_id, action_type, points, description, logged_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.DB.Exec(query, id, userID, actionType, points, description, time.Now())
	if err != nil {
		return 0, fmt.Errorf("failed to log impact action: %w", err)
	}

	// Return updated total
	return r.GetUserTotalImpact(userID)
}

// GetUserToken retrieves the active token for a user if they are a token holder
func (r *Repository) GetUserToken(userID uuid.UUID) (*models.Token, error) {
	var token models.Token
	query := `
		SELECT id, user_id, token_code, tier, is_active, issued_at, expires_at 
		FROM tokens 
		WHERE user_id = $1 AND is_active = true
		LIMIT 1
	`
	row := r.DB.QueryRow(query, userID)
	err := row.Scan(
		&token.ID,
		&token.UserID,
		&token.TokenCode,
		&token.Tier,
		&token.IsActive,
		&token.IssuedAt,
		&token.ExpiresAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No active token found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user token: %w", err)
	}

	return &token, nil
}

// GetUserByEmail retrieves a user by their email address
func (r *Repository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at, age, how_found
		FROM users
		WHERE email = $1
		LIMIT 1
	`
	row := r.DB.QueryRow(query, email)
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.Age,
		&user.HowFound,
	)

	if err == sql.ErrNoRows {
		return nil, nil // User not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user by their UUID
func (r *Repository) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at, age, how_found
		FROM users
		WHERE id = $1
		LIMIT 1
	`
	row := r.DB.QueryRow(query, id)
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.Age,
		&user.HowFound,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

// UserExists checks if a user with the given email or DNI already exists
func (r *Repository) UserExists(email, dni string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR dni = $2)`
	err := r.DB.QueryRow(query, email, dni).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}
	return exists, nil
}

// CreateUser inserts a new user into the database
func (r *Repository) CreateUser(user *models.User) error {
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	// Role defaults to SOCIO, IsActive defaults to false unless specified otherwise
	if user.Role == "" {
		user.Role = "SOCIO"
	}

	query := `
		INSERT INTO users (id, email, password_hash, full_name, dni, phone, role, is_active, verification_code, is_verified, created_at, updated_at, age, how_found)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err := r.DB.Exec(query,
		user.ID,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.DNI,
		user.Phone,
		user.Role,
		user.IsActive,
		user.VerificationCode,
		user.IsVerified,
		user.CreatedAt,
		user.UpdatedAt,
		user.Age,
		user.HowFound,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// VerifyUser checks the OTP code and marks the user as verified
func (r *Repository) VerifyUser(email, code string) error {
	var userID uuid.UUID
	query := `SELECT id FROM users WHERE email = $1 AND verification_code = $2`
	err := r.DB.QueryRow(query, email, code).Scan(&userID)
	if err == sql.ErrNoRows {
		return fmt.Errorf("invalid code or email")
	}
	if err != nil {
		return err
	}

	// Code matches, update user to verified (but still inactive until Admin approval)
	update := `UPDATE users SET is_verified = true, verification_code = NULL WHERE id = $1`
	_, err = r.DB.Exec(update, userID)
	return err
}

// GetTokenStats returns the number of total and claimed tokens
func (r *Repository) GetTokenStats() (int, int, error) {
	// For this MVP, we assume a fixed total of 30 tokens.
	// We count how many have user_id != NULL
	const totalTokens = 30
	var claimedTokens int

	query := `SELECT COUNT(*) FROM tokens WHERE user_id IS NOT NULL`
	err := r.DB.QueryRow(query).Scan(&claimedTokens)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to count claimed tokens: %w", err)
	}

	return totalTokens, claimedTokens, nil
}

// AssignTokenToUser assigns an available token to a user
func (r *Repository) AssignTokenToUser(userID uuid.UUID) (*models.Token, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Check if user already has a token
	var existingID uuid.UUID
	err = tx.QueryRow(`SELECT id FROM tokens WHERE user_id = $1`, userID).Scan(&existingID)
	if err == nil {
		return nil, fmt.Errorf("user already owns a token")
	} else if err != sql.ErrNoRows {
		return nil, err
	}

	// 2. Find first available token
	// If tokens table is empty, we might need to seed it.
	// For MVP robustness, if table is empty, we insert one on the fly (Hybrid approach).
	// Checking if there are any available tokens first
	var tokenID uuid.UUID
	var tokenCode string

	err = tx.QueryRow(`
		SELECT id, token_code 
		FROM tokens 
		WHERE user_id IS NULL 
		ORDER BY token_code ASC 
		LIMIT 1 FOR UPDATE
	`).Scan(&tokenID, &tokenCode)

	if err == sql.ErrNoRows {
		// No available pre-generated tokens found.
		// Detailed handling: Check if we reached limit.
		var count int
		tx.QueryRow("SELECT COUNT(*) FROM tokens").Scan(&count)
		if count >= 30 {
			return nil, fmt.Errorf("sold out")
		}

		// Create a new token on the fly
		tokenID = uuid.New()
		tokenCode = fmt.Sprintf("TOKEN-%03d", count+1)
		_, err = tx.Exec(`
			INSERT INTO tokens (id, token_code, tier, is_active, issued_at)
			VALUES ($1, $2, 'GOLD', true, $3)
		`, tokenID, tokenCode, time.Now())
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	// 3. Assign the token
	_, err = tx.Exec(`
		UPDATE tokens 
		SET user_id = $1, issued_at = $2 
		WHERE id = $3
	`, userID, time.Now(), tokenID)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return &models.Token{
		ID:        tokenID,
		UserID:    &userID,
		TokenCode: tokenCode,
		Tier:      "GOLD",
		IsActive:  true,
		IssuedAt:  time.Now(),
	}, nil
}

// GetAllUsers retrieves all users from the database
func (r *Repository) GetAllUsers() ([]models.User, error) {
	query := `
		SELECT id, email, full_name, COALESCE(dni, ''), COALESCE(phone, ''), role, is_active, created_at, updated_at, age, how_found
		FROM users
		WHERE COALESCE(is_verified, true) = true
		ORDER BY created_at DESC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(
			&u.ID,
			&u.Email,
			&u.FullName,
			&u.DNI,
			&u.Phone,
			&u.Role,
			&u.IsActive,
			&u.CreatedAt,
			&u.UpdatedAt,
			&u.Age,
			&u.HowFound,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, u)
	}
	return users, nil
}

// ApproveUser activates a registered user
func (r *Repository) ApproveUser(userID uuid.UUID) error {
	query := `UPDATE users SET is_active = true WHERE id = $1`
	_, err := r.DB.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to approve user: %w", err)
	}
	return nil
}

// GetUserStats returns aggregated user statistics
func (r *Repository) GetUserStats() (int, int, error) {
	var totalUsers int
	var activeUsers int

	queryTotal := `SELECT COUNT(*) FROM users`
	if err := r.DB.QueryRow(queryTotal).Scan(&totalUsers); err != nil {
		return 0, 0, err
	}

	queryActive := `SELECT COUNT(*) FROM users WHERE is_active = true`
	if err := r.DB.QueryRow(queryActive).Scan(&activeUsers); err != nil {
		return 0, 0, err
	}

	return totalUsers, activeUsers, nil
}

// ---- Gallery Methods ----

// AutoMigrateGallery creates the galerias table if it doesn't exist
func (r *Repository) AutoMigrateGallery() error {
	query := `
	CREATE TABLE IF NOT EXISTS galerias (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		titulo VARCHAR(255) NOT NULL,
		categoria VARCHAR(50) NOT NULL,
		imagen_url TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);
	CREATE INDEX IF NOT EXISTS idx_galerias_categoria ON galerias(categoria);
	`
	_, err := r.DB.Exec(query)
	return err
}

// CreateGalleryItem inserts a new gallery photo
func (r *Repository) CreateGalleryItem(item *models.GalleryItem) error {
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	query := `INSERT INTO galerias (id, titulo, categoria, imagen_url, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.DB.Exec(query, item.ID, item.Titulo, item.Categoria, item.ImagenURL, item.CreatedAt)
	return err
}

// GetGalleryItems retrieves gallery items, optionally filtered by category
func (r *Repository) GetGalleryItems(categoria string) ([]models.GalleryItem, error) {
	var rows *sql.Rows
	var err error

	if categoria != "" {
		rows, err = r.DB.Query(`SELECT id, titulo, categoria, imagen_url, created_at FROM galerias WHERE categoria = $1 ORDER BY created_at DESC`, categoria)
	} else {
		rows, err = r.DB.Query(`SELECT id, titulo, categoria, imagen_url, created_at FROM galerias ORDER BY created_at DESC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.GalleryItem
	for rows.Next() {
		var g models.GalleryItem
		if err := rows.Scan(&g.ID, &g.Titulo, &g.Categoria, &g.ImagenURL, &g.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, g)
	}
	return items, nil
}

// ---- Huesped Historico ----

// EnsureHuespedHistoricoTable creates the huespedes_historicos table if it doesn't exist
func (r *Repository) EnsureHuespedHistoricoTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS huespedes_historicos (
			id UUID PRIMARY KEY,
			nombre VARCHAR(255) NOT NULL,
			dni VARCHAR(50) NOT NULL,
			procedencia VARCHAR(255) DEFAULT '',
			canal_origen VARCHAR(100) DEFAULT 'Sin datos',
			fecha_reserva TIMESTAMPTZ NOT NULL,
			linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(dni, fecha_reserva)
		);
		CREATE INDEX IF NOT EXISTS idx_huespedes_dni ON huespedes_historicos(dni);
		CREATE INDEX IF NOT EXISTS idx_huespedes_linked ON huespedes_historicos(linked_user_id);
	`
	_, err := r.DB.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create huespedes_historicos table: %w", err)
	}
	fmt.Println("Huespedes historicos table ready")
	return nil
}

// InsertHuespedHistoricoBatch inserts a batch of historical guest records transactionally.
// It skips duplicates (same DNI + fecha_reserva) and returns the count of actual inserts.
func (r *Repository) InsertHuespedHistoricoBatch(records []models.HuespedHistorico) (imported int, duplicates int, err error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO huespedes_historicos (id, nombre, dni, procedencia, canal_origen, fecha_reserva, linked_user_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (dni, fecha_reserva) DO NOTHING
	`)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, rec := range records {
		result, err := stmt.Exec(rec.ID, rec.Nombre, rec.DNI, rec.Procedencia, rec.CanalOrigen, rec.FechaReserva, rec.LinkedUserID, rec.CreatedAt)
		if err != nil {
			// Skip individual errors, count them
			duplicates++
			continue
		}
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			duplicates++
		} else {
			imported++
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, fmt.Errorf("failed to commit transaction: %w", err)
	}
	return imported, duplicates, nil
}

// MatchHuespedByDNI links historical guest records to existing SaaS users by DNI.
// It scans all unlinked huespedes_historicos and tries to find a matching user.dni.
// Returns the number of newly linked records.
func (r *Repository) MatchHuespedByDNI() (int, error) {
	query := `
		UPDATE huespedes_historicos h
		SET linked_user_id = u.id
		FROM users u
		WHERE h.dni = u.dni
		  AND h.linked_user_id IS NULL
		  AND u.dni != ''
	`
	result, err := r.DB.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to match huespedes by DNI: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	return int(rowsAffected), nil
}

// GetHuespedHistorico retrieves historical guest records, optionally filtered by DNI.
func (r *Repository) GetHuespedHistorico(dniFilter string) ([]models.HuespedHistorico, error) {
	var query string
	var args []interface{}

	if dniFilter != "" {
		query = `
			SELECT id, nombre, dni, procedencia, canal_origen, fecha_reserva, linked_user_id, created_at
			FROM huespedes_historicos
			WHERE dni = $1
			ORDER BY fecha_reserva DESC
		`
		args = append(args, dniFilter)
	} else {
		query = `
			SELECT id, nombre, dni, procedencia, canal_origen, fecha_reserva, linked_user_id, created_at
			FROM huespedes_historicos
			ORDER BY fecha_reserva DESC
		`
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query huespedes_historicos: %w", err)
	}
	defer rows.Close()

	var records []models.HuespedHistorico
	for rows.Next() {
		var h models.HuespedHistorico
		if err := rows.Scan(&h.ID, &h.Nombre, &h.DNI, &h.Procedencia, &h.CanalOrigen, &h.FechaReserva, &h.LinkedUserID, &h.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, h)
	}
	return records, nil
}

// UpdateUserRole updates the role (category) of a user
func (r *Repository) UpdateUserRole(userID uuid.UUID, role string) error {
	_, err := r.DB.Exec("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", role, userID)
	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}
	return nil
}

// GetHuespedStats returns summary statistics for the historical guest data.
func (r *Repository) GetHuespedStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total records
	var total int
	r.DB.QueryRow("SELECT COUNT(*) FROM huespedes_historicos").Scan(&total)
	stats["total_registros"] = total

	// Unique guests (by DNI)
	var uniqueGuests int
	r.DB.QueryRow("SELECT COUNT(DISTINCT dni) FROM huespedes_historicos").Scan(&uniqueGuests)
	stats["huespedes_unicos"] = uniqueGuests

	// Linked to SaaS users
	var linked int
	r.DB.QueryRow("SELECT COUNT(*) FROM huespedes_historicos WHERE linked_user_id IS NOT NULL").Scan(&linked)
	stats["vinculados_saas"] = linked

	// Top channels
	rows, err := r.DB.Query(`
		SELECT canal_origen, COUNT(*) as cnt
		FROM huespedes_historicos
		GROUP BY canal_origen
		ORDER BY cnt DESC
		LIMIT 5
	`)
	if err == nil {
		defer rows.Close()
		channels := make(map[string]int)
		for rows.Next() {
			var canal string
			var cnt int
			rows.Scan(&canal, &cnt)
			channels[canal] = cnt
		}
		stats["canales_top"] = channels
	}

	return stats, nil
}

// AutoClassifyFundadores identifies guests with records in 2+ distinct years
// and promotes their linked SaaS user to 'FUNDADOR' role.
// Returns the number of users promoted.
func (r *Repository) AutoClassifyFundadores() (int, error) {
	query := `
		UPDATE users u
		SET role = 'FUNDADOR'
		FROM (
			SELECT linked_user_id
			FROM huespedes_historicos
			WHERE linked_user_id IS NOT NULL
			GROUP BY linked_user_id
			HAVING COUNT(DISTINCT EXTRACT(YEAR FROM fecha_reserva)) >= 2
		) AS candidates
		WHERE u.id = candidates.linked_user_id
		  AND u.role NOT IN ('ADMIN', 'FUNDADOR')
	`
	result, err := r.DB.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to auto-classify fundadores: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	return int(rowsAffected), nil
}

// ---- Solicitudes de Reserva ----

// CreateSolicitud inserts a new reservation request with PENDIENTE status
func (r *Repository) CreateSolicitud(s *models.SolicitudReserva) error {
	s.ID = uuid.New()
	s.Status = "PENDIENTE"
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()

	// Hot-migration: Ensure columns exist using a robust DO block (compat with old Postgres)
	migrationSQL := `
	DO $$ 
	BEGIN 
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes_reserva' AND column_name='bed_ids') THEN
			ALTER TABLE solicitudes_reserva ADD COLUMN bed_ids TEXT;
		END IF;
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes_reserva' AND column_name='linen_count') THEN
			ALTER TABLE solicitudes_reserva ADD COLUMN linen_count INTEGER DEFAULT 0;
		END IF;
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes_reserva' AND column_name='plataforma') THEN
			ALTER TABLE solicitudes_reserva ADD COLUMN plataforma VARCHAR(100) DEFAULT 'directo';
		END IF;
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes_reserva' AND column_name='otros_huespedes') THEN
			ALTER TABLE solicitudes_reserva ADD COLUMN otros_huespedes TEXT;
		END IF;
	END $$;`
	r.DB.Exec(migrationSQL)

	query := `INSERT INTO solicitudes_reserva
		(id, nombre, dni, telefono, email, tipo_habitacion, plazas, check_in, check_out, noches, precio_total, es_historico, bed_ids, linen_count, plataforma, otros_huespedes, status, notas_admin, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`

	_, err := r.DB.Exec(query,
		s.ID, s.Nombre, s.DNI, s.Telefono, s.Email,
		s.TipoHabitacion, s.Plazas, s.CheckIn, s.CheckOut,
		s.Noches, s.PrecioTotal, s.EsHistorico, s.BedIDs, s.LinenCount, s.Plataforma, s.OtrosHuespedes, s.Status, s.NotasAdmin,
		s.CreatedAt, s.UpdatedAt,
	)
	return err
}

// GetSolicitudes retrieves reservation requests, optionally filtered by status
func (r *Repository) GetSolicitudes(statusFilter string) ([]models.SolicitudReserva, error) {
	var rows *sql.Rows
	var err error

	baseColumns := `id, nombre, dni, telefono, email, tipo_habitacion, plazas, check_in, check_out, noches, precio_total, es_historico, bed_ids, linen_count, plataforma, otros_huespedes, status, notas_admin, created_at, updated_at`

	if statusFilter != "" {
		rows, err = r.DB.Query(fmt.Sprintf(`SELECT %s FROM solicitudes_reserva WHERE status = $1 ORDER BY created_at DESC`, baseColumns), statusFilter)
	} else {
		rows, err = r.DB.Query(fmt.Sprintf(`SELECT %s FROM solicitudes_reserva ORDER BY created_at DESC`, baseColumns))
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var solicitudes []models.SolicitudReserva
	for rows.Next() {
		var s models.SolicitudReserva
		err := rows.Scan(&s.ID, &s.Nombre, &s.DNI, &s.Telefono, &s.Email,
			&s.TipoHabitacion, &s.Plazas, &s.CheckIn, &s.CheckOut,
			&s.Noches, &s.PrecioTotal, &s.EsHistorico, &s.BedIDs, &s.LinenCount, &s.Plataforma, &s.OtrosHuespedes, &s.Status, &s.NotasAdmin,
			&s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		solicitudes = append(solicitudes, s)
	}
	return solicitudes, nil
}

// UpdateSolicitudStatus updates the status of a reservation request (CONFIRMADA / RECHAZADA)
func (r *Repository) UpdateSolicitudStatus(id uuid.UUID, status string, notas string) error {
	query := `UPDATE solicitudes_reserva SET status = $1, notas_admin = $2, updated_at = $3 WHERE id = $4`
	_, err := r.DB.Exec(query, status, notas, time.Now(), id)
	return err
}
// UpdateSolicitudStatusByCodigo updates the status of a reservation using the DNI-Year code format
func (r *Repository) UpdateSolicitudStatusByCodigo(codigo string, status string) error {
	// Parse the code (DNI-YEAR)
	parts := strings.Split(codigo, "-")
	if len(parts) < 2 {
		return fmt.Errorf("invalid code format")
	}
	dni := parts[0]
	year := parts[1]

	query := `
		UPDATE solicitudes_reserva 
		SET status = $1, updated_at = $2 
		WHERE dni = $3 AND EXTRACT(YEAR FROM check_in)::text = $4`
	_, err := r.DB.Exec(query, status, time.Now(), dni, year)
	return err
}

// ---- Beds & Availability ----

// AutoMigrateBeds creates the beds and bed_blocks tables if they don't exist, and seeds default beds
func (r *Repository) AutoMigrateBeds() error {
	// Create beds table
	_, err := r.DB.Exec(`
		CREATE TABLE IF NOT EXISTS beds (
			id SERIAL PRIMARY KEY,
			room_type VARCHAR(50) NOT NULL,
			label VARCHAR(100) NOT NULL,
			bunk_num INTEGER DEFAULT 0,
			level VARCHAR(20) DEFAULT '',
			is_active BOOLEAN DEFAULT TRUE
		)
	`)
	if err != nil {
		return fmt.Errorf("creating beds table: %w", err)
	}

	// Create bed_blocks table
	_, err = r.DB.Exec(`
		CREATE TABLE IF NOT EXISTS bed_blocks (
			id SERIAL PRIMARY KEY,
			bed_id INTEGER REFERENCES beds(id) ON DELETE CASCADE,
			block_date DATE NOT NULL,
			block_type VARCHAR(20) NOT NULL DEFAULT 'admin',
			solicitud_id UUID REFERENCES solicitudes_reserva(id) ON DELETE SET NULL,
			guest_name VARCHAR(255) DEFAULT '',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(bed_id, block_date)
		)
	`)
	if err != nil {
		return fmt.Errorf("creating bed_blocks table: %w", err)
	}

	// Seed beds if table is empty
	var count int
	r.DB.QueryRow("SELECT COUNT(*) FROM beds").Scan(&count)
	if count == 0 {
		// 8 beds for shared room (4 bunks x 2 levels)
		for i := 1; i <= 4; i++ {
			r.DB.Exec("INSERT INTO beds (room_type, label, bunk_num, level) VALUES ($1, $2, $3, $4)",
				"compartido", fmt.Sprintf("Cucheta %d - Arriba", i), i, "arriba")
			r.DB.Exec("INSERT INTO beds (room_type, label, bunk_num, level) VALUES ($1, $2, $3, $4)",
				"compartido", fmt.Sprintf("Cucheta %d - Abajo", i), i, "abajo")
		}
		// 1 entry for private room
		r.DB.Exec("INSERT INTO beds (room_type, label, bunk_num, level) VALUES ($1, $2, $3, $4)",
			"privado", "Habitación Privada", 0, "")
		fmt.Println("Seeded 9 beds (8 shared + 1 private)")
	}

	return nil
}

// GetBeds returns all beds, optionally filtered by room_type
func (r *Repository) GetBeds(roomType string) ([]models.Bed, error) {
	query := "SELECT id, room_type, label, bunk_num, level, is_active FROM beds"
	args := []interface{}{}
	if roomType != "" {
		query += " WHERE room_type = $1"
		args = append(args, roomType)
	}
	query += " ORDER BY room_type, bunk_num, level DESC" // arriba before abajo

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var beds []models.Bed
	for rows.Next() {
		var b models.Bed
		if err := rows.Scan(&b.ID, &b.RoomType, &b.Label, &b.BunkNum, &b.Level, &b.IsActive); err != nil {
			return nil, err
		}
		beds = append(beds, b)
	}
	return beds, nil
}

// GetBedAvailability returns beds with their blocked dates for a given date range
func (r *Repository) GetBedAvailability(roomType, fromDate, toDate string) ([]models.BedAvailability, error) {
	beds, err := r.GetBeds(roomType)
	if err != nil {
		return nil, err
	}

	result := make([]models.BedAvailability, len(beds))
	for i, bed := range beds {
		result[i] = models.BedAvailability{Bed: bed, BlockedDates: []string{}}

		rows, err := r.DB.Query(`
			SELECT block_date::TEXT, block_type FROM bed_blocks
			WHERE bed_id = $1 AND block_date >= $2::DATE AND block_date < $3::DATE
			ORDER BY block_date
		`, bed.ID, fromDate, toDate)
		if err != nil {
			return nil, err
		}

		for rows.Next() {
			var d, bt string
			rows.Scan(&d, &bt)
			result[i].BlockedDates = append(result[i].BlockedDates, d)
			if result[i].BlockType == "" {
				result[i].BlockType = bt
			}
		}
		rows.Close()
	}

	return result, nil
}

// AdminBlockBed blocks a bed for a specific date (manual admin block)
func (r *Repository) AdminBlockBed(bedID int, date string) error {
	_, err := r.DB.Exec(`
		INSERT INTO bed_blocks (bed_id, block_date, block_type) VALUES ($1, $2::DATE, 'admin')
		ON CONFLICT (bed_id, block_date) DO NOTHING
	`, bedID, date)
	return err
}

// AdminUnblockBed removes an admin block from a bed for a specific date
func (r *Repository) AdminUnblockBed(bedID int, date string) error {
	_, err := r.DB.Exec(`
		DELETE FROM bed_blocks WHERE bed_id = $1 AND block_date = $2::DATE AND block_type = 'admin'
	`, bedID, date)
	return err
}

// BlockBedsForBooking blocks bed(s) for all dates in a booking range
func (r *Repository) BlockBedsForBooking(bedIDs []int, fromDate, toDate string, solicitudID uuid.UUID, guestName string) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Generate all dates in the range [from, to)
	stmt, err := tx.Prepare(`
		INSERT INTO bed_blocks (bed_id, block_date, block_type, solicitud_id, guest_name)
		VALUES ($1, $2::DATE, 'booking', $3, $4)
		ON CONFLICT (bed_id, block_date) DO NOTHING
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, bedID := range bedIDs {
		// Use generate_series to create all dates in range
		rows, err := tx.Query(
			"SELECT d::DATE::TEXT FROM generate_series($1::DATE, $2::DATE - INTERVAL '1 day', '1 day') d",
			fromDate, toDate,
		)
		if err != nil {
			return err
		}
		for rows.Next() {
			var d string
			rows.Scan(&d)
			stmt.Exec(bedID, d, solicitudID, guestName)
		}
		rows.Close()
	}

	return tx.Commit()
}

// GetBedBlocksForAdmin returns all blocks for a room type in a date range, with guest info
func (r *Repository) GetBedBlocksForAdmin(roomType, fromDate, toDate string) ([]map[string]interface{}, error) {
	rows, err := r.DB.Query(`
		SELECT bb.id, bb.bed_id, b.label, bb.block_date::TEXT, bb.block_type, 
			   COALESCE(bb.guest_name, '') as guest_name,
			   COALESCE(bb.solicitud_id::TEXT, '') as solicitud_id
		FROM bed_blocks bb
		JOIN beds b ON b.id = bb.bed_id
		WHERE b.room_type = $1 AND bb.block_date >= $2::DATE AND bb.block_date <= $3::DATE
		ORDER BY bb.block_date, bb.bed_id
	`, roomType, fromDate, toDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []map[string]interface{}
	for rows.Next() {
		var id, bedID int
		var label, date, blockType, guestName, solicitudID string
		rows.Scan(&id, &bedID, &label, &date, &blockType, &guestName, &solicitudID)
		blocks = append(blocks, map[string]interface{}{
			"id":           id,
			"bed_id":       bedID,
			"label":        label,
			"block_date":   date,
			"block_type":   blockType,
			"guest_name":   guestName,
			"solicitud_id": solicitudID,
		})
	}
	return blocks, nil
}

// EnsureUsersTable handles migrations for the users table
func (r *Repository) EnsureUsersTable() error {
	// Add age column if not exists
	_, _ = r.DB.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 0")
	// Add how_found column if not exists
	_, _ = r.DB.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS how_found TEXT DEFAULT ''")
	return nil
}

// EnsureConfiguracionPreciosTable ensures the configuration table exists and has default values for room types
func (r *Repository) EnsureConfiguracionPreciosTable() error {
	fmt.Println("   [MIGRACIÓN] Iniciando EnsureConfiguracionPreciosTable...")
	query := `
		CREATE TABLE IF NOT EXISTS configuracion_precios (
			id SERIAL PRIMARY KEY,
			room_type TEXT UNIQUE,
			base_price FLOAT,
			discount_nights JSONB,
			discount_guests JSONB,
			discount_lead_time JSONB,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`
	_, err := r.DB.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create configuracion_precios table: %w", err)
	}
	fmt.Println("   [MIGRACIÓN] Tabla configuracion_precios lista.")

	// Initialize with default values if empty
	roomTypes := []string{"compartido", "privado"}
	for _, rt := range roomTypes {
		var exists bool
		err := r.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM configuracion_precios WHERE room_type = $1)", rt).Scan(&exists)
		if err != nil {
			fmt.Printf("   [WARNING] Error check exists RT %s: %v\n", rt, err)
			continue
		}
		if !exists {
			fmt.Printf("   [MIGRACIÓN] Inicializando RT %s con valores por defecto...\n", rt)
			basePrice := 18000.0
			if rt == "privado" {
				basePrice = 38000.0
			}
			// Empty JSON arrays as default
			emptyJSON := "[]"
			_, err = r.DB.Exec(`
				INSERT INTO configuracion_precios (room_type, base_price, discount_nights, discount_guests, discount_lead_time)
				VALUES ($1, $2, $3, $4, $5)
			`, rt, basePrice, emptyJSON, emptyJSON, emptyJSON)
		}
	}

	return nil
}


// GetConfiguracionPrecios returns all pricing configurations
func (r *Repository) GetConfiguracionPrecios() (map[string]interface{}, error) {
	rows, err := r.DB.Query("SELECT room_type, base_price, discount_nights, discount_guests, discount_lead_time FROM configuracion_precios")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	configs := make(map[string]interface{})
	for rows.Next() {
		var rt string
		var bp float64
		var dn, dg, dlt []byte
		if err := rows.Scan(&rt, &bp, &dn, &dg, &dlt); err != nil {
			return nil, err
		}
		configs[rt] = map[string]interface{}{
			"base_price":         bp,
			"discount_nights":    string(dn),
			"discount_guests":    string(dg),
			"discount_lead_time": string(dlt),
		}
	}
	return configs, nil
}

// UpdateConfiguracionPrecio updates a specific room type configuration
func (r *Repository) UpdateConfiguracionPrecio(rt string, bp float64, dn, dg, dlt string) error {
	_, err := r.DB.Exec(`
		UPDATE configuracion_precios 
		SET base_price = $1, discount_nights = $2, discount_guests = $3, discount_lead_time = $4, updated_at = CURRENT_TIMESTAMP
		WHERE room_type = $5
	`, bp, dn, dg, dlt, rt)
	return err
}

