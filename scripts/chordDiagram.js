'use strict'

import * as d3 from 'https://esm.run/d3'

d3.text('./data/shipping_chordDiagram.csv').then(
  (chordFile) => {
    const estados = ['SP', 'RJ', 'MG', 'RS', 'Outros']
    const colors = d3.schemeSpectral[5]

    const size = Math.min(window.innerHeight, window.innerWidth) * 0.9

    const svg = d3.select('#chord-diagram')
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`)

    const tooltip = d3.select('#tooltip')

    const chordData = d3.csvParseRows(chordFile)

    const res = d3.chord()
      .padAngle(0.05) // padding between entities (black arc)
      .sortSubgroups(d3.descending)(chordData)

    // Add the links between groups
    svg
      .datum(res)
      .append('g')
      .selectAll('path')
      .data(d => d)
      .enter()
      .append('path')
      .attr('d', d3.ribbon()
        .radius(size * 0.47)
      )
      .style('fill', d => colors[d.source.index])
      .style('fill-opacity', '0.5')
      .on('mouseenter', function (event, d) {
        d3.select(this).style('fill-opacity', '1')
        tooltip
          .style('left', event.clientX)
          .style('top', event.clientY)
          .html(function () {
            const origem = estados[d.source.index]
            const destino = estados[d.target.index]
            return `${origem} ➡️ ${destino} : ${d.source.value} pedidos` +
             (origem !== destino ? `</br>${destino} ➡️ ${origem}: ${d.target.value} pedidos` : '')
          })
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', event.clientX)
          .style('top', event.clientY)
      })
      .on('mouseleave', function () {
        d3.select(this).style('fill-opacity', '0.5')
        tooltip.style('left', '-100%')
        tooltip.style('top', '-100%')
      })

    // this group object use each group of the data.groups object
    const group = svg
      .datum(res)
      .append('g')
      .selectAll('g')
      .data(function (d) { return d.groups })
      .enter()

    // add the group arcs on the outer part of the circle
    group.append('g')
      .append('path')
      .style('fill', d => colors[d.index])
      .attr('id', d => 'chord_' + d.index)
      .attr('d', d3.arc()
        .innerRadius(size * 0.47)
        .outerRadius(size * 0.45)
      )

    group.append('svg:text')
      .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2 })
      .attr('dy', '-0.25em')
      .attr('class', 'titles')
      .append('textPath')
      .attr('xlink:href', d => '#chord_' + d.index)
      .style('text-anchor', 'middle')
      .attr('startOffset', '25%')
      .text(function (d, i) { return estados[i] })
  }
)
