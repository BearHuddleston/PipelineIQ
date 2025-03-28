package database

import (
	"log"

	"github.com/arkouda/PipelineIQ/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect establishes a connection to the database and performs auto-migration
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate the schema
	err = db.AutoMigrate(
		&models.RawData{},
		&models.ProcessedData{},
		&models.LLMAnalysis{},
	)
	if err != nil {
		log.Printf("Error auto-migrating schema: %v", err)
		return nil, err
	}

	return db, nil
}
