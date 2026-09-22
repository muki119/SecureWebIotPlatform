package config

// this is going to hold the SMTP instance creator
import (
	"net/smtp"
)

func NewSMTPClient(host, port, user, pass string) (*smtp.Client, error) {
	auth := smtp.PlainAuth("", user, pass, host)
	client, err := smtp.Dial(host + ":" + port)
	if err != nil {
		return nil, err
	}
	if err = client.Auth(auth); err != nil {
		return nil, err
	}
	return client, nil
}
