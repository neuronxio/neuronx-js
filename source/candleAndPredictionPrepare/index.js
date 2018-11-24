const moment = require('moment-timezone')
const _ = require('lodash')
const Decimal = require('decimal.js')


class CandleAndPredictionPrepare {
  constructor ({ candles = [], predictions = [], timeFrame = '15m', enabled = [], timeZone = 'Europe/Moscow' }) {
    this.candles = candles
    this.predictions = _.cloneDeep(predictions)
    this.timeFrame = timeFrame
    this.candleDuration = timeframeToTimestamp({ timeFrame })
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
    this.basePrediction = []

    this.run()
  }

  getMinAndMaxDates () {
    const pred = _.map(this.predictions, i => i.d)
    const cand = _.map(this.candles, i => i.d)
    const all = _.concat(cand, pred)
    const min = _.min(all)
    const max = _.max(all)
    this.r.x = createMatrixByStep({ start: min, end: max, step: 15, stepType: 'm', timeZone: this.timeZone })
    this.basePrediction = _.map(this.r.x, () => null)
  }

  prepareCandles () {
    let key = 0, closedDate
    for (let item of this.candles) {
      this.r.open.push(item.o)
      this.r.high.push(item.h)
      this.r.low.push(item.l)
      this.r.close.push(item.c)
      this.r.y.push(item.v)
      this.allPoints.push(item.h)
      this.allPoints.push(item.l)

      item.median = medianCalc(item)
      item.isIntence = intenceCalc(item, this.candles[key + 1])

      key = key + 1
      closedDate = moment.unix(item.d).add(this.candleDuration, 'seconds')
      item['isClosed'] =  closedDate < moment()
      item['signals'] = {}
      item['predictions'] = _.filter(this.predictions, row =>
        // candle.openDate <= prediction.date < candle.closedDate
        row.d >= item.d && row.d < closedDate.unix()
      )

      this.r.items.push(item)
    }
    return this
  }

  preparePredictions () {
    let predictions = []
    if (this.enabled.indexOf('default') !== -1) {
      predictions = _.filter(this.predictions, i => i.n === 'default')
    }
    if (this.enabled.indexOf('next3') !== -1) {
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
      const key = _.findIndex(this.r.x, (item) => moment(item).unix() === prediction.d)

      if (key !== -1) {
        this.r.predictions[name]['y'][key] = prediction.c
      }
    }
    return this
  }

  run () {
    this.getMinAndMaxDates()
    this.prepareCandles()
    this.preparePredictions()
    return this
  }

  result () {
    return this.r
  }
}

function medianCalc (item) {
  if (item === undefined && item.l && item.h) {
    return 0
  }
  return _.floor(item.l - ((item.l - item.h) / 2), 2)
}

// важность, если тело свечи вместе с тенью больше чем предидущее тело свечи с тенью на 15 процентов и более
function intenceCalc (currentCandle, pastCandle, perc = 15) {
  if (currentCandle === undefined || pastCandle === undefined || !pastCandle.l || !pastCandle.h) {
    return false
  }
  currentCandle.height = _.floor(Math.abs(currentCandle.l - currentCandle.h), 2)
  pastCandle.height = _.floor(Math.abs(pastCandle.l - pastCandle.h), 2)

  let percentBetweenTwoCandles = new Decimal(currentCandle.height).minus(pastCandle.height).div(currentCandle.height).mul(100).toFixed(2)

  return new Decimal(percentBetweenTwoCandles).greaterThanOrEqualTo(perc)
}

function createMatrixByStep ({ start = null, end = null, step = 15, stepType = 'm', timeZone = 'Europe/Moscow' }) {
  let result = []
  let lastDate = moment.unix(start)
  let endDate = moment.unix(end)

  for (i = 0; i < 1000; i++) {
    lastDate = lastDate.clone().add(step, stepType)
    if (endDate.diff(lastDate, 'minutes') < 0) {
      break
    }
    result.push(lastDate.clone().tz(timeZone).format())
  }
  return result
}

function timeframeToTimestamp ({ timeFrame }) {
  let seconds = 0
  switch (timeFrame) {
    case '15m':
      seconds = 900
      break
    case '5m':
      seconds = 300
      break
  }
  return seconds
}

module.exports = CandleAndPredictionPrepare
