import pytest

class TestHealth:
    """Health endpoint tests"""

    def test_upload_health_report(self, base_url, api_client, auth_headers):
        """Test POST /api/health/report"""
        response = api_client.post(f"{base_url}/api/health/report",
            headers=auth_headers,
            json={
                "report_type": "blood_work",
                "data": {
                    "hemoglobin": "14.5 g/dL",
                    "cholesterol": "180 mg/dL",
                    "blood_sugar": "92 mg/dL"
                }
            }
        )
        assert response.status_code == 200, f"Upload report failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Report should have id"
        assert data["report_type"] == "blood_work", "Report type mismatch"
        assert "insights" in data, "Should have AI insights"
        assert "_id" not in data, "MongoDB _id should be excluded"
        
        # Verify insights structure
        insights = data["insights"]
        assert "summary" in insights, "Insights should have summary"
        assert "recommendations" in insights, "Insights should have recommendations"
        assert isinstance(insights["recommendations"], list), "Recommendations should be a list"

    def test_get_health_reports(self, base_url, api_client, auth_headers):
        """Test GET /api/health/reports"""
        # First upload a report
        api_client.post(f"{base_url}/api/health/report",
            headers=auth_headers,
            json={
                "report_type": "general_checkup",
                "data": {"bmi": "23.5", "bp": "120/80"}
            }
        )
        
        # Get reports
        response = api_client.get(f"{base_url}/api/health/reports", headers=auth_headers)
        assert response.status_code == 200, f"Get reports failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 1, "Should have at least one report"

    def test_health_requires_auth(self, base_url, api_client):
        """Test health endpoints require authentication"""
        response = api_client.post(f"{base_url}/api/health/report", json={"report_type": "test", "data": {}})
        assert response.status_code == 401, "Should require authentication"
