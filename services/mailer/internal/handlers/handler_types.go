package handlers

import (
	"context"
	"log/slog"
	"mailer/internal/services"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

// this file defines the handlers struct for the mailer service
// should hold all the dependencies for all handlers in the mailer service - like the service struct
// also all handlers will be methods on this struct
type Handlers struct {
	// here lies the dependencies for the handlers
	Services *services.Services
	Logger *slog.Logger
	Tracer trace.Tracer

	HandledCounter  metric.Int64Counter
	HandlerDuration metric.Float64Histogram
}

// EventHandler matches the event bus's Handler type (context.Context, map[string]interface{}) error,
// without importing the event bus package here.
type EventHandler func(ctx context.Context, message map[string]interface{}) error

// WithInstrumentation wraps an EventHandler with a span, a handled-message counter, and a duration
// histogram keyed by handler name and outcome (ok/error). Meant to be applied where handlers are
// registered on the event bus, not inside the handler bodies themselves.
func (h *Handlers) WithInstrumentation(name string, next EventHandler) EventHandler {
	return func(ctx context.Context, message map[string]interface{}) error {
		ctx, span := h.Tracer.Start(ctx, name)
		defer span.End()

		start := time.Now()
		err := next(ctx, message)
		elapsed := time.Since(start).Seconds()

		status := "ok"
		if err != nil {
			status = "error"
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		}

		attrs := metric.WithAttributes(
			attribute.String("handler", name),
			attribute.String("status", status),
		)
		h.HandledCounter.Add(ctx, 1, attrs)
		h.HandlerDuration.Record(ctx, elapsed, attrs)

		return err
	}
}

