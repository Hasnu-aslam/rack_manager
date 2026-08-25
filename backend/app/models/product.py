from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    brand = Column(String, index=True)
    category = Column(String, index=True)
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    image_url = Column(String, nullable=True)
    attributes = Column(JSON, nullable=True)  # For size, color, etc.
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    tenant = relationship("Tenant", backref="products")
    sizes = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan")


class ProductSize(Base):
    __tablename__ = "product_sizes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    size = Column(String, nullable=False, index=True)
    quantity = Column(Integer, default=0, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)

    product = relationship("Product", back_populates="sizes")
    tenant = relationship("Tenant", backref="product_sizes")
