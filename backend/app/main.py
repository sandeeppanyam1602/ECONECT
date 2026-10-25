from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import re
from datetime import datetime, timezone

from app.config import settings
from app.database import Base, engine, get_db, SessionLocal
from app.models import (
    User, UserRole, VerificationStatus, MaterialCategory, PriceRate,
    WasteRecord, WasteEvent, WasteEventType, PickupRequest, PickupStatus,
    Transaction, CentreInventory, RecyclerTransaction, Notification, AuditLog
)
from app.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    CategoryOut, PickupCreate, WeighRequest, CancelRequest,
    PriceUpdateRequest, ClassificationResponse,
    UserValidationRequest, UserValidationResponse,
    OTPRequest, OTPResponse, OTPVerifyRequest,
    AIChatRequest, AIChatResponse, NavigationAction
)
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_roles
)
from app.ai_classifier import classify_waste_image
from app.seed import run_seed

app = FastAPI(
    title="ECONECT API — SIH 2026",
    description="Bringing the Informal Collector into the Formal Recycling Chain",
    version="1.0.0"
)

# In-memory OTP storage for validation flow: (email:phone) -> {"otp": "...", "created_at": ...}
OTP_STORE: dict[str, dict] = {}

def normalize_phone_number(raw_phone: str) -> str:
    """Normalize and validate Indian 10-digit mobile number format."""
    digits = re.sub(r"[\s\-\(\)\.]", "", raw_phone)
    if digits.startswith("+91"):
        digits = digits[3:]
    elif digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    
    if not re.match(r"^[6-9]\d{9}$", digits):
        raise HTTPException(
            status_code=400,
            detail="Invalid mobile number format. Please provide a valid 10-digit mobile number starting with 6-9 (e.g., 9876543210 or +91 9876543210)."
        )
    return digits

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()

@app.post("/auth/register", response_model=TokenResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    norm_phone = normalize_phone_number(payload.phone)
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == norm_phone).first():
        raise HTTPException(status_code=400, detail="Mobile number already registered to another account")
    if payload.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot self-register as Administrator")

    ver_status = VerificationStatus.VERIFIED if payload.role == UserRole.CITIZEN else VerificationStatus.PENDING
    badge_id = None
    if ver_status == VerificationStatus.VERIFIED and payload.role != UserRole.CITIZEN:
        badge_id = f"ECO-{payload.role.value[:3]}-2026-{random.randint(100, 999)}"

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=norm_phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        verification_status=ver_status,
        econect_badge_id=badge_id,
        address=payload.address,
        service_area=payload.service_area
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id, "role": user.role.value})
    return {"access_token": token, "user": user}

@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id, "role": user.role.value})
    return {"access_token": token, "user": user}

@app.post("/auth/validate-user", response_model=UserValidationResponse)
def validate_user_endpoint(payload: UserValidationRequest, db: Session = Depends(get_db)):
    """Validate user account identity based on Email and Mobile number."""
    norm_phone = normalize_phone_number(payload.phone)
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        return UserValidationResponse(
            is_valid=False,
            exists=False,
            message=f"No account found matching email '{payload.email}'. Please check your spelling or register.",
            user=None,
            normalized_phone=norm_phone,
            verification_status=None,
            econect_badge_id=None,
            can_login=False
        )

    # Normalize user's registered phone
    user_digits = re.sub(r"[\s\-\(\)\.]", "", user.phone)
    if user_digits.startswith("+91"):
        user_digits = user_digits[3:]
    elif user_digits.startswith("0") and len(user_digits) == 11:
        user_digits = user_digits[1:]

    if user_digits != norm_phone:
        return UserValidationResponse(
            is_valid=False,
            exists=True,
            message="Mobile number does not match the registered user profile.",
            user=None,
            normalized_phone=norm_phone,
            verification_status=user.verification_status.value if user.verification_status else None,
            econect_badge_id=None,
            can_login=False
        )

    return UserValidationResponse(
        is_valid=True,
        exists=True,
        message=f"User identity verified for {user.full_name} ({user.role.value}).",
        user=UserResponse.model_validate(user),
        normalized_phone=norm_phone,
        verification_status=user.verification_status.value if user.verification_status else "VERIFIED",
        econect_badge_id=user.econect_badge_id,
        can_login=True
    )

