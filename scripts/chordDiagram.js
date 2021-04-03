'use strict'

import * as d3 from 'https://esm.run/d3'

d3.text('./data/shipping_chordDiagram.csv').then(
  (chordFile) => {
    const svg = d3.select('#chord-diagram')
      .append('svg')
      .attr('width', 440)
      .attr('height', 440)
      .append('g')
      .attr('transform', 'translate(220,220)')

    const chordData = d3.csvParseRows(chordFile)
    console.log(chordData)

    const res = d3.chord()
      .padAngle(0.05) // padding between entities (black arc)
      .sortSubgroups(d3.descending)(chordData)

    // add the groups on the inner part of the circle
    svg
      .datum(res)
      .append('g')
      .selectAll('g')
      .data(function (d) { return d.groups })
      .enter()
      .append('g')
      .append('path')
      .style('fill', 'grey')
      .style('stroke', 'black')
      .attr('d', d3.arc()
        .innerRadius(200)
        .outerRadius(210)
      )

    // Add the links between groups
    svg
      .datum(res)
      .append('g')
      .selectAll('path')
      .data(function (d) { return d })
      .enter()
      .append('path')
      .attr('d', d3.ribbon()
        .radius(200)
      )
      .style('fill', '#69b3a2')
      .style('stroke', 'black')
  }
)
