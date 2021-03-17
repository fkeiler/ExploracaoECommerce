const flowPromises = [
  d3.json('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'),
  d3.csv('./data/olist_customers_dataset.csv'),
  d3.csv('./data/olist_orders_dataset.csv', [['order_id', 'customer_id']])
]

const mapObserver = new IntersectionObserver((entries, observer) => Promise.all(flowPromises).then(
  ([geoData, customersDataset, ordersDataset]) => {
    const customersState = new Map(customersDataset.map(d => [d.customer_id, d.customer_state]))
    ordersDataset.forEach(function (d) {
      d.dest_state = customersState.get(d.customer_id)
    })

    const facts = crossfilter(ordersDataset)
    const statesDim = facts.dimension(d => d.dest_state)
    const ordersGroup = statesDim.group().all()

    const ordersPerStateMap = new Map(ordersGroup.map(d => [d.key, d.value]))

    const colorScale = d3.scaleQuantile()
      .domain(ordersGroup.flatMap(d => d.value))
      .range(d3.schemeBlues[6].slice(2))

    const svg = d3.select('#map')
      .attr('width', 600)
      .attr('height', 480)
    const width = +svg.attr('width')
    const height = +svg.attr('height')

    // Map and projection
    const projection = d3.geoMercator()
      .scale(4 * width / 1.3 / Math.PI)
      .translate([3 * width / 2, height / 8])

    // Draw the map
    svg.append('g')
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('fill', d => colorScale(ordersPerStateMap.get(d.properties.sigla)))
      .attr('d', d3.geoPath()
        .projection(projection)
      )
      .style('stroke', '#fff')
      .on('mouseover', function (d) {
        d3.select(this)
          .style('cursor', 'pointer')
          .attr('stroke-width', 2)
      })
      .on('mouseout', function (d) {
        d3.select(this)
          .style('cursor', 'default')
          .attr('stroke-width', 'none')
      })
      .append('title')
      .text(d => `Nome: ${d.properties.name}\nPedidos: ${ordersPerStateMap.get(d.properties.sigla)}`)

      entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
mapObserver.observe(document.querySelector('#map'))
