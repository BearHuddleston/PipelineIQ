package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/arkouda/PipelineIQ/internal/models"
	"github.com/arkouda/PipelineIQ/internal/services"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Handler contains the dependencies needed for API handlers
type Handler struct {
	DB           *gorm.DB
	Logger       *zap.SugaredLogger
	IngestionSvc *services.DataIngestionService
	ProcessorSvc *services.DataProcessorService
	LLMSvc       *services.LLMService
}

// FetchAndProcessHandler handles the request to fetch data, process it, and generate insights
func (h *Handler) FetchAndProcessHandler(c *gin.Context) {
	h.Logger.Info("Handling fetch and process request")

	// Fetch data from APIs
	if err := h.IngestionSvc.FetchData(); err != nil {
		h.Logger.Errorw("Error fetching data", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch data: " + err.Error(),
		})
		return
	}

	// Process the fetched data
	processedData, err := h.ProcessorSvc.ProcessData()
	if err != nil {
		h.Logger.Errorw("Error processing data", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process data: " + err.Error(),
		})
		return
	}

	// Generate insights using LLM
	llmAnalysis, err := h.LLMSvc.GenerateInsights()
	if err != nil {
		h.Logger.Errorw("Error generating insights", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate insights: " + err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message":       "Data pipeline completed successfully",
		"processed_id":  processedData.ID,
		"analysis_id":   llmAnalysis.ID,
		"completed_at":  time.Now(),
	})
}

// GetResultsHandler returns the processed data
func (h *Handler) GetResultsHandler(c *gin.Context) {
	h.Logger.Info("Handling get results request")

	// Optional date filter
	dateFilter := c.Query("date")
	var processedData []models.ProcessedData
	var err error

	if dateFilter != "" {
		// Parse date string to time.Time
		date, err := time.Parse("2006-01-02", dateFilter)
		if err != nil {
			h.Logger.Errorw("Invalid date format", "date", dateFilter, "error", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid date format. Please use YYYY-MM-DD",
			})
			return
		}

		// Query with date filter
		err = h.DB.Where("DATE(processed_at) = DATE(?)", date).Order("processed_at desc").Find(&processedData).Error
	} else {
		// Query without filter
		err = h.DB.Order("processed_at desc").Limit(10).Find(&processedData).Error
	}

	if err != nil {
		h.Logger.Errorw("Error fetching processed data", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch results: " + err.Error(),
		})
		return
	}

	if len(processedData) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No processed data found",
		})
		return
	}

	// Return the results
	c.JSON(http.StatusOK, gin.H{
		"results": processedData,
		"count":   len(processedData),
	})
}

// GetAnalysisHandler returns the LLM-generated insights
func (h *Handler) GetAnalysisHandler(c *gin.Context) {
	h.Logger.Info("Handling get analysis request")

	// Optional ID parameter
	analysisID := c.Query("id")
	var llmAnalysis models.LLMAnalysis
	var err error

	if analysisID != "" {
		// Query by ID
		err = h.DB.First(&llmAnalysis, analysisID).Error
	} else {
		// Get the latest analysis
		err = h.DB.Order("generated_at desc").First(&llmAnalysis).Error
	}

	if err != nil {
		h.Logger.Errorw("Error fetching LLM analysis", "error", err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No analysis found",
		})
		return
	}

	// Return the analysis
	c.JSON(http.StatusOK, gin.H{
		"analysis":     llmAnalysis,
		"generated_at": llmAnalysis.GeneratedAt,
	})
}

// StreamAnalysisHandler streams LLM-generated insights using Server-Sent Events
func (h *Handler) StreamAnalysisHandler(c *gin.Context) {
	h.Logger.Info("Handling stream analysis request")

	// Optional processed data ID parameter
	processedID := c.Query("processed_id")
	var processedDataID uint = 0
	
	if processedID != "" {
		if id, err := strconv.ParseUint(processedID, 10, 32); err == nil {
			processedDataID = uint(id)
		} else {
			h.Logger.Errorw("Invalid processed_id parameter", "error", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid processed_id parameter",
			})
			return
		}
	}

	// Since we're handling a long-running process with SSE, 
	// we need to disable Gin middleware timeouts and buffering
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	
	// Important to disable buffering for SSE
	c.Writer.Flush()

	// Stream the LLM analysis
	h.LLMSvc.StreamLLMAnalysis(c.Writer, processedDataID)
}