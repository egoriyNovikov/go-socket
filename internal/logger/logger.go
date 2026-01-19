package logger

import (
	"log"
	"os"
)

var (
	// Global — глобальный логгер для всего проекта
	Global *log.Logger
)

func init() {
	Global = log.New(os.Stdout, "", log.LstdFlags)
}
