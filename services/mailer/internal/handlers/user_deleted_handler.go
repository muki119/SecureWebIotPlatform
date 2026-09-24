package handlers

import "context"

func (h *Handlers) HandleUserDeleted(ctx context.Context, message map[string]interface{}) error {
	name, email, err := validateUserMessage(message)
	if err != nil {
		return err
	}

	return h.Services.UserDeletedService(name, email)
}
