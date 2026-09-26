package services

// this file defines the services struct for the mailer service
// should hold all the dependencies for all services in the mailer service - like the repository struct
// all services will be methods on this struct

import (
	"bytes"
	"context"
	"errors"
	"html/template"

	"mailer/internal/templates"
)

type IMailer interface {
	SendMail(ctx context.Context, recipient string, content bytes.Buffer) error
}

type Services struct {
	// here lies the dependencies for the services
	Mailer            IMailer
	CreateMailContent func(ctx context.Context, templateName string, data any) (*bytes.Buffer, error)
}

func CreateMailContent(ctx context.Context, templateName string, data any) (*bytes.Buffer, error) {
	t, err := template.ParseFS(templates.FS, templateName)
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
	ErrInvalidName  = errors.New("invalid name")
	ErrInvalidEmail = errors.New("invalid email")
)
