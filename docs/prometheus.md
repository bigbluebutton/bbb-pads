# Prometheus metrics

bbb-pads provides direct Prometheus instrumentation for monitoring purposes.
The instrumentation code is **disabled by default**.

The underlying mechanisms of the Prometheus client as well as the default Node.js
metrics come from https://github.com/siimon/prom-client.

## Enabling instrumentation

It can be enabled via configuration file (settings.json).

### Configuration file (settings.json)

See the `prometheus` object in `/config/settings.json.template`.

The default configuration is:

```JSON5
"prometheus": {
  // Whether to enable or disable metric exporting altogether.
  "enabled": false,
  // host: scrape route host
  "host": "localhost",
  // port: scrape route port
  "port": "9003",
  // path: metrics endpoint path
  "path": "/metrics",
  // collectCustomMetrics: whether custom bbb-pads metrics should be exported
  "collectCustomMetrics": true
  // collectDefaultMetrics: whether default Node.js metrics should be exported
  "collectDefaultMetrics": true
}
```

## Exposed metrics

The custom metric set currently is:

```
# HELP bbb_pads_etherpad_requests_total Total Etherpad API requests
# TYPE bbb_pads_etherpad_requests_total counter
bbb_pads_etherpad_requests_total{method="<method_name>"} 0

# HELP bbb_pads_etherpad_requests_errors_total Total Etherpad API request failures
# TYPE bbb_pads_etherpad_requests_errors_total counter
bbb_pads_etherpad_requests_errors_total{method="<method_name>"} 0

```

The default Node.js metrics come from https://github.com/siimon/prom-client.
