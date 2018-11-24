const assert = require("assert");
const Tail = require("../source/indicators/tail");
const { candles, predictions } = require("../testAssets/15m");

describe("Test Tail Signal", async function () {
  new Tail(candles).run()
})