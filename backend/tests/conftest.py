import pytest
import requests
import os

@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL not set in environment")
    return url.rstrip('/')

@pytest.fixture
def api_client():
    """Fresh requests session for each test"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def admin_token(base_url):
    """Login as admin and return token"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{base_url}/api/auth/login", json={
        "email": "admin@fitie.com",
        "password": os.environ.get("ADMIN_PASSWORD", "fitie_admin_2026!")
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    data = response.json()
    return data.get("token")

@pytest.fixture
def auth_headers(admin_token):
    """Headers with admin auth token"""
    return {"Authorization": f"Bearer {admin_token}"}
