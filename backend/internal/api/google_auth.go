package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"labeba/internal/logic"
	"labeba/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// GoogleAuthRequest is sent from the frontend with the Google credential token
type GoogleAuthRequest struct {
	Credential string `json:"credential"`
}

// GoogleTokenInfo is the response from Google's tokeninfo endpoint
type GoogleTokenInfo struct {
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	EmailVerified string `json:"email_verified"`
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
}

func (h *Handler) GoogleAuthHandler(w http.ResponseWriter, r *http.Request) {
	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Credential == "" {
		http.Error(w, "Missing Google credential", http.StatusBadRequest)
		return
	}

	// Verify the token with Google
	googleResp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.Credential)
	if err != nil {
		http.Error(w, "Failed to verify Google token", http.StatusInternalServerError)
		return
	}
	defer googleResp.Body.Close()

	body, err := io.ReadAll(googleResp.Body)
	if err != nil {
		http.Error(w, "Failed to read Google response", http.StatusInternalServerError)
		return
	}

	if googleResp.StatusCode != 200 {
		http.Error(w, "Invalid Google token", http.StatusUnauthorized)
		return
	}

	var tokenInfo GoogleTokenInfo
	if err := json.Unmarshal(body, &tokenInfo); err != nil {
		http.Error(w, "Failed to parse Google token info", http.StatusInternalServerError)
		return
	}

	// Verify the audience matches our Client ID
	expectedClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if expectedClientID != "" && tokenInfo.Aud != expectedClientID {
		http.Error(w, "Token audience mismatch", http.StatusUnauthorized)
		return
	}

	if tokenInfo.EmailVerified != "true" {
		http.Error(w, "Google email not verified", http.StatusUnauthorized)
		return
	}

	// Check if user already exists
	user, err := h.Repo.GetUserByEmail(tokenInfo.Email)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if user == nil {
		// Create new user automatically from Google data
		randomPassword, _ := logic.HashPassword(uuid.New().String()) // Random hash, user won't use password login

		var newUser models.User
		newUser.FullName = tokenInfo.Name
		newUser.Email = tokenInfo.Email
		newUser.DNI = "GOOGLE-" + tokenInfo.Sub[:8] // Use Google Sub ID as placeholder DNI
		newUser.Phone = ""
		newUser.PasswordHash = randomPassword
		newUser.IsActive = true  // Google-verified users are auto-activated
		newUser.IsVerified = true
		newUser.VerificationCode = ""
		newUser.Role = "SOCIO" // Default role

		if err := h.Repo.CreateUser(&newUser); err != nil {
			http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		user, _ = h.Repo.GetUserByEmail(tokenInfo.Email)
		if user == nil {
			http.Error(w, "Failed to retrieve created user", http.StatusInternalServerError)
			return
		}
	}

	// Check if user is active (could have been deactivated by admin)
	if !user.IsActive {
		http.Error(w, "Tu cuenta está pendiente de aprobación", http.StatusForbidden)
		return
	}

	// Generate JWT (same as regular login)
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

	// Return same response as regular login
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

	fmt.Printf("✅ Google Auth: %s (%s) logged in successfully\n", user.FullName, user.Email)
}
