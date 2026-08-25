from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.tenant import Tenant as TenantModel
from app.models.user import User as UserModel
from app.schemas.tenant import Tenant as TenantSchema, TenantCreateWithAdmin
from app.schemas.user import User as UserSchema
from app.api.v1.auth import get_current_user

router = APIRouter()


def check_superuser(current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super-admins can access this resource"
        )
    return current_user


@router.get("/", response_model=List[TenantSchema])
async def get_tenants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _ = Depends(check_superuser)
):
    """List all tenants"""
    return db.query(TenantModel).offset(skip).limit(limit).all()


@router.post("/", response_model=TenantSchema, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreateWithAdmin,
    db: Session = Depends(get_db),
    _ = Depends(check_superuser)
):
    """Create a new tenant and its associated admin user without a password"""
    # Check if tenant with this name already exists
    existing_tenant = db.query(TenantModel).filter(TenantModel.name == tenant_data.name).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant with this name already exists"
        )
    
    # Check if user already exists
    existing_user = db.query(UserModel).filter(
        (UserModel.username == tenant_data.admin_username) | 
        (UserModel.email == tenant_data.admin_email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin username or email already registered"
        )
    
    # Create tenant
    db_tenant = TenantModel(name=tenant_data.name, status="active")
    db.add(db_tenant)
    db.flush() # get tenant id
    
    # Create admin user with no password
    db_user = UserModel(
        username=tenant_data.admin_username,
        email=tenant_data.admin_email,
        hashed_password=None, # password setup pending
        tenant_id=db_tenant.id,
        is_superuser=False
    )
    db.add(db_user)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _ = Depends(check_superuser)
):
    """Delete a tenant and all its associated data"""
    tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Delete associated data to prevent foreign key errors
    from app.models.inventory_log import InventoryLog
    db.query(InventoryLog).filter(InventoryLog.tenant_id == tenant_id).delete()
    
    from app.models.sale import Sale, SaleItem
    sales = db.query(Sale).filter(Sale.tenant_id == tenant_id).all()
    for sale in sales:
        db.query(SaleItem).filter(SaleItem.sale_id == sale.id).delete()
    db.query(Sale).filter(Sale.tenant_id == tenant_id).delete()
    
    from app.models.product import Product
    db.query(Product).filter(Product.tenant_id == tenant_id).delete()
    
    from app.models.customer import Customer
    db.query(Customer).filter(Customer.tenant_id == tenant_id).delete()
    
    db.query(UserModel).filter(UserModel.tenant_id == tenant_id).delete()
    
    db.delete(tenant)
    db.commit()
    return None

