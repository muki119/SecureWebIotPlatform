package handlers

import (
	"mailer/internal/services"
)

// this file defines the handlers struct for the mailer service
// should hold all the dependencies for all handlers in the mailer service - like the service struct
// also all handlers will be methods on this struct
type Handlers struct {
	// here lies the dependencies for the handlers
	services *services.Services
}