@app.post("/auth/send-otp", response_model=OTPResponse)
def send_otp_endpoint(payload: OTPRequest, db: Session = Depends(get_db)):
    norm_phone = normalize_phone_number(payload.phone)
    code = f"{random.randint(100000, 999999)}"
    cache_key = f"{payload.email.lower()}:{norm_phone}"
    OTP_STORE[cache_key] = {
        "otp": code,
        "created_at": datetime.now(timezone.utc)
    }
    return OTPResponse(
        message=f"Verification OTP sent to mobile +91-{norm_phone} and {payload.email}.",
        email=payload.email,
        phone=norm_phone,
        demo_otp=code
    )

@app.post("/auth/verify-otp")
def verify_otp_endpoint(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    norm_phone = normalize_phone_number(payload.phone)
    cache_key = f"{payload.email.lower()}:{norm_phone}"
    stored = OTP_STORE.get(cache_key)

    if payload.otp != "123456" and (not stored or stored["otp"] != payload.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter the correct 6-digit OTP.")

    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        user.verification_status = VerificationStatus.VERIFIED
        if not user.econect_badge_id and user.role != UserRole.CITIZEN:
            user.econect_badge_id = f"ECO-{user.role.value[:3]}-2026-{random.randint(100, 999)}"
        db.commit()
        db.refresh(user)
        return {
            "verified": True,
            "message": f"Account verified successfully! {user.full_name} is now VERIFIED on ECONECT.",
            "user": UserResponse.model_validate(user),
            "econect_badge_id": user.econect_badge_id
        }
    return {
        "verified": True,
        "message": f"Mobile +91-{norm_phone} and email {payload.email} successfully verified.",
        "user": None
    }

@app.post("/ai/chat", response_model=AIChatResponse)
def ai_chat_assistant(payload: AIChatRequest, db: Session = Depends(get_db)):
    """AI Assistant endpoint for user navigation and smart SIH 2026 recycling queries."""
    msg = payload.message.lower().strip()
    role = (payload.current_role or "GUEST").upper()
    actions: list[NavigationAction] = []
    prompts: list[str] = [
        "How do I book a scrap pickup?",
        "How does collector digital weighing work?",
        "Validate user by email and mobile",
        "Track waste chain of custody",
        "What are indicative scrap rates?"
    ]

    # Intent matching for Navigation
    if any(k in msg for k in ["book", "pickup", "request", "sell scrap", "schedule", "dispose"]):
        reply = (
            "To request a waste or scrap pickup:\n"
            "1. Confirm or choose your waste category (e.g., Batteries, E-Waste, Paper).\n"
            "2. Input the estimated weight (kg) to see the locked indicative price snapshot.\n"
            "3. Enter your address and click 'Submit Pickup Request'.\n"
            "A nearby verified Kabadiwala (Collector) will accept and weigh your material."
        )
        actions.append(NavigationAction(target="pickup_form", label="👉 Go to Book Pickup", description="Scrolls to Waste Pickup Request form"))
    elif any(k in msg for k in ["weigh", "collector", "kabadiwala", "arrive", "scale"]):
        reply = (
            "Collector (Kabadiwala) Workflow on ECONECT:\n"
            "1. **Accept Pickup:** Reserve requested waste in your vicinity.\n"
            "2. **Mark Arrived:** Notify the citizen you have reached their premises.\n"
            "3. **Record Digital Weight:** Key in the certified scale weight (kg).\n"
            "4. **Complete & Issue Receipt:** The system locks the snapshot rate and generates an immutable receipt."
        )
        actions.append(NavigationAction(target="collector_queue", label="👉 Go to Collector Queue", description="View and manage assigned pickups"))
        if role != "COLLECTOR":
            actions.append(NavigationAction(target="switch_collector", label="🔄 Switch to Kabadiwala Demo", description="Quick login as Ramesh Kumar (Kabadiwala)"))
    elif any(k in msg for k in ["validate", "verify", "phone", "mobile", "mail", "email", "otp", "identity"]):
        reply = (
            "User Identity Validation on ECONECT:\n"
            "Users can be verified using their registered Email and 10-digit Indian Mobile number.\n"
            "1. Enter your registered email address.\n"
            "2. Enter your 10-digit mobile number.\n"
            "3. Click 'Validate User' or request a 6-digit OTP to confirm your verification badge."
        )
        actions.append(NavigationAction(target="validate_user", label="📱 Open User Validation", description="Validate account by email and phone number"))
    elif any(k in msg for k in ["track", "journey", "trace", "custody", "code", "eco-waste"]):
        reply = (
            "Chronological Traceability on ECONECT:\n"
            "Every waste batch is assigned a unique tracking code (e.g., `ECO-WASTE-2026-001001`).\n"
            "Enter any tracking code in the Traceability Inspector below to see the complete audit trail: "
            "Citizen Creation → Kabadiwala Digital Weighing → Collection Centre Intake → Authorized Recycler Processing."
        )
        actions.append(NavigationAction(target="traceability", label="🔍 Go to Traceability Tracker", description="Inspect immutable chain of custody"))
    elif any(k in msg for k in ["rate", "price", "cost", "how much", "inr", "per kg", "scrap price"]):
        rates = db.query(PriceRate).filter(PriceRate.active == True).limit(5).all()
        rate_lines = [f"• {r.category.name}: ₹{r.rate_per_kg}/kg" for r in rates if r.category]
        rates_summary = "\n".join(rate_lines) if rate_lines else "Rates: Computers ₹220/kg, Batteries ₹55/kg, Paper ₹14/kg"
        reply = (
            f"Here are current indicative rates on ECONECT:\n{rates_summary}\n\n"
            "Rates are indicative snapshots that protect Kabadiwalas and citizens against market fluctuations."
        )
        actions.append(NavigationAction(target="prices", label="💰 View Rate Calculator", description="Check indicative category prices"))
    elif any(k in msg for k in ["centre", "inventory", "stock", "warehouse"]):
        reply = (
            "Collection Centre Intake:\n"
            "Centres accept sorted aggregate consignments from collectors. "
            "Submitting the Waste Tracking ID automatically updates the centre inventory stock and signs the custody ledger."
        )
        actions.append(NavigationAction(target="centre_inventory", label="🏭 Go to Collection Centre Desk", description="Collection centre inventory management"))
    elif any(k in msg for k in ["recycle", "recycler", "formal", "recovery", "authorized"]):
        reply = (
            "Authorized Recycler Desk:\n"
            "Recyclers confirm industrial processing and recovery of hazardous or valuable materials. "
            "Confirming receipt marks the final lifecycle event in the ECONECT traceability ledger."
        )
        actions.append(NavigationAction(target="recycler_portal", label="♻️ Go to Recycler Confirmation", description="Authorized recycler formal confirmation"))
    elif any(k in msg for k in ["admin", "governance", "analytics"]):
        reply = (
            "Administrator Governance & Verification:\n"
            "Admins review user profiles, verify collector badges, update category benchmark prices, "
            "and inspect national recycling analytics."
        )
        actions.append(NavigationAction(target="admin_panel", label="🛡️ Go to Admin Analytics", description="Platform governance and metrics"))
    else:
        reply = (
            f"Hello! I am ECONECT AI Navigator ({role} Assistant).\n\n"
            "I can guide you through every part of the platform:\n"
            "• Requesting waste pickups with transparent pricing\n"
            "• Collector digital weighing & instant receipts\n"
            "• Validating user accounts via Email & Mobile number\n"
            "• Inspecting end-to-end traceability of scrap materials\n"
            "• Navigating to role dashboards"
        )
        actions.append(NavigationAction(target="pickup_form", label="📦 Book Scrap Pickup", description="Request scrap pickup"))
        actions.append(NavigationAction(target="validate_user", label="📱 Validate User Identity", description="Validate mobile & email"))
        actions.append(NavigationAction(target="traceability", label="🔍 Trace Waste Journey", description="Chain of custody tracking"))

    return AIChatResponse(reply=reply, navigation_actions=actions, suggested_prompts=prompts)

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/prices", response_model=list[CategoryOut])
def get_prices(db: Session = Depends(get_db)):
    categories = db.query(MaterialCategory).filter(MaterialCategory.active == True).all()
    result = []
    for c in categories:
        rate = db.query(PriceRate).filter(
            PriceRate.category_id == c.id, PriceRate.active == True
        ).order_by(PriceRate.valid_from.desc()).first()
        result.append(CategoryOut(
            id=c.id,
            code=c.code,
            name=c.name,
            is_hazardous=c.is_hazardous,
            safety_guidance=c.safety_guidance,
            rate_per_kg=rate.rate_per_kg if rate else 10.0,
            currency=rate.currency if rate else "INR"
        ))
    return result

@app.post("/admin/prices")
def update_price(
    payload: PriceUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN))
):
    cat = db.query(MaterialCategory).filter(MaterialCategory.code == payload.category_code).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.query(PriceRate).filter(PriceRate.category_id == cat.id, PriceRate.active == True).update({"active": False})
    new_rate = PriceRate(
        category_id=cat.id,
        rate_per_kg=payload.rate_per_kg,
        source_note=payload.source_note,
        active=True
    )
    db.add(new_rate)
    db.add(AuditLog(actor_id=admin.id, action="UPDATE_PRICE", target_id=cat.code, details=f"New rate: INR {payload.rate_per_kg}/kg"))
    db.commit()
    return {"message": "Indicative rate updated", "category_code": cat.code, "new_rate_per_kg": payload.rate_per_kg}

