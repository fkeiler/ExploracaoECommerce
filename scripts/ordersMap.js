const flowPromises = [
  d3.json('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'),
  d3.csv('./data/olist_customers_dataset.csv'),
  d3.csv('./data/olist_orders_dataset.csv', [['order_id', 'customer_id']])
]
    
function filterGroupCities(items, state){
  return {
    all: function () {
      return items.filter(d => d.key[0] === state).slice(0, 5)
    }
  }
}

const mapObserver = new IntersectionObserver((entries, observer) => Promise.all(flowPromises).then(
  ([geoData, customersDataset, ordersDataset]) => {
    const customersState = new Map(customersDataset.map(d => [d.customer_id, [d.customer_state, d.customer_city]]))

    ordersDataset.forEach(function (d) {
      let data = customersState.get(d.customer_id);
      d["dest_state"] = data[0]
      d["dest_city"] = data[1] 
    })


    const facts = crossfilter(ordersDataset);
    
    // Map Data
    const statesDim = facts.dimension(d => d.dest_state);
    const ordersGroup = statesDim.group();
    const ordersGroupItems = ordersGroup.all();
    
    const ordersPerStateMap = new Map(ordersGroupItems.map(d => [d.key, d.value]))
    
    const mapColorScale = d3.scaleQuantile()
      .domain(ordersGroupItems.flatMap(d => d.value))
      .range(d3.schemeBlues[6].slice(2))
    
    // Bars Data
    const initialState = "SP";
    const stateCityDim = facts.dimension(d => [d.dest_state, d.dest_city]);
    const ordersCityGroup = stateCityDim.group();
    

    const cityStatesOrdersItems = ordersCityGroup.top(Infinity);
    
    const ordersPerCityGroup = filterGroupCities(cityStatesOrdersItems, initialState);
    
    const ordersCitiesScale = d3.scaleOrdinal()
      .domain(cityStatesOrdersItems.flatMap(d => d.key[1]))
    
    const barChart = dc.barChart('#pedidos-cidades');
    
    //  ----     Map      -----
    const svg = d3.select('#map')
      .attr('width', 600)
      .attr('height', 480)
      .attr('viewbox', '0 0 100 100')
    const width = +svg.attr('width')
    const height = +svg.attr('height')

    // Map and projection
    const projection = d3.geoMercator()
      .scale(4 * width / 1.3 / Math.PI)
      .translate([3 * width / 2, height / 8])

    // Legend
    const legend = d3.select("#map").append("g")
    const legendKeys = mapColorScale.range();
    const boxSize = 20;
    const legendLabels = mapColorScale.range().map((d) => mapColorScale.invertExtent(d).join(' - '));
    const offsetX = 10;
    const offsetY = 300;

    legend
      .append("text")
        .text("Legenda")
        .style("font-family", "Roboto")
        .style("font-size", 16)
        .attr("x", offsetX)
        .attr("y", offsetY - 10)    
    
    legend.selectAll("box-colors")
      .data(legendKeys)
      .enter()
      .append("rect")
        .attr("x", offsetX)
        .attr("y", (d, i) => (offsetY + i*(boxSize + 5)) + "px")
        .attr("width", boxSize)
        .attr("height", boxSize)
        .style("fill", d => d)
    
    legend.selectAll("box-labels")
      .data(legendLabels)
      .enter()
      .append("text")
        .attr("x", offsetX + boxSize + 5)
        .attr("y", (d, i) => (offsetY + i*(boxSize + 5) + boxSize/2 + 5) + "px")
        .text(d => d)
        .style("alignment-baseline", "middle")
        .style("font-family", "Roboto")
        .style("font-size", 12)
    
    // Tooltip
    const tooltip = d3.select("#pedidos-estado")
      .append("div")
      .style("opacity", 0)
      .style("position", "absolute")
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")

    // Draw the map
    svg.append('g')
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('fill', d => mapColorScale(ordersPerStateMap.get(d.properties.sigla)))
      .attr('d', d3.geoPath()
        .projection(projection)
      )
      .style('stroke', '#fff')
      .on('mouseover', function (d, data) { // show tooltip
        d3.select(this)
          .style('cursor', 'pointer')
          .attr('stroke-width', 2)
        tooltip
          .style("opacity", 1)
      })
      .on('mouseout', function (d) { // hide tooltip
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style('cursor', 'default')
          .attr('stroke-width', 'none')
      })
      .on("mousemove", function(d, data){ // Bind tooltip to data
        tooltip
        .html(`Estado:${data.properties.sigla}<br>Quantidade de Pedidos: ${ordersPerStateMap.get(data.properties.sigla)}`)
        .style("left", (d.layerX + 20) + "px")
        .style("top", (d.layerY) + "px")
      })
      .on("click", function(d, data){ // Filter Bars group and redraw
        barChart.group(filterGroupCities(cityStatesOrdersItems, data.properties.sigla));
        barChart.render();
      })

      barChart
        .width(960)
        .height(480)
        .margins({ top: 50, right: 50, bottom: 50, left: 50 })
        .dimension(stateCityDim)
        .group(ordersPerCityGroup)
        .keyAccessor(d => d.key[1])
        .x(ordersCitiesScale)
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .elasticY(true)
        .ordering(d => -d.value)
        .yAxisLabel('Quantidade de Pedidos')
        .xAxisLabel('Cidades')
      
      barChart.render();
      entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })


mapObserver.observe(document.querySelector('#map'))
