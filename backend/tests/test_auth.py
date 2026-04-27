"""Tests for authentication endpoints"""
import pytest


class TestAuthLogin:
    """登录接口测试"""

    def test_login_success(self, client, test_user):
        """正确密码登录成功"""
        response = client.post("/api/v1/auth/login", data={
            "username": "testuser",
            "password": "testpass123"
        })
        assert response.status_code == 200
        data = response.json()
        # 登录接口直接返回 Token 模型
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        """错误密码登录失败"""
        response = client.post("/api/v1/auth/login", data={
            "username": "testuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """不存在用户登录失败"""
        response = client.post("/api/v1/auth/login", data={
            "username": "nonexistent",
            "password": "anypassword"
        })
        assert response.status_code == 401


class TestAuthMe:
    """获取当前用户信息测试"""

    def test_me_authenticated(self, client, auth_headers):
        """已认证用户获取信息"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"

    def test_me_unauthenticated(self, client):
        """未认证用户拒绝访问"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401