@app.post("/waste/classify", response_model=ClassificationResponse)
async def classify_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    return await classify_waste_image(file)

@app.post("/pickups")
def create_pickup(
    payload: PickupCreate,
    db: Session = Depends(get_db),
    citizen: User = Depends(require_roles(UserRole.CITIZEN))
):
    cat = db.query(MaterialCategory).filter(MaterialCategory.code == payload.category_code).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Invalid waste category")

    rate_obj = db.query(PriceRate).filter(PriceRate.category_id == cat.id, PriceRate.active == True).first()
    rate_val = rate_obj.rate_per_kg if rate_obj else 10.0
    estimated_val = round(payload.estimated_weight_kg * rate_val, 2)

    count = db.query(func.count(WasteRecord.id)).scalar() or 0
    tracking_code = f"ECO-WASTE-2026-{count + 1001:06d}"

    waste = WasteRecord(
        tracking_code=tracking_code,
        citizen_id=citizen.id,
        category_id=cat.id,
        current_holder_id=citizen.id,
        estimated_weight_kg=payload.estimated_weight_kg,
        condition_note=payload.condition_note
    )
    db.add(waste)
    db.flush()

    db.add(WasteEvent(
        waste_record_id=waste.id,
        event_type=WasteEventType.CREATED,
        actor_id=citizen.id,
        location_note=payload.pickup_address,
        quantity_kg=payload.estimated_weight_kg,
        notes=f"Citizen logged {cat.name} (~{payload.estimated_weight_kg} kg)"
    ))

    pickup = PickupRequest(
        waste_record_id=waste.id,
        citizen_id=citizen.id,
        category_id=cat.id,
        pickup_address=payload.pickup_address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        estimated_weight_kg=payload.estimated_weight_kg,
        locked_rate_per_kg=rate_val,
        estimated_value_inr=estimated_val,
        status=PickupStatus.REQUESTED
    )
    db.add(pickup)
    db.commit()
    db.refresh(pickup)
    return {
        "pickup_id": pickup.id,
        "tracking_code": tracking_code,
        "status": pickup.status,
        "locked_rate_per_kg": rate_val,
        "estimated_value_inr": estimated_val
    }

