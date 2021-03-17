const heatmapObserver = new IntersectionObserver((entries, observer) => d3.csv('./data/olist_orders_dataset.csv').then(
  (ordersDataset) => {
    function getDiferenceInDays (initialDate, finalDate) {
      if (!initialDate || !finalDate) { return null }
      const DifferenceInTime = finalDate.getTime() - initialDate.getTime()
      return DifferenceInTime / (1000 * 3600 * 24)
    }

    ordersDataset = ordersDataset.filter(
      (d) => (d.order_purchase_timestamp !== '' &&
        d.order_delivered_customer_date !== '' &&
        d.order_estimated_delivery_date !== '')
    )
    const datasetReduzido =
    ordersDataset.map(function (d) {
      const dateParser = d3.timeParse('%Y-%m-%d %H:%M:%S')

      const n = {}
      d.order_purchase_timestamp = dateParser(d.order_purchase_timestamp)
      d.order_delivered_customer_date = dateParser(d.order_delivered_customer_date)
      d.order_estimated_delivery_date = dateParser(d.order_estimated_delivery_date)

      // Calculate Delivery Time and Estimated Time
      n.wait = Math.floor(getDiferenceInDays(d.order_purchase_timestamp, d.order_delivered_customer_date))
      n.expected_wait = Math.floor(getDiferenceInDays(d.order_purchase_timestamp, d.order_estimated_delivery_date))

      return n
    })

    const facts = crossfilter(datasetReduzido.filter((d) => d.wait <= 31 && d.expected_wait <= 31))
    const deliveryDim = facts.dimension(d => [d.wait, d.expected_wait])
    const deliveryGroup = deliveryDim.group()

    const heatMap = dc.heatMap('#heatmap')

    const minimalDimension = Math.min(window.innerHeight, window.innerWidth) * 0.8 // 80vmin
    heatMap
      .width(minimalDimension)
      .height(minimalDimension)
      .dimension(deliveryDim)
      .group(deliveryGroup)
      .keyAccessor(function (d) { return d.key[0] })
      .valueAccessor(function (d) { return d.key[1] })
      .colorAccessor(function (d) { return +d.value })
      .title((d) =>
`Tempo de entrega real (em dias: ${d.key[0]}
Tempo de entrega estimado (em dias): ${d.key[1]}
Quantidade de pedidos: ${d.value}`)
      .colors(d3.schemeBlues[9])
      .calculateColorDomain()

    heatMap.render()

    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
heatmapObserver.observe(document.querySelector('#heatmap'))
