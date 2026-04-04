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

	// 1. Alter Users Table
	queries := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni VARCHAR(50) UNIQUE;`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'SOCIO';`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			log.Printf("Failed to execute query %q: %v", q, err)
		} else {
			fmt.Printf("Executed: %s\n", q)
		}
	}

	// 2. Create Tokens Table
	tokensTable := `
	CREATE TABLE IF NOT EXISTS tokens (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID REFERENCES users(id),
		token_code VARCHAR(50) UNIQUE NOT NULL,
		tier VARCHAR(50),
		is_active BOOLEAN DEFAULT TRUE,
		issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP WITH TIME ZONE
	);`
	if _, err := db.Exec(tokensTable); err != nil {
		log.Printf("Failed to create tokens table: %v", err)
	} else {
		fmt.Println("Tokens table ensured.")
	}

	// 3. Create Reservations Table
	reservationsTable := `
	CREATE TABLE IF NOT EXISTS reservations (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID REFERENCES users(id),
		spot_id UUID,
		start_date TIMESTAMP WITH TIME ZONE,
		end_date TIMESTAMP WITH TIME ZONE,
		total_price DECIMAL(10, 2),
		status VARCHAR(50),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := db.Exec(reservationsTable); err != nil {
		log.Printf("Failed to create reservations table: %v", err)
	} else {
		fmt.Println("Reservations table ensured.")
	}

	// 4. Create Impact Logs Table
	impactLogsTable := `
	CREATE TABLE IF NOT EXISTS impact_logs (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID REFERENCES users(id),
		reservation_id UUID REFERENCES reservations(id),
		action_type VARCHAR(50),
		points INTEGER,
		description TEXT,
		logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := db.Exec(impactLogsTable); err != nil {
		log.Printf("Failed to create impact_logs table: %v", err)
	} else {
		fmt.Println("Impact Logs table ensured.")
	}

	fmt.Println("Database schema updated successfully.")
}
