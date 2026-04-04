package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "user=postgres password=postgres dbname=labeba sslmode=disable"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	email := "info@laabuelabeba.cloud"
	password := "Roma669!"

	// Generate Hash
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Check if user exists
	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
	if err != nil {
		log.Fatalf("Failed to check user existence: %v", err)
	}

	if exists {
		// Update existing user
		_, err := db.Exec("UPDATE users SET password_hash=$1, role='ADMIN', is_active=true WHERE email=$2", string(hash), email)
		if err != nil {
			log.Fatalf("Failed to update user: %v", err)
		}
		fmt.Printf("UPDATED existing user %s to ADMIN with password '%s'\n", email, password)
	} else {
		// Create new user
		// Note: We need to handle potential DNI conflicts if 'ADMIN-DNI-001' already exists for another user (unlikely for this specific case but good practice)
		// For this script simpler is better as we expect to update the user created in previous step.
		_, err := db.Exec(`
			INSERT INTO users (email, password_hash, full_name, role, is_active, dni) 
			VALUES ($1, $2, 'Marcelo Admin', 'ADMIN', true, 'ADMIN-DNI-001')
			ON CONFLICT (dni) DO UPDATE SET email=EXCLUDED.email -- Minimal conflict handling
		`, email, string(hash))
		if err != nil {
			// Fallback if DNI conflict on INSERT
			log.Printf("Insert failed (likely DNI conflict), trying update via email: %v", err)
			_, err = db.Exec("UPDATE users SET password_hash=$1, role='ADMIN', is_active=true WHERE email=$2", string(hash), email)
			if err != nil {
				log.Fatalf("Failed to create/update user: %v", err)
			}
		}
		fmt.Printf("CREATED/UPDATED admin user %s with password '%s'\n", email, password)
	}
}
