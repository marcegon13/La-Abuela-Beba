package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"labeba/internal/api"
	"labeba/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
)

// spaHandler serves the React SPA. It serves static files if they exist,
// otherwise falls back to index.html so React Router can handle the route.
type spaHandler struct {
	staticPath string // Path to the frontend dist folder
	indexPath  string // Filename of the index (usually "index.html")
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Clean the path
	path := filepath.Join(h.staticPath, filepath.Clean(r.URL.Path))

	// Check if the requested file exists
	indexPath := filepath.Join(h.staticPath, h.indexPath)
	info, err := os.Stat(path)
	if os.IsNotExist(err) || (info != nil && info.IsDir()) || path == indexPath {
		// Serve index.html (let React Router handle it)
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		http.ServeFile(w, r, indexPath)
		return
	}
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// File exists → serve it (JS, CSS, images, etc.)
	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}

func main() {
	// Database Connection
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
	fmt.Println("Connected to PostgreSQL database")

	// Dependencies
	repo := repository.NewRepository(db)
	handler := api.NewHandler(repo)

	// Auto-migrate gallery table
	if err := repo.AutoMigrateGallery(); err != nil {
		log.Printf("Warning: Gallery migration failed: %v", err)
	} else {
		fmt.Println("Gallery table ready")
	}

	// Hot-migrate users table for new fields
	if err := repo.EnsureUsersTable(); err != nil {
		log.Printf("Warning: Users table migration failed: %v", err)
	}

	// Auto-migrate huespedes_historicos table
	if err := repo.EnsureHuespedHistoricoTable(); err != nil {
		log.Printf("Warning: HuespedHistorico migration failed: %v", err)
	}

	// Auto-migrate beds & bed_blocks tables
	if err := repo.AutoMigrateBeds(); err != nil {
		log.Printf("Warning: Beds migration failed: %v", err)
	} else {
		fmt.Println("Beds tables ready")
	}

	// Auto-migrate pricing config table
	if err := repo.EnsureConfiguracionPreciosTable(); err != nil {
		log.Printf("Warning: Pricing config migration failed: %v", err)
	} else {
		fmt.Println("Pricing config table ready")
	}


	// Router Setup
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Setup — reads allowed origins from CORS_ORIGINS env var (comma-separated)
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"}
	if envOrigins := os.Getenv("CORS_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// API Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/register", handler.RegisterHandler)
		r.Post("/verify", handler.VerifyEmailHandler)
		r.Post("/login", handler.LoginHandler)
		r.Post("/auth/google", handler.GoogleAuthHandler)
		r.Get("/tokens/stats", handler.GetTokenStatsHandler)
		r.Post("/tokens/claim", handler.ClaimTokenHandler)
		r.Post("/bookings", handler.CreateBookingHandler)
		r.Get("/user/impact/{id}", handler.GetImpactHandler)
		r.Post("/user/impact/log", handler.LogActionHandler)

		// Gallery Routes
		r.Get("/gallery", handler.GetGalleryHandler)
		r.Post("/gallery/upload", handler.UploadGalleryHandler)

		// Public Solicitud de Reserva
		r.Post("/solicitudes", handler.CreateSolicitudHandler)

		// Beds & Availability (public)
		r.Get("/beds", handler.GetBedsHandler)
		r.Get("/beds/availability", handler.GetBedAvailabilityHandler)

		// Webhook from Google Sheets
		r.Post("/webhooks/google-sheets", handler.GoogleSheetsWebhookHandler)

		// Admin Routes
		r.Route("/admin", func(r chi.Router) {
			r.Get("/stats", handler.AdminGetStatsHandler)
			r.Get("/users", handler.AdminGetUsersHandler)
			r.Post("/users/{id}/approve", handler.AdminApproveUserHandler)
			r.Put("/users/{id}/role", handler.UpdateUserRoleHandler)

			// Huesped Historico / CSV Import
			r.Post("/huespedes/import", handler.UploadCSVHandler)
			r.Get("/huespedes", handler.GetHuespedHistoricoHandler)
			r.Get("/huespedes/stats", handler.GetHuespedStatsHandler)

			// Solicitudes de Reserva (admin management)
			r.Get("/solicitudes", handler.GetSolicitudesHandler)
			r.Put("/solicitudes/{id}", handler.UpdateSolicitudHandler)

			// Beds Management (admin)
			r.Get("/beds/blocks", handler.AdminGetBedBlocksHandler)
			r.Post("/beds/{id}/block", handler.AdminBlockBedHandler)
			r.Delete("/beds/{id}/block", handler.AdminUnblockBedHandler)

			// Pricing & Promotions (admin)
			r.Get("/pricing", handler.GetPricingConfigHandler)
			r.Put("/pricing", handler.UpdatePricingConfigHandler)
		})
	})


	// Serve uploaded files
	fileServer := http.FileServer(http.Dir("uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

	// SPA Fallback — Serve React frontend for all non-API routes
	// Check if the frontend dist folder exists (production build)
	frontendDist := "../frontend/dist"
	if _, err := os.Stat(frontendDist); err == nil {
		fmt.Println("Serving frontend from:", frontendDist)
		spa := spaHandler{staticPath: frontendDist, indexPath: "index.html"}
		r.NotFound(spa.ServeHTTP)
	} else {
		// Development mode: no dist folder, just return a helpful message
		r.NotFound(func(w http.ResponseWriter, r *http.Request) {
			// Skip API paths (they should 404 normally)
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.Error(w, "API endpoint not found", http.StatusNotFound)
				return
			}
			// For non-API routes in dev, redirect to Vite dev server
			http.Redirect(w, r, "http://localhost:5173"+r.URL.Path, http.StatusTemporaryRedirect)
		})
	}

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
