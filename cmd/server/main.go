package main

import (
	"fmt"
	"net/http"

	"github.com/go-socket/internal/config"
	http_handler "github.com/go-socket/internal/http"
	"github.com/go-socket/internal/logger"
	"github.com/go-socket/internal/ws"
)

func main() {
	cfg := config.LoadConfig()
	hub := ws.NewHub()
	go hub.Run()

	http.Handle("/", http.FileServer(http.Dir("./web")))
	http.HandleFunc(cfg.Path, func(w http.ResponseWriter, r *http.Request) {
		http_handler.ServerWS(w, r, hub)
	})

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	logger.Global.Printf("Server started at %s://%s%s", cfg.Protocol, addr, cfg.Path)

	if err := http.ListenAndServe(addr, nil); err != nil {
		logger.Global.Fatal(err)
	}
}
