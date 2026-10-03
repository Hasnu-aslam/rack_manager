from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from typing import Optional, List
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.dashboard import (
    DashboardStats, SalesOverview, SalesTrend, BestSeller,
    CategoryPerformance
)


class DashboardService:
    @staticmethod
    async def get_sales_overview(
        db: Session,
        period: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        tenant_id: Optional[int] = None
    ) -> SalesOverview:
        """Get sales overview for a period"""
        query = db.query(Sale)
        
        if not start_date or not end_date:
            end_date = date.today()
            if period == "daily":
                start_date = end_date
            elif period == "monthly":
                start_date = end_date.replace(day=1)
            else:  # yearly
                start_date = end_date.replace(month=1, day=1)
        
        query = query.filter(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date,
            Sale.is_reverted == False
        )
        if tenant_id is not None:
            query = query.filter(Sale.tenant_id == tenant_id)
        
        result = query.with_entities(
            func.sum(Sale.total_amount).label("total"),
            func.count(Sale.id).label("count")
        ).first()
        
        total_sales = float(result.total or 0)
        total_transactions = int(result.count or 0)
        average_transaction = total_sales / total_transactions if total_transactions > 0 else 0
        
        return SalesOverview(
            total_sales=total_sales,
            total_transactions=total_transactions,
            average_transaction=average_transaction,
            period=period
        )
    
    @staticmethod
    async def get_sales_trends(
        db: Session,
        period: str,
        days: int,
        tenant_id: Optional[int] = None
    ) -> List[SalesTrend]:
        """Get sales trends over time"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        
        query = db.query(
            func.date(Sale.created_at).label("date"),
            func.sum(Sale.total_amount).label("sales"),
            func.count(Sale.id).label("transactions")
        ).filter(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date,
            Sale.is_reverted == False
        )
        
        if tenant_id is not None:
            query = query.filter(Sale.tenant_id == tenant_id)
            
        query = query.group_by(func.date(Sale.created_at)).order_by("date")
        
        results = query.all()
        
        trends = []
        for row in results:
            date_val = row.date
            date_str = date_val[:10] if isinstance(date_val, str) else date_val.strftime("%Y-%m-%d")
            trends.append(SalesTrend(
                date=date_str,
                sales=float(row.sales or 0),
                transactions=int(row.transactions or 0)
            ))
        
        return trends
    
    @staticmethod
    async def get_best_sellers(
        db: Session,
        limit: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        tenant_id: Optional[int] = None
    ) -> List[BestSeller]:
        """Get best selling products"""
        query = db.query(
            Product.id,
            Product.name,
            func.sum(SaleItem.quantity).label("total_quantity"),
            func.sum(SaleItem.quantity * SaleItem.unit_price - SaleItem.discount).label("total_revenue")
        ).join(SaleItem, Product.id == SaleItem.product_id).join(Sale, SaleItem.sale_id == Sale.id)
        
        if start_date:
            query = query.filter(func.date(Sale.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(Sale.created_at) <= end_date)
        
        query = query.filter(Sale.is_reverted == False)
        
        if tenant_id is not None:
            query = query.filter(Sale.tenant_id == tenant_id)
        
        results = query.group_by(Product.id, Product.name).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(limit).all()
        
        return [
            BestSeller(
                product_id=row.id,
                product_name=row.name,
                total_quantity=int(row.total_quantity or 0),
                total_revenue=float(row.total_revenue or 0)
            )
            for row in results
        ]
    
    @staticmethod
    async def get_category_performance(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        tenant_id: Optional[int] = None
    ) -> List[CategoryPerformance]:
        """Get sales performance by category"""
        query = db.query(
            Product.category,
            func.sum(SaleItem.quantity * SaleItem.unit_price - SaleItem.discount).label("total_sales"),
            func.sum(SaleItem.quantity).label("total_quantity")
        ).join(SaleItem, Product.id == SaleItem.product_id).join(Sale, SaleItem.sale_id == Sale.id)
        
        if start_date:
            query = query.filter(func.date(Sale.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(Sale.created_at) <= end_date)
        
        query = query.filter(Sale.is_reverted == False)
        
        if tenant_id is not None:
            query = query.filter(Sale.tenant_id == tenant_id)
        
        results = query.group_by(Product.category).all()
        
        total_sales = sum(float(row.total_sales or 0) for row in results)
        
        performance = []
        for row in results:
            category_sales = float(row.total_sales or 0)
            percentage = (category_sales / total_sales * 100) if total_sales > 0 else 0
            
            performance.append(CategoryPerformance(
                category=row.category or "Uncategorized",
                total_sales=category_sales,
                total_quantity=int(row.total_quantity or 0),
                percentage=percentage
            ))
        
        return sorted(performance, key=lambda x: x.total_sales, reverse=True)
    
    @staticmethod
    async def get_low_stock_products(db: Session, threshold: int, tenant_id: Optional[int] = None) -> List[dict]:
        """Get products with low stock"""
        query = db.query(Product).filter(Product.stock_quantity < threshold)
        if tenant_id is not None:
            query = query.filter(Product.tenant_id == tenant_id)
        products = query.order_by(Product.stock_quantity.asc()).all()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "threshold": threshold
            }
            for p in products
        ]
    
    @staticmethod
    async def get_dashboard_stats(
        db: Session,
        period: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        tenant_id: Optional[int] = None
    ) -> DashboardStats:
        """Get comprehensive dashboard statistics"""
        overview = await DashboardService.get_sales_overview(db, period, start_date, end_date, tenant_id)
        trends = await DashboardService.get_sales_trends(db, period, 30, tenant_id)
        best_sellers = await DashboardService.get_best_sellers(db, 10, start_date, end_date, tenant_id)
        category_performance = await DashboardService.get_category_performance(db, start_date, end_date, tenant_id)
        low_stock_products = await DashboardService.get_low_stock_products(db, 10, tenant_id)
        
        return DashboardStats(
            overview=overview,
            trends=trends,
            best_sellers=best_sellers,
            category_performance=category_performance,
            low_stock_products=low_stock_products
        )
