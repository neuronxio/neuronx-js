const assert = require('assert');
const { candleAndPredictionPrepare } = require('../index')
const {candles, predictions} = require('../testAssets/15m')

describe('Array', async function () {
  const instance = new candleAndPredictionPrepare({candles, predictions, timeframe: '15m', timeZone: 'Europe/Moscow'}).run()
  console.log(instance)
});
