package utilities

import (
	"os"
	"strconv"
)

type EnvVariableNotSetError struct {
	Key string
}

func (e *EnvVariableNotSetError) Error() string {
	return "environment variable " + e.Key + " is not set"
}



func GetEnvString(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(&EnvVariableNotSetError{Key: key})
	}
	return value
}

func GetEnvInt(key string) int {
	value := GetEnvString(key)
	intValue, err := strconv.Atoi(value)
	if err != nil {
		panic("The environment variable " + key + " is not a valid integer")
	}
	return intValue
}


func GetEnvStringWithDefault(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func GetEnvIntWithDefault(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intValue
}