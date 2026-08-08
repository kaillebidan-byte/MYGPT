"use strict";

const assert = require("node:assert/strict");
const { createGateState, classifyTerminal } = require("./terminal_gate.js");

const config = { barConfirmCycles: 3, terminalMinStableMs: 1200 };
let state = createGateState(0);

({ state } = classifyTerminal(state, {
  now: 0, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
assert.equal(state.barStableCycles, 0, "first sighting must not count as stable");

({ state } = classifyTerminal(state, {
  now: 500, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
assert.equal(state.barStableCycles, 1);

let result = classifyTerminal(state, {
  now: 1000, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config);
state = result.state;
assert.equal(result.terminal, false, "minimum stable time is still unmet");

result = classifyTerminal(state, {
  now: 1500, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config);
assert.equal(result.terminal, true, "three stable bar cycles and stable time should complete");
assert.equal(result.proof, "oracle-action-bar");

state = createGateState(0);
({ state } = classifyTerminal(state, {
  now: 0, contentKey: "preamble", textLength: 20,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
({ state } = classifyTerminal(state, {
  now: 800, contentKey: "preamble", textLength: 20,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
result = classifyTerminal(state, {
  now: 1600, contentKey: "real-answer", textLength: 15,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config);
assert.equal(result.terminal, false, "content replacement must reset completion debounce");
assert.equal(result.state.barStableCycles, 0);

state = createGateState(0);
({ state } = classifyTerminal(state, {
  now: 0, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
({ state } = classifyTerminal(state, {
  now: 800, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: false
}, config));
result = classifyTerminal(state, {
  now: 1600, contentKey: "a", textLength: 10,
  stopVisible: false, barVisible: true, strongThinkingActive: true
}, config);
assert.equal(result.terminal, false, "strong thinking must veto terminal state");
assert.equal(result.state.barStableCycles, 0);

console.log("terminal gate tests passed");
