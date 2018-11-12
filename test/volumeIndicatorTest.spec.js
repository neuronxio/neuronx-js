const assert = require('assert');
const Volume = require('../source/indicators/volume')
const { candles, predictions } = require('../testAssets/15m')

describe('Array', async function () {
  try {
    new Volume({ candles: candles }).run()
  } catch ( e ) {
    console.log(e)
  }
});
