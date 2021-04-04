import csv
from datetime import datetime

matrizChegada = [[0 for x in range(32)] for y in range(32)] 
with open('raw_data/olist_orders_dataset.csv') as orders_dataset:
    for order in csv.DictReader(orders_dataset):
        if order['order_purchase_timestamp'] != '' and order['order_delivered_customer_date'] != '' and order['order_estimated_delivery_date'] != '':
                dataSaida = datetime.fromisoformat(order['order_purchase_timestamp'])
                dataChegada = datetime.fromisoformat(order['order_delivered_customer_date'])
                dataPrevisao = datetime.fromisoformat(order['order_estimated_delivery_date'])
                diasParaChegada = (dataChegada - dataSaida).days
                diasParaPrevisao = (dataPrevisao - dataSaida).days
                if diasParaChegada <= 31 and diasParaPrevisao <= 31:
                    matrizChegada[diasParaChegada][diasParaPrevisao] += 1
    
    
with open('shipping_heatmap.csv', 'w') as heatmap_file:
    heatmap_dataset = csv.DictWriter(heatmap_file, fieldnames=['demora_esperada', 'demora_real', 'n_pedidos'])
    heatmap_dataset.writeheader()
    for e in range(32):
        for r in range(32):
            heatmap_dataset.writerow({
                'demora_esperada': e,
                'demora_real': r,
                'n_pedidos': matrizChegada[r][e]
            })
    heatmap_file.close()
