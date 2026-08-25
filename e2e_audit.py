import requests
import io
import time
from PIL import Image

BASE_URL = "http://localhost:8000/api/v1"

def test_e2e_workflow():
    print("=== STARTING E2E WORKFLOW AUDIT ===")

    # ----------------------------------------------------
    # 1. SuperAdmin Workflow
    # ----------------------------------------------------
    print("\n--- 1. SuperAdmin Workflow ---")
    
    # Login as SuperAdmin
    print("Logging in as SuperAdmin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "admin",
        "password": "admin123"
    })
    assert login_res.status_code == 200, f"SuperAdmin Login failed: {login_res.text}"
    sa_token = login_res.json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}
    print("✓ SuperAdmin logged in successfully.")

    # Fetch tenants
    print("Fetching existing tenants...")
    tenants_res = requests.get(f"{BASE_URL}/tenants/", headers=sa_headers)
    assert tenants_res.status_code == 200, f"Fetch tenants failed: {tenants_res.text}"
    print(f"✓ Found {len(tenants_res.json())} tenants.")

    # Create new Tenant with Admin
    tenant_name = f"Test Tenant {int(time.time())}"
    admin_username = f"admin_{int(time.time())}"
    admin_email = f"{admin_username}@tenant.com"
    print(f"Creating new tenant '{tenant_name}' with admin '{admin_username}'...")
    create_tenant_res = requests.post(f"{BASE_URL}/tenants/", headers=sa_headers, json={
        "name": tenant_name,
        "admin_username": admin_username,
        "admin_email": admin_email
    })
    assert create_tenant_res.status_code == 201, f"Create tenant failed: {create_tenant_res.text}"
    tenant_data = create_tenant_res.json()
    tenant_id = tenant_data["id"]
    print(f"✓ Tenant created successfully with ID: {tenant_id}")
    
    # Verify user was created with password setup pending
    assert len(tenant_data["users"]) == 1, "Admin user should be automatically associated with the tenant"
    admin_user = tenant_data["users"][0]
    assert admin_user["username"] == admin_username
    assert admin_user["email"] == admin_email
    assert admin_user["is_password_configured"] is False, "Password should not be set yet"
    print("✓ Verified admin user exists and is_password_configured is False.")

    # Set password for the new admin (First-time Password Configuration)
    admin_password = "password123"
    print(f"Setting initial password for tenant admin '{admin_username}'...")
    set_password_res = requests.post(f"{BASE_URL}/auth/set-password", json={
        "username_or_email": admin_username,
        "password": admin_password
    })
    assert set_password_res.status_code == 200, f"Password setup failed: {set_password_res.text}"
    print("✓ Tenant admin password configured successfully.")

    # Fetch tenants again and verify password configured status is True
    print("Verifying password configured status in tenants list...")
    tenants_res2 = requests.get(f"{BASE_URL}/tenants/", headers=sa_headers)
    assert tenants_res2.status_code == 200
    updated_tenant = next((t for t in tenants_res2.json() if t["id"] == tenant_id), None)
    assert updated_tenant is not None
    assert updated_tenant["users"][0]["is_password_configured"] is True, "Password status should now be True"
    print("✓ Verified password status changed to configured in Tenant details.")

    # ----------------------------------------------------
    # 2. Client (Admin) Workflow
    # ----------------------------------------------------
    print("\n--- 2. Client (Admin) Workflow ---")

    # Login as Tenant Admin
    print(f"Logging in as Tenant Admin '{admin_username}'...")
    client_login_res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": admin_username,
        "password": admin_password
    })
    assert client_login_res.status_code == 200, f"Client Login failed: {client_login_res.text}"
    client_token = client_login_res.json()["access_token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}
    print("✓ Client logged in successfully.")

    # Create Customer
    customer_phone = f"9876{str(int(time.time()))[-6:]}"
    print(f"Creating a customer with phone {customer_phone}...")
    create_customer_res = requests.post(f"{BASE_URL}/customers/", headers=client_headers, json={
        "name": "E2E Test Customer",
        "phone": customer_phone,
    })
    assert create_customer_res.status_code == 201, f"Create customer failed: {create_customer_res.text}"
    customer_id = create_customer_res.json()["id"]
    print(f"✓ Customer created with ID: {customer_id}")

    # Upload Product Image
    print("Generating a test image and uploading...")
    file_stream = io.BytesIO()
    image = Image.new('RGB', (100, 100), color = 'red')
    image.save(file_stream, 'JPEG')
    file_stream.seek(0)
    
    upload_res = requests.post(f"{BASE_URL}/products/upload-image", headers=client_headers, files={
        "file": ("test.jpg", file_stream, "image/jpeg")
    })
    assert upload_res.status_code == 200, f"Image upload failed: {upload_res.text}"
    image_url = upload_res.json()["url"]
    print(f"✓ Image uploaded successfully. URL: {image_url}")

    # Create Product
    product_sku = f"SKU-{int(time.time())}"
    print(f"Creating a new product with SKU {product_sku}...")
    create_product_res = requests.post(f"{BASE_URL}/products/", headers=client_headers, json={
        "name": "E2E Runner Shoes",
        "sku": product_sku,
        "brand": "E2E Brand",
        "category": "Sneakers",
        "price": 4999.00,
        "cost": 2500.00,
        "stock_quantity": 50,
        "image_url": image_url
    })
    assert create_product_res.status_code == 201, f"Create product failed: {create_product_res.text}"
    product_id = create_product_res.json()["id"]
    print(f"✓ Product created successfully with ID: {product_id}")

    # Complete a Cart/Billing transaction
    print("Creating a sales transaction (checkout)...")
    create_sale_res = requests.post(f"{BASE_URL}/sales/", headers=client_headers, json={
        "customer_id": customer_id,
        "payment_method": "cash",
        "items": [
            {
                "product_id": product_id,
                "quantity": 2,
                "unit_price": 4999.00,
                "discount": 0.00,
                "size": "8"
            }
        ]
    })
    assert create_sale_res.status_code == 201, f"Create sale failed: {create_sale_res.text}"
    sale_data = create_sale_res.json()
    print(f"✓ Transaction complete! Invoice Number: {sale_data['invoice_number']}")

    print("\n=== E2E WORKFLOW AUDIT PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_e2e_workflow()
