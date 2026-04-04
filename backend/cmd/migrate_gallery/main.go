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

	// Create galerias table
	query := `
	CREATE TABLE IF NOT EXISTS galerias (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		titulo VARCHAR(255) NOT NULL,
		categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Obra', 'Entorno', 'Social')),
		imagen_url TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_galerias_categoria ON galerias(categoria);
	`

	_, err = db.Exec(query)
	if err != nil {
		log.Fatalf("Failed to create galerias table: %v", err)
	}

	fmt.Println("✅ Table 'galerias' created successfully!")
}
