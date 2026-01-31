import requests
import json

url = "http://localhost:8000/api/orders"
payload = {
    "userId": "seq_test_user",
    "items": [
        {
            "productId": "P1002",
            "quantity": 1
        }
    ]
}

print("Creating new order...")
response = requests.post(url, json=payload)
if response.status_code == 200:
    data = response.json()
    print(f"Created Order ID: {data['id']}")
else:
    print(f"Failed: {response.text}")
