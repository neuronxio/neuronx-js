const assert = require('assert');
const CandleAndPredictionPrepare = require('../source/candleAndPredictionPrepare')
const { candles, predictions } = require('../testAssets/15m')

describe('Array', async function () {
  const data = new CandleAndPredictionPrepare({
    candles,
    predictions,
    enabled: ['default', 'next3'],
    timeframe: '15m',
    timeZone: 'Europe/Moscow'
  })
  console.log(data)
});
