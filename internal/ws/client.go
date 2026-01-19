package ws

import "github.com/gorilla/websocket"

type Client struct {
	conn *websocket.Conn
	send chan *Message
	hub  *Hub
}

func NewClient(conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		conn: conn,
		send: make(chan *Message, 256),
		hub:  hub,
	}
}

func (c *Client) ReadMessages() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		var msg Message
		if err := c.conn.ReadJSON(&msg); err != nil {
			return
		}
		c.hub.broadcast <- &msg
	}
}

func (c *Client) WriteMessages() {
	defer func() {
		c.conn.Close()
	}()
	for message := range c.send {
		if err := c.conn.WriteJSON(message); err != nil {
			return
		}
	}
}
