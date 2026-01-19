package ws

import "time"

type Message struct {
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	Sender    string      `json:"sender"`
	Timestamp time.Time   `json:"timestamp"`
}
