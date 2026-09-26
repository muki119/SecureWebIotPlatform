package main

// This is the main entry point of the mailer service
// will use the event bus to receive mail data and send emails accordingly
// probably means that in the auth service - it should save if the user wants emails

import (
	"fmt"
	"mailer/internal/app"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	App := &app.App{}
	errChan, err := App.Start()
	if err != nil {
		fmt.Println("Error starting the app: ", err)
		os.Exit(1)
	}

	if err := App.InitializeHealthChecks(); err != nil {
		fmt.Println("Error initializing health checks: ", err)
		os.Exit(1)
	}

	shutdownChan := make(chan struct{})
	go func() { // listen for shutdown signals and close the shutdown channel when received
		exitSignal := make(chan os.Signal, 1)
		signal.Notify(exitSignal, syscall.SIGINT, syscall.SIGTERM)
		<-exitSignal
		App.Logger.Info("Shutting down...")
		err := App.Stop()
		if err != nil {
			fmt.Println("Error stopping the app: ", err)
			os.Exit(1) // exit with error code if there was an error stopping the app
		}
		close(shutdownChan)
	}()

	App.Logger.Info("Mailer service started successfully")
	if err := <-errChan; err != nil {
		fmt.Println("Error from the app: ", err)
		close(shutdownChan) // close the shutdown channel so it doesn't hang forever
	}
	<-shutdownChan

}
