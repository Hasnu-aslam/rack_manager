from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SalesOverview(BaseModel):
    total_sales: float
    total_transactions: int
    average_transaction: float
    period: str  # daily, monthly, yearly


class SalesTrend(BaseModel):
    date: str
    sales: float
    transactions: int


class BestSeller(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_revenue: float


class CategoryPerformance(BaseModel):
    category: str
    total_sales: float
    total_quantity: int
    percentage: float


class DashboardStats(BaseModel):
    overview: SalesOverview
    trends: List[SalesTrend]
    best_sellers: List[BestSeller]
    category_performance: List[CategoryPerformance]
    low_stock_products: List[dict]
