package services

import (
	"context"
	"errors"
	"testing"
)

func TestPasswordResetService(t *testing.T) {
	t.Run("happy path sends the rendered mail to the given recipient", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.PasswordResetService(context.Background(), "ada@example.com", "https://example.com/reset?token=abc123", "15")

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !mailer.called {
			t.Fatal("expected the mailer to be called")
		}
		if mailer.recipient != "ada@example.com" {
			t.Fatalf("expected recipient %q, got %q", "ada@example.com", mailer.recipient)
		}
		if mailer.subject != "Reset your password" {
			t.Fatalf("expected subject %q, got %q", "Reset your password", mailer.subject)
		}
	})

	t.Run("returns ErrInvalidEmail when email is empty", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.PasswordResetService(context.Background(), "", "https://example.com/reset?token=abc123", "15")

		if !errors.Is(err, ErrInvalidEmail) {
			t.Fatalf("expected %v, got %v", ErrInvalidEmail, err)
		}
		if mailer.called {
			t.Fatal("expected the mailer not to be called")
		}
	})

	t.Run("returns ErrInvalidResetURL when reset url is empty", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.PasswordResetService(context.Background(), "ada@example.com", "", "15")

		if !errors.Is(err, ErrInvalidResetURL) {
			t.Fatalf("expected %v, got %v", ErrInvalidResetURL, err)
		}
		if mailer.called {
			t.Fatal("expected the mailer not to be called")
		}
	})

	t.Run("returns ErrInvalidExpiresInMinutes when expires in minutes is empty", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.PasswordResetService(context.Background(), "ada@example.com", "https://example.com/reset?token=abc123", "")

		if !errors.Is(err, ErrInvalidExpiresInMinutes) {
			t.Fatalf("expected %v, got %v", ErrInvalidExpiresInMinutes, err)
		}
		if mailer.called {
			t.Fatal("expected the mailer not to be called")
		}
	})

	t.Run("propagates the render error and never calls the mailer", func(t *testing.T) {
		renderErr := errors.New("render failed")
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: failingMailContent(renderErr),
		}

		err := svc.PasswordResetService(context.Background(), "ada@example.com", "https://example.com/reset?token=abc123", "15")

		if !errors.Is(err, renderErr) {
			t.Fatalf("expected %v, got %v", renderErr, err)
		}
		if mailer.called {
			t.Fatal("expected the mailer not to be called when rendering fails")
		}
	})

	t.Run("propagates the mailer's send error", func(t *testing.T) {
		sendErr := errors.New("send failed")
		mailer := &fakeMailer{err: sendErr}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.PasswordResetService(context.Background(), "ada@example.com", "https://example.com/reset?token=abc123", "15")

		if !errors.Is(err, sendErr) {
			t.Fatalf("expected %v, got %v", sendErr, err)
		}
		if !mailer.called {
			t.Fatal("expected the mailer to be called")
		}
	})
}
