import pytest

class TestScan:
    """Machine scan endpoint tests (simulated)"""

    def test_scan_detect(self, base_url, api_client, auth_headers):
        """Test POST /api/scan/detect (simulated machine detection)"""
        response = api_client.post(f"{base_url}/api/scan/detect", headers=auth_headers)
        assert response.status_code == 200, f"Scan detect failed: {response.text}"
        
        data = response.json()
        assert "detected" in data, "Should have detected machine"
        assert "exercises" in data, "Should have exercises for detected machine"
        
        # Verify detected structure
        detected = data["detected"]
        assert "name" in detected, "Detected should have name"
        assert "equipment" in detected, "Detected should have equipment"
        assert "confidence" in detected, "Detected should have confidence"
        assert 0 <= detected["confidence"] <= 1, "Confidence should be between 0 and 1"
        
        # Verify exercises
        exercises = data["exercises"]
        assert isinstance(exercises, list), "Exercises should be a list"

    def test_scan_requires_auth(self, base_url, api_client):
        """Test scan endpoint requires authentication"""
        response = api_client.post(f"{base_url}/api/scan/detect")
        assert response.status_code == 401, "Should require authentication"
