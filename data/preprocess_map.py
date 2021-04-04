import csv

customer_list = []
order_list = []
with open('raw_data/olist_customers_dataset.csv') as customers_dataset:
    for customer in csv.DictReader(customers_dataset):
        customer_list.append(customer)

with open('raw_data/olist_orders_dataset.csv') as orders_dataset:
    for order in csv.DictReader(orders_dataset):
        order_list.append(order)

customer_list.sort(key = lambda c : c['customer_id'])
order_list.sort(key = lambda o : o['customer_id'])

mapa_cidade_pedidos = {}

order_idx = 0
for customer in customer_list:
    while order_list[order_idx]['customer_id'] < customer['customer_id']:
        order_idx += 1
    while order_idx < len(order_list) and order_list[order_idx]['customer_id'] == customer['customer_id']:
        local = customer['customer_city'] + ',' + customer['customer_state']
        if local in mapa_cidade_pedidos:
            mapa_cidade_pedidos[local] += 1
        else:
            mapa_cidade_pedidos[local] = 1
        order_idx += 1

with open('order_map.csv', 'w') as map_file:
    map_dataset = csv.DictWriter(map_file, ['estado', 'cidade', 'n_pedidos'])
    map_dataset.writeheader()
    for key, value in mapa_cidade_pedidos.items():
        map_dataset.writerow({
            'estado': key.split(',')[1], 
            'cidade': key.split(',')[0], 
            'n_pedidos': value
        })