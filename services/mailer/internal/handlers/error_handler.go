package handlers

import (
	"context"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

func (h *Handlers) HandleError(err error, message map[string]interface{}) {
	h.Logger.Error("event bus error", "error", err, "message", message)

	h.HandledCounter.Add(context.Background(), 1, metric.WithAttributes(
		attribute.String("handler", "HandleError"),
		attribute.String("status", "error"),
	))
}
