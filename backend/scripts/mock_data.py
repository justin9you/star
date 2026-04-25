"""
Mock数据生成脚本
用于生成测试数据并插入到数据库中
"""
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base, init_db
from app.models.user import User
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.inventory import Inventory
from app.models.customer import Customer
from app.models.sales_order import SalesOrder, SalesOrderItem, PaymentStatus, OrderStatus
from app.models.old_appliance import OldAppliance
from app.services.auth import get_password_hash
from app.config import settings


# 初始化数据库（创建表 + 自动迁移）
init_db()


def create_brands(db: Session):
    """创建品牌数据"""
    brands_data = [
        {"name": "美的", "code": "MIDEA", "remark": "美的集团,中国知名家电品牌"},
        {"name": "格力", "code": "GREE", "remark": "格力电器,空调行业领导者"},
        {"name": "海尔", "code": "HAIER", "remark": "海尔智家,全球家电品牌"},
        {"name": "海信", "code": "HISENSE", "remark": "海信集团,电视冰箱知名品牌"},
        {"name": "小米", "code": "XIAOMI", "remark": "小米科技,智能家居品牌"},
        {"name": "松下", "code": "PANASONIC", "remark": "松下电器,日本品牌"},
        {"name": "西门子", "code": "SIEMENS", "remark": "西门子家电,德国品牌"},
        {"name": "奥克斯", "code": "AUX", "remark": "奥克斯集团,空调制造商"},
        {"name": "TCL", "code": "TCL", "remark": "TCL科技,电视制造商"},
        {"name": "创维", "code": "SKYWORTH", "remark": "创维集团,电视制造商"},
    ]

    brands = []
    for data in brands_data:
        brand = db.query(Brand).filter(Brand.code == data["code"]).first()
        if not brand:
            brand = Brand(**data)
            db.add(brand)
            db.commit()
            db.refresh(brand)
        brands.append(brand)

    print(f"[OK] 已创建 {len(brands)} 个品牌")
    return brands


def create_categories(db: Session):
    """创建电器类型数据"""
    categories_data = [
        {"name": "冰箱", "code": "FRIDGE", "sort": 1},
        {"name": "空调", "code": "AC", "sort": 2},
        {"name": "洗衣机", "code": "WASHER", "sort": 3},
        {"name": "电视", "code": "TV", "sort": 4},
        {"name": "热水器", "code": "HEATER", "sort": 5},
        {"name": "油烟机", "code": "HOOD", "sort": 6},
        {"name": "微波炉", "code": "MICRO", "sort": 7},
        {"name": "电饭煲", "code": "COOKER", "sort": 8},
        {"name": "电磁炉", "code": "INDUCTION", "sort": 9},
        {"name": "净水器", "code": "PURIFIER", "sort": 10},
    ]

    categories = []
    for data in categories_data:
        category = db.query(Category).filter(Category.code == data["code"]).first()
        if not category:
            category = Category(**data)
            db.add(category)
            db.commit()
            db.refresh(category)
        categories.append(category)

    print(f"[OK] 已创建 {len(categories)} 个电器类型")
    return categories


