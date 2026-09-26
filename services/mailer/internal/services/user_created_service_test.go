package services

import (
	"bytes"
	"context"
	"errors"
	"testing"
)

type fakeMailer struct {
	called    bool
	recipient string
	subject   string
	content   bytes.Buffer
	err       error
}

func (f *fakeMailer) SendMail(ctx context.Context, recipient string, subject string, content bytes.Buffer) error {
	f.called = true
	f.recipient = recipient
	f.subject = subject
	f.content = content
	return f.err
}

func renderingMailContent(content string) func(ctx context.Context, templateName string, data any) (*bytes.Buffer, error) {
	return func(ctx context.Context, templateName string, data any) (*bytes.Buffer, error) {
		return bytes.NewBufferString(content), nil
	}
}

func failingMailContent(err error) func(ctx context.Context, templateName string, data any) (*bytes.Buffer, error) {
	return func(ctx context.Context, templateName string, data any) (*bytes.Buffer, error) {
		return nil, err
	}
}

func TestUserCreatedService(t *testing.T) {
	t.Run("happy path sends the rendered mail to the given recipient", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.UserCreatedService(context.Background(), "Ada", "ada@example.com")

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !mailer.called {
			t.Fatal("expected the mailer to be called")
		}
		if mailer.recipient != "ada@example.com" {
			t.Fatalf("expected recipient %q, got %q", "ada@example.com", mailer.recipient)
		}
	})

	t.Run("returns ErrInvalidName when name is empty", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.UserCreatedService(context.Background(), "", "ada@example.com")

		if !errors.Is(err, ErrInvalidName) {
			t.Fatalf("expected %v, got %v", ErrInvalidName, err)
		}
		if mailer.called {
			t.Fatal("expected the mailer not to be called")
		}
	})

	t.Run("returns ErrInvalidEmail when email is empty", func(t *testing.T) {
		mailer := &fakeMailer{}
		svc := &Services{
			Mailer:            mailer,
			CreateMailContent: renderingMailContent("<html>rendered</html>"),
		}

		err := svc.UserCreatedService(context.Background(), "Ada", "")

		if !errors.Is(err, ErrInvalidEmail) {
			t.Fatalf("expected %v, got %v", ErrInvalidEmail, err)
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

		err := svc.UserCreatedService(context.Background(), "Ada", "ada@example.com")

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

		err := svc.UserCreatedService(context.Background(), "Ada", "ada@example.com")

		if !errors.Is(err, sendErr) {
			t.Fatalf("expected %v, got %v", sendErr, err)
		}
		if !mailer.called {
			t.Fatal("expected the mailer to be called")
		}
	})
}
