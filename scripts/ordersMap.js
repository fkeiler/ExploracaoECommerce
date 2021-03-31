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

Promise.all(flowPromises).then(([geoData, customersDataset, ordersDataset]) => {
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

  const mapColorScale = d3.scaleThreshold()
  .domain([0, 100, 1000, 10000, 20000, 50000])
  .range(d3.schemeBlues[8].slice(2))

  // Bars Data
  const initialState = "SP";
  const stateCityDim = facts.dimension(d => [d.dest_state, d.dest_city]);
  const ordersCityGroup = stateCityDim.group();

  const cityStatesOrdersItems = ordersCityGroup.top(Infinity);
  
  const ordersPerCityGroup = filterGroupCities(cityStatesOrdersItems, initialState);
  
  const ordersCitiesScale = d3.scaleOrdinal()
    .domain(cityStatesOrdersItems.flatMap(d => d.key[1]))
  
  // Slice removes the first value of the scale,
  // the first value is not necessary for the vis.
  
  const legendKeys = mapColorScale.range().slice(1);
  const legendLabels = mapColorScale.range().slice(1).map(
    (d) => mapColorScale.invertExtent(d).join(' - ')
  );

  const barChart = dc.barChart('#pedidos-cidades');
  
  // Map
  let mapInstance = L.map('map', {scrollWheelZoom: false}).setView([-15.749997, -47.9499962], 4);
  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
              attribution:  `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
              maxZoom: 18
              }).addTo(mapInstance)
  
  let geoJson;
  
  // Tooltip
  const info = L.control();

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update();
      return this._div;
  };

  info.update = function (props) {
      this._div.innerHTML = '<h4>Número de Pedidos por Estado</h4>' + "Estado: " + (props ?
          '<b>' + props.name + '</b><br />' + ordersPerStateMap.get(props.sigla) + ' Pedidos'
          : 'Passe o mouse pelo estado');
  };

  // Color scheme config
  function style(feature){
      return {
          fillColor: mapColorScale(ordersPerStateMap.get(feature.properties.sigla)),
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '1',
          fillOpacity: 0.8
      };
  }

  // Features
  function highlightFeature(e) {
      let layer = e.target;
  
      layer.setStyle({
          weight: 3,
          color: '#fff',
          dashArray: '',
          fillOpacity: 0.7
      });
  
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
      }
      info.update(layer.feature.properties);
  }

  function resetHighlight(e) {
      geoJson.resetStyle(e.target);
      info.update();

  }
  
  function filterBarsFeature(e) {
      let data = e.target.feature
      
      barChart.group(filterGroupCities(cityStatesOrdersItems, data.properties.sigla));
      barChart.render();
  }    
  
  function onEachFeature(feature, layer) {
      layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: filterBarsFeature
      });
  }

  geoJson = L.geoJson(geoData, {
      style: style,
      onEachFeature: onEachFeature
  }).addTo(mapInstance);
  info.addTo(mapInstance);

  // Legend
  const legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

      let div = L.DomUtil.create('div', 'info legend')

      for (let i = 0; i < legendKeys.length; i++) {
          div.innerHTML +=
              '<i style="background:' + legendKeys[i] + '"></i> ' + legendLabels[i] + "<br/>"
      }

      return div;
  };

  legend.addTo(mapInstance)

  // Bar Chart Config
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
})
