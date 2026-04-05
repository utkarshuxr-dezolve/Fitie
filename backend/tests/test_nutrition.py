import pytest
from datetime import datetime

class TestNutrition:
    """Nutrition endpoint tests"""

    def test_log_meal(self, base_url, api_client, auth_headers):
        """Test POST /api/meals"""
        response = api_client.post(f"{base_url}/api/meals",
            headers=auth_headers,
            json={
                "food_name": "Chicken Breast",
                "calories": 165,
                "protein": 31,
                "carbs": 0,
                "fat": 3.6,
                "meal_type": "lunch"
            }
        )
        assert response.status_code == 200, f"Log meal failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Meal should have id"
        assert data["food_name"] == "Chicken Breast", "Food name mismatch"
        assert data["calories"] == 165, "Calories mismatch"
        assert data["protein"] == 31, "Protein mismatch"
        assert data["meal_type"] == "lunch", "Meal type mismatch"
        assert "_id" not in data, "MongoDB _id should be excluded"

    def test_get_todays_meals(self, base_url, api_client, auth_headers):
        """Test GET /api/meals/today"""
        # First log a meal
        api_client.post(f"{base_url}/api/meals",
            headers=auth_headers,
            json={
                "food_name": "Oatmeal",
                "calories": 150,
                "protein": 5,
                "carbs": 27,
                "fat": 3,
                "meal_type": "breakfast"
            }
        )
        
        # Get today's meals
        response = api_client.get(f"{base_url}/api/meals/today", headers=auth_headers)
        assert response.status_code == 200, f"Get today's meals failed: {response.text}"
        
        data = response.json()
        assert "meals" in data, "Should have meals array"
        assert "totals" in data, "Should have totals"
        assert "date" in data, "Should have date"
        
        # Verify totals structure
        totals = data["totals"]
        assert "calories" in totals, "Totals should have calories"
        assert "protein" in totals, "Totals should have protein"
        assert "carbs" in totals, "Totals should have carbs"
        assert "fat" in totals, "Totals should have fat"
        
        # Should have at least the meals we logged
        assert len(data["meals"]) >= 2, "Should have logged meals"

    def test_search_foods(self, base_url, api_client):
        """Test GET /api/foods/search"""
        response = api_client.get(f"{base_url}/api/foods/search", params={"q": "chicken"})
        assert response.status_code == 200, f"Search foods failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should find chicken in database"
        
        # Verify food structure
        food = data[0]
        assert "name" in food, "Food should have name"
        assert "calories" in food, "Food should have calories"
        assert "chicken" in food["name"].lower(), "Should match search query"
        assert "_id" not in food, "MongoDB _id should be excluded"

    def test_get_meal_history(self, base_url, api_client, auth_headers):
        """Test GET /api/meals/history"""
        response = api_client.get(f"{base_url}/api/meals/history", headers=auth_headers, params={"days": 7})
        assert response.status_code == 200, f"Get meal history failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"

    def test_meal_requires_auth(self, base_url, api_client):
        """Test meal endpoints require authentication"""
        response = api_client.post(f"{base_url}/api/meals", json={"food_name": "Test", "calories": 100})
        assert response.status_code == 401, "Should require authentication"
