package app

// going to house the setup
// since go is a procedural language , were kinda forced to do a dependency injection pattern , no real singletons or anything

import (
	"context"
	"errors"
	"log/slog"
	"mailer/internal/constants"
	"mailer/internal/handlers"
	config "mailer/internal/helpers"
	"mailer/internal/services"
	"mailer/internal/utilities"
	"net/http"
	"time"

	eventBus "github.com/muki119/go-slim-event-bus/v2"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	otelprom "go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

type App struct {
	// here lies the dependencies for the application
	eventBus *eventBus.StreamsEventBus
	handlers *handlers.Handlers

	logger         *slog.Logger
	loggerProvider *log.LoggerProvider

	tracer         trace.Tracer
	tracerProvider *sdktrace.TracerProvider

	meter         metric.Meter
	meterProvider *sdkmetric.MeterProvider
	metricsServer *http.Server
}

func (a *App) Start() (chan error, error) {
	if err := a.initializeLogger(); err != nil {
		return nil, err
	}
	if err := a.initializeTracer(); err != nil {
		return nil, err
	}
	if err := a.initializeMetrics(); err != nil {
		return nil, err
	}

	eventBusConfig := eventBus.EventBusConfig{
		ConnectionConfig: &redis.Options{
			Addr:     utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_HOST", "localhost") + ":" + utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_PORT", "6379"),
			Username: utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_USERNAME", ""),
			Password: utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_PASSWORD", ""),
			DB:       utilities.GetEnvIntWithDefault("EVENT_BUS_REDIS_DB", 0),
		},
	}
	a.eventBus = eventBusConfig.NewFromConfig()
	err := a.initializeHandlers()
	if err != nil {
		return nil, err
	}

	return a.eventBus.Listen(), nil
}

func (a *App) initializeHandlers() error {
	// will get the handlers from the struct and attatch them to the event bus
	services, err := a.initializeServices()
	if err != nil {
		return err
	}

	handledCounter, err := a.meter.Int64Counter(
		"mailer_handled_messages_total",
		metric.WithDescription("Number of event bus messages handled by the mailer service"),
	)
	if err != nil {
		return err
	}
	handlerDuration, err := a.meter.Float64Histogram(
		"mailer_handler_duration_seconds",
		metric.WithDescription("Duration of mailer handler executions in seconds"),
	)
	if err != nil {
		return err
	}

	a.handlers = &handlers.Handlers{
		Services: services,
		Logger:   a.logger,
		Tracer:   a.tracer,

		HandledCounter:  handledCounter,
		HandlerDuration: handlerDuration,
	}
	a.eventBus.StreamHandler(constants.AUTH_USER_CREATED, eventBus.Handler(a.handlers.WithInstrumentation("HandleUserCreated", a.handlers.HandleUserCreated)))
	a.eventBus.StreamHandler(constants.AUTH_USER_DELETED, eventBus.Handler(a.handlers.WithInstrumentation("HandleUserDeleted", a.handlers.HandleUserDeleted)))
	a.eventBus.ErrorHandler(a.handlers.HandleError)
	return nil
}

func (a *App) initializeServices() (*services.Services, error) {
	// create the services sttuct and dependencies and return it

	mailerClient, err := config.CreateMailer(
		utilities.GetEnvString("SMTP_HOST"),
		utilities.GetEnvString("SMTP_PORT"),
		utilities.GetEnvString("SMTP_USER"),
		utilities.GetEnvString("SMTP_PASS"),
		utilities.GetEnvString("SMTP_FROM"),
	)
	if err != nil {
		return nil, err
	}
	services := &services.Services{
		Mailer:            mailerClient,
		CreateMailContent: services.CreateMailContent,
	}
	return services, nil
}

func (a *App) initializeLogger() error { // creates otel logger that exports on otlp
	ctx := context.Background()
	exporter, err := otlploghttp.New(ctx) // uses the OTEL_EXPORTER_OTLP_LOGS_ENDPOINT env var to determine where to send logs
	if err != nil {
		return err
	}
	processor := log.NewBatchProcessor(exporter)

	provider := log.NewLoggerProvider(
		log.WithProcessor(processor),
	)
	logger := otelslog.NewLogger(
		utilities.GetEnvStringWithDefault("OTEL_SERVICE_NAME", "mailer"),
		otelslog.WithLoggerProvider(provider),
	)

	a.logger = logger
	a.loggerProvider = provider
	return nil
}

func (a *App) initializeTracer() error { // creates otel tracer that exports spans on otlp
	ctx := context.Background()
	exporter, err := otlptracehttp.New(ctx) // uses the OTEL_EXPORTER_OTLP_TRACES_ENDPOINT env var to determine where to send traces
	if err != nil {
		return err
	}

	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
	)

	a.tracerProvider = provider
	a.tracer = provider.Tracer(utilities.GetEnvStringWithDefault("OTEL_SERVICE_NAME", "mailer"))
	return nil
}

func (a *App) initializeMetrics() error { // creates the otel meter and serves it for prometheus to scrape
	exporter, err := otelprom.New()
	if err != nil {
		return err
	}

	provider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(exporter),
	)

	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	a.metricsServer = &http.Server{
		Addr:    ":" + utilities.GetEnvStringWithDefault("OTEL_PROMETHEUS_PORT", "9464"),
		Handler: mux,
	}
	go func() {
		if err := a.metricsServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			a.logger.Error("metrics server stopped unexpectedly", "error", err)
		}
	}()

	a.meterProvider = provider
	a.meter = provider.Meter(utilities.GetEnvStringWithDefault("OTEL_SERVICE_NAME", "mailer"))
	return nil
}

func (a *App) Stop() error {
	a.eventBus.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return errors.Join(
		a.metricsServer.Shutdown(ctx),
		a.tracerProvider.Shutdown(ctx),
		a.meterProvider.Shutdown(ctx),
		a.loggerProvider.Shutdown(ctx),
	)
}
