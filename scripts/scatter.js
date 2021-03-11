let scatterPromises = [
    d3.csv("./data/olist_orders_dataset.csv")
]

Promise.all(scatterPromises).then(ready);

const LIMIT_DATA = 1000;

function ready([ordersDataset]){
    ordersDataset = ordersDataset.filter(function(d){
        if(d["order_purchase_timestamp"] != "" && d["order_delivered_customer_date"] != "" && d["order_estimated_delivery_date"] != "")
            return d;
    })
    ordersDataset.forEach(function(d){
        let dateParser = d3.timeParse("%Y-%m-%d %H:%M:%S");
        d["order_purchase_timestamp"] = dateParser(d["order_purchase_timestamp"])
        d["order_delivered_customer_date"] = dateParser(d["order_delivered_customer_date"])
        d["order_estimated_delivery_date"] = dateParser(d["order_estimated_delivery_date"])
  
        // Calculate Delivery Time and Estimated Time     
        d["order_delivered_time"] = getDiferenceInDays(d["order_purchase_timestamp"], d["order_delivered_customer_date"]);
        d["order_estimated_delivered_time"] = getDiferenceInDays(d["order_purchase_timestamp"], d["order_estimated_delivery_date"]);
        d["on_time_delivery"] = d["order_delivered_time"] <= d["order_estimated_delivered_time"];
        return d;
    })

    if(LIMIT_DATA !== -1){
        ordersDataset = ordersDataset.filter(function(d, i){
            if(i < LIMIT_DATA) return d;
        })
    }

    

    const facts = crossfilter(ordersDataset);

    const deliveryDim = facts.dimension(d => [d["order_delivered_time"], d["order_estimated_delivered_time"]]);
    const deliveryGroup = deliveryDim.group();
    const delivryScale = d3
        .scaleLinear()
        .domain(d3.extent(ordersDataset.flatMap(d => d.order_delivered_time)))
    
    let scatterPlot = dc.scatterPlot("#scatter");
    let height = 480;
    scatterPlot
        .width(960)
        .height(height)
        .margins({top: 50, right: 50, bottom: 50, left: 50})
        .dimension(deliveryDim)
        .group(deliveryGroup)
        .x(delivryScale)
        .yAxisLabel("Tempo de Entrega Estimado")
        .xAxisLabel("Tempo de Entrega Registrado")
        .on("renderlet", function(chart){
            let chartData = [{x: chart.x().range()[0], y: chart.y().range()[0]}, {x: chart.x().range()[1], y: chart.y().range()[1]},];

            let line = d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveLinear)
            let chartBody = chart.select('g.chart-body');
            let path = chartBody.selectAll('path.extra').data([chartData]);
            path = path
            .enter()
                .append('path')
                .attr('class', 'extra')
                .attr('stroke', 'red')
                .attr('id', 'extra-line')
            .merge(path);
            path.attr('d', line); 
        })
    dc.renderAll();
}

function getDiferenceInDays(initialDate, finalDate){
    let Difference_In_Time = finalDate.getTime() - initialDate.getTime();
    return Difference_In_Time / (1000 * 3600 * 24); 
}