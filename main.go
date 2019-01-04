// main.go
package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client records a client connecting to the server.
type Client struct {
	conn *websocket.Conn
}

// ClientList binds clients with a mutex structure to prevent race conditions.
type ClientList struct {
	mutex   *sync.Mutex
	clients []*Client
}

// Grid holds the color values for each square.
type Grid struct {
	mutex  *sync.Mutex
	colors []string
}

var srv *http.Server
var clientList ClientList
var grid Grid
var gridSize int
var gridColor string

func main() {
	port := ":80"
	rand.Seed(time.Now().UnixNano())
	srv = &http.Server{Addr: port}
	gridSize = 25 * 25
	gridColor = "rgb(99, 110, 114)"
	clientList = ClientList{
		mutex:   &sync.Mutex{},
		clients: make([]*Client, 0),
	}
	grid = Grid{
		mutex:  &sync.Mutex{},
		colors: make([]string, gridSize),
	}
	fmt.Printf("Startup successful on port %s. Type 'clear' to clear board.\n", port)
	go launchCLI()
	http.HandleFunc("/canvas/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/html/index.html")
	})
	http.HandleFunc("/canvas/draw", launchHTTP)
	http.HandleFunc("/canvas/help", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/html/help.html")
	})
	http.Handle("/canvas/static/", http.StripPrefix("/canvas/static/", http.FileServer(http.Dir("static"))))
	if err := srv.ListenAndServe(); err != nil {
		fmt.Println(err)
	}
}

func launchHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err == nil {
		client := &Client{conn}
		clientList.mutex.Lock()
		clientList.clients = append(clientList.clients, client)
		clientList.mutex.Unlock()
		defer clientList.deleteClient(client)

		for i, v := range grid.colors {
			if len(v) > 0 {
				clientList.sendClient(client, strconv.Itoa(i)+" "+v)
			}
		}

		for {
			// Read message from browser
			_, msg, err := conn.ReadMessage()
			if len(msg) > 0 {
				grid.mutex.Lock()
				splitMsg := strings.SplitN(string(msg), " ", 2)
				if index, err := strconv.Atoi(splitMsg[0]); err == nil {
					if index >= 0 && index < gridSize {
						grid.colors[index] = splitMsg[1]
					}
				} else {
					panic(err)
				}
				grid.mutex.Unlock()
				clientList.sendAll(string(msg))
			}
			if err != nil {
				return
			}
		}
	}
}

func launchCLI() {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		switch scanner.Text() {
		case "clear":
			grid.mutex.Lock()
			grid.colors = make([]string, gridSize)
			for i := range grid.colors {
				clientList.sendAll(strconv.Itoa(i) + " " + gridColor)
			}
			grid.mutex.Unlock()
			fmt.Println("board cleared")
		default:
			fmt.Println("invalid command", scanner.Text())
		}
	}

	if scanner.Err() != nil {
		fmt.Println(scanner.Err())
	}
}

func (clientList *ClientList) sendClient(client *Client, msg string) {
	if err := client.conn.WriteMessage(1, []byte(msg)); err != nil {
		fmt.Println(err)
		return
	}
}

func (clientList *ClientList) sendAll(msg string) {
	defer clientList.mutex.Unlock()
	clientList.mutex.Lock()
	for _, v := range clientList.clients {
		clientList.sendClient(v, msg)
	}
}

func (clientList *ClientList) deleteClient(client *Client) {
	defer clientList.mutex.Unlock()
	clientList.mutex.Lock()
	for i, v := range clientList.clients {
		if reflect.DeepEqual(client, v) {
			clientList.clients = append(clientList.clients[:i], clientList.clients[i+1:]...)
			break
		}
	}
}
