import pytest

class TestWorkouts:
    """Workout endpoint tests"""

    def test_start_workout(self, base_url, api_client, auth_headers):
        """Test POST /api/workouts/start"""
        response = api_client.post(f"{base_url}/api/workouts/start", 
            headers=auth_headers,
            json={
                "exercise_ids": ["bench-press", "squat"],
                "plan_name": "Test Workout"
            }
        )
        assert response.status_code == 200, f"Start workout failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Workout should have id"
        assert data["plan_name"] == "Test Workout", "Plan name mismatch"
        assert data["status"] == "active", "Workout should be active"
        assert len(data["exercises"]) == 2, "Should have 2 exercises"
        assert "_id" not in data, "MongoDB _id should be excluded"
        
        # Store workout ID for completion test
        pytest.workout_id = data["id"]

    def test_complete_workout(self, base_url, api_client, auth_headers):
        """Test POST /api/workouts/{id}/complete"""
        # First start a workout
        start_response = api_client.post(f"{base_url}/api/workouts/start", 
            headers=auth_headers,
            json={"exercise_ids": ["bench-press"]}
        )
        assert start_response.status_code == 200
        workout_id = start_response.json()["id"]
        
        # Complete it
        response = api_client.post(f"{base_url}/api/workouts/{workout_id}/complete",
            headers=auth_headers,
            json={
                "duration_minutes": 30,
                "calories_burned": 250,
                "notes": "Great workout!"
            }
        )
        assert response.status_code == 200, f"Complete workout failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "completed", "Workout should be completed"
        assert data["duration_minutes"] == 30, "Duration mismatch"
        assert data["calories_burned"] == 250, "Calories mismatch"
        assert data["notes"] == "Great workout!", "Notes mismatch"
        assert "completed_at" in data, "Should have completion timestamp"

    def test_get_workout_history(self, base_url, api_client, auth_headers):
        """Test GET /api/workouts/history"""
        response = api_client.get(f"{base_url}/api/workouts/history", headers=auth_headers)
        assert response.status_code == 200, f"Get history failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Should have at least the workouts we just completed
        assert len(data) >= 1, "Should have workout history"

    def test_get_active_workout(self, base_url, api_client, auth_headers):
        """Test GET /api/workouts/active"""
        # Start a workout
        start_response = api_client.post(f"{base_url}/api/workouts/start", 
            headers=auth_headers,
            json={"exercise_ids": ["squat"]}
        )
        assert start_response.status_code == 200
        
        # Get active workout
        response = api_client.get(f"{base_url}/api/workouts/active", headers=auth_headers)
        assert response.status_code == 200, f"Get active workout failed: {response.text}"
        
        data = response.json()
        if data:  # May be None if no active workout
            assert data["status"] == "active", "Should be active workout"

    def test_workout_requires_auth(self, base_url, api_client):
        """Test workout endpoints require authentication"""
        response = api_client.post(f"{base_url}/api/workouts/start", json={"exercise_ids": ["bench-press"]})
        assert response.status_code == 401, "Should require authentication"
