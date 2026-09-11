"use strict";
// Public upload edition: no server URL, API key, account identifier or private configuration.
// Keep secret credentials on a server, never in a public website.
window.APP_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabasePublishableKey: "",
  traceTable: "group_traces",
});
