<template>
  <div class="chart-body">
    <vue-plotly
      ref="plotly"
      :data="cpData"
      :layout="cpLayout"
      :auto-resize="true"
      :watch-shallow="false"/>
  </div>
</template>
<script>
  import VuePlotly from '@statnett/vue-plotly'
  import _ from 'lodash'
  import Decimal from 'decimal.js'
  import ColorHash from 'color-hash'
  // for example candle stick and volumes: https://plot.ly/~jackp/17419.embed

  export default {
    components: {
      VuePlotly
    },
    props: {
      value: {},
      name: {},
      indicators: {},
      showLegend: {
        default: true
      },
      legendFontSize: {
        default: 12
      },
      height: {
        default: 600
      }
    },
    data () {
      return {
        options: {
          displayModeBar: false
        }
      }
    },
    computed: {
      cpLayout () {
        return {
          // dragmode: 'pan',

          yaxis: { domain: [0, 0.1], showticklabels: true },
          plot_bgcolor: '#454A5C',
          paper_bgcolor: '#232630',

          height: this.height,
          yaxis2: {
            domain: [0.1, 0.99],
            dtick: this.cpTick,
            color: '#ffffff50'
            // tickcolor: '#ffffff50'
          },
          xaxis: {
            rangeslider: {
              visible: false
            },
            color: '#ffffff50',
            tickcolor: '#ffffff50',
            zerolinecolor: '#ffffff50'
            // color: '#ffffff50'
          },
          shapes: this.cpShapes,
          // annotations: [
          //   {
          //     x: '2017-01-31',
          //     y: 0.9,
          //     xref: 'x',
          //     yref: 'paper',
          //     text: 'largest movement',
          //     font: {color: 'magenta'},
          //     showarrow: true,
          //     xanchor: 'right',
          //     ax: -20,
          //     ay: 0
          //   }
          // ],
          // yaxis: {

          // },
          autosize: true,
          showlegend: this.showLegend,
          margin: { r: 10, b: 40, l: 40, t: 0 },
          legend: {
            y: -0.20,
            x: 0.04,
            orientation: 'h',
            yanchor: 'bottom',
            bgcolor: 'transparent',
            font: {
              size: this.legendFontSize,
              color: '#ffffff50'
            }
          }
        }
      },
      // чтобы красивые и человекочитаемые линейки были
      cpTick () {
        let {allPoints} = this.value
        let max = _.max(allPoints)
        let min = _.min(allPoints)
        return Math.floor((max - min) / 12)
      },
      cpShapes () {
        let {x, items} = this.value
        if (!items.length) {
          return []
        }

        let medians = _.chain(items)
          .filter({isIntence: true})
          .sortBy(i => -i.height)
          .take(3)
          .map(i => i.median)
          .value()
        let sum = 0
        for (var i = 0; i < medians.length; i++) {
          sum = new Decimal(sum).plus(medians[i]).toFixed(2)
        }

        let avg = new Decimal(sum).div(medians.length).toFixed(2)
        // console.log(medians, avg)

        return [
          {
            type: 'line',
            x0: _.last(x),
            y0: avg,
            x1: _.first(x),
            y1: avg,
            yref: 'y2',
            line: {
              color: '#ccc',
              width: 3,
              dash: 'dashdot'
            }
          }
        ]
      },
      cpData () {
        let {open, high, low, close, x, y, predictions} = this.value
        let candles = {
          name: 'Candle',
          type: 'candlestick',
          yaxis: 'y2',
          open,
          high,
          low,
          close,
          x,
          line: {
            color: '#FB497C'
            // width: 1
          }
          // color: '#FB497C'
          // hoverinfo: 'text'
        }

        let volumes = {
          name: 'Volume', type: 'bar', yaxis: 'y', x, y
        }
        // medians = _.map(medians, (itemP, key) => {
        //   return {
        //     ...itemP,
        //     name: key,
        //     type: 'scatter',
        //     mode: 'markers+lines',
        //     marker: { size: 7 },
        //     line: {color: StringToColor(key)},
        //     yaxis: 'y2',
        //     x
        //   }
        // })

        // let maxMin = [
        //   {
        //     name: 'Max',
        //     type: 'scatter',
        //     mode: 'markers+lines',
        //     connectgaps: true,
        //     marker: { size: 7 },
        //     line: {color: '#ccc'},
        //     yaxis: 'y2',
        //     x,
        //     y: max
        //   },
        //   {
        //     name: 'Min',
        //     type: 'scatter',
        //     mode: 'markers+lines',
        //     connectgaps: true,
        //     marker: { size: 7 },
        //     line: {color: '#ccc'},
        //     yaxis: 'y2',
        //     x,
        //     y: min
        //   },
        // ]
        predictions = _.map(Object.values(predictions), (itemP, key) => {
          return {
            ...itemP,
            name: itemP.name,
            type: 'scatter',
            mode: 'markers+lines',
            marker: { size: 7 },
            line: {color: ColorHash({hash: key, lightness: 0.1})},
            yaxis: 'y2',
            x
          }
        })

        return [
          candles,
          volumes,
          // ...maxMin,
          ...predictions
          // ...medians
        ]
      }
    },
    methods: {
      toggle () {
        this.$refs['plotly'].resizeMethod()
          // this.fullscreen = !this.fullscreen // deprecated
      }
    }
  }
</script>

<style>
.chart-body{
  background-color: #000;
}
</style>
