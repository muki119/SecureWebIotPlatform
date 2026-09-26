package utilities

import (
	"testing"
)

func TestGetEnvString(t *testing.T) {
	t.Run("returns environment value", func(t *testing.T) {
		t.Setenv("TEST_VAR", "test_value")
		if got := GetEnvString("TEST_VAR"); got != "test_value" {
			t.Fatalf("GetEnvString() = %q, want %q", got, "test_value")
		}
	})

	t.Run("panics when variable is not set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "")
		assertPanicsWithMessage(t, "environment variable TEST_VAR is not set", func() {
			GetEnvString("TEST_VAR")
		})
	})

	t.Run("returns default when variable is not set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "")
		if got := GetEnvStringWithDefault("TEST_VAR", "default_value"); got != "default_value" {
			t.Fatalf("GetEnvStringWithDefault() = %q, want %q", got, "default_value")
		}
	})

	t.Run("prefers environment value over default", func(t *testing.T) {
		t.Setenv("TEST_VAR", "env_value")
		if got := GetEnvStringWithDefault("TEST_VAR", "default_value"); got != "env_value" {
			t.Fatalf("GetEnvStringWithDefault() = %q, want %q", got, "env_value")
		}
	})

	t.Run("panics when key is empty", func(t *testing.T) {
		assertPanicsWithMessage(t, "environment variable  is not set", func() {
			GetEnvString("")
		})
	})
}

func TestGetEnvInt(t *testing.T) {
	t.Run("returns environment value", func(t *testing.T) {
		t.Setenv("TEST_VAR", "42")
		if got := GetEnvInt("TEST_VAR"); got != 42 {
			t.Fatalf("GetEnvInt() = %d, want 42", got)
		}
	})

	t.Run("panics when variable is not set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "")
		assertPanicsWithMessage(t, "environment variable TEST_VAR is not set", func() {
			GetEnvInt("TEST_VAR")
		})
	})

	t.Run("panics when value is not an integer", func(t *testing.T) {
		t.Setenv("TEST_VAR", "not_a_number")
		assertPanicsWithMessage(t, "The environment variable TEST_VAR is not a valid integer", func() {
			GetEnvInt("TEST_VAR")
		})
	})
}

func TestGetEnvStringWithDefault(t *testing.T) {
	t.Run("returns default when variable is not set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "")
		if got := GetEnvStringWithDefault("TEST_VAR", "default_value"); got != "default_value" {
			t.Fatalf("GetEnvStringWithDefault() = %q, want %q", got, "default_value")
		}
	})

	t.Run("prefers environment value over default", func(t *testing.T) {
		t.Setenv("TEST_VAR", "env_value")
		if got := GetEnvStringWithDefault("TEST_VAR", "default_value"); got != "env_value" {
			t.Fatalf("GetEnvStringWithDefault() = %q, want %q", got, "env_value")
		}
	})
}

func TestGetEnvIntWithDefault(t *testing.T) {
	t.Run("returns default when variable is not set", func(t *testing.T) {
		t.Setenv("TEST_VAR", "")
		if got := GetEnvIntWithDefault("TEST_VAR", 100); got != 100 {
			t.Fatalf("GetEnvIntWithDefault() = %d, want 100", got)
		}
	})

	t.Run("returns parsed environment value", func(t *testing.T) {
		t.Setenv("TEST_VAR", "42")
		if got := GetEnvIntWithDefault("TEST_VAR", 100); got != 42 {
			t.Fatalf("GetEnvIntWithDefault() = %d, want 42", got)
		}
	})

	t.Run("returns default for invalid integer", func(t *testing.T) {
		t.Setenv("TEST_VAR", "not_a_number")
		if got := GetEnvIntWithDefault("TEST_VAR", 100); got != 100 {
			t.Fatalf("GetEnvIntWithDefault() = %d, want 100", got)
		}
	})
}

func assertPanicsWithMessage(t *testing.T, want string, function func()) {
	t.Helper()

	defer func() {
		recovered := recover()
		if recovered == nil {
			t.Fatalf("function did not panic, want %q", want)
		}

		if errorValue, ok := recovered.(error); ok {
			if errorValue.Error() != want {
				t.Fatalf("panic message = %q, want %q", errorValue.Error(), want)
			}
			return
		}

		if message, ok := recovered.(string); ok {
			if message != want {
				t.Fatalf("panic message = %q, want %q", message, want)
			}
			return
		}

		t.Fatalf("panic value has type %T, want error or string", recovered)
	}()

	function()
}