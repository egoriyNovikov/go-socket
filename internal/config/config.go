package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 int
	Host                 string
	Protocol             string
	Path                 string
	MaxMessageSize       int
	MaxMessageTimeout    time.Duration
	MaxMessageBufferSize int
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	port, _ := strconv.Atoi(os.Getenv("PORT"))
	if port == 0 {
		port = 8080
	}

	maxSize, _ := strconv.Atoi(os.Getenv("MAX_MESSAGE_SIZE"))
	if maxSize == 0 {
		maxSize = 1024
	}

	maxTimeout, _ := time.ParseDuration(os.Getenv("MAX_MESSAGE_TIMEOUT"))
	if maxTimeout == 0 {
		maxTimeout = 30 * time.Second
	}

	maxBuffer, _ := strconv.Atoi(os.Getenv("MAX_MESSAGE_BUFFER_SIZE"))
	if maxBuffer == 0 {
		maxBuffer = 256
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	protocol := os.Getenv("PROTOCOL")
	if protocol == "" {
		protocol = "http"
	}

	path := os.Getenv("WS_PATH")
	if path == "" {
		path = "/ws"
	}

	return &Config{
		Port:                 port,
		Host:                 host,
		Protocol:             protocol,
		Path:                 path,
		MaxMessageSize:       maxSize,
		MaxMessageTimeout:    maxTimeout,
		MaxMessageBufferSize: maxBuffer,
	}
}
