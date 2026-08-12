import assert from "node:assert/strict";
import { chooseFollowUp } from "../src/matter_delivery.ts";

const now = new Date("2026-08-10T09:00:00Z");
assert.equal(chooseFollowUp("2026-08-09T17:00:00Z", now), true);
assert.equal(chooseFollowUp("2026-08-11T17:00:00Z", now), false);
console.log("deadline decision test passed");
