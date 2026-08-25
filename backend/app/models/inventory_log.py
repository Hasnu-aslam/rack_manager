from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class InventoryLogType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    type = Column(Enum(InventoryLogType), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    product = relationship("Product", backref="inventory_logs")
    tenant = relationship("Tenant", backref="inventory_logs")
