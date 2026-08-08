"use strict";
const assert = require("node:assert/strict");
const gate = require("../terminal_gate.js");
let state = gate.createGateState(0);
let result;
for (const now of [1000, 2000, 3000, 4000]) {
  result = gate.classifyTerminal(state, {
    contentKey: "same", now, textLength: 10, stopVisible: false, barVisible: true, strongThinkingActive: false
  }, { barConfirmCycles: 3, terminalMinStableMs: 1500 });
  state = result.state;
}
assert.equal(result.terminal, true);
assert.equal(result.proof, "oracle-action-bar");
console.log("Translation Loop terminal gate: PASS");