def create_products(db: Session, brands, categories):
    """创建商品数据"""
    products_data = [
        # 冰箱
        {"name": "美的冰箱 BCD-200TM", "brand_code": "MIDEA", "category_code": "FRIDGE", "spec": "200L", "purchase_price": 1500, "sale_price": 1999, "unit": "台"},
        {"name": "海尔冰箱 BCD-300WDP", "brand_code": "HAIER", "category_code": "FRIDGE", "spec": "300L", "purchase_price": 2500, "sale_price": 3299, "unit": "台"},
        {"name": "西门子冰箱 KG39N", "brand_code": "SIEMENS", "category_code": "FRIDGE", "spec": "350L", "purchase_price": 4500, "sale_price": 5999, "unit": "台"},
        {"name": "松下冰箱 NR-B21", "brand_code": "PANASONIC", "category_code": "FRIDGE", "spec": "210L", "purchase_price": 1800, "sale_price": 2399, "unit": "台"},

        # 空调
        {"name": "格力空调 KFR-35GW", "brand_code": "GREE", "category_code": "AC", "spec": "1.5匹", "purchase_price": 2800, "sale_price": 3599, "unit": "台"},
        {"name": "美的空调 KFR-26GW", "brand_code": "MIDEA", "category_code": "AC", "spec": "1匹", "purchase_price": 2000, "sale_price": 2599, "unit": "台"},
        {"name": "奥克斯空调 KFR-35GW", "brand_code": "AUX", "category_code": "AC", "spec": "1.5匹", "purchase_price": 2200, "sale_price": 2799, "unit": "台"},
        {"name": "海尔空调 KFR-50LW", "brand_code": "HAIER", "category_code": "AC", "spec": "2匹", "purchase_price": 3500, "sale_price": 4499, "unit": "台"},

        # 洗衣机
        {"name": "海尔洗衣机 EG100", "brand_code": "HAIER", "category_code": "WASHER", "spec": "10kg", "purchase_price": 2200, "sale_price": 2899, "unit": "台"},
        {"name": "西门子洗衣机 WM12", "brand_code": "SIEMENS", "category_code": "WASHER", "spec": "8kg", "purchase_price": 3000, "sale_price": 3999, "unit": "台"},
        {"name": "美的洗衣机 MG100", "brand_code": "MIDEA", "category_code": "WASHER", "spec": "10kg", "purchase_price": 1800, "sale_price": 2399, "unit": "台"},
        {"name": "松下洗衣机 XQB80", "brand_code": "PANASONIC", "category_code": "WASHER", "spec": "8kg", "purchase_price": 2500, "sale_price": 3299, "unit": "台"},

        # 电视
        {"name": "小米电视 L55M7", "brand_code": "XIAOMI", "category_code": "TV", "spec": "55英寸", "purchase_price": 2200, "sale_price": 2799, "unit": "台"},
        {"name": "TCL电视 55Q10", "brand_code": "TCL", "category_code": "TV", "spec": "55英寸", "purchase_price": 2500, "sale_price": 3199, "unit": "台"},
        {"name": "海信电视 55E7G", "brand_code": "HISENSE", "category_code": "TV", "spec": "55英寸", "purchase_price": 2400, "sale_price": 2999, "unit": "台"},
        {"name": "创维电视 55A7", "brand_code": "SKYWORTH", "category_code": "TV", "spec": "55英寸", "purchase_price": 2300, "sale_price": 2899, "unit": "台"},

        # 热水器
        {"name": "美的热水器 F60-21W9", "brand_code": "MIDEA", "category_code": "HEATER", "spec": "60L", "purchase_price": 800, "sale_price": 1099, "unit": "台"},
        {"name": "海尔热水器 ES60H", "brand_code": "HAIER", "category_code": "HEATER", "spec": "60L", "purchase_price": 900, "sale_price": 1199, "unit": "台"},

        # 油烟机
        {"name": "美的油烟机 CXW-200", "brand_code": "MIDEA", "category_code": "HOOD", "spec": "近吸式", "purchase_price": 1200, "sale_price": 1599, "unit": "台"},
        {"name": "海尔油烟机 CXW-219", "brand_code": "HAIER", "category_code": "HOOD", "spec": "欧式", "purchase_price": 1500, "sale_price": 1999, "unit": "台"},

        # 微波炉
        {"name": "美的微波炉 M1-L213B", "brand_code": "MIDEA", "category_code": "MICRO", "spec": "21L", "purchase_price": 300, "sale_price": 449, "unit": "台"},
        {"name": "松下微波炉 NN-GF598M", "brand_code": "PANASONIC", "category_code": "MICRO", "spec": "27L", "purchase_price": 600, "sale_price": 899, "unit": "台"},

        # 电饭煲
        {"name": "美的电饭煲 MB-FB40S7", "brand_code": "MIDEA", "category_code": "COOKER", "spec": "4L", "purchase_price": 200, "sale_price": 299, "unit": "台"},
        {"name": "小米电饭煲 CRRC2", "brand_code": "XIAOMI", "category_code": "COOKER", "spec": "3L", "purchase_price": 180, "sale_price": 269, "unit": "台"},

        # 电磁炉
        {"name": "美的电磁炉 C21-WT2102", "brand_code": "MIDEA", "category_code": "INDUCTION", "spec": "2100W", "purchase_price": 150, "sale_price": 229, "unit": "台"},
        {"name": "小米电磁炉 DCL002CM", "brand_code": "XIAOMI", "category_code": "INDUCTION", "spec": "2100W", "purchase_price": 130, "sale_price": 199, "unit": "台"},

        # 净水器
        {"name": "小米净水器 MR432-B", "brand_code": "XIAOMI", "category_code": "PURIFIER", "spec": "400G", "purchase_price": 800, "sale_price": 1299, "unit": "台"},
        {"name": "美的净水器 MRC1882", "brand_code": "MIDEA", "category_code": "PURIFIER", "spec": "600G", "purchase_price": 1000, "sale_price": 1599, "unit": "台"},
    ]

    products = []
    brand_dict = {b.code: b for b in brands}
    category_dict = {c.code: c for c in categories}

    for i, data in enumerate(products_data):
        # 生成唯一二维码（部分商品没有二维码）
        has_qr = random.random() > 0.3
        qr_code = f"YX{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}" if has_qr else None

        # 生成条形码（EAN-13 格式模拟）
        barcode_prefix = "690"  # 中国商品条码前缀
        barcode_body = f"{random.randint(100000000, 999999999)}"
        barcode = f"{barcode_prefix}{barcode_body}"

        product = db.query(Product).filter(Product.name == data["name"]).first()
        if not product:
            product = Product(
                name=data["name"],
                brand_id=brand_dict[data["brand_code"]].id,
                category_id=category_dict[data["category_code"]].id,
                spec=data["spec"],
                purchase_price=Decimal(str(data["purchase_price"])),
                sale_price=Decimal(str(data["sale_price"])),
                unit=data["unit"],
                qr_code=qr_code,
                barcode=barcode,
            )
            db.add(product)
            db.commit()
            db.refresh(product)
        products.append(product)

    print(f"[OK] 已创建 {len(products)} 个商品")
    return products


