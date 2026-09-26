package handlers

import "errors"

var errInvalidPasswordResetMessage = errors.New("invalid password reset message: email, resetUrl, and expiresInMinutes are required strings")

func validatePasswordResetMessage(message map[string]interface{}) (string, string, string, error) {
	email, emailOK := message["email"].(string)
	resetURL, resetURLOK := message["resetUrl"].(string)
	expiresInMinutes, expiresOK := message["expiresInMinutes"].(string)
	if !emailOK || !resetURLOK || !expiresOK || email == "" || resetURL == "" || expiresInMinutes == "" {
		return "", "", "", errInvalidPasswordResetMessage
	}

	return email, resetURL, expiresInMinutes, nil
}
