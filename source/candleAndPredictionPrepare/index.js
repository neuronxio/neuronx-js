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
    this.basePrediction = []
  }
  getMinAndMaxDates () {
    const pred = _.map(this.predictions, i => i.d)
    const cand = _.map(this.candles, i => i.d)
    const all = _.concat(cand, pred)
    const min = _.min(all)
    const max = _.max(all)
    this.r.x = createMatrixByStep({ start: min, end: max, step: 15, stepType: 'm', timeZone: this.timeZone})
    this.basePrediction = _.map(this.r.x, () => null)
    
  }
  prepareCandles(){
    let key = 0
    for(let item of this.candles){
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
      const key = _.findIndex(this.r.x, (item) => moment(item).unix() === prediction.d)
      //TODO надо в соответствии с таймреймом искать индекс по диапазону
      if (key !== -1) {
        this.r.predictions[name]['y'][key] = prediction.c
      }
    }
    return this
  }
  checkTailSignal() {
    const tops = this.r.predictions['next3 Top'].y
    const middles = this.r.predictions['next3 Middle'].y
    let lastCloseCandle = (_.last(this.candles)).c
    return tailSignal({ tops, middles, close: lastCloseCandle, commission: 0.075 })
  }
  run () {
    this.getMinAndMaxDates()
    this.prepareCandles()
    this.preparePredictions()
    this.checkTailSignal()
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

function createMatrixByStep({ start = null, end = null, step = 15, stepType = 'm', timeZone = 'Europe/Moscow'}) {
  let result = []
  let lastDate = moment.unix(start)
  let endDate = moment.unix(end)

  for(i = 0; i < 1000; i++){
    lastDate = lastDate.clone().add(step, stepType)
    if (endDate.diff(lastDate, 'minutes') < 0){
      break
    }
    result.push(lastDate.clone().tz(timeZone).format())
  }
  return result
}

function tailSignal({ tops, middles, close, commission, bottomPoint = null }) {
  const firstTop = _.first(_.takeRight(tops, 3))
  const lastTop = _.last(_.takeRight(tops, 3))
  const firstMiddle = _.first(_.takeRight(middles, 3))
  const lastMiddle = (_.takeRight(middles, 3))[1]
  
  const corridorOfDoubt = getCorridorOfDoubt(close, commission)
  const inScope = isInScope(lastTop, lastMiddle, corridorOfDoubt.top, corridorOfDoubt.bottom)
  const sameDirection = isSameDirection(firstTop, lastTop, firstMiddle, lastMiddle)

  console.log('Corridor', corridorOfDoubt)
  console.log('clos', close)
  console.log('lastTop', lastTop, 'lastMiddle', lastMiddle)
  console.log('Хвосты в коридоре?', inScope)
  console.log('Одинаковое направление?', sameDirection)

  if (!sameDirection) {
    console.log('Нет сигнала')
    return false
  }
  if (sameDirection && inScope) {
    console.log('Неуверенный сигнал')
    return true
  }
  console.log('Сигнал')
}

/**
 * Узнаем, находится ли точки хвостов внутри коридора
 * @param {number} top значение крайней точки по верхнему коридору графика
 * @param {number} middle значение крайней точки по средней линии графика
 * @param {number} bottomScope нижняя граница коридора неуверенности
 * @param {number} topScope верхняя граница коридора неуверенности
 */
function isInScope(top, middle, topScope, bottomScope ) {
  if (top > bottomScope && top < topScope ||
    middle > bottomScope && middle < topScope) {
    return true
  }
  return false
}
/**
 * Получаем коридо неуверенности
 * @param {number} close 
 * @param {number} commission 
 */
function getCorridorOfDoubt(close, commission) {
  const scale = new Decimal(new Decimal(close).mul(commission)).div(100).toFixed(3)
  return {
    top: new Decimal(close).plus(scale).toFixed(3),
    bottom: new Decimal(close).minus(scale).toFixed(3)
  }
}
/**
 * Определяем, направлены ли хвосты в одну сторону
 * @param {number} firstTop 
 * @param {number} lastTop
 * @param {number} firstMiddle
 * @param {number} lastMiddle
 */
function isSameDirection(firstTop, lastTop, firstMiddle, lastMiddle) {
  if ((firstTop - lastTop) > 0 && (firstMiddle - lastMiddle) > 0 ) {
    return true
  }
  if ((firstTop - lastTop) < 0 && (firstMiddle - lastMiddle) < 0) {
    return true
  }
  return false
}

module.exports = CandleAndPredictionPrepare
