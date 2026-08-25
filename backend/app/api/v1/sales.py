from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.models.sale import Sale, SaleItem, PaymentMethod
from app.models.product import Product
from app.schemas.sale import SaleCreate, Sale as SaleSchema, SaleSummary
from app.services.sale_service import SaleService
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[SaleSummary])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales with optional date filters"""
    query = db.query(Sale)
    if not current_user.is_superuser:
        query = query.filter(Sale.tenant_id == current_user.tenant_id)
    
    if start_date:
        query = query.filter(Sale.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(Sale.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleSchema)
async def get_sale(
    sale_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single sale by ID with items"""
    query = db.query(Sale).filter(Sale.id == sale_id)
    if not current_user.is_superuser:
        query = query.filter(Sale.tenant_id == current_user.tenant_id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/", response_model=SaleSchema, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_data: SaleCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sale"""
    return await SaleService.create_sale(db, sale_data, current_user.tenant_id if not current_user.is_superuser else None)


@router.get("/invoice/{invoice_number}", response_model=SaleSchema)
async def get_sale_by_invoice(
    invoice_number: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a sale by invoice number"""
    query = db.query(Sale).filter(Sale.invoice_number == invoice_number)
    if not current_user.is_superuser:
        query = query.filter(Sale.tenant_id == current_user.tenant_id)
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/{sale_id}/revert", response_model=SaleSchema)
async def revert_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revert a sale and restore its stock quantity"""
    try:
        tenant_id = current_user.tenant_id
        return await SaleService.revert_sale(db, sale_id, tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

