<template>
  <div>
    <div>
      <label v-for="item in enabled" :key="item.name">
        <input type="checkbox" v-model="item.enabled"> {{item.name}}
      </label>
    </div>
    <vue-plotly :value="cpData"/>
  </div>
</template>

<script>
const { candleAndPredictionPrepare } = require('../../../../index.js')
const {candles, predictions} = require('../../../../testAssets/15m')
const moment = require('moment-timezone')
const timeZone = moment.tz.guess()
import VuePlotly from './graphic'
export default {
  components: {
    VuePlotly
  },
  data () {
    return {
      enabled: [
        {name: 'next', val: 'next3', enabled: true},
        {name: 'default', val: 'default', enabled: true},
      ],
    }
  },
  computed: {
    cpData () {
      const enabled = _.map(_.filter(this.enabled, i => i.enabled), i => i.val)
      return new candleAndPredictionPrepare({candles, predictions, timeframe: '15m', timeZone, enabled})
        .run()
        .result()
    }
  }
}
</script>

