import csv
from datetime import datetime

map_customer_state = {}
with open('raw_data/olist_customers_dataset.csv') as customers_dataset:
    for customer in csv.DictReader(customers_dataset):
        map_customer_state[customer['customer_id']] = customer['customer_state']

map_state_shipping = {}
with open('raw_data/olist_orders_dataset.csv') as orders_dataset:
    for order in csv.DictReader(orders_dataset):
        if order['order_purchase_timestamp'] != '' and order['order_delivered_customer_date'] != '' and order['order_estimated_delivery_date'] != '':
            state = map_customer_state[order['customer_id']]
            prazoEstimado = datetime.fromisoformat(order['order_estimated_delivery_date']) - datetime.fromisoformat(order['order_purchase_timestamp'])
            prazoReal = datetime.fromisoformat(order['order_delivered_customer_date']) - datetime.fromisoformat(order['order_purchase_timestamp'])
            if state in map_state_shipping.keys():
                map_state_shipping[state]['n de pedidos'] += 1
                map_state_shipping[state]['total estimado'] += prazoEstimado.days
                map_state_shipping[state]['total real'] += prazoReal.days
            else:
                map_state_shipping[state] = {
                    'n de pedidos': 1,
                    'total estimado': prazoEstimado.days,
                    'total real': prazoReal.days
                }

with open('shipping_dotplot.csv', 'w') as dotplot_file:
    dotplot_dataset = csv.DictWriter(dotplot_file, ['state', 'avg estimated delivery', 'avg real delivery'])
    dotplot_dataset.writeheader()
    for state, value in map_state_shipping.items():
        dotplot_dataset.writerow({
            'state': state,
            'avg estimated delivery': value['total estimado'] / value['n de pedidos'],
            'avg real delivery': value['total real'] / value['n de pedidos']
        })