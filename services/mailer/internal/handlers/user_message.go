package handlers

import "errors"

var errInvalidUserMessage = errors.New("invalid user message: name and email are required strings")

func validateUserMessage(message map[string]interface{}) (string, string, error) {
	name, nameOK := message["name"].(string)
	email, emailOK := message["email"].(string)
	if !nameOK || !emailOK || name == "" || email == "" {
		return "", "", errInvalidUserMessage
	}

	return name, email, nil
}
