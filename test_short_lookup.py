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

test_lookup("99")
test_lookup("O0099")
