import requests

BASE_URL = "http://localhost:8000/api/v1"

# 1. Register a user
print("Registering user...")
res = requests.post(f"{BASE_URL}/auth/register", json={
    "username": "client_test",
    "email": "client@test.com",
    "password": "password123"
})
print("Register:", res.status_code, res.text)

# 2. Login
print("Logging in...")
res = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "client_test",
    "password": "password123"
})
print("Login:", res.status_code, res.text)
if res.status_code != 200:
    exit(1)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Create Product
print("Creating product...")
res = requests.post(f"{BASE_URL}/products/", headers=headers, json={
    "name": "Test Product",
    "sku": "TEST-123",
    "brand": "Brand",
    "category": "Category",
    "price": 100.0,
    "cost": 50.0,
    "stock_quantity": 10
})
print("Create Product:", res.status_code, res.text)

# 4. Create Customer
print("Creating customer...")
res = requests.post(f"{BASE_URL}/customers/", headers=headers, json={
    "name": "Test Customer",
    "phone": "1234567890",
    "email": "cust@test.com",
    "address": "123 Test St"
})
print("Create Customer:", res.status_code, res.text)
