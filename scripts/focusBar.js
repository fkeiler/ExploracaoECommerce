const focusPromises = [
  d3.csv('./data/olist_order_items_dataset.csv'),
  d3.csv('./data/olist_products_dataset.csv')
]

const rangeFocusObserver = new IntersectionObserver((entries, observer) => Promise.all(focusPromises).then(
  function ([orderItemsDataset, productsDataset]) {
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

    const categoryLookupMap = new Map(productsDataset.map(d => [d.product_id, d.product_category_name]))

    orderItemsDataset.forEach(function (d) {
      d.category = categoryLookupMap.get(d.product_id)
      return d
    })

    const cf = crossfilter(orderItemsDataset)
    const dimension = cf.dimension(function (d) { return d.category })
    let group = dimension.group()

    const size = group.size()
    group = ordinal_to_linear_group(group)

    focus = new dc.BarChart('#focus')
    const linear_domain = [-0.5, size + 0.5]
    focus
      .width(800).height(330)
      .margins({ left: 60, top: 10, right: 20, bottom: 100 })
      .x(d3.scaleLinear().domain(linear_domain))
      .xUnits(dc.units.integers)
      .keyAccessor(d => group.ord2int(d.key))
      .controlsUseVisibility(true)
      .centerBar(true)
      .yAxisLabel('Num. Pedidos')
      .elasticY(true)
      .brushOn(false)
      .dimension(dimension)
      .mouseZoomable(true)
      .zoomScale([4, 8])
      .group(group)
      .title(d => d.key)
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

    dc.renderAll()
    focus
      .focus([-0.5, 20])

    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
rangeFocusObserver.observe(document.querySelector('#range-focus'))
