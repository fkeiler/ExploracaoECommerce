import pandas as pd
import numpy as np
from os import path
from datetime import datetime

df_orders = pd.read_csv("./raw_data/olist_orders_dataset.csv", usecols=['order_id', 'order_purchase_timestamp'])
df_orders_items = pd.read_csv("./raw_data/olist_order_items_dataset.csv", usecols=['order_id', 'product_id', 'price'])
df_products = pd.read_csv("./raw_data/olist_products_dataset.csv", usecols=['product_id', 'product_category_name'])

merge = pd.merge(df_orders, df_orders_items, on="order_id")
merge = pd.merge(merge, df_products, on="product_id")

merge.to_csv("orders_products_timestamp.csv", index=False)
