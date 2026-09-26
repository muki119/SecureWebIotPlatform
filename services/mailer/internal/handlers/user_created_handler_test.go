package handlers

import (
	"context"
	"errors"
	"testing"
)

type fakeServices struct {
	userCreatedCalled bool
	userCreatedName   string
	userCreatedEmail  string
	userCreatedErr    error

	userDeletedCalled bool
	userDeletedName   string
	userDeletedEmail  string
	userDeletedErr    error

	passwordResetCalled           bool
	passwordResetEmail            string
	passwordResetResetURL         string
	passwordResetExpiresInMinutes string
	passwordResetErr              error
}

func (f *fakeServices) UserCreatedService(ctx context.Context, name string, email string) error {
	f.userCreatedCalled = true
	f.userCreatedName = name
	f.userCreatedEmail = email
	return f.userCreatedErr
}

func (f *fakeServices) UserDeletedService(ctx context.Context, name string, email string) error {
	f.userDeletedCalled = true
	f.userDeletedName = name
	f.userDeletedEmail = email
	return f.userDeletedErr
}

func (f *fakeServices) PasswordResetService(ctx context.Context, email string, resetURL string, expiresInMinutes string) error {
	f.passwordResetCalled = true
	f.passwordResetEmail = email
	f.passwordResetResetURL = resetURL
	f.passwordResetExpiresInMinutes = expiresInMinutes
	return f.passwordResetErr
}

func TestHandleUserCreated(t *testing.T) {
	t.Run("happy path calls UserCreatedService with the name and email from the message", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserCreated(context.Background(), map[string]interface{}{
			"name":  "Ada",
			"email": "ada@example.com",
		})

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !services.userCreatedCalled {
			t.Fatal("expected UserCreatedService to be called")
		}
		if services.userCreatedName != "Ada" || services.userCreatedEmail != "ada@example.com" {
			t.Fatalf("expected UserCreatedService called with (%q, %q), got (%q, %q)",
				"Ada", "ada@example.com", services.userCreatedName, services.userCreatedEmail)
		}
	})

	t.Run("returns an error without calling the service when the message is missing a name", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserCreated(context.Background(), map[string]interface{}{
			"email": "ada@example.com",
		})

		if err == nil {
			t.Fatal("expected an error, got nil")
		}
		if services.userCreatedCalled {
			t.Fatal("expected UserCreatedService not to be called")
		}
	})

	t.Run("returns an error without calling the service when the message is missing an email", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserCreated(context.Background(), map[string]interface{}{
			"name": "Ada",
		})

		if err == nil {
			t.Fatal("expected an error, got nil")
		}
		if services.userCreatedCalled {
			t.Fatal("expected UserCreatedService not to be called")
		}
	})

	t.Run("propagates the service's error", func(t *testing.T) {
		serviceErr := errors.New("service failed")
		services := &fakeServices{userCreatedErr: serviceErr}
		h := &Handlers{Services: services}

		err := h.HandleUserCreated(context.Background(), map[string]interface{}{
			"name":  "Ada",
			"email": "ada@example.com",
		})

		if !errors.Is(err, serviceErr) {
			t.Fatalf("expected %v, got %v", serviceErr, err)
		}
	})
}
