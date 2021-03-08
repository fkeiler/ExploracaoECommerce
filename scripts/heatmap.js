let heatmapPromises = [
    d3.csv("/data/olist_orders_dataset.csv")
]

Promise.all(heatmapPromises).then(ready);

function ready([ordersDataset]){
    ordersDataset = ordersDataset.filter(function(d){
        if(d["order_purchase_timestamp"] != "" && d["order_delivered_customer_date"] != "" && d["order_estimated_delivery_date"] != "")
            return d;
    })
    let dataset_reduzido = 
    ordersDataset.map(function(d){
        let dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");

        let n = {};
        d["order_purchase_timestamp"] = dateParser(d["order_purchase_timestamp"])
        d["order_delivered_customer_date"] = dateParser(d["order_delivered_customer_date"])
        d["order_estimated_delivery_date"] = dateParser(d["order_estimated_delivery_date"])
  
        // Calculate Delivery Time and Estimated Time     
        n["wait"] = Math.floor(getDiferenceInDays(d["order_purchase_timestamp"], d["order_delivered_customer_date"]))
        n["expected_wait"] = Math.floor(getDiferenceInDays(d["order_purchase_timestamp"], d["order_estimated_delivery_date"]))
        
        return n;
    })

    const facts = crossfilter(dataset_reduzido.filter((d) => d["wait"] <= 31 && d["expected_wait"] <= 31));
    const deliveryDim = facts.dimension(d => [d["wait"], d["expected_wait"]]);
    const deliveryGroup = deliveryDim.group();

    let heatMap = dc.heatMap('#heatmap')

    heatMap
        .width(960)
        .height(960)
        .dimension(deliveryDim)
        .group(deliveryGroup)
        .keyAccessor(function(d) { return d.key[0] })
        .valueAccessor(function(d) { return d.key[1] })
        .colorAccessor(function(d) { return +d.value })
        .title((d) => 
`Tempo de entrega real (em dias: ${d.key[0]}
Tempo de entrega estimado (em dias): ${d.key[1]}
Quantidade de pedidos: ${d.value}`)
        .colors(d3.schemeBlues[9])
        .calculateColorDomain();

    heatMap.render();
}