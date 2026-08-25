from sqlalchemy.orm import Session
from app.models.product import Product, ProductSize
from app.models.inventory_log import InventoryLog, InventoryLogType
from datetime import datetime


class InventoryService:
    @staticmethod
    async def update_stock(db: Session, product_id: int, quantity_change: int, reason: str = None, size: str = "8"):
        """Update product stock for a specific size and create inventory log entry"""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("Product not found")
        
        # Get or create the ProductSize entry
        size_record = db.query(ProductSize).filter(
            ProductSize.product_id == product_id,
            ProductSize.size == size
        ).first()
        
        if not size_record:
            # If stock-out request for a non-existent size record, raise error
            if quantity_change < 0:
                raise ValueError(f"Insufficient stock: size {size} not found for this product")
            # Create a new size record for stock-in
            size_record = ProductSize(
                product_id=product_id,
                size=size,
                quantity=0,
                tenant_id=product.tenant_id
            )
            db.add(size_record)
            db.flush()

        # Check if stock for this size would go negative
        new_size_quantity = size_record.quantity + quantity_change
        if new_size_quantity < 0:
            raise ValueError(f"Insufficient stock for size {size}")
        
        # Update size stock
        size_record.quantity = new_size_quantity
        db.flush()
        
        # Recalculate parent product total stock quantity
        product.stock_quantity = sum(s.quantity for s in product.sizes)
        
        # Create inventory log
        log_type = InventoryLogType.IN if quantity_change > 0 else InventoryLogType.OUT
        log_entry = InventoryLog(
            product_id=product_id,
            type=log_type,
            quantity=abs(quantity_change),
            reason=f"{reason or 'Manual adjustment'} (Size {size})",
            tenant_id=product.tenant_id
        )
        db.add(log_entry)
        db.commit()
        db.refresh(product)
        
        return product
