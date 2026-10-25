from sqlalchemy.orm import Session
from app.models import (
    User, UserRole, VerificationStatus,
    MaterialCategory, PriceRate
)
from app.auth import hash_password

INITIAL_CATEGORIES = [
    ("PAPER", "Paper", False, 14.0, "Keep dry and bundled."),
    ("CARDBOARD", "Cardboard", False, 12.0, "Flatten boxes before pickup."),
    ("PET_PLASTIC", "PET plastic", False, 18.0, "Empty and rinse bottles."),
    ("OTHER_PLASTIC", "Other plastic", False, 10.0, "Separate hard and soft plastics."),
    ("METAL", "Metal", False, 32.0, "Avoid sharp unshielded edges."),
    ("GLASS", "Glass", False, 4.0, "Pack broken glass in rigid cardboard."),
    ("EWASTE_GENERAL", "Electronic waste", True, 25.0, "Do not dismantle sealed appliances."),
    ("MOBILE_PHONES", "Mobile phones", True, 150.0, "Factory-reset device and remove SIM/SD cards."),
    ("COMPUTERS_LAPTOPS", "Computers and laptops", True, 220.0, "Wipe storage media; keep battery intact."),
    ("PCB", "Printed circuit boards", True, 180.0, "Handle by edges; never burn or acid-leach."),
    ("CABLES_WIRES", "Cables and wires", False, 65.0, "Do not open-burn PVC insulation."),
    ("BATTERIES", "Batteries", True, 55.0, "HAZARD: Tape terminals of lithium/lead-acid batteries; store away from heat."),
    ("CRT_LCD_DISPLAYS", "CRT/LCD displays", True, 40.0, "HAZARD: Do not break CRT glass (contains lead/mercury phosphor)."),
    ("MOTORS_COMPONENTS", "Motors and electronic components", False, 48.0, "Drain any residual lubricants."),
    ("OTHER_SCRAP", "Other scrap", False, 8.0, "General mixed recyclable material."),
]

DEMO_USERS = [
    ("Aarav Sharma (Citizen)", "citizen@econect.in", "9876543210", "demo123", UserRole.CITIZEN, VerificationStatus.VERIFIED, None, "Indiranagar, Bengaluru"),
    ("Ramesh Kumar (Kabadiwala)", "collector@econect.in", "9876543211", "demo123", UserRole.COLLECTOR, VerificationStatus.VERIFIED, "ECO-COL-2026-001", "Indiranagar & Domlur"),
    ("GreenHub Collection Centre", "centre@econect.in", "9876543212", "demo123", UserRole.CENTRE, VerificationStatus.VERIFIED, "ECO-CTR-2026-010", "Peenya Industrial Area"),
    ("EcoCycle Authorized Recycler", "recycler@econect.in", "9876543213", "demo123", UserRole.RECYCLER, VerificationStatus.VERIFIED, "ECO-REC-2026-099", "Dobbaspet E-Waste Park"),
    ("SIH Platform Admin", "admin@econect.in", "9876543214", "admin123", UserRole.ADMIN, VerificationStatus.VERIFIED, "ECO-ADM-001", "Bengaluru HQ"),
]

def run_seed(db: Session):
    for code, name, hazard, rate, safety in INITIAL_CATEGORIES:
        cat = db.query(MaterialCategory).filter(MaterialCategory.code == code).first()
        if not cat:
            cat = MaterialCategory(code=code, name=name, is_hazardous=hazard, safety_guidance=safety)
            db.add(cat)
            db.flush()
            price = PriceRate(
                category_id=cat.id,
                rate_per_kg=rate,
                currency="INR",
                source_note="Illustrative SIH 2026 Seed Rate (Not Live Market Feed)"
            )
            db.add(price)

    for name, email, phone, pwd, role, ver_status, badge, addr in DEMO_USERS:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                full_name=name,
                email=email,
                phone=phone,
                hashed_password=hash_password(pwd),
                role=role,
                verification_status=ver_status,
                econect_badge_id=badge,
                address=addr,
                service_area=addr
            )
            db.add(u)

    db.commit()
