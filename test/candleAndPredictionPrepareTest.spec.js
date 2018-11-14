const assert = require("assert");
const { candleAndPredictionPrepare } = require("../index");
const { candles, predictions } = require("../testAssets/15m");
const testData = require("../testAssets/testCase");

// describe('Array', async function () {
//   const instance = new candleAndPredictionPrepare({ candles, predictions, timeframe: '15m', timeZone: 'Europe/Moscow', enabled: ['next3', 'default']}).run()
//   console.log(instance)
// });

describe("Test Tail Signal", async function() {
  testData.forEach(test => {
    const instance = new candleAndPredictionPrepare({
      candles: test.testData.candles,
      predictions: test.testData.predictions,
      timeframe: "15m",
      timeZone: "Europe/Moscow",
      enabled: ["next3", "default"]
    }).run()
    const { sameDirection, inScope, buyOrSell } = instance.testResult;
    console.log(test.name)
    assert.equal(test.result.sameDirection, sameDirection)
    assert.equal(test.result.inScope, inScope)
    assert.equal(test.result.buyOrSell, buyOrSell)
  })
})