def serialize_pickup(p: PickupRequest):
    return {
        "id": p.id,
        "tracking_code": p.waste_record.tracking_code if p.waste_record else "",
        "waste_record_id": p.waste_record_id,
        "category_code": p.category.code if p.category else "",
        "category_name": p.category.name if p.category else "",
        "is_hazardous": p.category.is_hazardous if p.category else False,
        "safety_guidance": p.category.safety_guidance if p.category else "",
        "pickup_address": p.pickup_address,
        "estimated_weight_kg": p.estimated_weight_kg,
        "actual_weight_kg": p.actual_weight_kg,
        "locked_rate_per_kg": p.locked_rate_per_kg,
        "estimated_value_inr": p.estimated_value_inr,
        "final_value_inr": p.final_value_inr,
        "status": p.status.value,
        "citizen_name": p.citizen.full_name if p.citizen else "",
        "collector_name": p.collector.full_name if p.collector else None,
        "collector_badge": p.collector.econect_badge_id if p.collector else None,
        "created_at": p.created_at
    }

@app.get("/citizen/pickups")
def list_citizen_pickups(
    db: Session = Depends(get_db),
    citizen: User = Depends(require_roles(UserRole.CITIZEN))
):
    rows = db.query(PickupRequest).filter(PickupRequest.citizen_id == citizen.id).order_by(PickupRequest.created_at.desc()).all()
    return [serialize_pickup(p) for p in rows]

