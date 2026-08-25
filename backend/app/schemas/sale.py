from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.sale import PaymentMethod


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)
    discount: float = Field(ge=0, default=0.0)
    size: str


class SaleItem(SaleItemCreate):
    id: int
    sale_id: int

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    payment_method: PaymentMethod
    items: List[SaleItemCreate] = Field(..., min_items=1)


class Sale(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    total_amount: float
    payment_method: PaymentMethod
    created_at: datetime
    is_reverted: bool = False
    items: List[SaleItem] = []

    class Config:
        from_attributes = True


class SaleSummary(BaseModel):
    id: int
    invoice_number: str
    customer_name: Optional[str] = None
    total_amount: float
    payment_method: PaymentMethod
    created_at: datetime
    is_reverted: bool = False

    class Config:
        from_attributes = True
