let daysHeatmapPromises = [
    d3.csv("./data/olist_orders_dataset.csv")
]

Promise.all(daysHeatmapPromises).then(ready);

function ready([ordersDataset]){
    ordersDataset = ordersDataset.filter(function(d){
        if(d["order_purchase_timestamp"] != "" 
            && d["order_delivered_customer_date"] != "" 
            && d["order_estimated_delivery_date"] != "")
            return d;
    })

    let reducedDataset = 
    ordersDataset.map(function(d){
        let dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let n = {}
        d["order_purchase_timestamp"] = dateParser(d["order_purchase_timestamp"])
        if(d["order_purchase_timestamp"].getFullYear() == 2017){
            n["order_day"] = d["order_purchase_timestamp"].getDate()
            n["order_month"] = d["order_purchase_timestamp"].getMonth() + 1
            return n;
        }
    })

    const facts = crossfilter(reducedDataset.filter(function(d){return d;}));
    const deliveryDim = facts.dimension(d => [d["order_day"], d["order_month"]]);
    const deliveryGroup = deliveryDim.group();

    let heatMap = dc.heatMap('#days-heatmap')
    let domain = deliveryGroup.all().flatMap(d => +d.value);
    const binSize = 15;
    heatMap
        .width(31 * binSize + 400)
        .height(12 * binSize + 200)
        .dimension(deliveryDim)
        .group(deliveryGroup)
        .keyAccessor(function(d) { return d.key[0] })
        .valueAccessor(function(d) { return d.key[1] })
        .colorAccessor(function(d) { return +d.value })
        .title(d => `${d.key[0]}/${d.key[1]}\nPedidos: ${d.value}`)
        .colors(d3.scaleQuantile().domain(domain).range(d3.schemeBlues[8]))

    heatMap.render();
}