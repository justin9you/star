from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.inventory import Inventory
from app.services.log import log_operation


# ==================== 品牌管理 ====================

def create_brand(db: Session, name: str, code: str, remark: Optional[str] = None, user_id: int = 1) -> Brand:
    existing = db.query(Brand).filter(Brand.name == name).first()
    if existing:
        raise ValueError(f"品牌名称已存在: {name}")
    existing_code = db.query(Brand).filter(Brand.code == code).first()
    if existing_code:
        raise ValueError(f"品牌编码已存在: {code}")

    brand = Brand(name=name, code=code, remark=remark)
    db.add(brand)
    db.commit()
    db.refresh(brand)

    log_operation(db, user_id, "创建品牌", f"创建品牌: {name}", after_data={"id": brand.id, "name": name, "code": code})
    return brand


def get_brands(db: Session, page: int = 1, page_size: int = 20, keyword: Optional[str] = None) -> tuple[list[Brand], int]:
    query = db.query(Brand)
    if keyword:
        query = query.filter(or_(Brand.name.contains(keyword), Brand.code.contains(keyword)))
    total = query.count()
    brands = query.order_by(Brand.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return brands, total


def get_brand(db: Session, brand_id: int) -> Optional[Brand]:
    return db.query(Brand).filter(Brand.id == brand_id).first()


def update_brand(db: Session, brand_id: int, name: Optional[str] = None, code: Optional[str] = None,
                 status: Optional[bool] = None, remark: Optional[str] = None, user_id: int = 1) -> Brand:
    brand = get_brand(db, brand_id)
    if not brand:
        raise ValueError("品牌不存在")

    before = {"name": brand.name, "code": brand.code, "status": brand.status, "remark": brand.remark}

    if name is not None:
        existing = db.query(Brand).filter(Brand.name == name, Brand.id != brand_id).first()
        if existing:
            raise ValueError(f"品牌名称已存在: {name}")
        brand.name = name
    if code is not None:
        existing_code = db.query(Brand).filter(Brand.code == code, Brand.id != brand_id).first()
        if existing_code:
            raise ValueError(f"品牌编码已存在: {code}")
        brand.code = code
    if status is not None:
        brand.status = status
    if remark is not None:
        brand.remark = remark

    brand.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(brand)

    after = {"name": brand.name, "code": brand.code, "status": brand.status, "remark": brand.remark}
    log_operation(db, user_id, "更新品牌", f"更新品牌: {brand.name}", before_data=before, after_data=after)
    return brand


def delete_brand(db: Session, brand_id: int, user_id: int = 1) -> None:
    brand = get_brand(db, brand_id)
    if not brand:
        raise ValueError("品牌不存在")

    product_count = db.query(Product).filter(Product.brand_id == brand_id).count()
    if product_count > 0:
        raise ValueError(f"该品牌下有 {product_count} 个商品，无法删除")

    log_operation(db, user_id, "删除品牌", f"删除品牌: {brand.name}", before_data={"id": brand.id, "name": brand.name})
    db.delete(brand)
    db.commit()


# ==================== 电器类型管理 ====================

def create_category(db: Session, name: str, code: str, parent_id: Optional[int] = None,
                    sort: int = 0, user_id: int = 1) -> Category:
    existing = db.query(Category).filter(Category.code == code).first()
    if existing:
        raise ValueError(f"类型编码已存在: {code}")

    category = Category(name=name, code=code, parent_id=parent_id, sort=sort)
    db.add(category)
    db.commit()
    db.refresh(category)

    log_operation(db, user_id, "创建类型", f"创建类型: {name}", after_data={"id": category.id, "name": name, "code": code})
    return category


def get_categories(db: Session, page: int = 1, page_size: int = 100,
                   parent_id: Optional[int] = None) -> tuple[list[Category], int]:
    query = db.query(Category)
    if parent_id is not None:
        query = query.filter(Category.parent_id == parent_id)
    total = query.count()
    categories = query.order_by(Category.sort, Category.id).offset((page - 1) * page_size).limit(page_size).all()
    return categories, total


def get_category_tree(db: Session) -> list[dict]:
    categories = db.query(Category).filter(Category.status == True).order_by(Category.sort, Category.id).all()
    category_map = {}
    for cat in categories:
        category_map[cat.id] = {
            "id": cat.id, "name": cat.name, "code": cat.code,
            "parent_id": cat.parent_id, "sort": cat.sort, "children": []
        }
    tree = []
    for cat in categories:
        node = category_map[cat.id]
        if cat.parent_id and cat.parent_id in category_map:
            category_map[cat.parent_id]["children"].append(node)
        else:
            tree.append(node)
    return tree


def get_category(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()


def update_category(db: Session, category_id: int, name: Optional[str] = None, code: Optional[str] = None,
                    parent_id: Optional[int] = None, sort: Optional[int] = None,
                    status: Optional[bool] = None, user_id: int = 1) -> Category:
    category = get_category(db, category_id)
    if not category:
        raise ValueError("类型不存在")

    if name is not None:
        category.name = name
    if code is not None:
        existing = db.query(Category).filter(Category.code == code, Category.id != category_id).first()
        if existing:
            raise ValueError(f"类型编码已存在: {code}")
        category.code = code
    if parent_id is not None:
        category.parent_id = parent_id
    if sort is not None:
        category.sort = sort
    if status is not None:
        category.status = status

    category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(category)

    log_operation(db, user_id, "更新类型", f"更新类型: {category.name}")
    return category


def delete_category(db: Session, category_id: int, user_id: int = 1) -> None:
    category = get_category(db, category_id)
    if not category:
        raise ValueError("类型不存在")

    children = db.query(Category).filter(Category.parent_id == category_id).count()
    if children > 0:
        raise ValueError("该类型下有子类型，无法删除")

    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        raise ValueError(f"该类型下有 {product_count} 个商品，无法删除")

    log_operation(db, user_id, "删除类型", f"删除类型: {category.name}")
    db.delete(category)
    db.commit()


# ==================== 仓库管理 ====================

def create_warehouse(db: Session, name: str, type: str = "主仓", address: Optional[str] = None,
                     manager: Optional[str] = None, phone: Optional[str] = None, user_id: int = 1) -> Warehouse:
    existing = db.query(Warehouse).filter(Warehouse.name == name).first()
    if existing:
        raise ValueError(f"仓库名称已存在: {name}")

    warehouse = Warehouse(name=name, type=type, address=address, manager=manager, phone=phone)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    log_operation(db, user_id, "创建仓库", f"创建仓库: {name}", after_data={"id": warehouse.id, "name": name, "type": type})
    return warehouse


def get_warehouses(db: Session, page: int = 1, page_size: int = 20,
                   warehouse_type: Optional[str] = None) -> tuple[list[Warehouse], int]:
    query = db.query(Warehouse)
    if warehouse_type:
        query = query.filter(Warehouse.type == warehouse_type)
    total = query.count()
    warehouses = query.order_by(Warehouse.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return warehouses, total


def get_warehouse(db: Session, warehouse_id: int) -> Optional[Warehouse]:
    return db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()


def get_default_old_warehouse(db: Session) -> Optional[Warehouse]:
    warehouse = db.query(Warehouse).filter(Warehouse.type == "旧货专用仓", Warehouse.status == True).first()
    if not warehouse:
        warehouse = create_warehouse(db, "旧货专用仓", type="旧货专用仓")
    return warehouse


def update_warehouse(db: Session, warehouse_id: int, name: Optional[str] = None, type: Optional[str] = None,
                     address: Optional[str] = None, manager: Optional[str] = None,
                     phone: Optional[str] = None, status: Optional[bool] = None, user_id: int = 1) -> Warehouse:
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise ValueError("仓库不存在")

    if name is not None:
        existing = db.query(Warehouse).filter(Warehouse.name == name, Warehouse.id != warehouse_id).first()
        if existing:
            raise ValueError(f"仓库名称已存在: {name}")
        warehouse.name = name
    if type is not None:
        warehouse.type = type
    if address is not None:
        warehouse.address = address
    if manager is not None:
        warehouse.manager = manager
    if phone is not None:
        warehouse.phone = phone
    if status is not None:
        warehouse.status = status

    warehouse.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(warehouse)

    log_operation(db, user_id, "更新仓库", f"更新仓库: {warehouse.name}")
    return warehouse


def delete_warehouse(db: Session, warehouse_id: int, user_id: int = 1) -> None:
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise ValueError("仓库不存在")

    inventory_count = db.query(Inventory).filter(Inventory.warehouse_id == warehouse_id, Inventory.quantity > 0).count()
    if inventory_count > 0:
        raise ValueError("该仓库有库存记录，无法删除")

    log_operation(db, user_id, "删除仓库", f"删除仓库: {warehouse.name}")
    db.delete(warehouse)
    db.commit()


# ==================== 商品管理 ====================

def create_product(db: Session, name: str, brand_id: int, category_id: int,
                   purchase_price, sale_price, unit: str = "台",
                   spec: Optional[str] = None, remark: Optional[str] = None, user_id: int = 1) -> Product:
    brand = get_brand(db, brand_id)
    if not brand:
        raise ValueError("品牌不存在")
    category = get_category(db, category_id)
    if not category:
        raise ValueError("类型不存在")

    product = Product(
        name=name, brand_id=brand_id, category_id=category_id,
        spec=spec, purchase_price=purchase_price, sale_price=sale_price,
        unit=unit, remark=remark
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # 自动生成二维码
    product.qr_code = f"P{product.id:06d}"
    db.commit()
    db.refresh(product)

    log_operation(db, user_id, "创建商品", f"创建商品: {name}", after_data={"id": product.id, "name": name, "qr_code": product.qr_code})
    return product


def get_products(db: Session, page: int = 1, page_size: int = 20,
                 brand_id: Optional[int] = None, category_id: Optional[int] = None,
                 keyword: Optional[str] = None, only_active: bool = False) -> tuple[list[Product], int]:
    query = db.query(Product)
    if brand_id:
        query = query.filter(Product.brand_id == brand_id)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if only_active:
        # 兼容老数据：status 为 NULL 视为上架
        query = query.filter(or_(Product.status == True, Product.status.is_(None)))
    if keyword:
        query = query.filter(or_(
            Product.name.contains(keyword),
            Product.qr_code.contains(keyword),
            Product.spec.contains(keyword)
        ))
    total = query.count()
    products = query.order_by(Product.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return products, total


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_qr(db: Session, qr_code: str) -> Optional[Product]:
    return db.query(Product).filter(Product.qr_code == qr_code).first()


def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    return db.query(Product).filter(Product.barcode == barcode).first()


def get_product_by_code(db: Session, code: str) -> Optional[dict]:
    """根据二维码或条形码查询商品，返回商品信息和库存"""
    product = db.query(Product).filter(
        or_(Product.qr_code == code, Product.barcode == code)
    ).first()

    if not product:
        return None

    # 查询总库存
    inventory_records = db.query(Inventory).filter(
        Inventory.product_id == product.id
    ).all()

    total_quantity = sum(inv.quantity for inv in inventory_records)

    brand = get_brand(db, product.brand_id)
    category = get_category(db, product.category_id)

    return {
        "id": product.id,
        "name": product.name,
        "brand_id": product.brand_id,
        "category_id": product.category_id,
        "brand_name": brand.name if brand else "未知",
        "category_name": category.name if category else "未知",
        "spec": product.spec,
        "purchase_price": float(product.purchase_price),
        "sale_price": float(product.sale_price),
        "unit": product.unit,
        "qr_code": product.qr_code,
        "barcode": product.barcode,
        "total_stock": total_quantity,
        "has_stock": total_quantity > 0
    }


def update_product(db: Session, product_id: int, user_id: int = 1, **kwargs) -> Product:
    product = get_product(db, product_id)
    if not product:
        raise ValueError("商品不存在")

    if "brand_id" in kwargs and kwargs["brand_id"] is not None:
        if not get_brand(db, kwargs["brand_id"]):
            raise ValueError("品牌不存在")
    if "category_id" in kwargs and kwargs["category_id"] is not None:
        if not get_category(db, kwargs["category_id"]):
            raise ValueError("类型不存在")

    for key, value in kwargs.items():
        if value is not None and hasattr(product, key):
            setattr(product, key, value)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)

    log_operation(db, user_id, "更新商品", f"更新商品: {product.name}")
    return product


def delete_product(db: Session, product_id: int, user_id: int = 1) -> None:
    product = get_product(db, product_id)
    if not product:
        raise ValueError("商品不存在")

    inventory_count = db.query(Inventory).filter(Inventory.product_id == product_id, Inventory.quantity > 0).count()
    if inventory_count > 0:
        raise ValueError("该商品有库存，无法删除")

    log_operation(db, user_id, "删除商品", f"删除商品: {product.name}")
    db.delete(product)
    db.commit()


# ==================== 库存管理 ====================

def get_or_create_inventory(db: Session, product_id: int, warehouse_id: int,
                            min_quantity: int = 10, commit: bool = True) -> Inventory:
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == warehouse_id
    ).first()

    if not inv:
        inv = Inventory(product_id=product_id, warehouse_id=warehouse_id, quantity=0, min_quantity=min_quantity)
        db.add(inv)
        if commit:
            db.commit()
            db.refresh(inv)
        else:
            db.flush()
    return inv


def stock_in(db: Session, product_id: int, warehouse_id: int, quantity: int,
             purchase_price=None, user_id: int = 1, is_gift: bool = False,
             reason: str = "采购入库", commit: bool = True) -> Inventory:
    """入库操作，支持搭送库存

    commit=False 时不提交事务，供 create_order/进货等编排函数在同一事务内统一
    提交，保证库存变更与订单写入的原子性。
    """
    if quantity <= 0:
        raise ValueError("入库数量必须大于0")

    product = get_product(db, product_id)
    if not product:
        raise ValueError("商品不存在")
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        raise ValueError("仓库不存在")

    inv = get_or_create_inventory(db, product_id, warehouse_id, commit=commit)
    before_quantity = inv.quantity
    before_gift = inv.gift_quantity

    if is_gift:
        inv.gift_quantity = (inv.gift_quantity or 0) + quantity
    else:
        inv.quantity += quantity

    inv.updated_at = datetime.utcnow()

    # 非搭送项更新商品进货价
    if purchase_price is not None and not is_gift:
        product.purchase_price = purchase_price

    if commit:
        db.commit()
        db.refresh(inv)
    else:
        db.flush()

    log_operation(db, user_id, reason,
                  f"商品 {product.name} 入库 {quantity}{'(搭送)' if is_gift else ''} 到 {warehouse.name}",
                  before_data={"quantity": before_quantity, "gift_quantity": before_gift},
                  after_data={"quantity": inv.quantity, "gift_quantity": inv.gift_quantity, "warehouse": warehouse.name},
                  commit=commit)
    return inv


def stock_out(db: Session, product_id: int, warehouse_id: int, quantity: int,
              user_id: int = 1, is_gift: bool = False, reason: str = "销售出库",
              commit: bool = True) -> Inventory:
    """出库操作，正常出库优先消耗搭送库存，作废出库按 is_gift 精确扣减

    commit=False 时不提交事务，供编排函数在同一事务内统一提交，保证原子性。
    """
    if quantity <= 0:
        raise ValueError("出库数量必须大于0")

    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == warehouse_id
    ).first()

    if not inv:
        raise ValueError("库存记录不存在")

    before_quantity = inv.quantity
    before_gift = inv.gift_quantity

    if is_gift:
        # 作废进货单时精确扣减搭送池
        if (inv.gift_quantity or 0) < quantity:
            raise ValueError(f"搭送库存不足: 当前搭送库存 {inv.gift_quantity or 0}，需要 {quantity}")
        inv.gift_quantity -= quantity
    else:
        # 正常出库：先扣搭送库存，再扣正常库存
        total_available = inv.quantity + (inv.gift_quantity or 0)
        if total_available < quantity:
            raise ValueError(f"库存不足: 当前总库存 {total_available}，需要 {quantity}")

        remaining = quantity
        if (inv.gift_quantity or 0) > 0:
            consume_gift = min(inv.gift_quantity or 0, remaining)
            inv.gift_quantity -= consume_gift
            remaining -= consume_gift
        if remaining > 0:
            inv.quantity -= remaining

    inv.updated_at = datetime.utcnow()
    if commit:
        db.commit()
        db.refresh(inv)
    else:
        db.flush()

    product = get_product(db, product_id)
    warehouse = get_warehouse(db, warehouse_id)
    log_operation(db, user_id, reason,
                  f"商品 {product.name if product else product_id} 从 {warehouse.name if warehouse else warehouse_id} 出库 {quantity}",
                  before_data={"quantity": before_quantity, "gift_quantity": before_gift},
                  after_data={"quantity": inv.quantity, "gift_quantity": inv.gift_quantity},
                  commit=commit)
    return inv


def get_inventory_list(db: Session, page: int = 1, page_size: int = 20,
                       product_id: Optional[int] = None, warehouse_id: Optional[int] = None,
                       keyword: Optional[str] = None, low_stock_only: bool = False) -> tuple[list[dict], int]:
    """库存列表查询"""
    query = db.query(Inventory)

    if product_id:
        query = query.filter(Inventory.product_id == product_id)
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if keyword:
        query = query.join(Product).filter(or_(
            Product.name.contains(keyword),
            Product.qr_code.contains(keyword)
        ))
    if low_stock_only:
        query = query.filter(Inventory.quantity <= Inventory.min_quantity)

    total = query.count()
    items = query.order_by(Inventory.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for item in items:
        product = get_product(db, item.product_id)
        warehouse = get_warehouse(db, item.warehouse_id)

        # 获取品牌和类型信息
        brand_name = ""
        category_name = ""
        if product:
            brand = get_brand(db, product.brand_id)
            category = get_category(db, product.category_id)
            brand_name = brand.name if brand else ""
            category_name = category.name if category else ""

        result.append({
            "id": item.id,
            "product_id": item.product_id,
            "warehouse_id": item.warehouse_id,
            "quantity": item.quantity,
            "gift_quantity": item.gift_quantity,
            "min_quantity": item.min_quantity,
            "product_name": product.name if product else "未知",
            "brand_name": brand_name,
            "category_name": category_name,
            "warehouse_name": warehouse.name if warehouse else "未知",
            "is_low_stock": item.quantity <= item.min_quantity,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None
        })

    return result, total


def get_low_stock_list(db: Session) -> list[dict]:
    """获取低库存预警列表"""
    items = db.query(Inventory).filter(Inventory.quantity <= Inventory.min_quantity).all()
    result = []
    for item in items:
        product = get_product(db, item.product_id)
        warehouse = get_warehouse(db, item.warehouse_id)
        result.append({
            "id": item.id,
            "product_id": item.product_id,
            "warehouse_id": item.warehouse_id,
            "quantity": item.quantity,
            "min_quantity": item.min_quantity,
            "product_name": product.name if product else "未知",
            "warehouse_name": warehouse.name if warehouse else "未知",
            "is_low_stock": True
        })
    return result