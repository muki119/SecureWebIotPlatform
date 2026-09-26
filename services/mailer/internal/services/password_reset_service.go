package services

import "context"

type passwordResetData struct {
	Email            string
	ResetURL         string
	ExpiresInMinutes string
}

func (s *Services) PasswordResetService(ctx context.Context, email string, resetURL string, expiresInMinutes string) error {
	if email == "" {
		return ErrInvalidEmail
	}
	if resetURL == "" {
		return ErrInvalidResetURL
	}
	if expiresInMinutes == "" {
		return ErrInvalidExpiresInMinutes
	}

	mailContent, err := s.CreateMailContent(ctx, "password_reset.html", passwordResetData{
		Email:            email,
		ResetURL:         resetURL,
		ExpiresInMinutes: expiresInMinutes,
	})
	if err != nil {
		return err
	}
	err = s.Mailer.SendMail(ctx, email, "Reset your password", *mailContent)
	if err != nil {
		return err
	}
	return nil
}
