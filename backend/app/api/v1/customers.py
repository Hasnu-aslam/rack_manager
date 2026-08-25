from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, Customer as CustomerSchema
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CustomerSchema])
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all customers with optional search"""
    query = db.query(Customer)
    if not current_user.is_superuser:
        query = query.filter(Customer.tenant_id == current_user.tenant_id)
    
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%"))
        )
    
    customers = query.offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerSchema)
async def get_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single customer by ID"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not current_user.is_superuser:
        query = query.filter(Customer.tenant_id == current_user.tenant_id)
    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=CustomerSchema, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer"""
    db_customer = Customer(**customer.model_dump())
    if not current_user.is_superuser:
        db_customer.tenant_id = current_user.tenant_id
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a customer"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not current_user.is_superuser:
        query = query.filter(Customer.tenant_id == current_user.tenant_id)
    db_customer = query.first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a customer"""
    query = db.query(Customer).filter(Customer.id == customer_id)
    if not current_user.is_superuser:
        query = query.filter(Customer.tenant_id == current_user.tenant_id)
    db_customer = query.first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return None
