const _ = require('lodash')

class NextAISignal {
  constructor ({ candles }) {
    this.candles = _.sortBy(candles, item => item.d).reverse() // deck sorting
    this.take = 2
    this.data = []

    this.run()
  }

  detectNextAISignal ({ currentMidPredictionClose, currentTopPredictionClose, currentBottomPredictionClose, previousMidPredictionClose, previousTopPredictionClose, previousBottomPredictionClose, currentCandleLow, currentCandleHigh }) {
    this.result = null

    if (currentTopPredictionClose < currentCandleHigh && currentMidPredictionClose < currentCandleLow && previousTopPredictionClose < currentTopPredictionClose && previousMidPredictionClose < currentMidPredictionClose && previousBottomPredictionClose < currentBottomPredictionClose) {
      // BUY
      this.result = "LONG"

    } else if (currentBottomPredictionClose < currentCandleLow && currentMidPredictionClose > currentCandleHigh && previousTopPredictionClose > currentTopPredictionClose && previousMidPredictionClose > currentMidPredictionClose && previousBottomPredictionClose > currentBottomPredictionClose) {
      // SELL
      this.result = "SHORT"
    }
  }

  isNextAISignal () {
    let [currentCandle, previousCandle] = this.data
    // take first prediction element where network equal network-parameter in constructor
    const currentMidPrediction = _.first(_.filter(currentCandle.predictions, i => i.n === 'next3 Middle'))
    const currentTopPrediction = _.first(_.filter(currentCandle.predictions, i => i.n === 'next3 Top'))
    const currentBottomPrediction = _.first(_.filter(currentCandle.predictions, i => i.n === 'next3 Bottom'))

    const previousMidPrediction = _.first(_.filter(previousCandle.predictions, i => i.n === 'next3 Middle'))
    const previousTopPrediction = _.first(_.filter(previousCandle.predictions, i => i.n === 'next3 Top'))
    const previousBottomPrediction = _.first(_.filter(previousCandle.predictions, i => i.n === 'next3 Bottom'))

    const data = {
      currentMidPredictionClose: parseFloat(currentMidPrediction.c),
      currentTopPredictionClose: parseFloat(currentTopPrediction.c),
      currentBottomPredictionClose: parseFloat(currentBottomPrediction.c),

      previousMidPredictionClose: parseFloat(previousMidPrediction.c),
      previousTopPredictionClose: parseFloat(previousTopPrediction.c),
      previousBottomPredictionClose: parseFloat(previousBottomPrediction.c),

      currentCandleLow: parseFloat(currentCandle.l),
      currentCandleHigh: parseFloat(currentCandle.h),
    }

    this.detectNextAISignal(data)
    if (this.result) {
      // have signal
      currentCandle.signals['nextAISignal'] = this.result
    }
  }

  run () {
    // take first two closed candles
    this.data = _.take(_.filter(this.candles, candle => candle.isClosed === true && candle.predictions.length > 0), this.take)

    this.isNextAISignal()
  }
}

module.exports = NextAISignal