def create_warehouses(db: Session):
    """创建仓库数据"""
    warehouses_data = [
        {"name": "主仓库", "type": "主仓", "address": "江苏省苏州市吴中区临湖镇工业园A区", "manager": "张经理", "phone": "13800138000"},
        {"name": "分店仓库", "type": "分店仓", "address": "江苏省苏州市吴中区临湖镇商业街B栋", "manager": "李经理", "phone": "13900139000"},
        {"name": "旧货仓库", "type": "旧货专用仓", "address": "江苏省苏州市吴中区临湖镇旧货市场C区", "manager": "王经理", "phone": "13700137000"},
    ]

    warehouses = []
    for data in warehouses_data:
        warehouse = db.query(Warehouse).filter(Warehouse.name == data["name"]).first()
        if not warehouse:
            warehouse = Warehouse(**data)
            db.add(warehouse)
            db.commit()
            db.refresh(warehouse)
        warehouses.append(warehouse)

    print(f"[OK] 已创建 {len(warehouses)} 个仓库")
    return warehouses


def create_inventory(db: Session, products, warehouses):
    """创建库存数据"""
    # 清空现有库存
    db.query(Inventory).delete()
    db.commit()

    inventory_count = 0
    for product in products:
        # 随机分配到主仓库和分店仓库
        main_warehouse = warehouses[0]
        branch_warehouse = warehouses[1]

        # 主仓库库存
        quantity_main = random.randint(5, 50)
        min_quantity = random.randint(2, 5)
        inventory_main = Inventory(
            product_id=product.id,
            warehouse_id=main_warehouse.id,
            quantity=quantity_main,
            min_quantity=min_quantity,
        )
        db.add(inventory_main)
        inventory_count += 1

        # 分店仓库库存 (部分商品)
        if random.random() > 0.3:
            quantity_branch = random.randint(3, 30)
            inventory_branch = Inventory(
                product_id=product.id,
                warehouse_id=branch_warehouse.id,
                quantity=quantity_branch,
                min_quantity=min_quantity,
            )
            db.add(inventory_branch)
            inventory_count += 1

    db.commit()
    print(f"[OK] 已创建 {inventory_count} 条库存记录")


