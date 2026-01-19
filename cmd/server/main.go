package main

import (
	"log"
	"net/http"

	http_handler "github.com/go-socket/internal/http"
	"github.com/go-socket/internal/ws"
)

func main() {
	hub := ws.NewHub()
	go hub.Run()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		http_handler.ServerWS(w, r)
	})
	log.Println("Server started at :8080")
	http.ListenAndServe(":8080", nil)

}
