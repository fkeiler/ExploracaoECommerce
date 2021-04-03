const dotPlotDemoraObserver = new IntersectionObserver((entries, observer) =>
  Promise.all([
    d3.csv('./data/raw_data/olist_orders_dataset.csv'),
    d3.csv('./data/raw_data/olist_customers_dataset.csv')
  ]).then(function ([datasetOrders, datasetCustomers]) {
    const stateLookupMap = new Map(datasetCustomers.map(c => [c.customer_id, c.customer_state]))
    return [datasetOrders, stateLookupMap]
  }).then(([datasetOrders, stateLookupMap]) => {
    const getDifferenceInDays = (dInicial, dFinal) => (dFinal.getTime() - dInicial.getTime()) / 86400000
    datasetOrders.forEach((d) => {
      d.order_purchase_timestamp = new Date(d.order_purchase_timestamp)
      d.order_delivered_customer_date = new Date(d.order_delivered_customer_date)
      d.order_estimated_delivery_date = new Date(d.order_estimated_delivery_date)

      d.demora_real = getDifferenceInDays(d.order_purchase_timestamp, d.order_delivered_customer_date)
      d.demora_estimada = getDifferenceInDays(d.order_purchase_timestamp, d.order_estimated_delivery_date)
      d.estado = stateLookupMap.get(d.customer_id)
    })

    const datasetReduzido =
  d3.rollup(
    datasetOrders,
    v => {
      return {
        demora_real: d3.mean(v, d => d.demora_real),
        demora_estimada: d3.mean(v, d => d.demora_estimada)
      }
    },
    d => d.estado
  )
    return datasetReduzido
  }).then(function (datasetReduzido) {
    const margin = { top: 10, bottom: 30, left: 30, right: 10 }
    const height = window.innerHeight * 0.8
    const width = Math.min(height, window.innerWidth)

    const svg = d3.select('#dot-plot-demora')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const maxDias = d3.max(datasetReduzido, (d) => Math.max(d[1].demora_real, d[1].demora_estimada))
    const xScale = d3.scaleLinear()
      .domain(
        [0,
          maxDias])
      .range([0, width])
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))

    const yScale = d3.scaleBand()
      .domain(datasetReduzido.keys())
      .range([0, height])
      .padding(1)
    svg.append('g')
      .call(d3.axisLeft(yScale))

    // Linha guia
    svg.selectAll('guide-lines')
      .data(datasetReduzido, (key, value) => [key, value])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d[0]))
      .attr('y2', d => yScale(d[0]))
      .attr('stroke', 'grey')
      .attr('stroke-dasharray', [10, 10])
      .attr('stroke-width', '1px')

    // Linha normal
    svg.selectAll('myline')
      .data(datasetReduzido, (key, value) => [key, value])
      .enter()
      .append('line')
      .attr('x1', d => xScale(d[1].demora_estimada))
      .attr('x2', d => xScale(d[1].demora_real))
      .attr('y1', d => yScale(d[0]))
      .attr('y2', d => yScale(d[0]))
      .attr('stroke', 'grey')
      .attr('stroke-width', '1.5px')

    svg.selectAll('mycircle')
      .data(datasetReduzido)
      .enter()
      .append('circle')
      .attr('cx', function (d) { return xScale(d[1].demora_estimada) })
      .attr('cy', function (d) { return yScale(d[0]) })
      .attr('r', '6')
      .style('fill', '#69b3a2')

    svg.selectAll('mycircle')
      .data(datasetReduzido)
      .enter()
      .append('circle')
      .attr('cx', function (d) { return xScale(d[1].demora_real) })
      .attr('cy', function (d) { return yScale(d[0]) })
      .attr('r', '6')
      .style('fill', '#')

    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
dotPlotDemoraObserver.observe(document.querySelector('#dot-plot-demora'))
