import pytest

class TestExercises:
    """Exercise endpoint tests"""

    def test_get_all_exercises(self, base_url, api_client):
        """Test GET /api/exercises returns 23 exercises"""
        response = api_client.get(f"{base_url}/api/exercises")
        assert response.status_code == 200, f"Get exercises failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 23, f"Expected 23 exercises, got {len(data)}"
        
        # Verify exercise structure
        if data:
            ex = data[0]
            assert "id" in ex, "Exercise should have id"
            assert "name" in ex, "Exercise should have name"
            assert "muscle_group" in ex, "Exercise should have muscle_group"
            assert "equipment" in ex, "Exercise should have equipment"
            assert "_id" not in ex, "MongoDB _id should be excluded"

    def test_get_exercises_by_muscle_group(self, base_url, api_client):
        """Test filtering exercises by muscle group"""
        response = api_client.get(f"{base_url}/api/exercises", params={"muscle_group": "chest"})
        assert response.status_code == 200, f"Filter failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have chest exercises"
        
        for ex in data:
            assert ex["muscle_group"] == "chest", "All exercises should be chest"

    def test_get_exercises_by_equipment(self, base_url, api_client):
        """Test filtering exercises by equipment"""
        response = api_client.get(f"{base_url}/api/exercises", params={"equipment": "barbell"})
        assert response.status_code == 200, f"Filter failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have barbell exercises"
        
        for ex in data:
            assert ex["equipment"] == "barbell", "All exercises should use barbell"

    def test_get_muscle_groups(self, base_url, api_client):
        """Test GET /api/muscle-groups"""
        response = api_client.get(f"{base_url}/api/muscle-groups")
        assert response.status_code == 200, f"Get muscle groups failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have muscle groups"
        assert "chest" in data, "Should include chest"
        assert "back" in data, "Should include back"
        assert "legs" in data, "Should include legs"

    def test_get_single_exercise(self, base_url, api_client):
        """Test GET /api/exercises/{id}"""
        response = api_client.get(f"{base_url}/api/exercises/bench-press")
        assert response.status_code == 200, f"Get exercise failed: {response.text}"
        
        data = response.json()
        assert data["id"] == "bench-press", "Exercise ID mismatch"
        assert data["name"] == "Bench Press", "Exercise name mismatch"
        assert "instructions" in data, "Should have instructions"
        assert "_id" not in data, "MongoDB _id should be excluded"

    def test_get_nonexistent_exercise(self, base_url, api_client):
        """Test GET /api/exercises/{id} with invalid ID"""
        response = api_client.get(f"{base_url}/api/exercises/nonexistent-exercise")
        assert response.status_code == 404, "Should return 404 for nonexistent exercise"
