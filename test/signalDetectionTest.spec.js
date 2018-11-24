const assert = require('assert');
const SignalDetection = require('../source/signalDetection')
const { candles, predictions } = require('../testAssets/15m')

describe('Array', async function () {
  const data = new SignalDetection({
    candles,
    predictions
  })
  console.log(data)
});
