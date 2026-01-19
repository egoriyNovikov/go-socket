package ws

type MessageType string

const (
	MessageTypeJoin    MessageType = "join"
	MessageTypeMessage MessageType = "message"
	MessageTypeLeave   MessageType = "leave"
	MessageTypeSystem  MessageType = "system"
)
