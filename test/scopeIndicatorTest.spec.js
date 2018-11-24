const Scope = require('../source/indicators/scope')
const { candles, predictions } = require("../testAssets/15m");

describe("Test Tail Signal", async function () {
  new Scope(candles).run()
})