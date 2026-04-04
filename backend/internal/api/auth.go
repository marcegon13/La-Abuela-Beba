package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"labeba/internal/email"
	"labeba/internal/logic"
	"labeba/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWT Secret Key — reads from environment variable JWT_SECRET
// In production, ALWAYS set this to a strong random string
var jwtKey = func() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "super_secret_key_la_beba_2026" // fallback for local dev only
	}
	return []byte(secret)
}()

// Claims defines the JWT payload
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string              `json:"token"`
	User  UserResponsePayload `json:"user"`
}

type UserResponsePayload struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	FullName string    `json:"full_name"`
	Role     string    `json:"role"`
}

func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Get User by Email
	user, err := h.Repo.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// 2. Check Password
	if !logic.CheckPasswordHash(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// 2.5 Check Approval Status
	if !user.IsActive {
		http.Error(w, "Registro recibido. Se revisará tu solicitud en breve", http.StatusForbidden)
		return
	}

	// 3. Generate JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID.String(),
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "la-beba-auth",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Failed to sign token", http.StatusInternalServerError)
		return
	}

	// 4. Return Response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token: tokenString,
		User: UserResponsePayload{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Role:     user.Role,
		},
	})
}

type RegisterRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	DNI      string `json:"dni"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Age      int    `json:"age"`
	HowFound string `json:"how_found"`
}

func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Basic Validation
	if req.FullName == "" || req.Email == "" || req.DNI == "" || req.Password == "" {
		http.Error(w, "All fields are required (Name, Email, DNI, Password)", http.StatusBadRequest)
		return
	}

	// 2. Check duplicates (Email or DNI)
	exists, err := h.Repo.UserExists(req.Email, req.DNI)
	if err != nil {
		http.Error(w, "Database error checking user", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "User with this Email or DNI already exists", http.StatusConflict)
		return
	}

	// 3. Hash Password
	hashedPassword, err := logic.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	// 4. Create User (Default Active=False, Verified=False)
	code := fmt.Sprintf("%06d", time.Now().UnixNano()%1000000) // Simple OTP

	var user models.User
	user.FullName = req.FullName
	user.Email = req.Email
	user.DNI = req.DNI
	user.Phone = req.Phone
	user.Age = req.Age
	user.HowFound = req.HowFound
	user.PasswordHash = hashedPassword
	user.IsActive = false
	user.IsVerified = false // Needs OTP verification
	user.VerificationCode = code

	if err := h.Repo.CreateUser(&user); err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 5. Send Verification Email
	go email.SendVerificationEmail(user.Email, code)

	// 6. Response
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Se ha enviado un código de verificación a tu email.",
		"email":   user.Email,
	})
}

type VerifyRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

func (h *Handler) VerifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	var req VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Repo.VerifyUser(req.Email, req.Code); err != nil {
		http.Error(w, "Verification failed: "+err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Email verificado correctamente. Tu solicitud ahora está pendiente de aprobación.",
	})
}