def create_customers(db: Session):
    """创建客户数据"""
    customers_data = [
        {"name": "张三", "phone": "13800001001", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "花园小区1栋101室"},
        {"name": "李四", "phone": "13800001002", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "阳光小区2栋202室"},
        {"name": "王五", "phone": "13800001003", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "幸福小区3栋303室"},
        {"name": "赵六", "phone": "13800001004", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "木渎镇", "address": "和谐小区4栋404室"},
        {"name": "钱七", "phone": "13800001005", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "胥口镇", "address": "美丽小区5栋505室"},
        {"name": "孙八", "phone": "13800001006", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "温馨小区6栋606室"},
        {"name": "周九", "phone": "13800001007", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "祥和小区7栋707室"},
        {"name": "吴十", "phone": "13800001008", "province": "江苏省", "city": "苏州市", "district": "吴中区", "town": "临湖镇", "address": "平安小区8栋808室"},
    ]

    customers = []
    for data in customers_data:
        customer = db.query(Customer).filter(Customer.phone == data["phone"]).first()
        if not customer:
            customer = Customer(**data)
            db.add(customer)
            db.commit()
            db.refresh(customer)
        customers.append(customer)

    print(f"[OK] 已创建 {len(customers)} 个客户")
    return customers


def create_sales_orders(db: Session, products, customers, warehouses):
    """创建销售订单数据"""
    # 清空现有订单
    db.query(OldAppliance).delete()
    db.query(SalesOrderItem).delete()
    db.query(SalesOrder).delete()
    db.commit()

    orders_count = 0
    items_count = 0
    old_appliances_count = 0

    # 创建最近30天的订单
    for i in range(30):
        order_date = datetime.now() - timedelta(days=i)

        # 每天随机创建2-5个订单
        daily_orders = random.randint(2, 5)

        for _ in range(daily_orders):
            customer = random.choice(customers)

            # 生成订单号
            order_no = f"YX{order_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"

            # 创建订单
            order = SalesOrder(
                order_no=order_no,
                customer_id=customer.id,
                total_amount=Decimal("0"),
                discount_amount=Decimal(str(random.choice([0, 50, 100, 150, 200]))),
                final_amount=Decimal("0"),
                payment_status=random.choice([PaymentStatus.PAID.value, PaymentStatus.UNPAID.value]),
                status=OrderStatus.ACTIVE.value,
                created_at=order_date,
            )
            db.add(order)
            db.flush()

            # 随机选择1-4个商品
            order_products = random.sample(products, random.randint(1, 4))
            order_total = Decimal("0")

            for product in order_products:
                quantity = random.randint(1, 3)
                unit_price = product.sale_price
                subtotal = unit_price * quantity
                order_total += subtotal

                item = SalesOrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
                db.add(item)
                items_count += 1

            # 更新订单总金额
            order.total_amount = order_total
            order.final_amount = order_total - order.discount_amount

            # 随机添加旧货 (30%概率)
            if random.random() < 0.3:
                old_appliance = OldAppliance(
                    category=random.choice(["冰箱", "空调", "洗衣机", "电视"]),
                    brand=random.choice(["美的", "格力", "海尔", "海信", "其他"]),
                    condition=random.choice(["新", "旧", "差"]),
                    recycle_price=Decimal(str(random.randint(100, 500))),
                    warehouse_id=warehouses[2].id,  # 旧货仓库
                    order_id=order.id,
                    recycle_date=order_date,
                )
                db.add(old_appliance)
                old_appliances_count += 1

            orders_count += 1

    db.commit()
    print(f"[OK] 已创建 {orders_count} 个销售订单")
    print(f"[OK] 已创建 {items_count} 个订单明细")
    print(f"[OK] 已创建 {old_appliances_count} 个旧货记录")


def main():
    """主函数"""
    print("=" * 60)
    print("开始生成测试数据...")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 创建基础数据
        brands = create_brands(db)
        categories = create_categories(db)
        products = create_products(db, brands, categories)
        warehouses = create_warehouses(db)

        # 创建库存和销售数据
        create_inventory(db, products, warehouses)
        customers = create_customers(db)
        create_sales_orders(db, products, customers, warehouses)

        print("=" * 60)
        print("[OK] 测试数据生成完成!")
        print("=" * 60)

        # 显示统计信息
        print("\n数据统计:")
        print(f"  品牌: {db.query(Brand).count()} 个")
        print(f"  电器类型: {db.query(Category).count()} 个")
        print(f"  商品: {db.query(Product).count()} 个")
        print(f"  仓库: {db.query(Warehouse).count()} 个")
        print(f"  库存记录: {db.query(Inventory).count()} 条")
        print(f"  客户: {db.query(Customer).count()} 个")
        print(f"  销售订单: {db.query(SalesOrder).count()} 个")
        print(f"  订单明细: {db.query(SalesOrderItem).count()} 条")
        print(f"  旧货记录: {db.query(OldAppliance).count()} 个")

    except Exception as e:
        print(f"[ERROR] 错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()