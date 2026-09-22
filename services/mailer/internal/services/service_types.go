package services

import "net/smtp"

// this file defines the services struct for the mailer service
// should hold all the dependencies for all services in the mailer service - like the repository struct
// all services will be methods on this struct
type Services struct {
	// here lies the dependencies for the services
	mailClient *smtp.Client
}