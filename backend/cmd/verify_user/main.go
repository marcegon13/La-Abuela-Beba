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

	email := "marcelo@lanubecomputacion.com"
	var role string
	var isActive bool
	err = db.QueryRow("SELECT role, is_active FROM users WHERE email = $1", email).Scan(&role, &isActive)
	if err == sql.ErrNoRows {
		fmt.Printf("User %s NOT FOUND.\n", email)
	} else if err != nil {
		log.Fatal(err)
	} else {
		fmt.Printf("User: %s | Role: %s | Active: %v\n", email, role, isActive)
	}
}
