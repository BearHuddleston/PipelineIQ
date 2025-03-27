// main.go
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Data models
type RawData struct {
	ID   uint   `gorm:"primaryKey"`
	Data string `gorm:"type:json"`
}

type ProcessedData struct {
	ID         uint   `gorm:"primaryKey"`
	MergedData string `gorm:"type:json"`
	CreatedAt  time.Time
}

type AnalysisSummary struct {
	ID        uint `gorm:"primaryKey"`
	Summary   string
	CreatedAt time.Time
}

var db *gorm.DB

func initDB() {
	var err error
	db, err = gorm.Open(sqlite.Open("data.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}
	db.AutoMigrate(&RawData{}, &ProcessedData{}, &AnalysisSummary{})
}

// TODO: asynchronous API calls
func fetchData(url string, resultCh chan<- string) {
	// TODO: network call (replace with real HTTP call)
	time.Sleep(2 * time.Second)
	resultCh <- "data from " + url
}

// TODO: LLM integration function (stub)
func callLLM(summaryData string) (string, error) {
	// TODO: call OpenAI or another LLM API.
	return "Summary: " + summaryData, nil
}

func fetchAndProcess(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ch1 := make(chan string)
	ch2 := make(chan string)

	go func() {
		fetchData("https://api.weather.com", ch1)
	}()
	go func() {
		var _ context.Context = ctx
		fetchData("https://api.finance.com", ch2)
	}()

	data1 := <-ch1
	data2 := <-ch2

	raw1 := RawData{Data: data1}
	raw2 := RawData{Data: data2}
	db.Create(&raw1)
	db.Create(&raw2)

	merged := data1 + " | " + data2
	processed := ProcessedData{
		MergedData: merged,
		CreatedAt:  time.Now(),
	}
	db.Create(&processed)

	// Call LLM for summary
	summary, err := callLLM(merged)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM call failed"})
		return
	}
	analysis := AnalysisSummary{
		Summary:   summary,
		CreatedAt: time.Now(),
	}
	db.Create(&analysis)

	c.JSON(http.StatusOK, gin.H{"message": "Data fetched and processed successfully", "jobId": processed.ID})
}

func getResults(c *gin.Context) {
	var results []ProcessedData
	db.Find(&results)
	c.JSON(http.StatusOK, results)
}

func getAnalysis(c *gin.Context) {
	var analysis AnalysisSummary
	if err := db.Last(&analysis).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No analysis found"})
		return
	}
	c.JSON(http.StatusOK, analysis)
}

func main() {
	initDB()
	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/fetch_and_process", fetchAndProcess)
		api.GET("/results", getResults)
		api.GET("/analysis", getAnalysis)
	}

	r.Static("/static", "./web/frontend/dist")

	r.NoRoute(func(c *gin.Context) {
		c.File("./web/frontend/dist/index.html")
	})

	if err := r.SetTrustedProxies([]string{"127.0.0.1"}); err != nil {
		log.Fatal("Failed to set trusted proxies:", err)
	}

	r.Run(":8080")
}
