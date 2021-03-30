const heatmapObserver = new IntersectionObserver(
  (entries, observer) => {
    d3.csv('./data/olist_orders_dataset.csv').then(
      (ordersDataset) => {
        function getDiferenceInDays (initialDate, finalDate) {
          if (!initialDate || !finalDate) { return null }
          const DifferenceInTime = finalDate.getTime() - initialDate.getTime()
          return Math.floor(DifferenceInTime / (1000 * 3600 * 24))
        }

        ordersDataset = ordersDataset.filter(d => d.order_status === 'delivered')
        const heatmapData = new Map()
        for (let i = 0; i <= 31; i++) {
          for (let j = 0; j <= 31; j++) {
            heatmapData.set(`${i}, ${j}`, 0) // Tem que usar o stringify porque [0, 1] != [0, 1]
          }
        }
        ordersDataset.forEach((d) => {
          const dateParser = d3.timeParse('%Y-%m-%d %H:%M:%S')

          d.order_purchase_timestamp = dateParser(d.order_purchase_timestamp)
          d.order_delivered_customer_date = dateParser(d.order_delivered_customer_date)
          d.order_estimated_delivery_date = dateParser(d.order_estimated_delivery_date)

          // Calculate Delivery Time and Estimated Time
          const wait = getDiferenceInDays(d.order_purchase_timestamp, d.order_delivered_customer_date)
          const expectedWait = getDiferenceInDays(d.order_purchase_timestamp, d.order_estimated_delivery_date)

          if (wait != null && expectedWait != null && wait <= 31 && expectedWait <= 31) { heatmapData.set(`${wait}, ${expectedWait}`, heatmapData.get(`${wait}, ${expectedWait}`) + 1) }
        })
        return heatmapData
      }).then(
      (heatmapData) => {
        const margin = {
          top: 10,
          left: 50,
          right: 10,
          bottom: 50
        }
        const dimMin = Math.min(window.innerWidth, window.innerHeight) * 0.8 // 80vmin
        const width = dimMin - margin.left - margin.right
        const height = dimMin - margin.top - margin.bottom
        const svg = d3.select('#heatmap')
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`)

        const x = d3.scaleBand() // Escala x: demora real em dias
          .range([0, width])
          .domain([...Array(32).keys()])
          .padding(0.05)
        svg.append('g')
          .attr('transform', `translate(0, ${height})`)
          .call(d3.axisBottom(x).tickSize(0))
        svg.append('text')
          .attr('transform',
          `translate(${width / 2} , ${height + margin.top + 20} )`)
          .style('text-anchor', 'middle')
          .text('Demora real (em dias)')

        const y = d3.scaleBand() // Escala y: demora esperada em dias
          .range([height, 0])
          .domain([...Array(32).keys()])
          .padding(0.05)
        svg.append('g')
          .call(d3.axisLeft(y).tickSize(0))
        svg.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 0 - margin.left)
          .attr('x', 0 - (height / 2))
          .attr('dy', '1em')
          .attr('text-anchor', 'middle')
          .text('Demora esperada (em dias)')

        const colorScale = d3.scaleSequential()
          .interpolator(d3.interpolateBlues)
          .domain(d3.extent(heatmapData.values()))

        svg.selectAll()
          .data(heatmapData.entries())
          .enter()
          .append('rect')
          .attr('x', d => x(d[0].toString().split(', ')[0])) // x(d.key[0])) // x = wait
          .attr('y', d => y(d[0].toString().split(', ')[1]))// y = expected wait
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .style('fill', d => colorScale(d[1]))
      })

    entries.forEach(e => observer.unobserve(e.target))
  }, { threshold: 0.1 })
heatmapObserver.observe(document.querySelector('#heatmap'))
