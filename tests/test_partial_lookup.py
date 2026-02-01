import requests

def test_lookup(partial_id):
    url = f"http://localhost:8000/api/orders/{partial_id}"
    print(f"Looking up: {partial_id}...")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print(f"Found Order: {data['id']}")
        else:
            print(f"Not Found (Status {response.status_code})")
    except Exception as e:
        print(f"Error: {e}")

# ID from previous step: ORD-1769868892
test_lookup("ORD-1769868892") # Exact
test_lookup("1769868892")     # Number only
test_lookup("68892")          # Suffix