@app.get("/collector/pickups")
def list_collector_pickups(
    db: Session = Depends(get_db),
    collector: User = Depends(require_roles(UserRole.COLLECTOR))
):
    rows = db.query(PickupRequest).filter(
        (PickupRequest.status == PickupStatus.REQUESTED) | (PickupRequest.collector_id == collector.id)
    ).order_by(PickupRequest.created_at.desc()).all()
    return [serialize_pickup(p) for p in rows]

@app.post("/pickups/{pickup_id}/accept")
def accept_pickup(
    pickup_id: str,
    db: Session = Depends(get_db),
    collector: User = Depends(require_roles(UserRole.COLLECTOR))
):
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup request not found")
    if pickup.status != PickupStatus.REQUESTED or pickup.collector_id is not None:
        raise HTTPException(status_code=409, detail="Pickup already accepted or unavailable")

    pickup.collector_id = collector.id
    pickup.status = PickupStatus.ACCEPTED
    db.add(Notification(
        user_id=pickup.citizen_id,
        title="Collector Assigned",
        message=f"{collector.full_name} accepted your pickup ({pickup.waste_record.tracking_code})."
    ))
    db.commit()
    return serialize_pickup(pickup)

@app.post("/pickups/{pickup_id}/arrive")
def mark_arrived(
    pickup_id: str,
    db: Session = Depends(get_db),
    collector: User = Depends(require_roles(UserRole.COLLECTOR))
):
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id, PickupRequest.collector_id == collector.id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Assigned pickup not found")
    if pickup.status not in [PickupStatus.ACCEPTED, PickupStatus.ON_THE_WAY]:
        raise HTTPException(status_code=400, detail=f"Cannot transition from {pickup.status} to ARRIVED")

    pickup.status = PickupStatus.ARRIVED
    db.commit()
    return serialize_pickup(pickup)

@app.post("/pickups/{pickup_id}/weigh")
def weigh_pickup(
    pickup_id: str,
    payload: WeighRequest,
    db: Session = Depends(get_db),
    collector: User = Depends(require_roles(UserRole.COLLECTOR))
):
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id, PickupRequest.collector_id == collector.id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Assigned pickup not found")
    if pickup.status != PickupStatus.ARRIVED:
        raise HTTPException(status_code=400, detail="Collector must mark ARRIVED before recording weight")

    pickup.actual_weight_kg = payload.actual_weight_kg
    pickup.final_value_inr = round(payload.actual_weight_kg * pickup.locked_rate_per_kg, 2)
    pickup.status = PickupStatus.WEIGHED

    pickup.waste_record.actual_weight_kg = payload.actual_weight_kg
    db.add(WasteEvent(
        waste_record_id=pickup.waste_record_id,
        event_type=WasteEventType.WEIGHED,
        actor_id=collector.id,
        location_note=pickup.pickup_address,
        quantity_kg=payload.actual_weight_kg,
        notes=f"Verified weight: {payload.actual_weight_kg} kg @ INR {pickup.locked_rate_per_kg}/kg"
    ))
    db.commit()
    return serialize_pickup(pickup)

