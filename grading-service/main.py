"""
AgriSync — Produce Grading Microservice (FastAPI)

Accepts a produce image via POST /grade and returns a structured
grading result using classical OpenCV analysis.

This is NOT a trained ML model.  See grading.py for the CV pipeline
and README.md for full documentation.
"""

from __future__ import annotations

import logging
import time

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from grading import grade_image

# ── logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
)
logger = logging.getLogger("main")

# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="AgriSync Produce Grading Service",
    description=(
        "Classical OpenCV rule-based produce quality grading. "
        "NOT a trained ML model."
    ),
    version="0.1.0",
)

# allow the Node.js backend (or any local dev frontend) to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── custom error handlers ────────────────────────────────────────────────────
# FastAPI returns 422 Unprocessable Entity when a required File(...) field
# is missing.  Our API contract requires all input errors to be HTTP 400.

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Convert FastAPI's 422 validation errors to 400 with our error format."""
    return JSONResponse(
        status_code=400,
        content={"error": "No image file provided. Send a multipart/form-data request with an 'image' field."},
    )

# ── accepted image MIME types ────────────────────────────────────────────────

ACCEPTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/bmp",
    "image/tiff",
    "image/webp",
}

from typing import List, Optional, Dict, Any

# ── response model ───────────────────────────────────────────────────────────

class GradeResponse(BaseModel):
    """Public API response — matches the AgriSync lot grading contract."""
    grade: str                         # "A", "B", or "C"
    defect_flags: List[str]
    notes: str
    quality_score: Optional[float] = None
    confidence: Optional[float] = None
    features: Optional[Dict[str, Any]] = None


# ── health check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Simple liveness probe."""
    return {"status": "ok", "service": "grading"}


# ── POST /grade ──────────────────────────────────────────────────────────────

@app.post("/grade", response_model=GradeResponse)
async def grade_produce(image: UploadFile = File(...)):
    """Grade an uploaded produce image.

    Accepts multipart/form-data with field ``image``.

    Returns:
        GradeResponse with grade (A/B/C), defect_flags, notes, quality_score, and features.
    """
    # ── validate presence and content type ────────────────────────────────
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    content_type = (image.content_type or "").lower()
    if content_type not in ACCEPTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported image type: '{content_type}'. "
                f"Accepted: {', '.join(sorted(ACCEPTED_CONTENT_TYPES))}."
            ),
        )

    # ── read bytes ───────────────────────────────────────────────────────
    try:
        raw_bytes = await image.read()
    except Exception as exc:
        logger.error("failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=400, detail="Could not read uploaded file.")

    if not raw_bytes or len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── decode with OpenCV ───────────────────────────────────────────────
    np_arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode image. File may be corrupted or not a valid image.",
        )

    logger.info(
        "received image: filename=%s size=%d bytes dimensions=%dx%d",
        image.filename,
        len(raw_bytes),
        img_bgr.shape[1],
        img_bgr.shape[0],
    )

    # ── run grading pipeline ─────────────────────────────────────────────
    try:
        start = time.perf_counter()
        result = grade_image(img_bgr)
        elapsed = time.perf_counter() - start
        logger.info("grading completed in %.3f s", elapsed)
    except Exception as exc:
        logger.exception("grading pipeline error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred during image grading.",
        )

    return GradeResponse(
        grade=result.grade,
        defect_flags=result.defect_flags,
        notes=result.notes,
        quality_score=round(result.overall_score, 1),
        confidence=round(max(0.70, min(0.98, result.overall_score / 100)), 2),
        features={
            "colorScore": round(result.color_score, 1),
            "defectScore": round(result.defect_score, 1),
            "shapeScore": round(result.shape_score, 1),
            "uniformityScore": round(result.uniformity_score, 1),
        },
    )
