const focusPromises = [
  d3.csv('./data/orders_products_timestamp.csv')
]

const ordersViewsObserver = new IntersectionObserver((entries, observer) => Promise.all(focusPromises).then(
  function ([orderItemsDataset]) {
    // index a group key -> i and i -> key
    function ordinal_to_linear_group (group, sort) {
      let _ord2int, _int2ord
      return {
        all: function () {
          const ret = group.top(Infinity)
          _ord2int = {}
          _int2ord = []
          ret.forEach(function (d, i) {
            _ord2int[d.key] = i
            _int2ord[i] = d.key
          })
          return ret
        },
        ord2int: function (o) {
          if (!_ord2int) { this.all() }
          return _ord2int[o]
        },
        int2ord: function (i) {
          if (!_int2ord) { this.all() }
          return _int2ord[i]
        }
      }
    }

    dc.constants.EVENT_DELAY = 10

    orderItemsDataset.forEach(function (d) {
      d.order_purchase_timestamp = new Date(d.order_purchase_timestamp)
    })

    const cf = crossfilter(orderItemsDataset)

    // ----- Focus Bar Code ----- //
    const dimension = cf.dimension(function (d) { return d.product_category_name })
    let group = dimension.group()

    const size = group.size()

    group = ordinal_to_linear_group(group)

    focus = new dc.BarChart('#focus')
    const linear_domain = [-0.5, size + 0.5]
    focus
      .width(800).height(330)
      .margins({ left: 60, top: 10, right: 20, bottom: 200 })
      .x(d3.scaleLinear().domain(linear_domain))
      .xUnits(dc.units.integers)
      .keyAccessor(d => group.ord2int(d.key))
      .controlsUseVisibility(true)
      .centerBar(true)
      .yAxisLabel('Num. Pedidos')
      .elasticY(true)
      .brushOn(false)
      .dimension(dimension)
      .mouseZoomable(false)
      .zoomScale([4, 8])
      .group(group)
      .title(d => `Pedidos: ${d.value}`)
      .transitionDuration(0)

    focus.xAxis()
      .tickFormat(function (d) { return group.int2ord(d) })

    focus.yAxis()
      .ticks(6, '~s')

    // unfortunately we have to recreate click-selection, since a focus chart
    // ordinarily filters to the visible area (and we don't want a brush either)
    let focusFilter = []
    focus.filterHandler(function () {}) // disable built-in filtering

    focus.applyFilter = function () { // non-standard method
      if (focusFilter.length) {
        this.dimension().filterFunction(function (k) {
          return focusFilter.includes(k)
        })
      } else this.dimension().filter(null)
    }

    focus.filterAll = function () {
      focusFilter = []
      this.applyFilter()
    }

    focus.fadeDeselectedArea = function (brushSelection) {
      const _chart = this
      const bars = _chart.chartBodyG().selectAll('rect.bar')
      if (focusFilter.length) {
        bars.classed(dc.constants.SELECTED_CLASS, function (d) {
          return focusFilter.includes(d.data.key)
        })
        bars.classed(dc.constants.DESELECTED_CLASS, function (d) {
          return !focusFilter.includes(d.data.key)
        })
      } else {
        bars.classed(dc.constants.SELECTED_CLASS, false)
        bars.classed(dc.constants.DESELECTED_CLASS, false)
      }
    }

    focus.on('pretransition', function (chart) {
      chart.selectAll('rect.bar').on('click.ordinal-select', function (d) {
        const i = focusFilter.indexOf(d.data.key)
        if (i >= 0) { focusFilter.splice(i, 1) } else { focusFilter.push(d.data.key) }
        chart.applyFilter()
        chart.redrawGroup()
      })
    })

    focus.on('preRedraw', function (chart) {
      const domain = chart.x().domain()
      const min = Math.ceil(domain[0]); const max = Math.floor(domain[1])
      chart.xAxis().tickValues(d3.range(min, max + 1))
    })

    range = new dc.BarChart('#range')
    range.filterHandler(function () {}) // disable built-in filtering
    range
      .margins({ left: 74, top: 0, right: 20, bottom: 2 })
      .width(1000).height(20)
      .x(d3.scaleLinear().domain(linear_domain))
      .xUnits(dc.units.integers)
      .keyAccessor(d => group.ord2int(d.key))
      .elasticY(true)
      .brushOn(true)
      .dimension(dimension)
      .group(group)
      .transitionDuration(0)

    focus
      .rangeChart(range)

    // ----- Sales over time Line Chart ----- //

    const dateDimension = cf.dimension(d => d3.timeDay(d.order_purchase_timestamp))
    const dateGroup = dateDimension.group()
    const dateScale = d3
      .scaleTime()
      .domain(d3.extent(orderItemsDataset, d => d.order_purchase_timestamp))

    const ymd = d3.timeFormat('%Y-%m-%d')

    const timeChart = dc.lineChart('#sales-over-time')
    timeChart.width(960)
      .height(400)
      .margins({ top: 60, right: 10, bottom: 40, left: 40 })
      .dimension(dateDimension)
      .group(dateGroup)
      .x(dateScale)
      .elasticX(true)
      .brushOn(true)
      .title((d) => `${ymd(d.key)}: ${d.value} pedidos`)

    // ----- Days Heatmap ----- //
    const deliveryDim = cf.dimension(d => [d.order_purchase_timestamp.getDate(), d.order_purchase_timestamp.getMonth() + 1, d.order_purchase_timestamp.getFullYear()])
    const deliveryGroup = deliveryDim.group()

    const filteredDeliveryItems = deliveryGroup.all().filter(d => d.key[2] === 2017)
    const filteredDeliveryGroup = {
      all: function () { return filteredDeliveryItems }
    }

    const binSize = 15
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain(d3.extent(deliveryGroup.all(), d => d.value))

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    const tooltip = d3.select('#tooltip')

    const heatMap = dc.heatMap('#days-heatmap')

    heatMap
      .width(31 * binSize + 400)
      .height(12 * binSize + 200)
      .dimension(deliveryDim)
      .group(filteredDeliveryGroup)
      .keyAccessor(function (d) { return d.key[0] })
      .valueAccessor(function (d) { return d.key[1] })
      .colorAccessor(function (d) { return +d.value })
      .rowsLabel(d => months[d - 1])
      .title(d => '')
      .colors(colorScale)
      .on('pretransition.add-tip', function (chart) {
        chart.selectAll('g.box-group')
          .on('mouseover', (e, d) => {
            tooltip
              .html(`Data: ${d.key[0]}/${d.key[1]}<br/>Pedidos: ${+d.value}`)
              .style('left', e.clientX + 'px')
              .style('top', e.clientY + 'px')
          })
          .on('mouseout', function (event) {
            tooltip
              .style('left', '-100%')
              .style('top', '-100%')
          })
          .on('mousemove', (e, d) => {
            tooltip
              .style('left', `${(e.clientX + 20)}px`)
              .style('top', `${(e.clientY)}px`)
          })
      })
      .on('preRedraw', function (chart) {
        chart.colors(colorScale.domain(d3.extent(heatMap.group().all(), d => d.value)))
      })

    dc.renderAll()
    focus
      .focus([-0.5, 20])
    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })

ordersViewsObserver.observe(document.querySelector('#range-focus'))
ordersViewsObserver.observe(document.querySelector('#days-heatmap'))
ordersViewsObserver.observe(document.querySelector('#sales-over-time'))