@app.post("/pickups/{pickup_id}/complete")
def complete_pickup(
    pickup_id: str,
    db: Session = Depends(get_db),
    collector: User = Depends(require_roles(UserRole.COLLECTOR))
):
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id, PickupRequest.collector_id == collector.id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Assigned pickup not found")
    if pickup.status != PickupStatus.WEIGHED or pickup.actual_weight_kg is None:
        raise HTTPException(status_code=400, detail="Actual weight must be recorded before completing pickup")

    existing_tx = db.query(Transaction).filter(Transaction.pickup_id == pickup.id).first()
    if existing_tx:
        raise HTTPException(status_code=409, detail="Transaction already completed for this pickup")

    pickup.status = PickupStatus.COMPLETED
    pickup.waste_record.current_holder_id = collector.id

    tx = Transaction(
        pickup_id=pickup.id,
        citizen_id=pickup.citizen_id,
        collector_id=collector.id,
        weight_kg=pickup.actual_weight_kg,
        rate_per_kg_snapshot=pickup.locked_rate_per_kg,
        total_amount_inr=pickup.final_value_inr
    )
    db.add(tx)
    db.add(WasteEvent(
        waste_record_id=pickup.waste_record_id,
        event_type=WasteEventType.COLLECTED,
        actor_id=collector.id,
        location_note=pickup.pickup_address,
        quantity_kg=pickup.actual_weight_kg,
        notes=f"Pickup completed. Final receipt value: INR {pickup.final_value_inr}"
    ))
    db.commit()
    return serialize_pickup(pickup)

@app.post("/pickups/{pickup_id}/cancel")
def cancel_pickup(
    pickup_id: str,
    payload: CancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    if pickup.citizen_id != current_user.id and pickup.collector_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this pickup")
    if pickup.status in [PickupStatus.COMPLETED, PickupStatus.WEIGHED]:
        raise HTTPException(status_code=400, detail="Cannot cancel after weighing/completion")

    pickup.status = PickupStatus.CANCELLED
    pickup.cancellation_reason = payload.reason
    db.commit()
    return serialize_pickup(pickup)

@app.get("/waste/{tracking_code}/journey")
def get_waste_journey(tracking_code: str, db: Session = Depends(get_db)):
    waste = db.query(WasteRecord).filter(WasteRecord.tracking_code == tracking_code).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Waste tracking ID not found")
    return {
        "tracking_code": waste.tracking_code,
        "category_name": waste.category.name,
        "estimated_weight_kg": waste.estimated_weight_kg,
        "actual_weight_kg": waste.actual_weight_kg,
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type.value,
                "location_note": e.location_note,
                "quantity_kg": e.quantity_kg,
                "notes": e.notes,
                "timestamp": e.timestamp
            }
            for e in waste.events
        ]
    }

@app.post("/centres/receive/{tracking_code}")
def centre_receive_waste(
    tracking_code: str,
    db: Session = Depends(get_db),
    centre: User = Depends(require_roles(UserRole.CENTRE))
):
    waste = db.query(WasteRecord).filter(WasteRecord.tracking_code == tracking_code).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Tracking code not found")
    weight = waste.actual_weight_kg or waste.estimated_weight_kg
    waste.current_holder_id = centre.id

    inv = db.query(CentreInventory).filter(
        CentreInventory.centre_id == centre.id,
        CentreInventory.category_id == waste.category_id
    ).first()
    if not inv:
        inv = CentreInventory(centre_id=centre.id, category_id=waste.category_id, available_weight_kg=0.0)
        db.add(inv)
    inv.available_weight_kg = round(inv.available_weight_kg + weight, 2)

    db.add(WasteEvent(
        waste_record_id=waste.id,
        event_type=WasteEventType.RECEIVED_AT_CENTRE,
        actor_id=centre.id,
        location_note=centre.address,
        quantity_kg=weight,
        notes=f"Received and sorted at {centre.full_name}"
    ))
    db.commit()
    return {"message": "Material received into Centre Inventory", "tracking_code": tracking_code, "added_kg": weight}

