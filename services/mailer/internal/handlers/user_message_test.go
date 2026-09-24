package handlers

import (
	"errors"
	"testing"
)

func TestValidateUserMessage(t *testing.T) {
	tests := []struct {
		name    string
		message map[string]interface{}
		wantErr bool
	}{
		{
			name:    "valid message",
			message: map[string]interface{}{"name": "Ada", "email": "ada@example.com"},
		},
		{
			name:    "missing name",
			message: map[string]interface{}{"email": "ada@example.com"},
			wantErr: true,
		},
		{
			name:    "missing email",
			message: map[string]interface{}{"name": "Ada"},
			wantErr: true,
		},
		{
			name:    "wrong field types",
			message: map[string]interface{}{"name": 42, "email": "ada@example.com"},
			wantErr: true,
		},
		{
			name:    "empty field",
			message: map[string]interface{}{"name": "Ada", "email": ""},
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, _, err := validateUserMessage(test.message)
			if test.wantErr {
				if !errors.Is(err, errInvalidUserMessage) {
					t.Fatalf("expected invalid user message error, got %v", err)
				}
				return
			}

			if err != nil {
				t.Fatalf("validateUserMessage returned unexpected error: %v", err)
			}
		})
	}
}
