package main

import (
	"fmt"
	"log"

	"github.com/arkouda/PipelineIQ/internal/api"
	"github.com/arkouda/PipelineIQ/internal/config"
	"github.com/arkouda/PipelineIQ/internal/database"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Can't initialize zap logger: %v", err)
	}
	defer logger.Sync()
	sugar := logger.Sugar()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		sugar.Fatalf("Failed to connect to database: %v", err)
	}
	sugar.Info("Connected to database")

	// Setup and start the HTTP server
	router := api.SetupRouter(db, sugar, cfg)
	serverAddr := fmt.Sprintf(":%d", cfg.Port)
	sugar.Infof("Starting server at %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		sugar.Fatalf("Failed to start server: %v", err)
	}
}
