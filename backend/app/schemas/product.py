from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ProductSizeBase(BaseModel):
    size: str
    quantity: int = Field(ge=0, default=0)


class ProductSizeCreate(ProductSizeBase):
    pass


class ProductSizeSchema(ProductSizeBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    sku: str
    brand: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(gt=0)
    cost: float = Field(ge=0)
    stock_quantity: int = Field(ge=0, default=0)
    image_url: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    sizes: Optional[List[ProductSizeCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    cost: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    sizes: Optional[List[ProductSizeCreate]] = None


class Product(ProductBase):
    id: int
    sizes: List[ProductSizeSchema] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductStockUpdate(BaseModel):
    quantity: int = Field(..., description="Positive for stock in, negative for stock out")
    reason: Optional[str] = None
    size: str
