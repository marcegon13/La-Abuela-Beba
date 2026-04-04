package logic

import (
	"time"

	"labeba/internal/models"
)

// CalculateIRBPoints determines the total points for a given action
func CalculateIRBPoints(actionType string) int {
	switch actionType {
	case "RESERVATION":
		return models.PointsReservation
	case "WASTE_MANAGEMENT":
		return models.PointsWasteManagement
	case "LOCAL_CONSUMPTION":
		return models.PointsLocalConsumption
	default:
		return 0
	}
}

// CalculateDynamicPrice calculates the price based on booking lead time
// Discounts: 3 months (5%), 6 months (10%), 9 months (15%)
func CalculateDynamicPrice(basePrice float64, startDate time.Time) float64 {
	now := time.Now()
	monthsUntilStart := int(startDate.Sub(now).Hours() / (24 * 30))

	discount := 0.0

	if monthsUntilStart >= 9 {
		discount = 0.15
	} else if monthsUntilStart >= 6 {
		discount = 0.10
	} else if monthsUntilStart >= 3 {
		discount = 0.05
	}

	finalPrice := basePrice * (1 - discount)
	return finalPrice
}

// IsTokenHolder checks if a user holds an active exclusive token
// In a real application, this would query the database
func IsTokenHolder(userTokens []models.Token) bool {
	for _, token := range userTokens {
		if token.IsActive && (token.ExpiresAt == nil || token.ExpiresAt.After(time.Now())) {
			return true
		}
	}
	return false
}

// PointsToCredits converts IRB points to monetary value
// Rate: 100 points = $5.00
func PointsToCredits(points int) float64 {
	return float64(points) / 100.0 * 5.0
}
