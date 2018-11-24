const Scope = require('../indicators/scope')
const Tail = require('../indicators/tail')
const Volume = require('../indicators/volume')
const HouseRoof = require('../indicators/houseRoof')
const CandleAndPredictionPrepare = require('../candleAndPredictionPrepare')


class SignalDetection {
  constructor ({ candles, predictions }) {
    this.candles = candles
    this.predictions = predictions

    this.run()
  }

  run () {
    const candles = this.candles
    const predictions = this.predictions

    // prepare data, modify this.candles
    new CandleAndPredictionPrepare({
      candles,
      predictions,
      enabled: ['default', 'next3'],
      timeframe: '15m',
      timeZone: 'Europe/Moscow'
    })

    // detect signals
    new HouseRoof({ candles })

    return this
  }
}

module.exports = SignalDetection