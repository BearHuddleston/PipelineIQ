package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/arkouda/PipelineIQ/internal/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// LLMService handles generating insights from processed data using an LLM
type LLMService struct {
	DB           *gorm.DB
	Logger       *zap.SugaredLogger
	OpenAIAPIKey string
}

// NewLLMService creates a new LLMService instance
func NewLLMService(db *gorm.DB, logger *zap.SugaredLogger, apiKey string) *LLMService {
	return &LLMService{
		DB:           db,
		Logger:       logger,
		OpenAIAPIKey: apiKey,
	}
}

// OpenAI ChatCompletion request structure
type ChatCompletionRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

// Message for OpenAI ChatCompletion
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAI ChatCompletion response structure
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// GenerateInsights retrieves the latest processed data and generates insights using an LLM
func (s *LLMService) GenerateInsights() (*models.LLMAnalysis, error) {
	if s.OpenAIAPIKey == "" {
		return nil, fmt.Errorf("OpenAI API key is not set")
	}

	s.Logger.Info("Starting LLM analysis generation")

	// Retrieve the latest processed data
	var processedData models.ProcessedData
	if err := s.DB.Order("processed_at desc").First(&processedData).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve processed data: %w", err)
	}

	// Prepare the prompt for the LLM
	prompt := fmt.Sprintf("""Analyze the following data and provide insights:

%s

Please provide:
1. A summary of the key metrics
2. Notable trends or patterns
3. Potential actions or recommendations based on the data
""", processedData.Content)

	// Query the LLM API
	insights, err := s.queryLLM(prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM API request failed: %w", err)
	}

	// Store the generated insights
	llmAnalysis := models.LLMAnalysis{
		Content:     insights,
		GeneratedAt: time.Now(),
	}

	if err := s.DB.Create(&llmAnalysis).Error; err != nil {
		return nil, fmt.Errorf("failed to store LLM analysis: %w", err)
	}

	s.Logger.Infow("LLM analysis generated successfully", "id", llmAnalysis.ID)
	return &llmAnalysis, nil
}

// queryLLM makes a request to the OpenAI API to generate insights
func (s *LLMService) queryLLM(prompt string) (string, error) {
	url := "https://api.openai.com/v1/chat/completions"

	// Prepare the request payload
	request := ChatCompletionRequest{
		Model: "gpt-4", // Use an appropriate model
		Messages: []Message{
			{
				Role:    "system",
				Content: "You are a data analyst that provides insightful analysis of metrics and trends.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	// Convert request to JSON
	payload, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to serialize request: %w", err)
	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.OpenAIAPIKey))

	// Make the request
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("OpenAI API request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read API response: %w", err)
	}

	// Check for non-200 response
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned error: status=%d, body=%s", resp.StatusCode, string(body))
	}

	// Parse the response
	var response ChatCompletionResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to parse API response: %w", err)
	}

	// Extract the generated text
	if len(response.Choices) == 0 {
		return "", fmt.Errorf("API response contained no choices")
	}

	return response.Choices[0].Message.Content, nil
}
