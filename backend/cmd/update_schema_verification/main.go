package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
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

	// Add verification columns
	queries := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			log.Printf("Failed to execute query %q: %v", q, err)
		} else {
			fmt.Printf("Executed: %s\n", q)
		}
	}

	// Update existing admins to be verified so they don't get locked out or hidden
	_, err = db.Exec("UPDATE users SET is_verified = true WHERE role = 'ADMIN'")
	if err != nil {
		log.Printf("Failed to update admin verification status: %v", err)
	}

	fmt.Println("Database schema updated for verification.")
}
