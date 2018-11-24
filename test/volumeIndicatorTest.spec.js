const assert = require('assert');
const Volume = require('../source/indicators/volume')
const { candles, predictions } = require('../testAssets/15m')

describe('Array', async function () {
  new Volume({ candles }).run()
});
