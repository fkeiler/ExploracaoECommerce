const barPromises = [
  d3.csv('./data/olist_order_items_dataset.csv'),
  d3.csv('./data/olist_products_dataset.csv')
]

const barsObserver = new IntersectionObserver((entries, observer) => Promise.all(barPromises).then(
  ([orderItemsDataset, productsDataset]) => {
    const categoryLookupMap = new Map(productsDataset.map(d => [d.product_id, d.product_category_name]))

    orderItemsDataset.forEach(function (d) {
      d.category = categoryLookupMap.get(d.product_id)
      return d
    })

    const orderItemsFacts = crossfilter(orderItemsDataset)
    const orderItemsDim = orderItemsFacts.dimension(d => d.category)
    const orderItemsGroup = orderItemsDim.group()
    const categoryNames = orderItemsGroup.top(5).flatMap(d => d.key)
    const categoryScale = d3.scaleBand().domain(categoryNames)

    const categoriesTop5 = {
      data: orderItemsGroup.top(5),
      all: function () { return this.data }
    }

    const barChart = dc.barChart('#bars')
    barChart
      .width(960)
      .height(480)
      .margins({ top: 50, right: 50, bottom: 50, left: 50 })
      .dimension(orderItemsDim)
      .group(categoriesTop5)
      .x(categoryScale)
      .xUnits(dc.units.ordinal)
      .yAxisLabel('Quantidade de Pedidos')
      .xAxisLabel('Categoria')
      .gap(70)

    dc.renderAll()

    entries.forEach(e => observer.unobserve(e.target))
  }), { threshold: 0.1 })
barsObserver.observe(document.querySelector('#bars'))
