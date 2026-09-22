package app

// going to house the setup
// since go is a procedural language , were kinda forced to do a dependency injection pattern , no real singletons or anything

import (
	"mailer/internal/constants"
	"mailer/internal/handlers"
	"mailer/internal/utilities"

	eventBus "github.com/muki119/go-slim-event-bus/v2"
	"github.com/redis/go-redis/v9"
)

type App struct {
	// here lies the dependencies for the application
	eventBus *eventBus.StreamsEventBus
	handlers *handlers.Handlers
}

/**
EVENT_BUS_REDIS_HOST=localhost
EVENT_BUS_REDIS_PORT=6379
EVENT_BUS_REDIS_PASSWORD=
EVENT_BUS_REDIS_DB=0

*/

func (a *App) Start() error {
	eventBusConfig := eventBus.EventBusConfig{
		ConnectionConfig: &redis.Options{
			Addr:     utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_HOST", "localhost") + ":" + utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_PORT", "6379"),
			Username: utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_USERNAME", ""),
			Password: utilities.GetEnvStringWithDefault("EVENT_BUS_REDIS_PASSWORD", ""),
			DB:       utilities.GetEnvIntWithDefault("EVENT_BUS_REDIS_DB", 0),
		},
	}
	a.eventBus = eventBusConfig.NewFromConfig()
	return nil
}



func (a *App) InitializeHandlers() error {
	// will get the handlers from the struct and attatch them to the event bus
	a.eventBus.StreamHandler(constants.AUTH_USER_CREATED, a.handlers.HandleUserCreated)
	a.eventBus.StreamHandler(constants.AUTH_USER_DELETED, a.handlers.HandleUserDeleted)
	return nil
}

func (a *App) Stop() error {
	return nil
}
