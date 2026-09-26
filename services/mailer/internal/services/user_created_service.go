package services

import "context"

type userCreatedData struct {
	Name  string
	Email string
}

func (s *Services) UserCreatedService(ctx context.Context, name string, email string) error {
	if name == "" {
		return ErrInvalidName
	}
	if email == "" {
		return ErrInvalidEmail
	}

	mailContent, err := s.CreateMailContent(ctx, "user_created.html", userCreatedData{
		Name:  name,
		Email: email,
	})
	if err != nil {
		return err
	}
	err = s.Mailer.SendMail(ctx, email, *mailContent)
	if err != nil {
		return err
	}
	return nil
}
