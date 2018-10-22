const moment = require('moment-timezone')
const _ = require('lodash')
const Decimal = require('decimal.js')
class CandleAndPredictionPrepare {
  constructor({ candles = [], predictions = [], timeFrame = '15m', enabled = [], timeZone = 'Europe/Moscow'}){
    this.candles = candles
    this.predictions = _.cloneDeep(predictions)
    this.timeFrame = timeFrame
    this.timeZone = timeZone
    this.r = {
      open: [],
      high: [],
      low: [],
      close: [],
      median: [],
      isIntence: [],
      items: [],
      x: [],
      y: [],
      predictions: {}
    }
    this.enabled = enabled
    this.allPoints = []
    this.baseTemplate = []
    this.basePrediction = []
  }
  prepareCandles(){
    let key = 0
    for(let item of this.candles){
      this.basePrediction.push(null)
      this.r.open.push(item.o)
      this.r.high.push(item.h)
      this.r.low.push(item.l)
      this.r.close.push(item.c)
      this.r.x.push(moment.unix(item.d).clone().tz(this.timeZone).format())
      this.r.y.push(item.v)
      this.r.predictions = []

      this.allPoints.push(item.h)
      this.allPoints.push(item.l)

      item.median = medianCalc(item)
      item.isIntence = intenceCalc(item, this.candles[key + 1])

      key = key + 1
      this.baseTemplate[item.d] = item
      this.r.items.push(item)
    }
    return this
  }
  preparePredictions() {
    let predictions = []
    if (this.enabled.indexOf('default') !== -1){
      predictions = _.filter(this.predictions, i => i.n === 'default')
    }
    if (this.enabled.indexOf('next3') !== -1){
      let groupped = _.groupBy(_.filter(this.predictions, i => i.n === 'next3'), i => i.d)
      _.forEach(groupped, item => {
        item = _.sortBy(item, i => -parseFloat(i.c))
        if (typeof item[0] !== 'undefined') {
          item[0].n = item[0].n + ' Top'
          predictions.push(item[0])
        }
        if (typeof item[1] !== 'undefined') {
          item[1].n = item[1].n + ' Middle'
          predictions.push(item[1])
        }
        if (typeof item[2] !== 'undefined') {
          item[2].n = item[2].n + ' Bottom'
          predictions.push(item[2])
        }
      })
    }
    for (const prediction of predictions) {
      const name = prediction.n
      // console.log(_.get(this.r, 'prediction.' + name, null))
      if (!_.get(this.r, 'predictions.' + name, null)) {
        this.r.predictions[name] = { name, y: _.cloneDeep(this.basePrediction) }
      }
      this.allPoints.push(prediction.c)
      const key = _.findIndex(this.candles, (item) => item.d === prediction.d)
      //TODO надо в соответствии с таймреймом искать индекс по диапазону
      if (key) {
        this.r.predictions[name]['y'][key] = prediction.c
      }
    }
    return this
  }
  run () {
    this.prepareCandles()
    this.preparePredictions()
    return this
  }
  result () {
    return this.r
  }
}

function medianCalc(item) {
  if (item === undefined && item.l && item.h) {
    return 0
  }
  return _.floor(item.l - ((item.l - item.h) / 2), 2)
}

// важность, если тело свечи вместе с тенью больше чем предидущее тело свечи с тенью на 15 процентов и более

function intenceCalc(currentCandle, pastCandle, perc = 15) {
  if (currentCandle === undefined || pastCandle === undefined || !pastCandle.l || !pastCandle.h) {
    return false
  }
  currentCandle.height = _.floor(Math.abs(currentCandle.l - currentCandle.h), 2)
  pastCandle.height = _.floor(Math.abs(pastCandle.l - pastCandle.h), 2)
  // console.log(currentCandle)

  let percentBetweenTwoCandles = new Decimal(currentCandle.height).minus(pastCandle.height).div(currentCandle.height).mul(100).toFixed(2)

  let isIntence = new Decimal(percentBetweenTwoCandles).greaterThanOrEqualTo(perc)

  // console.log(currentCandle.id, pastCandle, currentCandle.height, pastCandle.height, percentBetweenTwoCandles, isIntence)
  return isIntence
}

module.exports = CandleAndPredictionPrepare
