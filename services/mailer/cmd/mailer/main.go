package main

// This is the main entry point of the mailer service
// will use the event bus to receive mail data and send emails sccordingly
// probably means that in the auth service - it should save if the user wants emails

import "fmt"

func main() {
	fmt.Println("Mailer service started")
}