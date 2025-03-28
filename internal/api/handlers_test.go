package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/arkouda/PipelineIQ/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// Mock services
type MockIngestionService struct {
	mock.Mock
}

func (m *MockIngestionService) FetchData() error {
	args := m.Called()
	return args.Error(0)
}

type MockProcessorService struct {
	mock.Mock
}

func (m *MockProcessorService) ProcessData() (*models.ProcessedData, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProcessedData), args.Error(1)
}

type MockLLMService struct {
	mock.Mock
}

func (m *MockLLMService) GenerateInsights() (*models.LLMAnalysis, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LLMAnalysis), args.Error(1)
}

func TestFetchAndProcessHandler(t *testing.T) {
	// Setup mock services
	mockIngestionSvc := new(MockIngestionService)
	mockProcessorSvc := new(MockProcessorService)
	mockLLMSvc := new(MockLLMService)

	// Create test data
	processedData := &models.ProcessedData{
		Model: models.Model{ID: 1},
		Content: `{"test": "data"}`,
		ProcessedAt: time.Now(),
	}

	llmAnalysis := &models.LLMAnalysis{
		Model: models.Model{ID: 2},
		Content: "Test analysis",
		GeneratedAt: time.Now(),
	}

	// Setup expectations
	mockIngestionSvc.On("FetchData").Return(nil)
	mockProcessorSvc.On("ProcessData").Return(processedData, nil)
	mockLLMSvc.On("GenerateInsights").Return(llmAnalysis, nil)

	// Create handler with mock services
	logger, _ := zap.NewProduction()
	sugar := logger.Sugar()
	handler := &Handler{
		Logger:       sugar,
		IngestionSvc: mockIngestionSvc,
		ProcessorSvc: mockProcessorSvc,
		LLMSvc:       mockLLMSvc,
	}

	// Create a test context
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPost, "/fetch_and_process", nil)

	// Call handler
	handler.FetchAndProcessHandler(c)

	// Assert expectations
	mockIngestionSvc.AssertExpectations(t)
	mockProcessorSvc.AssertExpectations(t)
	mockLLMSvc.AssertExpectations(t)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}

	if response["processed_id"] != float64(processedData.ID) {
		t.Errorf("Expected processed_id %v, got %v", processedData.ID, response["processed_id"])
	}

	if response["analysis_id"] != float64(llmAnalysis.ID) {
		t.Errorf("Expected analysis_id %v, got %v", llmAnalysis.ID, response["analysis_id"])
	}
}