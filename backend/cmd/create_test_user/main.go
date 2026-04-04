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

	email := "test@labeba.com"
	password := "test1234"
	fullName := "Huésped Test"
	dni := "99999999"

	// Generate Hash
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Check if user exists
	var exists bool
	db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)

	if exists {
		db.Exec("UPDATE users SET password_hash=$1, role='SOCIO', is_active=true, is_verified=true WHERE email=$2", string(hash), email)
		fmt.Printf("UPDATED test user: %s / %s\n", email, password)
	} else {
		_, err = db.Exec(`
			INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified, dni, phone) 
			VALUES ($1, $2, $3, 'SOCIO', true, true, $4, '1134826691')
		`, email, string(hash), fullName, dni)
		if err != nil {
			log.Fatalf("Failed to create test user: %v", err)
		}
		fmt.Printf("CREATED test user: %s / %s\n", email, password)
	}
}
