const _ = require('lodash')

const moment = require('moment')
const Decimal = require('decimal.js')

const defineMinMaxByAvg = (avg, perc = 45) => {
  const percent = new Decimal(avg).mul(perc).div(100).toNumber()
  return {
    max: new Decimal(avg).plus(percent).toNumber(),
    min: new Decimal(avg).minus(percent).toNumber(),
  }
}

const defineSignal = (subject, min, max) => {
  if (new Decimal(subject).greaterThan(max)) {
    return '1'
  } else if (new Decimal(subject).lessThan(min)) {
    return '-1'
  }
  return 0
}

class Volume {
  constructor ({ candles = [], cbIteration = null}) {
    try {
      this.candles = _.sortBy(candles, item => moment(item.date).unix())
      this.cbIteration = cbIteration
      this.take = 5
    } catch ( e ) {
      console.log(e)
    }
  }

  run () {
    try {

      let candles = _.cloneDeep(this.candles)
      let cLength = candles.length - 1
      for ( let i = 0; i <= cLength; i++ ) {
        let taked = _.take(candles, this.take + 1)
        let subject = _.first(taked.splice(-1, 1))
        if (subject && subject.v && taked.length === this.take) {
          let avgVolume = ( _.meanBy(taked, item => parseFloat(item.v)) ).toFixed(8)
          const { min, max } = defineMinMaxByAvg(avgVolume)
          const signal = defineSignal(subject.v, min, max)
          console.log(subject.v, signal, min, max, avgVolume, i)
        }
        candles.shift()
      }
    } catch ( e ) {
      console.log(e)
    }
  }
}

module.exports = Volume

