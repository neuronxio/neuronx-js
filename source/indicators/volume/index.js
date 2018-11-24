const _ = require('lodash')
const moment = require('moment')
const Decimal = require('decimal.js')


class Volume {
  constructor ({ candles, predictions }) {
    // sort ask
    this.candles = _.sortBy(candles, item => moment(item.d).unix())
    this.take = 5
    this.lifetime = 300
  }

  defineMinMaxByAvg (avg, perc = 45) {
    const percent = new Decimal(avg).mul(perc).div(100).toNumber()
    return {
      max: new Decimal(avg).plus(percent).toNumber(),
      min: new Decimal(avg).minus(percent).toNumber(),
    }
  }

  defineSignal (subject, min, max) {
    if (new Decimal(subject).greaterThan(max)) {
      return '1'
    } else if (new Decimal(subject).lessThan(min)) {
      return '-1'
    }
    return 0
  }

  run () {
    let candles = _.cloneDeep(this.candles)
    let cLength = candles.length - 1
    let signals = []
    for (let i = 0; i <= cLength; i++) {
      let taked = _.take(candles, this.take + 1)
      let subject = _.first(taked.splice(-1, 1))

      if (subject && subject.v && taked.length === this.take) {
        let avgVolume = (_.meanBy(taked, item => parseFloat(item.v))).toFixed(8)
        const { min, max } = this.defineMinMaxByAvg(avgVolume)
        const signal = this.defineSignal(subject.v, min, max)
        signals.push(signal)
      }
      candles.shift()
    }
    // post-processing signals - determinate indicator
    this.result = { signals }
    return this
  }
}

module.exports = Volume

