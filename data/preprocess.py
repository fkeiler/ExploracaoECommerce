import csv
from datetime import datetime
from os import path

# Gerar arquivo do heatmap
with open('raw_data/olist_orders_dataset.csv') as orders_file:
    orders_dataset = csv.DictReader(orders_file)
    matrizChegada = [[0 for x in range(32)] for y in range(32)] 
    for row in orders_dataset:
        if(row['order_purchase_timestamp'] != '' and row['order_delivered_customer_date'] != '' and row['order_estimated_delivery_date'] != ''):
            dataSaida = datetime.fromisoformat(row['order_purchase_timestamp'])
            dataChegada = datetime.fromisoformat(row['order_delivered_customer_date'])
            dataPrevisao = datetime.fromisoformat(row['order_estimated_delivery_date'])
            diasParaChegada = (dataChegada - dataSaida).days
            diasParaPrevisao = (dataPrevisao - dataSaida).days
            if diasParaChegada < 31 and diasParaPrevisao < 31:
                matrizChegada[diasParaChegada][diasParaPrevisao] += 1
    orders_file.close()
    
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

    
