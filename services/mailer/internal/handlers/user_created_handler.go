package handlers

import (
	"context"
)

func (h *Handlers) HandleUserCreated(ctx context.Context, message map[string]interface{}) error {
	name, email, err := validateUserMessage(message)
	if err != nil {
		return err
	}

	return h.Services.UserCreatedService(name, email)
}
