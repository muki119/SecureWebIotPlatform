package helpers

import (
	"bytes"
	"context"
	"fmt"
	"net/smtp"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

type Mailer struct {
	Host   string // host is in format smtp.example.com
	Port   string // port of the smtp server
	User   string // the username for the smtp server
	Pass   string // password
	From   string // from is the email address that will be used to send emails
	auth   *smtp.Auth
	tracer trace.Tracer
}

func CreateMailer(host, port, user, pass, from string, tracer trace.Tracer) (*Mailer, error) {
	mailer := &Mailer{
		Host:   host,
		Port:   port,
		User:   user,
		Pass:   pass,
		From:   from,
		tracer: tracer,
	}
	auth := smtp.PlainAuth("", mailer.User, mailer.Pass, mailer.Host)
	mailer.auth = &auth
	return mailer, nil
}

func (s *Mailer) SendMail(ctx context.Context, recipient string, subject string, content bytes.Buffer) error {
	_, span := s.tracer.Start(
		ctx,
		"Mailer.SendMail",
	)
	defer span.End()

	message := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		s.From, recipient, subject, content.String(),
	)

	err := smtp.SendMail(s.Host+":"+s.Port, *s.auth, s.From, []string{recipient}, []byte(message))
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}
	return err
}
