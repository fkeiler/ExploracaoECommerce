'use strict'

d3.csv('./data/shipping_dotplot.csv').then(
  function (datasetDotplot) {
    const margin = { top: 10, bottom: 30, left: 30, right: 10 }
    const height = window.innerHeight * 0.8
    const width = Math.min(height, window.innerWidth)

    const svg = d3.select('#dot-plot-demora')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const maxDias = d3.max(datasetDotplot, d => Math.max(d['avg estimated delivery'], d['avg real delivery']))
    const xScale = d3.scaleLinear()
      .domain([0, maxDias])
      .range([0, width])
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))

    const yScale = d3.scaleBand()
      .domain(datasetDotplot.map(d => d.state))
      .range([0, height])
      .padding(1)
    svg.append('g')
      .call(d3.axisLeft(yScale))

    // Linha guia
    svg.selectAll('guide-lines')
      .data(datasetDotplot)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d.state))
      .attr('y2', d => yScale(d.state))
      .attr('stroke', 'rgba(0, 0, 0, 0.2)')
      .attr('stroke-dasharray', [1, 1])
      .attr('stroke-width', '0.5px')

    // Linha normal
    svg.selectAll('myline')
      .data(datasetDotplot)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d['avg estimated delivery']))
      .attr('x2', d => xScale(d['avg real delivery']))
      .attr('y1', d => yScale(d.state))
      .attr('y2', d => yScale(d.state))
      .attr('stroke', 'grey')
      .attr('stroke-width', '1.5px')

    svg.selectAll('mycircle')
      .data(datasetDotplot)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d['avg estimated delivery']))
      .attr('cy', d => yScale(d.state))
      .attr('r', '6')
      .style('fill', 'rgb(138, 191, 221)')

    svg.selectAll('mycircle')
      .data(datasetDotplot)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d['avg real delivery']))
      .attr('cy', d => yScale(d.state))
      .attr('r', '6')
      .style('fill', 'rgb(8, 48, 107)')
  })
