package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// GetBedsHandler returns all beds, optionally filtered by room_type query param
func (h *Handler) GetBedsHandler(w http.ResponseWriter, r *http.Request) {
	roomType := r.URL.Query().Get("room_type")
	beds, err := h.Repo.GetBeds(roomType)
	if err != nil {
		http.Error(w, "Failed to get beds: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(beds)
}

// GetBedAvailabilityHandler returns beds with availability info for a date range
func (h *Handler) GetBedAvailabilityHandler(w http.ResponseWriter, r *http.Request) {
	roomType := r.URL.Query().Get("room_type")
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	if from == "" || to == "" {
		http.Error(w, "Missing 'from' and 'to' query params (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	availability, err := h.Repo.GetBedAvailability(roomType, from, to)
	if err != nil {
		http.Error(w, "Failed to get availability: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(availability)
}

// AdminBlockBedHandler blocks a bed for a specific date
func (h *Handler) AdminBlockBedHandler(w http.ResponseWriter, r *http.Request) {
	bedIDStr := chi.URLParam(r, "id")
	bedID, err := strconv.Atoi(bedIDStr)
	if err != nil {
		http.Error(w, "Invalid bed ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Date string `json:"date"` // YYYY-MM-DD
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Date == "" {
		http.Error(w, "Missing 'date' field (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	if err := h.Repo.AdminBlockBed(bedID, req.Date); err != nil {
		http.Error(w, "Failed to block bed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "blocked"})
}

// AdminUnblockBedHandler removes an admin block from a bed
func (h *Handler) AdminUnblockBedHandler(w http.ResponseWriter, r *http.Request) {
	bedIDStr := chi.URLParam(r, "id")
	bedID, err := strconv.Atoi(bedIDStr)
	if err != nil {
		http.Error(w, "Invalid bed ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Date string `json:"date"` // YYYY-MM-DD
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Date == "" {
		http.Error(w, "Missing 'date' field (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}

	if err := h.Repo.AdminUnblockBed(bedID, req.Date); err != nil {
		http.Error(w, "Failed to unblock bed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "unblocked"})
}

// AdminGetBedBlocksHandler returns all blocks for admin view
func (h *Handler) AdminGetBedBlocksHandler(w http.ResponseWriter, r *http.Request) {
	roomType := r.URL.Query().Get("room_type")
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	if roomType == "" || from == "" || to == "" {
		http.Error(w, "Missing room_type, from, to query params", http.StatusBadRequest)
		return
	}

	blocks, err := h.Repo.GetBedBlocksForAdmin(roomType, from, to)
	if err != nil {
		http.Error(w, "Failed to get blocks: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}
