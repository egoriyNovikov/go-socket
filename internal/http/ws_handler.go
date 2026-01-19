package http

import (
	"log"
	"net/http"

	"github.com/go-socket/internal/ws"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // разрешаем все origin (для pet проекта)
	},
}

func ServerWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade to WebSocket:", err)
		return
	}
	defer conn.Close()

	hub := ws.NewHub()
	client := ws.NewClient(conn, hub)
	go client.ReadMessages()
	go client.WriteMessages()
}
