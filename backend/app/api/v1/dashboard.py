from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional, List
from app.core.database import get_db
from app.schemas.dashboard import DashboardStats, SalesOverview, SalesTrend, BestSeller, CategoryPerformance
from app.services.dashboard_service import DashboardService
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    period: str = Query("daily", regex="^(daily|monthly|yearly)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_dashboard_stats(db, period, start_date, end_date, tenant_id)


@router.get("/sales-overview", response_model=SalesOverview)
async def get_sales_overview(
    period: str = Query("daily", regex="^(daily|monthly|yearly)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales overview for a period"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_sales_overview(db, period, start_date, end_date, tenant_id)


@router.get("/sales-trends", response_model=List[SalesTrend])
async def get_sales_trends(
    period: str = Query("daily", regex="^(daily|monthly|yearly)$"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales trends over time"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_sales_trends(db, period, days, tenant_id)


@router.get("/best-sellers", response_model=List[BestSeller])
async def get_best_sellers(
    limit: int = Query(10, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get best selling products"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_best_sellers(db, limit, start_date, end_date, tenant_id)


@router.get("/category-performance", response_model=List[CategoryPerformance])
async def get_category_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales performance by category"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_category_performance(db, start_date, end_date, tenant_id)


@router.get("/low-stock")
async def get_low_stock_products(
    threshold: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products with low stock"""
    tenant_id = current_user.tenant_id if not current_user.is_superuser else None
    return await DashboardService.get_low_stock_products(db, threshold, tenant_id)
