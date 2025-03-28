package services

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
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
	Model     string    `json:"model"`
	Messages  []Message `json:"messages"`
	Stream    bool      `json:"stream,omitempty"`
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

// OpenAI ChatCompletion streaming response structure
type ChatCompletionChunk struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index int     `json:"index"`
		Delta struct {
			Content string `json:"content,omitempty"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
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
	prompt := fmt.Sprintf(`Analyze the following JSON data and provide insights:

%s

The data structure includes:
- timestamp: When the data was processed
- combined_metrics: All metrics from different data sources with source name as prefix
- derived_metrics: Calculated metrics based on combined data
- data_sources: List of data sources

Please provide:
1. A summary of the key metrics from each data source
2. Notable trends or patterns if any are apparent
3. Potential actions or recommendations based on the data
`, processedData.Content)

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

// StreamLLMAnalysis generates LLM insights and streams the results
func (s *LLMService) StreamLLMAnalysis(w http.ResponseWriter, processedDataID uint) {
	if s.OpenAIAPIKey == "" {
		http.Error(w, "OpenAI API key is not set", http.StatusInternalServerError)
		return
	}

	s.Logger.Info("Starting streaming LLM analysis generation")

	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create a channel to signal completion
	done := make(chan bool)

	// Helper function to write SSE messages
	sendSSE := func(eventType, data string) {
		fmt.Fprintf(w, "event: %s\n", eventType)
		fmt.Fprintf(w, "data: %s\n\n", data)
		w.(http.Flusher).Flush()
	}

	// Start streaming in a goroutine
	go func() {
		defer close(done)
		
		// Retrieve the processed data by ID or latest
		var processedData models.ProcessedData
		var err error
		
		if processedDataID > 0 {
			err = s.DB.First(&processedData, processedDataID).Error
		} else {
			err = s.DB.Order("processed_at desc").First(&processedData).Error
		}
		
		if err != nil {
			errMsg := fmt.Sprintf("failed to retrieve processed data: %v", err)
			s.Logger.Error(errMsg)
			sendSSE("error", errMsg)
			return
		}

		// Prepare the prompt for the LLM with Markdown formatting guidance
		prompt := fmt.Sprintf(`Analyze the following JSON data and provide insights:

%s

The data structure includes:
- timestamp: When the data was processed
- combined_metrics: All metrics from different data sources with source name as prefix
- derived_metrics: Calculated metrics based on combined data
- data_sources: List of data sources

Please provide a detailed analysis with the following sections, using Markdown formatting:

## Summary of Key Metrics
Summarize the key metrics from each data source with bullet points or paragraphs.

## Trends and Patterns
Analyze any notable trends or patterns in the data.

## Recommendations
Provide actionable recommendations based on the data analysis.

IMPORTANT: Format your response using Markdown with proper headings, lists, and emphasis to highlight important points. Use tables if appropriate for data comparison.
`, processedData.Content)

		// Send starting message
		sendSSE("start", "Starting LLM analysis...")

		// Stream from OpenAI API
		url := "https://api.openai.com/v1/chat/completions"

		// Prepare the streaming request
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
			Stream: true,
		}

		// Convert request to JSON
		payload, err := json.Marshal(request)
		if err != nil {
			s.Logger.Errorw("Failed to serialize request", "error", err)
			sendSSE("error", fmt.Sprintf("Failed to serialize request: %v", err))
			return
		}

		// Create the HTTP request
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
		if err != nil {
			s.Logger.Errorw("Failed to create HTTP request", "error", err)
			sendSSE("error", fmt.Sprintf("Failed to create HTTP request: %v", err))
			return
		}

		// Set headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.OpenAIAPIKey))
		req.Header.Set("Accept", "text/event-stream")

		// Make the request
		client := &http.Client{Timeout: 120 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			s.Logger.Errorw("OpenAI API request failed", "error", err)
			sendSSE("error", fmt.Sprintf("OpenAI API request failed: %v", err))
			return
		}
		defer resp.Body.Close()

		// Check for non-200 response
		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			s.Logger.Errorw("API returned error", "status", resp.StatusCode, "body", string(body))
			sendSSE("error", fmt.Sprintf("API returned error: status=%d, body=%s", resp.StatusCode, string(body)))
			return
		}

		// Accumulate the full content for storing in the database
		var fullContent strings.Builder

		// Read the streaming response
		reader := bufio.NewReader(resp.Body)
		for {
			line, err := reader.ReadBytes('\n')
			if err != nil {
				if err == io.EOF {
					break
				}
				s.Logger.Errorw("Error reading stream", "error", err)
				sendSSE("error", fmt.Sprintf("Error reading stream: %v", err))
				return
			}

			line = bytes.TrimSpace(line)
			if len(line) == 0 {
				continue
			}

			// SSE format: "data: {JSON data}"
			if !bytes.HasPrefix(line, []byte("data: ")) {
				continue
			}

			// Extract JSON data
			data := line[6:] // Skip "data: "
			
			// Check for stream end
			if string(data) == "[DONE]" {
				break
			}

			// Parse the chunk
			var chunk ChatCompletionChunk
			if err := json.Unmarshal(data, &chunk); err != nil {
				s.Logger.Errorw("Failed to parse chunk", "error", err, "data", string(data))
				continue
			}

			if len(chunk.Choices) == 0 {
				continue
			}

			content := chunk.Choices[0].Delta.Content
			if content != "" {
				fullContent.WriteString(content)
				sendSSE("content", content)
			}
		}

		// Store the full content in the database
		llmAnalysis := models.LLMAnalysis{
			Content:     fullContent.String(),
			GeneratedAt: time.Now(),
		}

		if err := s.DB.Create(&llmAnalysis).Error; err != nil {
			s.Logger.Errorw("Failed to store LLM analysis", "error", err)
			sendSSE("error", fmt.Sprintf("Failed to store analysis: %v", err))
			return
		}

		// Send completion event with the ID
		sendSSE("complete", fmt.Sprintf(`{"id": %d, "message": "Analysis completed"}`, llmAnalysis.ID))
		s.Logger.Infow("Streaming LLM analysis completed", "id", llmAnalysis.ID)
	}()

	// Wait for completion
	<-done
}
