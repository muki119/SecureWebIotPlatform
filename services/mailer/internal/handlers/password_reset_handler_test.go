package handlers

import (
	"context"
	"errors"
	"testing"
)

func TestHandlePasswordReset(t *testing.T) {
	t.Run("happy path calls PasswordResetService with the fields from the message", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandlePasswordReset(context.Background(), map[string]interface{}{
			"email":            "ada@example.com",
			"resetUrl":         "https://example.com/reset?token=abc123",
			"expiresInMinutes": "15",
		})

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !services.passwordResetCalled {
			t.Fatal("expected PasswordResetService to be called")
		}
		if services.passwordResetEmail != "ada@example.com" ||
			services.passwordResetResetURL != "https://example.com/reset?token=abc123" ||
			services.passwordResetExpiresInMinutes != "15" {
			t.Fatalf("expected PasswordResetService called with the message fields, got (%q, %q, %q)",
				services.passwordResetEmail, services.passwordResetResetURL, services.passwordResetExpiresInMinutes)
		}
	})

	t.Run("returns an error without calling the service when the message is missing a field", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandlePasswordReset(context.Background(), map[string]interface{}{
			"email": "ada@example.com",
		})

		if err == nil {
			t.Fatal("expected an error, got nil")
		}
		if services.passwordResetCalled {
			t.Fatal("expected PasswordResetService not to be called")
		}
	})

	t.Run("propagates the service's error", func(t *testing.T) {
		serviceErr := errors.New("service failed")
		services := &fakeServices{passwordResetErr: serviceErr}
		h := &Handlers{Services: services}

		err := h.HandlePasswordReset(context.Background(), map[string]interface{}{
			"email":            "ada@example.com",
			"resetUrl":         "https://example.com/reset?token=abc123",
			"expiresInMinutes": "15",
		})

		if !errors.Is(err, serviceErr) {
			t.Fatalf("expected %v, got %v", serviceErr, err)
		}
	})
}
