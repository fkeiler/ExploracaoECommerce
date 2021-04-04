import csv

# Arquivo do Chord Diagram
siglas_estados = ["SP", "RJ", "MG", "RS"]
mapVendedores = {}
with open('raw_data/olist_sellers_dataset.csv') as sellers_dataset:
    for seller in csv.DictReader(sellers_dataset):
        mapVendedores[seller['seller_id']] = seller['seller_state']

mapPedidos = {}
customerList = []
orderList = []
with open('raw_data/olist_customers_dataset.csv') as customers_dataset:
    for customer in csv.DictReader(customers_dataset):
        customerList.append(customer)
with open('raw_data/olist_orders_dataset.csv') as orders_dataset:
    for order in csv.DictReader(orders_dataset):
        orderList.append(order)
customerList.sort(key=lambda customer: customer['customer_id'])
orderList.sort(key=lambda order: order['customer_id'])

orderIdx = 0
for customer in customerList:
    while orderList[orderIdx]['customer_id'] < customer['customer_id']:
        orderIdx += 1
    while orderIdx < len(orderList) and orderList[orderIdx]['customer_id'] == customer['customer_id']:
        mapPedidos[orderList[orderIdx]['order_id']] = customer['customer_state']
        orderIdx += 1

n_pedidos_estado = [[0 for x in range(5)] for y in range(5)]
with open('raw_data/olist_order_items_dataset.csv') as order_items_dataset:
    for item in csv.DictReader(order_items_dataset):
        if item['order_id'] in mapPedidos and item['seller_id'] in mapVendedores:
            estadoOrigem = mapPedidos[item['order_id']]
            estadoDestino = mapVendedores[item['seller_id']]
            idxOrigem = 4
            idxDestino = 4
            if estadoOrigem in siglas_estados:
                idxOrigem = siglas_estados.index(estadoOrigem)
            if estadoDestino in siglas_estados:
                idxDestino = siglas_estados.index(estadoDestino)
            n_pedidos_estado[idxOrigem][idxDestino] += 1

with open('shipping_chordDiagram.csv', 'w') as chord_file:
    chord_dataset = csv.writer(chord_file)
    chord_dataset.writerows(n_pedidos_estado)