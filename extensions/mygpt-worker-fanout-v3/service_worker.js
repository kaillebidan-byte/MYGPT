"use strict";

// Keep the proven v0.4.4 orchestration untouched. Image recovery is layered on
// after the original background worker has registered its listeners.
importScripts("background.js", "image_collector.js");
