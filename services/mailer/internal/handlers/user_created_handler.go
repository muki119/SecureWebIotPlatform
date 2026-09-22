package handlers

import "context"

// needs to adhere to the event handler interface

func (h *Handlers) HandleUserCreated(ctx context.Context, message map[string]interface{}) error {

	return nil
}
