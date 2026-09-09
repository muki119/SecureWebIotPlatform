// Loaded via `node --import ./dist/instrumentation.js` (or tsx `--import ./instrumentation.ts`
// in dev) so the OpenTelemetry SDK registers before express / pg / etc. are imported.
import "@services/common/config/instrumentation";
