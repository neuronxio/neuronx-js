const assert = require('assert');
const CandleAndPredictionPrepare = require('../source/candleAndPredictionPrepare')
const {candles, predictions} = require('../testAssets/15m')
const moment = require('moment')

describe('Array', async function () {
  const instance = new CandleAndPredictionPrepare({candles, predictions, timeframe: '15m', timeZone: 'Europe/Moscow'}).run()
  console.log(instance)
});
