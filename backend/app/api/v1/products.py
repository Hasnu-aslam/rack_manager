from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from PIL import Image
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, Product as ProductSchema, ProductStockUpdate
from app.services.inventory_service import InventoryService
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.core.config import settings

router = APIRouter()


@router.get("/", response_model=List[ProductSchema])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products with optional filters"""
    query = db.query(Product)
    query = query.filter(Product.tenant_id == current_user.tenant_id)
    
    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand == brand)
    if low_stock:
        query = query.filter(Product.stock_quantity < 10)  # Threshold for low stock
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single product by ID"""
    query = db.query(Product).filter(Product.id == product_id)
    query = query.filter(Product.tenant_id == current_user.tenant_id)
    product = query.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    # Check if SKU already exists
    existing_query = db.query(Product).filter(Product.sku == product.sku)
    existing_query = existing_query.filter(Product.tenant_id == current_user.tenant_id)
    existing = existing_query.first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    product_data = product.model_dump()
    sizes_data = product_data.pop("sizes", None) or []
    
    db_product = Product(**product_data)
    db_product.tenant_id = current_user.tenant_id
        
    db.add(db_product)
    db.flush() # get product id
    
    # Save sizes
    from app.models.product import ProductSize
    total_stock = 0
    if not sizes_data and db_product.stock_quantity > 0:
        sizes_data = [{"size": "8", "quantity": db_product.stock_quantity}]
        
    for s_data in sizes_data:
        size_record = ProductSize(
            product_id=db_product.id,
            size=s_data["size"],
            quantity=s_data["quantity"],
            tenant_id=db_product.tenant_id
        )
        db.add(size_record)
        total_stock += s_data["quantity"]
        
    db_product.stock_quantity = total_stock
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product"""
    query = db.query(Product).filter(Product.id == product_id)
    query = query.filter(Product.tenant_id == current_user.tenant_id)
    db_product = query.first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.model_dump(exclude_unset=True)
    sizes_data = update_data.pop("sizes", None)
    
    # Sync sizes
    if sizes_data is not None:
        from app.models.product import ProductSize
        db.query(ProductSize).filter(ProductSize.product_id == db_product.id).delete()
        total_stock = 0
        for s_data in sizes_data:
            size_record = ProductSize(
                product_id=db_product.id,
                size=s_data["size"],
                quantity=s_data["quantity"],
                tenant_id=db_product.tenant_id
            )
            db.add(size_record)
            total_stock += s_data["quantity"]
        db_product.stock_quantity = total_stock

    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product"""
    query = db.query(Product).filter(Product.id == product_id)
    query = query.filter(Product.tenant_id == current_user.tenant_id)
    db_product = query.first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return None


@router.post("/{product_id}/stock", response_model=ProductSchema)
async def update_stock(
    product_id: int,
    stock_update: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update product stock quantity"""
    return await InventoryService.update_stock(db, product_id, stock_update.quantity, stock_update.reason, size=stock_update.size)


@router.post("/upload-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    UPLOAD_DIR = settings.upload_dir_path
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with Image.open(file.file) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(filepath, "JPEG", quality=85)
            
        return {"url": f"/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
