package helpers

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthCheckDependencies struct {
	Name    string
	IsReady func() bool
}

type ReadyDependency struct {
	// this is a dto , basically the health check dependency with a function will be ran to create this dto,
	// and then this dto will be marshalled to JSON and sent to the endpoints
	IsReady bool   `json:"ready"`
	Name    string `json:"name"`
}

type DTOHealthCheck struct {
	// this is a dto , basically the health check dependency with a function will be ran to create this dto,
	// and then this dto will be marshalled to JSON and sent to the endpoints
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
	Uptime    int64  `json:"uptime_ms"`
	// going to be milliseconds

	Dependencies []*ReadyDependency `json:"dependencies"`
}

type DTOReadyCheck struct {
	Status       string             `json:"status"`
	Timestamp    int64              `json:"timestamp"`
	Dependencies []*ReadyDependency `json:"dependencies"`
}
type DTOStatusCheck struct {
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
	Uptime    int64  `json:"uptime_ms"` // going to be milliseconds
}

func CreateHealthCheckHandler(deps ...*HealthCheckDependencies) http.Handler {
	mux := http.NewServeMux()
	timeStarted := time.Now()

	dependencyStatus := func() ([]*ReadyDependency, bool) {
		readyDependencies := make([]*ReadyDependency, len(deps))
		isHealthy := true
		for i, dep := range deps {
			depIsReady := dep.IsReady()
			if !depIsReady {
				isHealthy = false
			}
			readyDependencies[i] = &ReadyDependency{
				IsReady: depIsReady,
				Name:    dep.Name,
			}
		}
		return readyDependencies, isHealthy
	}

	ternary := func(condition bool, trueVal, falseVal string) string {
		if condition {
			return trueVal
		}
		return falseVal
	}

	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		_, isHealthy := dependencyStatus()
		healthCheck := &DTOStatusCheck{
			Status:    ternary(isHealthy, "UP", "DOWN"),
			Uptime:    time.Since(timeStarted).Milliseconds(),
			Timestamp: time.Now().UnixMilli(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(healthCheck)
	})

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		depStatus, isHealthy := dependencyStatus()
		healthCheck := &DTOHealthCheck{
			Status:       ternary(isHealthy, "OK", "BAD"),
			Uptime:       time.Since(timeStarted).Milliseconds(),
			Timestamp:    time.Now().UnixMilli(),
			Dependencies: depStatus,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(healthCheck)
	})

	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		depStatus, isHealthy := dependencyStatus()
		readyCheck := &DTOReadyCheck{
			Status:       ternary(isHealthy, "ready", "not ready"),
			Dependencies: depStatus,
			Timestamp:    time.Now().UnixMilli(),
		}
		w.Header().Set("Content-Type", "application/json")
		if isHealthy {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		_ = json.NewEncoder(w).Encode(readyCheck)
	})
	return mux

}
