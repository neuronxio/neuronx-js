const _ = require('lodash')

class HouseRoof {
  constructor ({ candles, network = 'default', s = 0 }) {
    this.candles = _.sortBy(candles, item => item.d)
    this.take = 3
    this.network = network
    this.s = s
    this.data = []

    this.run()
  }

  detectRoof ({ leftPredictionClose, midPredictionClose, rightPredictionClose, midCandleHigh, midCandleLow }) {
    // mid higher than right or left - house roof
    if (leftPredictionClose < midPredictionClose && midPredictionClose > rightPredictionClose && midCandleHigh > midPredictionClose) {
      // BUY
      return 1

      // mid lower than right or left - re-house roof
    } else if (leftPredictionClose > midPredictionClose && midPredictionClose < rightPredictionClose && midCandleLow > midPredictionClose) {
      // SELL
      return -1
    }
    // NOTHING
    return 0
  }

  isHouseRoof () {
    let [right, mid, left] = this.data
    // take first prediction element where network equal network-parameter in constructor
    const rightPrediction = _.first(_.filter(right.predictions, i => i.n === this.network && i.s === this.s))
    const midPrediction = _.first(_.filter(mid.predictions, i => i.n === this.network && i.s === this.s))
    const leftPrediction = _.first(_.filter(left.predictions, i => i.n === this.network && i.s === this.s))

    const data = {
      leftPredictionClose: parseFloat(leftPrediction.c),
      midPredictionClose: parseFloat(midPrediction.c),
      rightPredictionClose: parseFloat(rightPrediction.c),
      midCandleHigh: parseFloat(mid.h),
      midCandleLow: parseFloat(mid.l),
    }

    const signal = this.detectRoof(data)
    if (signal) {
      // have signal
      mid.signals['houseRoof'] = signal
      // mid candle is top/bot extremum
      mid['extremum'] = signal
      // TODO оповестить бота о сигнале покупки/продажи
    }
  }

  run () {
    // take first ${this.take} candles with isClosed = true
    this.data = _.take(_.filter(this.candles, candle => candle.isClosed === true), this.take)

    this.isHouseRoof()
  }
}

module.exports = HouseRoof