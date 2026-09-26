package handlers

import (
	"context"
	"errors"
	"testing"
)

func TestHandleUserDeleted(t *testing.T) {
	t.Run("happy path calls UserDeletedService with the name and email from the message", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserDeleted(context.Background(), map[string]interface{}{
			"name":  "Ada",
			"email": "ada@example.com",
		})

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !services.userDeletedCalled {
			t.Fatal("expected UserDeletedService to be called")
		}
		if services.userDeletedName != "Ada" || services.userDeletedEmail != "ada@example.com" {
			t.Fatalf("expected UserDeletedService called with (%q, %q), got (%q, %q)",
				"Ada", "ada@example.com", services.userDeletedName, services.userDeletedEmail)
		}
	})

	t.Run("returns an error without calling the service when the message is missing a name", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserDeleted(context.Background(), map[string]interface{}{
			"email": "ada@example.com",
		})

		if err == nil {
			t.Fatal("expected an error, got nil")
		}
		if services.userDeletedCalled {
			t.Fatal("expected UserDeletedService not to be called")
		}
	})

	t.Run("returns an error without calling the service when the message is missing an email", func(t *testing.T) {
		services := &fakeServices{}
		h := &Handlers{Services: services}

		err := h.HandleUserDeleted(context.Background(), map[string]interface{}{
			"name": "Ada",
		})

		if err == nil {
			t.Fatal("expected an error, got nil")
		}
		if services.userDeletedCalled {
			t.Fatal("expected UserDeletedService not to be called")
		}
	})

	t.Run("propagates the service's error", func(t *testing.T) {
		serviceErr := errors.New("service failed")
		services := &fakeServices{userDeletedErr: serviceErr}
		h := &Handlers{Services: services}

		err := h.HandleUserDeleted(context.Background(), map[string]interface{}{
			"name":  "Ada",
			"email": "ada@example.com",
		})

		if !errors.Is(err, serviceErr) {
			t.Fatalf("expected %v, got %v", serviceErr, err)
		}
	})
}
