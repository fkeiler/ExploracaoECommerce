d3.csv("/data/olist_orders_dataset.csv").then(function(dataset_orders){
    dataset_orders.forEach((d) => { 
        d.order_purchase_timestamp = new Date(d.order_purchase_timestamp)
        d.order_approved_at = new Date(d.order_approved_at)
        d.order_delivered_carrier_date = new Date(d.order_delivered_carrier_date)
        d.order_delivered_customer_date = new Date(d.order_delivered_customer_date)
        d.order_estimated_delivery_date = new Date(d.order_estimated_delivery_date)
    })

    const facts_orders = crossfilter(dataset_orders)
    const dateDimension = facts_orders.dimension(d => d3.timeDay(d.order_purchase_timestamp))
    const dateScale = d3
        .scaleTime()
        .domain(d3.extent(dataset_orders, d => d.order_purchase_timestamp))

    const ymd = d3.timeFormat('%Y-%m-%d')

    const timeChart = dc.lineChart(document.querySelector('#sales-over-time'))
    timeChart.width(960)
            .height(400)
            .margins({top: 60, right: 10, bottom: 40, left: 40})
            .dimension(dateDimension)
            .group(dateDimension.group())
            .x(dateScale)
            .brushOn(false)
            .title((d) =>  `${ymd(d.key)}: ${d.value} pedidos`)

    timeChart.render()
})