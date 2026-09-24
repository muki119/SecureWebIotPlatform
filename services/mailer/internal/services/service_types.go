package services

// this file defines the services struct for the mailer service
// should hold all the dependencies for all services in the mailer service - like the repository struct
// all services will be methods on this struct

import (
	"bytes"
	"errors"
	"html/template"
)
type IMailer interface {
    SendMail(recipient string, content bytes.Buffer) error
} 

type Services struct {
	// here lies the dependencies for the services
	Mailer IMailer
	CreateMailContent func(templateDir string, data any) (*bytes.Buffer, error)
}

func CreateMailContent(templateDir string, data any) (*bytes.Buffer, error) {
	t,err := template.ParseFiles(templateDir)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, errors.New("failed to parse template")
	}

	outBuffer := new(bytes.Buffer)
	err = t.Execute(
		outBuffer, 
		data,
	)
	if err != nil {
		return nil, err
	}

	return outBuffer, nil
}


var (
	ErrInvalidName = errors.New("invalid name")
	ErrInvalidEmail = errors.New("invalid email")
)