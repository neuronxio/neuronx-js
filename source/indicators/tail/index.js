const _ = require('lodash')
const Decimal = require('decimal.js')

class Tail {
  constructor ({ candles, predictions }) {
    this.candles = candles
    this.predictions = predictions
    this.lifetime = 60
  }

  run () {
    const tops = this.predictions['next3 Top'].y
    const middles = this.predictions['next3 Middle'].y
    const lastCloseCandle = (_.last(this.candles)).c

    this.tailSignal({ tops, middles, close: lastCloseCandle })
    return this
  }

  /**
   * Определение сигнала "Хвосты"
   * @param {Array} tops Массив значений верхнего коридора предсказаний
   * @param {Array} middles Массив значений средней линии предсказаний
   * @param {number} close Текущий close свечи
   * @param bottomPoint
   */
  tailSignal ({ tops, middles, close, bottomPoint = null }) {
    const commission = 0.075
    const waitProfit = 0.18

    const firstTop = _.first(_.takeRight(tops, 3))
    const lastTop = _.last(_.takeRight(tops, 3))
    const firstMiddle = _.first(_.takeRight(middles, 3))
    const lastMiddle = (_.takeRight(middles, 3))[1]

    const inScope = this.isInScope(lastTop, lastMiddle, close, commission)
    const sameDirection = this.isSameDirection(firstTop, lastTop, firstMiddle, lastMiddle)
    const buyOrSell = this.checkBuyOrSell(close, lastTop, lastMiddle, waitProfit)
    const data = { inScope, sameDirection, buyOrSell }
    let conclusion
    if (!sameDirection) {
      conclusion = 'No signal, the ends are looking at each other'
    } else if (sameDirection && inScope) {
      conclusion = 'Fuzzy signal'
    } else if (sameDirection && !inScope && buyOrSell) {
      conclusion = `Signal! ${buyOrSell}`
    }
    if (sameDirection && !inScope && buyOrSell === false) {
      conclusion = 'There is a signal, but tails are not higher and not lower than 0.18% of close. There is no certainty to buy or sell'
    }
    this.result = { ...data, conclusion }
  }

  /**
   * Определяем сигнал: покупка или продажа
   * @param {number} close - close текущей свечи
   * @param {number} top - последняя точка верхней границы коридора предсказаний
   * @param {number} middle  - посредняя точка средней линии коридора предсказаний
   * @param {number} waitProfit - ожидаемый профит
   */
  checkBuyOrSell (close, top, middle, waitProfit) {
    const topScopeByWaitProfit = new Decimal(close).plus(new Decimal(new Decimal(close).mul(waitProfit)).div(100)).toFixed(3)
    const bottomScopeByWaitProfit = new Decimal(close).minus(new Decimal(new Decimal(close).mul(waitProfit)).div(100)).toFixed(3)
    if (top > topScopeByWaitProfit && middle > topScopeByWaitProfit) {
      return 'BUY'
    }
    if (top < bottomScopeByWaitProfit && middle < bottomScopeByWaitProfit) {
      return 'SELL'
    }
    return false
  }

  /**
   * Узнаем, находится ли точки хвостов внутри коридора
   * @param {number} top значение крайней точки по верхнему коридору графика
   * @param {number} middle значение крайней точки по средней линии графика
   * @param {number} bottomScope нижняя граница коридора неуверенности
   * @param {number} topScope верхняя граница коридора неуверенности
   */
  isInScope (top, middle, close, commission) {
    const topScopeByComission = new Decimal(close).plus(new Decimal(new Decimal(close).mul(commission)).div(100)).toFixed(3)
    const bottomScopeByComission = new Decimal(close).minus(new Decimal(new Decimal(close).mul(commission)).div(100)).toFixed(3)
    if (top > bottomScopeByComission && top < topScopeByComission ||
      middle > bottomScopeByComission && middle < topScopeByComission) {
      return true
    }
    return false
  }

  /**
   * Определяем, направлены ли хвосты в одну сторону
   * @param {number} firstTop
   * @param {number} lastTop
   * @param {number} firstMiddle
   * @param {number} lastMiddle
   */
  isSameDirection (firstTop, lastTop, firstMiddle, lastMiddle) {
    const isFirstTopGreaterLastTop = new Decimal(firstTop).minus(lastTop) > 0
    const isFirstMiddleGreaterLastMiddle = new Decimal(firstMiddle).minus(lastMiddle) > 0
    if (isFirstTopGreaterLastTop && isFirstMiddleGreaterLastMiddle) {
      return true
    }
    if (!isFirstTopGreaterLastTop && !isFirstMiddleGreaterLastMiddle) {
      return true
    }
    return false
  }
}

module.exports = Tail