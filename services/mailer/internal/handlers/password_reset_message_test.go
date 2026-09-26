package handlers

import (
	"errors"
	"testing"
)

func TestValidatePasswordResetMessage(t *testing.T) {
	t.Run("returns the email, reset url, and expiry for a valid message", func(t *testing.T) {
		email, resetURL, expiresInMinutes, err := validatePasswordResetMessage(map[string]interface{}{
			"email":            "ada@example.com",
			"resetUrl":         "https://example.com/reset?token=abc123",
			"expiresInMinutes": "15",
		})

		if err != nil {
			t.Fatalf("validatePasswordResetMessage returned unexpected error: %v", err)
		}
		if email != "ada@example.com" || resetURL != "https://example.com/reset?token=abc123" || expiresInMinutes != "15" {
			t.Fatalf("expected fields to be returned, got (%q, %q, %q)", email, resetURL, expiresInMinutes)
		}
	})

	t.Run("returns errInvalidPasswordResetMessage when the email is missing", func(t *testing.T) {
		_, _, _, err := validatePasswordResetMessage(map[string]interface{}{
			"resetUrl":         "https://example.com/reset?token=abc123",
			"expiresInMinutes": "15",
		})

		if !errors.Is(err, errInvalidPasswordResetMessage) {
			t.Fatalf("expected invalid password reset message error, got %v", err)
		}
	})

	t.Run("returns errInvalidPasswordResetMessage when the reset url is missing", func(t *testing.T) {
		_, _, _, err := validatePasswordResetMessage(map[string]interface{}{
			"email":            "ada@example.com",
			"expiresInMinutes": "15",
		})

		if !errors.Is(err, errInvalidPasswordResetMessage) {
			t.Fatalf("expected invalid password reset message error, got %v", err)
		}
	})

	t.Run("returns errInvalidPasswordResetMessage when expiresInMinutes is missing", func(t *testing.T) {
		_, _, _, err := validatePasswordResetMessage(map[string]interface{}{
			"email":    "ada@example.com",
			"resetUrl": "https://example.com/reset?token=abc123",
		})

		if !errors.Is(err, errInvalidPasswordResetMessage) {
			t.Fatalf("expected invalid password reset message error, got %v", err)
		}
	})

	t.Run("returns errInvalidPasswordResetMessage when a field has the wrong type", func(t *testing.T) {
		_, _, _, err := validatePasswordResetMessage(map[string]interface{}{
			"email":            "ada@example.com",
			"resetUrl":         "https://example.com/reset?token=abc123",
			"expiresInMinutes": 15,
		})

		if !errors.Is(err, errInvalidPasswordResetMessage) {
			t.Fatalf("expected invalid password reset message error, got %v", err)
		}
	})

	t.Run("returns errInvalidPasswordResetMessage when a field is empty", func(t *testing.T) {
		_, _, _, err := validatePasswordResetMessage(map[string]interface{}{
			"email":            "ada@example.com",
			"resetUrl":         "",
			"expiresInMinutes": "15",
		})

		if !errors.Is(err, errInvalidPasswordResetMessage) {
			t.Fatalf("expected invalid password reset message error, got %v", err)
		}
	})
}
