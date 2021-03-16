let sankeyPromises = [
    d3.csv("./data/olist_orders_dataset.csv")
]

Promise.all(sankeyPromises).then(ready);


function ready([ordersDataset]){

    ordersDataset.forEach(function(d){
        let dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");
        d["order_purchase_timestamp"] = dateParser(d["order_purchase_timestamp"])
        d["order_delivered_customer_date"] = dateParser(d["order_delivered_customer_date"])
        d["order_estimated_delivery_date"] = dateParser(d["order_estimated_delivery_date"])
  
        // Calculate Delivery Time and Estimated Time     
        d["order_delivered_time"] = getDiferenceInDays(d["order_purchase_timestamp"], d["order_delivered_customer_date"]);
        d["order_estimated_delivered_time"] = getDiferenceInDays(d["order_purchase_timestamp"], d["order_estimated_delivery_date"]);
        
        if(!d["order_delivered_time"] || !d["order_delivered_time"]){
            d["on_time_delivery"] = "Não Entregue";
        } 
        else if(d["order_delivered_time"] <= d["order_estimated_delivered_time"]) {
            d["on_time_delivery"] = "Entregue no prazo"
        } 
        else {
            d["on_time_delivery"] = "Entregue fora do prazo"
        }
        
        
        return d;
    })

    let ndx = crossfilter(ordersDataset);
    let deliveryDimension = ndx.dimension(d => d.on_time_delivery)
    let deliveryGroup = deliveryDimension.group()

    var pieChart = new dc.PieChart("#pie-delivery-status")

    pieChart
        .width(768)
        .height(480)
        .slicesCap(4)
        .innerRadius(100)
        .externalLabels(30)
        .externalRadiusPadding(50)
        .drawPaths(true)
        .dimension(deliveryDimension)
        .group(deliveryGroup)
        .minAngleForLabel(0)
        .legend(dc.legend());

    pieChart.on('pretransition', function(chart) {
        chart.selectAll('.dc-legend-item text')
                .text('')
            .append('tspan')
                .text(function(d) { return d.name; })
            .append('tspan')
                .attr('x', 200)
                .attr('text-anchor', 'end')
                .text(function(d) { return d.data; });
    });
    pieChart.render();

}

function getDiferenceInDays(initialDate, finalDate){
    if(!initialDate || !finalDate)
        return null;
    let Difference_In_Time = finalDate.getTime() - initialDate.getTime();
    return Difference_In_Time / (1000 * 3600 * 24); 
}