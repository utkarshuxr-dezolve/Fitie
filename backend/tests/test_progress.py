import pytest

class TestProgress:
    """Progress tracking endpoint tests"""

    def test_log_weight(self, base_url, api_client, auth_headers):
        """Test POST /api/progress/weight"""
        response = api_client.post(f"{base_url}/api/progress/weight",
            headers=auth_headers,
            json={"weight": 75.5}
        )
        assert response.status_code == 200, f"Log weight failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Weight log should have id"
        assert data["weight"] == 75.5, "Weight mismatch"
        assert "date" in data, "Should have date"
        assert "_id" not in data, "MongoDB _id should be excluded"

    def test_get_weight_history(self, base_url, api_client, auth_headers):
        """Test GET /api/progress/weight"""
        # First log some weights
        api_client.post(f"{base_url}/api/progress/weight", headers=auth_headers, json={"weight": 76.0})
        api_client.post(f"{base_url}/api/progress/weight", headers=auth_headers, json={"weight": 75.8})
        
        # Get history
        response = api_client.get(f"{base_url}/api/progress/weight", headers=auth_headers, params={"days": 30})
        assert response.status_code == 200, f"Get weight history failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 2, "Should have weight entries"

    def test_get_progress_stats(self, base_url, api_client, auth_headers):
        """Test GET /api/progress/stats"""
        response = api_client.get(f"{base_url}/api/progress/stats", headers=auth_headers)
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        
        data = response.json()
        assert "total_workouts" in data, "Should have total_workouts"
        assert "week_workouts" in data, "Should have week_workouts"
        assert "today_calories" in data, "Should have today_calories"
        assert "streak" in data, "Should have streak"
        assert "goal" in data, "Should have goal"
        
        # Verify data types
        assert isinstance(data["total_workouts"], int), "total_workouts should be int"
        assert isinstance(data["streak"], int), "streak should be int"

    def test_progress_requires_auth(self, base_url, api_client):
        """Test progress endpoints require authentication"""
        response = api_client.post(f"{base_url}/api/progress/weight", json={"weight": 75})
        assert response.status_code == 401, "Should require authentication"
