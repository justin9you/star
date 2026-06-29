"""回归测试：库存原子性、成本快照、报表口径、日期筛选修复"""
import pytest
from decimal import Decimal
from datetime import date

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.customer import Customer
from app.services import inventory as inventory_service
from app.services import sales as sales_service
from app.services import report as report_service


@pytest.fixture
def base_data(test_db):
    """基础数据：品牌/类型/仓库/商品(进货价100)/客户，并入库10件"""
    brand = Brand(name="B", code="B1")
    cat = Category(name="C", code="C1")
    wh = Warehouse(id=1, name="主仓", type="主仓")
    test_db.add_all([brand, cat, wh])
    test_db.commit()

    product = Product(name="P", brand_id=brand.id, category_id=cat.id,
                      purchase_price=Decimal("100"), sale_price=Decimal("150"), unit="台")
    customer = Customer(name="客户", phone="13800000000")
    test_db.add_all([product, customer])
    test_db.commit()

    inventory_service.stock_in(test_db, product.id, wh.id, 10, reason="期初入库")
    return {"product": product, "customer": customer, "warehouse": wh}


def _inv_qty(db, product_id, warehouse_id):
    inv = db.query(inventory_service.Inventory).filter_by(
        product_id=product_id, warehouse_id=warehouse_id).first()
    return inv.quantity if inv else 0


class TestCostSnapshot:
    def test_profit_uses_cost_at_sale_time(self, test_db, base_data):
        """改进货价后，历史订单利润仍按成交时成本计算"""
        product = base_data["product"]
        customer = base_data["customer"]

        order = sales_service.create_order(
            test_db, customer.id,
            [{"product_id": product.id, "quantity": 2, "unit_price": 150}],
        )
        # 成本快照应写入明细
        assert order.items[0].cost_price == Decimal("100")

        # 之后进货价上涨到 999
        product.purchase_price = Decimal("999")
        test_db.commit()

        stats = report_service.get_profit_stats(test_db, date.today(), date.today())
        # 成本 = 100 * 2 = 200，而非 999 * 2
        assert stats["cost"] == Decimal("200")
        assert stats["revenue"] == Decimal("300")
        assert stats["gross_profit"] == Decimal("100")


class TestAtomicRollback:
    def test_cancel_restores_exact_stock(self, test_db, base_data):
        """作废订单精确回滚到原仓库"""
        product = base_data["product"]
        customer = base_data["customer"]
        wh = base_data["warehouse"]

        assert _inv_qty(test_db, product.id, wh.id) == 10
        order = sales_service.create_order(
            test_db, customer.id,
            [{"product_id": product.id, "quantity": 3, "unit_price": 150}],
        )
        assert _inv_qty(test_db, product.id, wh.id) == 7

        sales_service.cancel_order(test_db, order.id)
        assert _inv_qty(test_db, product.id, wh.id) == 10

    def test_create_order_does_not_commit_on_failure(self, test_db, base_data):
        """库存不足时不应产生订单，也不应扣减库存（原子性）"""
        product = base_data["product"]
        customer = base_data["customer"]
        wh = base_data["warehouse"]

        before = _inv_qty(test_db, product.id, wh.id)
        with pytest.raises(ValueError):
            sales_service.create_order(
                test_db, customer.id,
                [{"product_id": product.id, "quantity": 999, "unit_price": 150}],
            )
        test_db.rollback()
        assert _inv_qty(test_db, product.id, wh.id) == before
        assert test_db.query(sales_service.SalesOrder).count() == 0


class TestDailyReport:
    def test_cancelled_order_payment_excluded(self, test_db, base_data):
        """作废订单的付款不计入今日实收"""
        product = base_data["product"]
        customer = base_data["customer"]

        order = sales_service.create_order(
            test_db, customer.id,
            [{"product_id": product.id, "quantity": 1, "unit_price": 150}],
        )
        sales_service.add_payment(test_db, order.id,
                                  [{"payment_method": "现金", "amount": 150}])

        daily_before = report_service.get_daily_sales(test_db)
        assert daily_before["paid_amount"] == Decimal("150")

        sales_service.cancel_order(test_db, order.id)
        daily_after = report_service.get_daily_sales(test_db)
        assert daily_after["paid_amount"] == Decimal("0")


class TestDateFilter:
    def test_filter_by_today(self, test_db, base_data):
        product = base_data["product"]
        customer = base_data["customer"]
        sales_service.create_order(
            test_db, customer.id,
            [{"product_id": product.id, "quantity": 1, "unit_price": 150}],
        )
        today = date.today().isoformat()
        orders, total = sales_service.get_orders(test_db, order_date=today)
        assert total == 1
        # 不存在的历史日期应为空
        _, none_total = sales_service.get_orders(test_db, order_date="2000-01-01")
        assert none_total == 0
