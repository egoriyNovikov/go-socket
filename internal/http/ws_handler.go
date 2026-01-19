package http

import (
	"net/http"

	"github.com/go-socket/internal/logger"
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

func ServerWS(w http.ResponseWriter, r *http.Request, hub *ws.Hub) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Global.Println("Failed to upgrade to WebSocket:", err)
		return
	}

	client := ws.NewClient(conn, hub)
	hub.Register(client)
	go client.ReadMessages()
	go client.WriteMessages()
}
