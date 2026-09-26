package handlers

import (
	"errors"
	"testing"
)

func TestValidateUserMessage(t *testing.T) {
	t.Run("returns the name and email for a valid message", func(t *testing.T) {
		name, email, err := validateUserMessage(map[string]interface{}{
			"name":  "Ada",
			"email": "ada@example.com",
		})

		if err != nil {
			t.Fatalf("validateUserMessage returned unexpected error: %v", err)
		}
		if name != "Ada" || email != "ada@example.com" {
			t.Fatalf("expected name and email to be returned, got (%q, %q)", name, email)
		}
	})

	t.Run("returns errInvalidUserMessage when the name is missing", func(t *testing.T) {
		_, _, err := validateUserMessage(map[string]interface{}{
			"email": "ada@example.com",
		})

		if !errors.Is(err, errInvalidUserMessage) {
			t.Fatalf("expected invalid user message error, got %v", err)
		}
	})

	t.Run("returns errInvalidUserMessage when the email is missing", func(t *testing.T) {
		_, _, err := validateUserMessage(map[string]interface{}{
			"name": "Ada",
		})

		if !errors.Is(err, errInvalidUserMessage) {
			t.Fatalf("expected invalid user message error, got %v", err)
		}
	})

	t.Run("returns errInvalidUserMessage when a field has the wrong type", func(t *testing.T) {
		_, _, err := validateUserMessage(map[string]interface{}{
			"name":  42,
			"email": "ada@example.com",
		})

		if !errors.Is(err, errInvalidUserMessage) {
			t.Fatalf("expected invalid user message error, got %v", err)
		}
	})

	t.Run("returns errInvalidUserMessage when a field is empty", func(t *testing.T) {
		_, _, err := validateUserMessage(map[string]interface{}{
			"name":  "Ada",
			"email": "",
		})

		if !errors.Is(err, errInvalidUserMessage) {
			t.Fatalf("expected invalid user message error, got %v", err)
		}
	})
}
