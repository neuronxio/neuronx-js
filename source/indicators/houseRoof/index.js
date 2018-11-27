const _ = require('lodash')

class HouseRoof {
  constructor ({ candles, network = 'default', s = 0 }) {
    this.candles = _.sortBy(candles, item => item.d).reverse() // deck sorting
    this.take = 3
    this.network = network
    this.s = s
    this.data = []

    this.run()
  }

  detectRoof ({ leftPredictionClose, midPredictionClose, rightPredictionClose, midCandleHigh, midCandleLow }) {
    this.result = null
    // mid higher than right or left - house roof
    if (leftPredictionClose < midPredictionClose && midPredictionClose > rightPredictionClose && midCandleHigh > midPredictionClose) {
      // BUY
      this.result = "LONG"

      // mid lower than right or left - re-house roof
    } else if (leftPredictionClose > midPredictionClose && midPredictionClose < rightPredictionClose && midCandleLow < midPredictionClose) {
      // SELL
      this.result = "SHORT"
    }
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

    this.detectRoof(data)
    if (this.result) {
      // have signal
      mid.signals['houseRoof'] = this.result
      // mid candle is top/bot extremum
      mid['extremum'] = this.result
    }
  }

  run () {
    // take first ${this.take} candles with isClosed = true
    this.data = _.take(_.filter(this.candles, candle => candle.isClosed === true && candle.predictions.length > 0), this.take)

    this.isHouseRoof()
  }
}

module.exports = HouseRoof
