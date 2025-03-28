package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/arkouda/PipelineIQ/internal/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// DataIngestionService handles fetching data from external APIs
type DataIngestionService struct {
	DB     *gorm.DB
	Logger *zap.SugaredLogger
	Config *Config
}

// Config contains the required configuration for the ingestion service
type Config struct {
	CryptoAPIURL   string
	APIURL2        string
	WeatherAPIKey  string
}

// FetchResult represents the result of a fetch operation
type FetchResult struct {
	SourceName string
	Content    string
	Error      error
}

// New creates a new DataIngestionService instance
func NewDataIngestionService(db *gorm.DB, logger *zap.SugaredLogger, config *Config) *DataIngestionService {
	return &DataIngestionService{
		DB:     db,
		Logger: logger,
		Config: config,
	}
}

// FetchData concurrently fetches data from all configured sources and stores it in the database
func (s *DataIngestionService) FetchData() error {
	s.Logger.Info("Starting data ingestion")

	// Use a wait group to coordinate goroutines
	var wg sync.WaitGroup

	// Create a channel to collect results
	resultCh := make(chan FetchResult, 2) // Buffer for 2 API sources

	// Source 1 - Cryptocurrency API
	wg.Add(1)
	go func() {
		defer wg.Done()
		content, err := s.fetchFromAPI(s.Config.CryptoAPIURL)
		resultCh <- FetchResult{SourceName: "CryptoAPI", Content: content, Error: err}
	}()

	// Source 2 - Weather API
	wg.Add(1)
	go func() {
		defer wg.Done()
		// Default to Austin if no city is specified
		city := "Austin"
		// Format the Weather API URL with the API key
		weatherURL := fmt.Sprintf("%s?q=%s&key=%s", s.Config.APIURL2, city, s.Config.WeatherAPIKey)
		content, err := s.fetchFromAPI(weatherURL)
		resultCh <- FetchResult{SourceName: "WeatherAPI", Content: content, Error: err}
	}()

	// Close the channel when all goroutines are done
	go func() {
		wg.Wait()
		close(resultCh)
	}()

	// Process the results
	for result := range resultCh {
		var content string
		if result.Error != nil {
			s.Logger.Errorw("Error fetching data from source",
				"source", result.SourceName,
				"error", result.Error,
			)
			// Use a placeholder empty JSON object for failed requests
			content = `{"status":"error","error":"` + result.Error.Error() + `"}`
		} else {
			content = result.Content
		}

		// Store in database
		rawData := models.RawData{
			SourceName: result.SourceName,
			Content:    content,
			FetchedAt:  time.Now(),
		}

		if err := s.DB.Create(&rawData).Error; err != nil {
			s.Logger.Errorw("Error storing raw data",
				"source", result.SourceName,
				"error", err,
			)
			return err
		}

		s.Logger.Infow("Data fetched and stored successfully",
			"source", result.SourceName,
			"id", rawData.ID,
		)
	}

	return nil
}

// fetchFromAPI fetches data from a single API endpoint
func (s *DataIngestionService) fetchFromAPI(url string) (string, error) {
	if url == "" {
		return "", fmt.Errorf("empty API URL")
	}

	s.Logger.Infow("Fetching data from API", "url", url)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make the request
	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned non-200 status code: %d", resp.StatusCode)
	}

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	// Validate that the response is valid JSON
	var jsonData interface{}
	if err := json.Unmarshal(body, &jsonData); err != nil {
		return "", fmt.Errorf("response is not valid JSON: %w", err)
	}

	return string(body), nil
}
