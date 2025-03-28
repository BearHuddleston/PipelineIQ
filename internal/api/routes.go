package api

import (
	"net/http"

	"github.com/arkouda/PipelineIQ/internal/config"
	"github.com/arkouda/PipelineIQ/internal/services"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// SetupRouter initializes the Gin router with all application routes
func SetupRouter(db *gorm.DB, logger *zap.SugaredLogger, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Health check endpoint
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"message": "pong",
		})
	})

	// Initialize services
	ingestionSvc := services.NewDataIngestionService(db, logger, &services.Config{
		APIURL1:       cfg.APIURL1,
		APIURL2:       cfg.APIURL2,
		WeatherAPIKey: cfg.WeatherAPIKey,
	})
	processorSvc := services.NewDataProcessorService(db, logger)
	llmSvc := services.NewLLMService(db, logger, cfg.OpenAIAPIKey)

	// Initialize handler with services
	handler := &Handler{
		DB:           db,
		Logger:       logger,
		IngestionSvc: ingestionSvc,
		ProcessorSvc: processorSvc,
		LLMSvc:       llmSvc,
	}

	// Set up API routes
	r.POST("/fetch_and_process", handler.FetchAndProcessHandler)
	r.GET("/results", handler.GetResultsHandler)
	r.GET("/analysis", handler.GetAnalysisHandler)

	return r
}
