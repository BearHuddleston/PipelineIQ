package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes the Gin router with all application routes
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Health check endpoint
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"message": "pong",
		})
	})

	// Main API endpoints will be added here
	return r
}