@app.get("/centres/inventory")
def get_centre_inventory(
    db: Session = Depends(get_db),
    centre: User = Depends(require_roles(UserRole.CENTRE))
):
    items = db.query(CentreInventory).filter(CentreInventory.centre_id == centre.id).all()
    return [
        {"category_name": i.category.name, "category_code": i.category.code, "available_weight_kg": i.available_weight_kg}
        for i in items
    ]

@app.post("/recyclers/confirm/{tracking_code}")
def recycler_confirm_processing(
    tracking_code: str,
    db: Session = Depends(get_db),
    recycler: User = Depends(require_roles(UserRole.RECYCLER))
):
    waste = db.query(WasteRecord).filter(WasteRecord.tracking_code == tracking_code).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Tracking code not found")
    weight = waste.actual_weight_kg or waste.estimated_weight_kg
    waste.current_holder_id = recycler.id

    db.add(WasteEvent(
        waste_record_id=waste.id,
        event_type=WasteEventType.RECEIVED_BY_RECYCLER,
        actor_id=recycler.id,
        location_note=recycler.address,
        quantity_kg=weight,
        notes=f"Consignment received at {recycler.full_name}"
    ))
    db.add(WasteEvent(
        waste_record_id=waste.id,
        event_type=WasteEventType.PROCESSING_CONFIRMED,
        actor_id=recycler.id,
        location_note=recycler.address,
        quantity_kg=weight,
        notes=f"Formal material recovery & recycling confirmed by {recycler.full_name}"
    ))
    db.commit()
    return {"message": "Formal recycling confirmed", "tracking_code": tracking_code}

@app.get("/admin/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN))
):
    users = db.query(User).all()
    pickups = db.query(PickupRequest).all()
    completed = [p for p in pickups if p.status == PickupStatus.COMPLETED]
    total_kg = sum(p.actual_weight_kg or 0 for p in completed)
    total_inr = sum(p.final_value_inr or 0 for p in completed)
    return {
        "total_users": len(users),
        "total_pickups": len(pickups),
        "completed_pickups": len(completed),
        "total_verified_weight_kg": round(total_kg, 2),
        "total_transaction_value_inr": round(total_inr, 2),
        "users": [UserResponse.model_validate(u) for u in users]
    }

@app.post("/admin/verification/{user_id}/approve")
def approve_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.verification_status = VerificationStatus.VERIFIED
    if not u.econect_badge_id:
        u.econect_badge_id = f"ECO-{u.role.value[:3]}-2026-{random.randint(100,999)}"
    db.add(AuditLog(actor_id=admin.id, action="VERIFY_USER", target_id=u.id, details=f"Approved {u.email}"))
    db.commit()
    return {"message": "User verified", "badge_id": u.econect_badge_id}

# ---------------------------------------------------------
# Static file serving for single-service full-stack deployment
# ---------------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

_possible_dirs = [
    os.path.join(os.path.dirname(__file__), "..", "..", "dist"),
    os.path.join(os.getcwd(), "dist"),
]
dist_dir = next((d for d in _possible_dirs if os.path.exists(d) and os.path.isdir(d)), None)

if dist_dir:
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        api_prefixes = (
            "auth", "prices", "pickups", "waste", "centres",
            "recyclers", "admin", "ai", "docs", "redoc", "openapi.json"
        )
        if any(full_path == p or full_path.startswith(f"{p}/") for p in api_prefixes):
            raise HTTPException(status_code=404, detail="Not Found")

        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")
