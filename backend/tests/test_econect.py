import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import run_seed

@pytest.fixture(scope="module")
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    run_seed(db)
    db.close()
    with TestClient(app) as c:
        yield c

def get_token(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]

def test_end_to_end_citizen_to_collector_workflow(client):
    citizen_token = get_token(client, "citizen@econect.in", "demo123")
    collector_token = get_token(client, "collector@econect.in", "demo123")
    admin_token = get_token(client, "admin@econect.in", "admin123")

    res = client.post(
        "/pickups",
        json={"category_code": "BATTERIES", "estimated_weight_kg": 5.0, "pickup_address": "12th Main, Indiranagar"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    pickup_id = data["pickup_id"]
    tracking_code = data["tracking_code"]
    assert data["locked_rate_per_kg"] == 55.0
    assert data["estimated_value_inr"] == 275.0

    admin_res = client.post(
        "/admin/prices",
        json={"category_code": "BATTERIES", "rate_per_kg": 90.0},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_res.status_code == 200

    acc = client.post(f"/pickups/{pickup_id}/accept", headers={"Authorization": f"Bearer {collector_token}"})
    assert acc.status_code == 200
    assert acc.json()["status"] == "ACCEPTED"

    dup = client.post(f"/pickups/{pickup_id}/accept", headers={"Authorization": f"Bearer {collector_token}"})
    assert dup.status_code == 409

    early_weigh = client.post(
        f"/pickups/{pickup_id}/weigh",
        json={"actual_weight_kg": 6.0},
        headers={"Authorization": f"Bearer {collector_token}"}
    )
    assert early_weigh.status_code == 400

    arr = client.post(f"/pickups/{pickup_id}/arrive", headers={"Authorization": f"Bearer {collector_token}"})
    assert arr.status_code == 200

    w = client.post(
        f"/pickups/{pickup_id}/weigh",
        json={"actual_weight_kg": 6.0},
        headers={"Authorization": f"Bearer {collector_token}"}
    )
    assert w.status_code == 200
    assert w.json()["final_value_inr"] == 330.0

    comp = client.post(f"/pickups/{pickup_id}/complete", headers={"Authorization": f"Bearer {collector_token}"})
    assert comp.status_code == 200
    assert comp.json()["status"] == "COMPLETED"

    journey = client.get(f"/waste/{tracking_code}/journey")
    assert journey.status_code == 200
    events = [e["event_type"] for e in journey.json()["events"]]
    assert events == ["CREATED", "WEIGHED", "COLLECTED"]

def test_user_validation_email_and_mobile(client):
    # 1. Valid user validation (matches seeded citizen)
    res = client.post("/auth/validate-user", json={
        "email": "citizen@econect.in",
        "phone": "+91 98765 43210"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["exists"] is True
    assert data["normalized_phone"] == "9876543210"
    assert data["user"]["email"] == "citizen@econect.in"

    # 2. Mismatched phone
    res2 = client.post("/auth/validate-user", json={
        "email": "citizen@econect.in",
        "phone": "9999999999"
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_valid"] is False
    assert data2["exists"] is True
    assert "does not match" in data2["message"]

    # 3. Nonexistent user
    res3 = client.post("/auth/validate-user", json={
        "email": "unknown@econect.in",
        "phone": "9876543210"
    })
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["is_valid"] is False
    assert data3["exists"] is False

    # 4. Invalid phone format
    res4 = client.post("/auth/validate-user", json={
        "email": "citizen@econect.in",
        "phone": "12345"
    })
    assert res4.status_code == 400

def test_otp_verification(client):
    send_res = client.post("/auth/send-otp", json={
        "email": "collector@econect.in",
        "phone": "9876543211"
    })
    assert send_res.status_code == 200
    demo_otp = send_res.json()["demo_otp"]

    verify_res = client.post("/auth/verify-otp", json={
        "email": "collector@econect.in",
        "phone": "9876543211",
        "otp": demo_otp
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True

def test_ai_chat_navigation(client):
    res = client.post("/ai/chat", json={
        "message": "I want to book a pickup for my batteries",
        "current_role": "CITIZEN"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["navigation_actions"]) > 0
    assert any(a["target"] == "pickup_form" for a in data["navigation_actions"])

    res2 = client.post("/ai/chat", json={
        "message": "how does collector digital weighing work?"
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert any(a["target"] == "collector_queue" for a in data2["navigation_actions"])
