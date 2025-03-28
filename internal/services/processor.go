package services

import (
	"encoding/json"
	"fmt"
	"time"
	
	"github.com/arkouda/PipelineIQ/internal/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// DataProcessorService handles transforming raw data into processed insights
type DataProcessorService struct {
	DB     *gorm.DB
	Logger *zap.SugaredLogger
}

// NewDataProcessorService creates a new DataProcessorService instance
func NewDataProcessorService(db *gorm.DB, logger *zap.SugaredLogger) *DataProcessorService {
	return &DataProcessorService{
		DB:     db,
		Logger: logger,
	}
}

// Generic data structure to hold API data
type APIData struct {
	Timestamp time.Time              `json:"timestamp,omitempty"`
	Metrics   map[string]interface{} `json:"metrics,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// ProcessedResult represents the combined and transformed data
type ProcessedResult struct {
	Timestamp        time.Time              `json:"timestamp"`
	CombinedMetrics  map[string]interface{} `json:"combined_metrics"`
	DerivedMetrics   map[string]float64     `json:"derived_metrics"`
	DataSources      []string               `json:"data_sources"`
}

// ProcessData retrieves the latest raw data and processes it
func (s *DataProcessorService) ProcessData() (*models.ProcessedData, error) {
	s.Logger.Info("Starting data processing")

	// Retrieve the latest raw data entries
	var rawDataEntries []models.RawData
	if err := s.DB.Order("fetched_at desc").Limit(2).Find(&rawDataEntries).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve raw data: %w", err)
	}

	if len(rawDataEntries) == 0 {
		return nil, fmt.Errorf("no raw data available for processing")
	}

	s.Logger.Infow("Retrieved raw data for processing", "count", len(rawDataEntries))

	// Process and combine the data
	combinedResult, err := s.combineAndTransform(rawDataEntries)
	if err != nil {
		return nil, fmt.Errorf("data transformation failed: %w", err)
	}

	// Convert the processed result to JSON
	resultJSON, err := json.Marshal(combinedResult)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize processed data: %w", err)
	}

	// Store the processed data
	processedData := models.ProcessedData{
		Content:     string(resultJSON),
		ProcessedAt: time.Now(),
	}

	if err := s.DB.Create(&processedData).Error; err != nil {
		return nil, fmt.Errorf("failed to store processed data: %w", err)
	}

	s.Logger.Infow("Data processing completed successfully", "id", processedData.ID)
	return &processedData, nil
}

// combineAndTransform merges data from multiple sources and calculates derived metrics
func (s *DataProcessorService) combineAndTransform(rawDataEntries []models.RawData) (*ProcessedResult, error) {
	// Initialize result
	result := &ProcessedResult{
		Timestamp:       time.Now(),
		CombinedMetrics: make(map[string]interface{}),
		DerivedMetrics:  make(map[string]float64),
		DataSources:     []string{},
	}

	// Process each raw data entry
	for _, entry := range rawDataEntries {
		// Parse the JSON content as a generic map first to handle different API structures
		var rawJSON map[string]interface{}
		if err := json.Unmarshal([]byte(entry.Content), &rawJSON); err != nil {
			s.Logger.Warnw("Failed to parse raw data JSON", "error", err, "source", entry.SourceName)
			continue
		}

		// Add source to the list
		result.DataSources = append(result.DataSources, entry.SourceName)

		// Process the JSON data based on its structure
		flattenedData := make(map[string]interface{})
		
		// Flatten the JSON structure for easier processing
		flattenJSON("", rawJSON, flattenedData)
		
		// Add all flattened data to combined metrics
		for key, value := range flattenedData {
			result.CombinedMetrics[fmt.Sprintf("%s_%s", entry.SourceName, key)] = value
		}
	}

	// Calculate derived metrics
	// This is a placeholder - in a real application, this would implement domain-specific logic
	// to calculate meaningful derived metrics based on the combined data
	result.DerivedMetrics["example_derived_metric"] = 0.0

	// For demonstration, let's calculate a simple derived metric if we have two data sources
	if len(result.DataSources) >= 2 {
		// Calculate a ratio or some other derived value based on data from both sources
		result.DerivedMetrics["data_sources_count"] = float64(len(result.DataSources))
	}

	return result, nil
}

// flattenJSON recursively flattens a nested JSON structure into a single-level map
// with keys representing the path to each value
func flattenJSON(prefix string, data map[string]interface{}, result map[string]interface{}) {
	for k, v := range data {
		key := k
		if prefix != "" {
			key = prefix + "_" + k
		}

		switch val := v.(type) {
		case map[string]interface{}:
			// Recursively flatten nested maps
			flattenJSON(key, val, result)
		case []interface{}:
			// For arrays, store a count and process each item with index
			result[key+"_count"] = len(val)
			for i, item := range val {
				if mapItem, ok := item.(map[string]interface{}); ok {
					flattenJSON(fmt.Sprintf("%s_%d", key, i), mapItem, result)
				} else {
					result[fmt.Sprintf("%s_%d", key, i)] = item
				}
			}
		default:
			// Store primitive values directly
			result[key] = val
		}
	}
}
