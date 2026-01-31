import requests
import json

url = "http://localhost:8000/api/orders"
payload = {
    "userId": "script_test_user",
    "items": [
        {
            "productId": "P1002",
            "quantity": 1
        }
    ]
}

try:
    print("Sending POST request...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("Success!")
    else:
        print("Failed.")
        
except Exception as e:
    print(f"Error: {e}")
