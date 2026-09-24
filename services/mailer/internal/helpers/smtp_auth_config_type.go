package config

import (
	"bytes"
	"net/smtp"
)


type Mailer struct {
	Host string // host is in format smtp.example.com
	Port string // port of the smtp server
	User string // the username for the smtp server
	Pass string // password
	From string // from is the email address that will be used to send emails
	auth *smtp.Auth
}

func CreateMailer(host, port, user, pass, from string) (*Mailer, error) {
	mailer := &Mailer{
		Host: host,
		Port: port,
		User: user,
		Pass: pass,
		From: from,
	}
	auth := smtp.PlainAuth("", mailer.User, mailer.Pass, mailer.Host)
	mailer.auth = &auth
	return mailer, nil
}



func (s *Mailer) SendMail(recipient string, content bytes.Buffer) error {
	return smtp.SendMail(s.Host+":"+s.Port, *s.auth, s.From, []string{recipient}, []byte(content.Bytes()))
}