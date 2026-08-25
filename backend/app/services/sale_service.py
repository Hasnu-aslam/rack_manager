from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate
from app.services.inventory_service import InventoryService


class SaleService:
    @staticmethod
    async def create_sale(db: Session, sale_data: SaleCreate, tenant_id: int = None):
        """Create a sale with items and update inventory"""
        # Generate invoice number
        last_sale = db.query(Sale).order_by(Sale.id.desc()).first()
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{last_sale.id + 1 if last_sale else 1:04d}"
        
        # Calculate total
        total_amount = sum(
            (item.unit_price * item.quantity) - item.discount
            for item in sale_data.items
        )
        
        # Create sale
        sale = Sale(
            invoice_number=invoice_number,
            customer_id=sale_data.customer_id,
            employee_id=sale_data.employee_id,
            total_amount=total_amount,
            payment_method=sale_data.payment_method
        )
        if tenant_id is not None:
            sale.tenant_id = tenant_id
        db.add(sale)
        db.flush()  # Get sale.id
        
        # Create sale items and update inventory
        for item_data in sale_data.items:
            # Check product exists and has stock
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                raise ValueError(f"Product {item_data.product_id} not found")
            
            # Check size stock
            from app.models.product import ProductSize
            size_record = db.query(ProductSize).filter(
                ProductSize.product_id == item_data.product_id,
                ProductSize.size == item_data.size
            ).first()
            if not size_record or size_record.quantity < item_data.quantity:
                raise ValueError(f"Insufficient stock for size {item_data.size} of product {product.name}")
            
            # Create sale item
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                discount=item_data.discount,
                size=item_data.size
            )
            db.add(sale_item)
            
            # Update inventory (stock out)
            await InventoryService.update_stock(
                db,
                item_data.product_id,
                -item_data.quantity,
                f"Sale {invoice_number}",
                size=item_data.size
            )
        
        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    async def revert_sale(db: Session, sale_id: int, tenant_id: int):
        sale = db.query(Sale).filter(Sale.id == sale_id, Sale.tenant_id == tenant_id).first()
        if not sale:
            raise ValueError("Sale not found")
        if sale.is_reverted:
            raise ValueError("Sale is already reverted")
        
        # Restore stock for each item in the sale
        for item in sale.items:
            await InventoryService.update_stock(
                db,
                item.product_id,
                item.quantity,
                f"Revert Sale {sale.invoice_number}",
                size=item.size
            )
            
        sale.is_reverted = True
        db.commit()
        db.refresh(sale)
        return sale

