package services

type userDeletedData struct {
	Name string
}

func (s *Services) UserDeletedService(name string, email string) error {
	if name == "" {
		return ErrInvalidName
	}
	if email == "" {
		return ErrInvalidEmail
	}
	mailContent, err := s.CreateMailContent("templates/user_deleted.html", userDeletedData{
		Name: name,
	})
	if err != nil {
		return err
	}
	err = s.Mailer.SendMail(email, *mailContent)
	if err != nil {
		return err
	}
	return nil
}
