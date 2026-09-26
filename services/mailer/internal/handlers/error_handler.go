package handlers

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
)

func (h *Handlers) HandleError(ctx context.Context, err error, message map[string]interface{}) {
	h.Logger.Error("event bus error", "error", err)

	fmt.Println(ctx)
	_, errTracer := h.Tracer.Start(ctx, "HandleError")
	defer errTracer.End()

	errTracer.RecordError(err)
	errTracer.SetStatus(codes.Error, err.Error())
	errTracer.SetAttributes(attribute.String("error.message", err.Error()))
	h.HandledCounter.Add(context.Background(), 1, metric.WithAttributes(
		attribute.String("handler", "HandleError"),
		attribute.String("status", "error"),
	))
}
