const daysHeatmapPromises = [
  d3.csv('./data/olist_orders_dataset.csv')
]

const daysHeatmapObserver = new IntersectionObserver((entries, observer) => Promise.all(daysHeatmapPromises).then(
  function ([ordersDataset]) {
    ordersDataset = ordersDataset.filter(function (d) {
      return (d.order_purchase_timestamp !== '' &&
            d.order_delivered_customer_date !== '' &&
            d.order_estimated_delivery_date !== '')
    })

    const reducedDataset =
    ordersDataset.map(function (d) {
      const dateParser = d3.timeParse('%Y-%m-%d %H:%M:%S')
      const n = {}
      d.order_purchase_timestamp = dateParser(d.order_purchase_timestamp)
      if (d.order_purchase_timestamp != null && d.order_purchase_timestamp.getFullYear() === 2017) {
        n.order_day = d.order_purchase_timestamp.getDate()
        n.order_month = d.order_purchase_timestamp.getMonth() + 1
        return n
      }
    })

    const facts = crossfilter(reducedDataset.filter(function (d) { return d }))
    const deliveryDim = facts.dimension(d => [d.order_day, d.order_month])
    const deliveryGroup = deliveryDim.group()

    const heatMap = dc.heatMap('#days-heatmap')

    const binSize = 15
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain(d3.extent(deliveryGroup.all().flatMap(d => d.value)))

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    let tooltip = d3.select("#days-heatmap")
      .append("div")
      .style("display", "none")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px");
    
    heatMap
      .width(31 * binSize + 400)
      .height(12 * binSize + 200)
      .dimension(deliveryDim)
      .group(deliveryGroup)
      .keyAccessor(function (d) { return d.key[0] })
      .valueAccessor(function (d) { return d.key[1] })
      .colorAccessor(function (d) { return +d.value })
      .rowsLabel(d => months[d-1])
      .title(d => "")
      .colors(colorScale)
      .on('pretransition.add-tip', function(chart) {
        chart.selectAll('g.box-group')
            .on('mouseover', d => tooltip.style("display", "block"))
            .on('mouseout', d => tooltip.style("display", "none"))
            .on("mousemove", (e, d) => {
              tooltip
                .html(`Data: ${d.key[0]}/${d.key[1]}<br/>Pedidos: ${+d.value}`)
                .style("left", `${(e.layerX+20)}px`)
                .style("top", `${(e.layerY)}px`)
            })
      });

    heatMap.render();

    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
daysHeatmapObserver.observe(document.querySelector('#days-heatmap'))
