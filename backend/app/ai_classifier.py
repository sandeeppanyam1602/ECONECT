from io import BytesIO
from PIL import Image, UnidentifiedImageError
from fastapi import UploadFile, HTTPException
from app.schemas import ClassificationResponse
from app.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

KEYWORD_MAP = {
    "battery": ("BATTERIES", "Batteries"),
    "cell": ("BATTERIES", "Batteries"),
    "phone": ("MOBILE_PHONES", "Mobile phones"),
    "mobile": ("MOBILE_PHONES", "Mobile phones"),
    "laptop": ("COMPUTERS_LAPTOPS", "Computers and laptops"),
    "computer": ("COMPUTERS_LAPTOPS", "Computers and laptops"),
    "pcb": ("PCB", "Printed circuit boards"),
    "board": ("PCB", "Printed circuit boards"),
    "wire": ("CABLES_WIRES", "Cables and wires"),
    "cable": ("CABLES_WIRES", "Cables and wires"),
    "pet": ("PET_PLASTIC", "PET plastic"),
    "bottle": ("PET_PLASTIC", "PET plastic"),
    "cardboard": ("CARDBOARD", "Cardboard"),
    "box": ("CARDBOARD", "Cardboard"),
    "paper": ("PAPER", "Paper"),
    "metal": ("METAL", "Metal"),
    "iron": ("METAL", "Metal"),
    "glass": ("GLASS", "Glass"),
    "monitor": ("CRT_LCD_DISPLAYS", "CRT/LCD displays"),
    "motor": ("MOTORS_COMPONENTS", "Motors and electronic components"),
}

async def classify_waste_image(file: UploadFile) -> ClassificationResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Please upload JPEG, PNG, or WEBP.")

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds 5MB limit.")

    try:
        img = Image.open(BytesIO(raw_bytes))
        img.verify()
    except (UnidentifiedImageError, Exception):
        raise HTTPException(status_code=400, detail="Uploaded file is corrupted or not a valid image.")

    filename_lower = (file.filename or "").lower()
    matched_code, matched_name = ("EWASTE_GENERAL", "Electronic waste")
    for kw, (code, name) in KEYWORD_MAP.items():
        if kw in filename_lower:
            matched_code, matched_name = code, name
            break

    return ClassificationResponse(
        predicted_category_code=matched_code,
        predicted_category_name=matched_name,
        confidence=0.72,
        alternatives=[
            {"category_code": "PET_PLASTIC", "category_name": "PET plastic"},
            {"category_code": "METAL", "category_name": "Metal"},
            {"category_code": "PAPER", "category_name": "Paper"},
        ],
        model_name="ECONECT-Demo-Rule-Classifier-v1 (EfficientNet-B0 Hook Ready)",
        is_demo_fallback=(settings.AI_MODE == "DEMO_FALLBACK"),
        notice="DEMO FALLBACK MODE: Prediction is an assistive suggestion. Please verify or manually select the exact category before submitting."
    )
