package handlers

import "context"

func (h *Handlers) HandlePasswordReset(ctx context.Context, message map[string]interface{}) error {
	email, resetURL, expiresInMinutes, err := validatePasswordResetMessage(message)
	if err != nil {
		return err
	}

	return h.Services.PasswordResetService(ctx, email, resetURL, expiresInMinutes)
}
