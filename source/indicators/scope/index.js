const moment = require('moment-timezone')
const _ = require('lodash')
const Decimal = require('decimal.js')


class Scope {
  constructor ({ candles, predictions }) {
    this.predictions = predictions
    this.take = 5
  }

  // Решаем, добавлять ли элемент (value) в зависимости от расхождения (perc)
  // в зависимости от предыдущего значения (prevValue)
  // prevValue - предыдущее
  // value - максимальное или минимальное текущее
  isDifference (prevValue, value, perc = 0.5) {
    let diffPercent = new Decimal(prevValue).mul(100).div(value).toFixed(2)
    const result = 100 - diffPercent
    if (Math.abs(result) <= perc) {
      return false
    }
    return true
  }

  run () {
    let predictions = _.cloneDeep(this.predictions)
    predictions = _.chunk(predictions, this.take)
    let prevMax = 0
    let prevMin = 0
    let scope = []

    _.map(predictions, prediction => {
      let max = _.maxBy(prediction, item => item.c)
      let min = _.minBy(prediction, item => item.c)

      if (this.isDifference(prevMax, max.c) && this.isDifference(prevMin, min.c)) {
        scope.push({ max: max.c, min: min.c })
      } else if (this.isDifference(prevMax, max.c) && !this.isDifference(prevMin, min.c)) {
        scope.push({ max: max.c })
      } else if (!this.isDifference(prevMax, max.c) && this.isDifference(prevMin, min.c)) {
        scope.push({ min: min.c })
      }
      prevMax = max.c
      prevMin = min.c
    })
    this.result = { scope }
    return this
  }
}

module.exports = Scope