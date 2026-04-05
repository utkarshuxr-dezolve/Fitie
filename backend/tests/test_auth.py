import pytest
import requests
import uuid

class TestAuth:
    """Authentication endpoint tests"""

    def test_register_new_user(self, base_url, api_client):
        """Test user registration"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@fitie.com"
        response = api_client.post(f"{base_url}/api/auth/register", json={
            "email": unique_email,
            "password": "test123456",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "id" in data, "User ID not in response"
        assert data["email"] == unique_email, "Email mismatch"
        assert data["name"] == "Test User", "Name mismatch"

    def test_register_duplicate_email(self, base_url, api_client):
        """Test registration with existing email fails"""
        response = api_client.post(f"{base_url}/api/auth/register", json={
            "email": "admin@fitie.com",
            "password": "test123",
            "name": "Duplicate"
        })
        assert response.status_code == 400, "Should reject duplicate email"
        assert "already registered" in response.json()["detail"].lower()

    def test_login_success(self, base_url, api_client):
        """Test successful login"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@fitie.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "id" in data, "User ID not in response"
        assert data["email"] == "admin@fitie.com", "Email mismatch"

    def test_login_invalid_credentials(self, base_url, api_client):
        """Test login with wrong password"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@fitie.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should reject invalid credentials"

    def test_get_me_authenticated(self, base_url, api_client, auth_headers):
        """Test /auth/me with valid token"""
        response = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Get me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == "admin@fitie.com", "Email mismatch"
        assert "password_hash" not in data, "Password hash should not be exposed"
        assert "_id" not in data, "MongoDB _id should be excluded"
        assert "id" in data, "Should have user id"

    def test_get_me_unauthenticated(self, base_url, api_client):
        """Test /auth/me without token"""
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401, "Should require authentication"
