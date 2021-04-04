'use strict'
import * as d3 from 'https://esm.run/d3'

d3.csv('./data/shipping_heatmap.csv').then(
  (shippingDataset) => {
    const margin = {
      top: 10,
      left: 50,
      right: 10,
      bottom: 50
    }
    const tooltip = d3.select('#tooltip')
    const dimMin = Math.min(window.innerWidth, window.innerHeight) * 0.9 // 90vmin
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
      .domain(d3.extent(shippingDataset, d => +d.n_pedidos))
      .interpolator(d3.interpolateBlues)

    svg.selectAll()
      .data(shippingDataset)
      .enter()
      .append('rect')
      .attr('x', d => x(d.demora_real)) // x(d.key[0])) // x = wait
      .attr('y', d => y(d.demora_esperada))// y = expected wait
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', d => colorScale(d.n_pedidos))
      .attr('stroke', '#343434')
      .attr('stroke-width', '0')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-width', 1)
        tooltip.style('left', event.clientX + 'px')
        tooltip.style('top', event.clientY + 'px')

        tooltip.html(
              `Demora esperada: ${d.demora_esperada} dias<br/>
              Demora real: ${d.demora_real} dias<br/>` +
              `<i>(${(d.demora_real === d.demora_esperada
                ? 'No prazo!'
                : (parseInt(d.demora_real) > parseInt(d.demora_esperada)
                    ? `Atrasado em ${d.demora_real - d.demora_esperada} dias`
                    : `Adiantado em ${d.demora_esperada - d.demora_real} dias`))})</i><br/><br/>` +
              `Quantidade de pedidos: ${d.n_pedidos}`
        )
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.clientX + 'px')
        tooltip.style('top', event.clientY + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-width', 0)
        tooltip.style('left', '-100%')
        tooltip.style('top', '-100%')
      })

    svg.append('line')
      .attr('x1', x(0))
      .attr('x2', x(18))
      .attr('y1', y(13))
      .attr('y2', y(31))
      .attr('stroke', 'red')
      .attr('stroke-opacity', '0.5')
      .attr('stroke-width', '3')
      .attr('pointer-events', 'none')

    svg.append('text')
      .attr('x', x(18))
      .attr('y', y(31))
      .text('2 semanas antes do esperado')
      .style('color', 'red')

    svg.append('line')
      .attr('x1', x(0))
      .attr('x2', x(31) + x.bandwidth())
      .attr('y1', y(0) + y.bandwidth())
      .attr('y2', y(31))
      .attr('stroke', 'green')
  })
