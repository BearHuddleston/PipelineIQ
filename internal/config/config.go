package config

import (
	"os"
	"strconv"
)

// Config represents the application configuration loaded from environment variables
type Config struct {
	DatabaseURL    string
	OpenAIAPIKey   string
	WeatherAPIKey  string
	Port           int
	APIURL1        string
	APIURL2        string
}

// Load initializes the configuration from environment variables
func Load() *Config {
	port, _ := strconv.Atoi(getEnvOrDefault("PORT", "8080"))

	return &Config{
		DatabaseURL:    getEnvOrDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/pipelineiq?sslmode=disable"),
		OpenAIAPIKey:   getEnvOrDefault("OPENAI_API_KEY", ""),
		WeatherAPIKey:  getEnvOrDefault("WEATHER_API_KEY", ""),
		Port:           port,
		APIURL1:        getEnvOrDefault("API_URL_1", ""),
		APIURL2:        getEnvOrDefault("API_URL_2", ""),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
