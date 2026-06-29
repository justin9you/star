"""Tests for sales endpoints"""
import pytest


class TestCustomerManagement:
    """客户管理测试"""

    def test_create_customer(self, client, auth_headers):
        """创建客户"""
        response = client.post("/api/v1/sales/customers", json={
            "name": "张三",
            "phone": "13800138001",
            "province": "江苏省",
            "city": "苏州市",
            "district": "吴中区",
            "town": "临湖镇",
            "address": "某小区1号"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "张三"

    def test_list_customers(self, client, auth_headers):
        """获取客户列表"""
        # 创建测试客户
        client.post("/api/v1/sales/customers", json={
            "name": "李四",
            "phone": "13800138002"
        }, headers=auth_headers)

        response = client.get("/api/v1/sales/customers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 1

    def test_search_customers(self, client, auth_headers):
        """搜索客户"""
        client.post("/api/v1/sales/customers", json={
            "name": "王五",
            "phone": "13900139001"
        }, headers=auth_headers)

        response = client.get("/api/v1/sales/customers?keyword=王五", headers=auth_headers)
        assert response.status_code == 200
        items = response.json()["items"]
        assert any(c["name"] == "王五" for c in items)

    def test_update_customer(self, client, auth_headers):
        """更新客户"""
        # 创建客户
        create_resp = client.post("/api/v1/sales/customers", json={
            "name": "赵六",
            "phone": "13800138003"
        }, headers=auth_headers)
        customer_id = create_resp.json()["data"]["id"]

        # 更新客户
        response = client.put(f"/api/v1/sales/customers/{customer_id}", json={
            "phone": "13900139002"
        }, headers=auth_headers)
        assert response.status_code == 200

    def test_delete_customer_without_orders(self, client, auth_headers):
        """删除无订单的客户"""
        # 创建客户
        create_resp = client.post("/api/v1/sales/customers", json={
            "name": "待删除客户",
            "phone": "13800138004"
        }, headers=auth_headers)
        customer_id = create_resp.json()["data"]["id"]

        # 删除客户
        response = client.delete(f"/api/v1/sales/customers/{customer_id}", headers=auth_headers)
        assert response.status_code == 200


class TestSalesOrder:
    """销售订单测试"""

    @pytest.fixture(autouse=True)
    def setup_data(self, client, auth_headers):
        """每个测试前创建必要数据"""
        # 创建品牌和类型
        brand_resp = client.post("/api/v1/inventory/brands", json={"name": "订单测试品牌", "code": "ORD001"}, headers=auth_headers)
        category_resp = client.post("/api/v1/inventory/categories", json={"name": "订单测试类型", "code": "ORDCAT"}, headers=auth_headers)
        self.brand_id = brand_resp.json()["data"]["id"]
        self.category_id = category_resp.json()["data"]["id"]

        # 创建仓库 - 使用 ID=1 的默认仓库
        # (conftest.py 中已创建默认仓库)

        # 创建商品
        prod_resp = client.post("/api/v1/inventory/products", json={
            "name": "订单测试商品",
            "brand_id": self.brand_id,
            "category_id": self.category_id,
            "purchase_price": 100.00,
            "sale_price": 150.00,
            "unit": "台"
        }, headers=auth_headers)
        self.product_id = prod_resp.json()["data"]["id"]

        # 入库商品到默认仓库(ID=1)
        client.post("/api/v1/inventory/inventory/stock-in", json={
            "product_id": self.product_id,
            "warehouse_id": 1,
            "quantity": 100
        }, headers=auth_headers)

        # 创建客户
        cust_resp = client.post("/api/v1/sales/customers", json={
            "name": "订单测试客户",
            "phone": "13800138010"
        }, headers=auth_headers)
        self.customer_id = cust_resp.json()["data"]["id"]

    def test_create_order(self, client, auth_headers):
        """创建销售订单"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 2, "unit_price": 150.00}
            ]
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "order_no" in data["data"]
        assert data["data"]["final_amount"] == 300.00

    def test_create_order_with_discount(self, client, auth_headers):
        """创建带优惠的订单"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 2, "unit_price": 150.00}
            ],
            "discount_amount": 50.00
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["final_amount"] == 250.00

    def test_create_order_with_subsidy(self, client, auth_headers):
        """创建带国补的订单：客户实付 = 总额 - 国补"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 2, "unit_price": 150.00}
            ],
            "subsidy_amount": 60.00
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["final_amount"] == 240.00

    def test_create_order_with_discount_and_subsidy(self, client, auth_headers):
        """优惠与国补叠加：实付 = 总额 - 优惠 - 国补"""
        create_resp = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 2, "unit_price": 150.00}
            ],
            "discount_amount": 50.00,
            "subsidy_amount": 60.00
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        assert create_resp.json()["data"]["final_amount"] == 190.00

        # 详情中国补字段独立返回
        order_id = create_resp.json()["data"]["id"]
        detail = client.get(f"/api/v1/sales/orders/{order_id}").json()["data"]
        assert detail["subsidy_amount"] == 60.00
        assert detail["discount_amount"] == 50.00

    def test_create_order_subsidy_exceeds_total(self, client, auth_headers):
        """优惠与国补之和超过总额时创建失败"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}
            ],
            "discount_amount": 100.00,
            "subsidy_amount": 100.00
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_create_order_insufficient_stock(self, client, auth_headers):
        """库存不足时创建订单失败"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [
                {"product_id": self.product_id, "quantity": 200, "unit_price": 150.00}
            ]
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_list_orders(self, client, auth_headers):
        """获取订单列表"""
        # 先创建一个订单
        client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [{"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}]
        }, headers=auth_headers)

        response = client.get("/api/v1/sales/orders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 1

    def test_get_order_detail(self, client, auth_headers):
        """获取订单详情"""
        # 创建订单
        create_resp = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [{"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}]
        }, headers=auth_headers)
        order_id = create_resp.json()["data"]["id"]

        # 获取详情
        response = client.get(f"/api/v1/sales/orders/{order_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["id"] == order_id
        assert len(data["data"]["items"]) == 1

    def test_cancel_order(self, client, auth_headers):
        """作废订单"""
        # 创建订单
        create_resp = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [{"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}]
        }, headers=auth_headers)
        order_id = create_resp.json()["data"]["id"]

        # 作废订单
        response = client.post(f"/api/v1/sales/orders/{order_id}/cancel", headers=auth_headers)
        assert response.status_code == 200

        # 验证状态 - 中文值
        detail_resp = client.get(f"/api/v1/sales/orders/{order_id}")
        assert detail_resp.json()["data"]["status"] == "已作废"

    def test_mark_paid(self, client, auth_headers):
        """标记已付款"""
        # 创建订单
        create_resp = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [{"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}]
        }, headers=auth_headers)
        order_id = create_resp.json()["data"]["id"]

        # 标记付款
        response = client.post(f"/api/v1/sales/orders/{order_id}/pay", headers=auth_headers)
        assert response.status_code == 200

        # 验证状态 - 中文值
        detail_resp = client.get(f"/api/v1/sales/orders/{order_id}")
        assert detail_resp.json()["data"]["payment_status"] == "已付款"


class TestOldAppliance:
    """以旧换新测试"""

    @pytest.fixture(autouse=True)
    def setup_data(self, client, auth_headers):
        """创建测试数据"""
        # 创建品牌、类型、商品、客户
        brand_resp = client.post("/api/v1/inventory/brands", json={"name": "旧货测试品牌", "code": "OLD001"}, headers=auth_headers)
        category_resp = client.post("/api/v1/inventory/categories", json={"name": "旧货测试类型", "code": "OLDCAT"}, headers=auth_headers)
        prod_resp = client.post("/api/v1/inventory/products", json={
            "name": "旧货测试商品",
            "brand_id": brand_resp.json()["data"]["id"],
            "category_id": category_resp.json()["data"]["id"],
            "purchase_price": 100.00,
            "sale_price": 150.00,
            "unit": "台"
        }, headers=auth_headers)
        cust_resp = client.post("/api/v1/sales/customers", json={
            "name": "旧货测试客户",
            "phone": "13800138020"
        }, headers=auth_headers)

        self.product_id = prod_resp.json()["data"]["id"]
        self.customer_id = cust_resp.json()["data"]["id"]

        # 入库到默认仓库(ID=1)
        client.post("/api/v1/inventory/inventory/stock-in", json={
            "product_id": self.product_id,
            "warehouse_id": 1,
            "quantity": 10
        }, headers=auth_headers)

    def test_create_order_with_old_appliance(self, client, auth_headers):
        """创建带以旧换新的订单"""
        response = client.post("/api/v1/sales/orders", json={
            "customer_id": self.customer_id,
            "items": [{"product_id": self.product_id, "quantity": 1, "unit_price": 150.00}],
            "old_appliances": [
                {"category": "旧冰箱", "brand": "海尔", "condition": "旧", "recycle_price": 100.00}
            ]
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # 验证旧电器记录
        order_id = data["data"]["id"]
        detail_resp = client.get(f"/api/v1/sales/orders/{order_id}")
        assert len(detail_resp.json()["data"]["old_appliances"]) == 1