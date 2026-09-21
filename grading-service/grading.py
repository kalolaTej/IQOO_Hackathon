"""
AgriSync — Advanced Classical OpenCV Produce Grading & Quality Pipeline

Features:
  1. Pre-grading image quality gate (blur, exposure, contrast, produce size).
  2. Crop-specific color & defect profiles (Tomato, Onion, Potato, Mango, Wheat, Apple, General).
  3. Produce ROI segmentation (strict background exclusion across light, dark, and textured surfaces).
  4. Localized defect detection inside ROI (rot, necrosis, mold, blight, lesions, bruising).
  5. Morphological noise cleanup & connected component filtering.
  6. Visual Defect Mask & Annotated HUD Overlay Image generation.
  7. Strict defect dominance rule (severe defects force Grade C, minor defects force Grade B, never Grade A).
  8. Transparent, explainable scoring metrics.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any

import cv2
import numpy as np

logger = logging.getLogger("grading")

# Max processing dimension
MAX_IMAGE_DIM = 1024

# Quality Weights
W_DEFECT     = 0.45   # Blemish / rot / surface damage (highest impact)
W_COLOR      = 0.25   # Ripeness / color health
W_SHAPE      = 0.15   # Shape symmetry & regularity
W_UNIFORMITY = 0.15   # Color uniformity across produce

# Grade Thresholds
GRADE_A_THRESHOLD = 70.0
GRADE_B_THRESHOLD = 42.0

# ── Crop-Specific Profiles ──────────────────────────────────────────────────
CROP_PROFILES = {
    "tomato": {
        "name": "Tomato",
        "hsv_ranges": [
            (np.array([0, 45, 45]), np.array([12, 255, 255])),
            (np.array([160, 45, 45]), np.array([180, 255, 255])),
        ],
        "rot_v_max": 42,
        "rot_h_range": (12, 28),
        "rot_s_min": 30,
        "max_a_defect_ratio": 0.010,   # Max 1.0% defects for Grade A
        "max_b_defect_ratio": 0.060,   # Max 6.0% defects for Grade B
        "max_a_single_defect": 0.50,   # Max 0.5% single defect for Grade A
        "max_b_single_defect": 4.50,   # Max 4.5% single defect for Grade B
        "max_a_defect_count": 5,
        "min_component_ratio": 0.0008, # Ignore specks < 0.08% of produce
    },
    "onion": {
        "name": "Onion",
        # Red / Yellow / Brown Onion in HSV:
        "hsv_ranges": [
            (np.array([0, 30, 40]), np.array([25, 255, 255])),     # Brown/Yellow skin
            (np.array([135, 25, 40]), np.array([178, 255, 255])),   # Red/Purple skin
        ],
        "rot_v_max": 48,               # Black mold / necrotic rot
        "rot_h_range": (20, 42),       # Soft rot discoloration
        "rot_s_min": 25,
        "max_a_defect_ratio": 0.022,   # Max 2.2% defects for Grade A (allows natural dry skin)
        "max_b_defect_ratio": 0.080,
        "max_a_single_defect": 0.80,
        "max_b_single_defect": 4.50,
        "max_a_defect_count": 6,
        "min_component_ratio": 0.0008,
    },
    "potato": {
        "name": "Potato",
        "hsv_ranges": [
            (np.array([10, 25, 40]), np.array([40, 255, 255])),
        ],
        "rot_v_max": 36,
        "rot_h_range": (5, 25),
        "rot_s_min": 25,
        "max_a_defect_ratio": 0.015,
        "max_b_defect_ratio": 0.065,
        "max_a_single_defect": 0.60,
        "max_b_single_defect": 3.00,
        "max_a_defect_count": 5,
        "min_component_ratio": 0.0008,
    },
    "mango": {
        "name": "Mango",
        "hsv_ranges": [
            (np.array([12, 35, 45]), np.array([90, 255, 255])),
        ],
        "rot_v_max": 38,
        "rot_h_range": (8, 24),
        "rot_s_min": 30,
        "max_a_defect_ratio": 0.012,
        "max_b_defect_ratio": 0.060,
        "max_a_single_defect": 0.50,
        "max_b_single_defect": 2.80,
        "max_a_defect_count": 4,
        "min_component_ratio": 0.0008,
    },
    "wheat": {
        "name": "Wheat / Grain",
        "hsv_ranges": [
            (np.array([10, 20, 35]), np.array([38, 255, 255])),
        ],
        "rot_v_max": 35,
        "rot_h_range": (5, 22),
        "rot_s_min": 25,
        "max_a_defect_ratio": 0.015,
        "max_b_defect_ratio": 0.065,
        "max_a_single_defect": 0.60,
        "max_b_single_defect": 3.00,
        "max_a_defect_count": 5,
        "min_component_ratio": 0.0006,
    },
    "general": {
        "name": "General Produce",
        "hsv_ranges": [
            (np.array([0, 25, 35]), np.array([180, 255, 255])),
        ],
        "rot_v_max": 40,
        "rot_h_range": (8, 28),
        "rot_s_min": 28,
        "max_a_defect_ratio": 0.012,
        "max_b_defect_ratio": 0.065,
        "max_a_single_defect": 0.55,
        "max_b_single_defect": 3.00,
        "max_a_defect_count": 4,
        "min_component_ratio": 0.0008,
    },
}

def get_crop_profile(crop_type: Optional[str]) -> Dict[str, Any]:
    if not crop_type:
        return CROP_PROFILES["general"]
    key = str(crop_type).lower().strip()
    for k in CROP_PROFILES:
        if k in key:
            return CROP_PROFILES[k]
    return CROP_PROFILES["general"]

# ── Data Structure ──────────────────────────────────────────────────────────
@dataclass
class GradingResult:
    grade: str                         # "A", "B", "C", or "REVIEW_REQUIRED"
    quality_score: float = 0.0         # 0.0 - 100.0
    confidence: float = 0.0            # 0.0 - 1.0
    grading_status: str = "completed"  # "completed" | "review_required" | "failed"
    defect_flags: List[str] = field(default_factory=list)
    notes: str = ""
    features: Dict[str, Any] = field(default_factory=dict)
    analysis: Dict[str, Any] = field(default_factory=dict)
    annotated_image: Optional[np.ndarray] = None
    defect_mask: Optional[np.ndarray] = None

# ── Preprocessing & Quality Gate ────────────────────────────────────────────
def preprocess_image(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    if max(h, w) > MAX_IMAGE_DIM:
        scale = MAX_IMAGE_DIM / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return img

def validate_image_quality(img_bgr: np.ndarray) -> Tuple[bool, str]:
    """Pre-grading gate: validates blur, exposure, and image dimensions."""
    h, w = img_bgr.shape[:2]
    if h < 80 or w < 80:
        return False, "Image resolution is too low for quality grading."

    grey = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Check extreme blur (Laplacian variance)
    blur_var = cv2.Laplacian(grey, cv2.CV_64F).var()
    if blur_var < 3.5:
        return False, f"Image is too blurry (Laplacian variance: {blur_var:.1f}). Please capture a steady photo."

    # Exposure check: evaluate 95th and 20th percentiles of brightness
    p95 = float(np.percentile(grey, 95))
    p20 = float(np.percentile(grey, 20))

    if p95 < 22.0:
        return False, f"Image is completely underexposed / pitch dark (95th percentile: {p95:.1f})."
    
    if p20 > 248.0:
        return False, f"Image is completely overexposed / washed out (20th percentile: {p20:.1f})."

    return True, "Image quality acceptable for grading."

# ── Produce ROI Segmentation (Background Exclusion) ────────────────────────
def extract_produce_roi(img_bgr: np.ndarray, profile: Dict[str, Any]) -> Tuple[np.ndarray, Optional[np.ndarray], float, int]:
    """
    Isolates the primary produce object from background.
    Works across white/light surfaces, dark surfaces, and textured wooden tables.
    """
    h, w = img_bgr.shape[:2]
    total_image_pixels = h * w

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]
    l_channel = lab[:, :, 0]

    # 1. Profile HSV Color Mask
    hsv_mask = np.zeros((h, w), dtype=np.uint8)
    for lower, upper in profile["hsv_ranges"]:
        part_mask = cv2.inRange(hsv, lower, upper)
        hsv_mask = cv2.bitwise_or(hsv_mask, part_mask)

    # Include calyx/stem for tomato
    if profile.get("name", "").lower() == "tomato":
        calyx_inrange = cv2.inRange(hsv, np.array([30, 30, 30]), np.array([90, 255, 255]))
        hsv_mask = cv2.bitwise_or(hsv_mask, calyx_inrange)

    # 2. Non-neutral filter (excludes pure white, grey, black backgrounds)
    non_neutral = (s_channel >= 25) & (v_channel >= 25) & (l_channel < 244)
    produce_cands = cv2.bitwise_and(hsv_mask, hsv_mask, mask=non_neutral.astype(np.uint8))

    # 3. Detect distinct multiple objects before heavy morphological closing
    raw_cnts, _ = cv2.findContours(produce_cands, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    sig_raw_cnts = [c for c in raw_cnts if cv2.contourArea(c) > (total_image_pixels * 0.020)]
    object_count = len(sig_raw_cnts)

    # 4. Morphological Closing & Opening to seal solid produce body and enclose rot lesions
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    clean_mask = cv2.morphologyEx(produce_cands, cv2.MORPH_CLOSE, kernel_close, iterations=2)

    # 5. Find Contours and Select Significant Produce Object(s)
    contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.zeros((h, w), dtype=np.uint8), None, 0.0, 0

    largest = max(contours, key=cv2.contourArea)
    hull = cv2.convexHull(largest)

    produce_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(produce_mask, [hull], -1, 255, cv2.FILLED)

    produce_area = float(np.sum(produce_mask > 0))
    produce_ratio = produce_area / float(total_image_pixels)

    return produce_mask, hull, produce_ratio, max(1 if produce_ratio > 0.02 else 0, object_count)

# ── Localized Defect Detection (Inside Produce ROI) ─────────────────────────
def detect_defects_in_roi(
    img_bgr: np.ndarray,
    produce_mask: np.ndarray,
    profile: Dict[str, Any]
) -> Tuple[float, List[str], np.ndarray, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Detects surface rot, necrosis, blemishes, and damage strictly inside produce ROI.
    Excludes background, calyx/stem, and normal produce coloring.
    """
    produce_area = float(np.sum(produce_mask > 0))
    if produce_area < 100:
        return 50.0, ["insufficient_roi"], np.zeros_like(produce_mask), [], {
            "defect_ratio": 0.0,
            "defect_count": 0,
            "max_single_defect_pct": 0.0,
            "total_defect_area_px": 0,
            "produce_area_px": int(produce_area),
        }

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    
    v_channel = hsv[:, :, 2]
    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    l_channel = lab[:, :, 0]

    # 1. Produce inner ROI (moderate erosion of 12-15px to avoid limb-darkening & boundary shadows)
    erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    inner_roi = cv2.erode(produce_mask, erode_kernel, iterations=1)
    if np.sum(inner_roi > 0) < produce_area * 0.35:
        inner_roi = produce_mask

    # 2. Dark Necrotic Rot Detection (Strictly inside produce ROI)
    dark_rot_mask = (v_channel < profile["rot_v_max"]) & (inner_roi > 0)

    # 3. Fungal / Browning / Lesion Detection
    h_min, h_max = profile["rot_h_range"]
    browning_mask = (
        (h_channel >= h_min) &
        (h_channel <= h_max) &
        (s_channel >= profile.get("rot_s_min", 28)) &
        (v_channel < 85) &
        (inner_roi > 0)
    )

    # 4. Local Contrast Blemish Detection via Gaussian difference on LAB L-channel
    l_smooth = cv2.GaussianBlur(l_channel, (25, 25), 0).astype(np.int16)
    l_diff = l_smooth - l_channel.astype(np.int16)
    spot_mask = (l_diff >= 22) & (inner_roi > 0)

    # Exclude normal green calyx/stem from defects
    calyx_normal = (h_channel >= 30) & (h_channel <= 90) & (s_channel >= 35) & (v_channel >= 35)

    # Combine defect channels
    raw_defect_mask = np.zeros_like(produce_mask)
    raw_defect_mask[(dark_rot_mask | browning_mask | spot_mask) & (~calyx_normal)] = 255

    # 5. Morphological noise cleanup (discard isolated 1-2px noise)
    clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    defect_mask = cv2.morphologyEx(raw_defect_mask, cv2.MORPH_OPEN, clean_kernel, iterations=1)

    # 6. Connected Component & Contour Analysis
    contours, _ = cv2.findContours(defect_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_defect_area = produce_area * profile["min_component_ratio"]
    significant_defects = []
    total_defect_area = 0.0
    max_single_defect_area = 0.0

    for c in contours:
        c_area = cv2.contourArea(c)
        if c_area >= min_defect_area:
            total_defect_area += c_area
            if c_area > max_single_defect_area:
                max_single_defect_area = c_area
            
            x, y, w, h = cv2.boundingRect(c)
            rel_pct = round((c_area / produce_area) * 100.0, 2)
            significant_defects.append({
                "contour": c,
                "area": float(c_area),
                "relative_area_pct": rel_pct,
                "bbox": [int(x), int(y), int(w), int(h)]
            })

    defect_ratio = total_defect_area / produce_area if produce_area > 0 else 0.0
    max_single_defect_ratio = max_single_defect_area / produce_area if produce_area > 0 else 0.0
    defect_count = len(significant_defects)

    defect_flags: List[str] = []
    if defect_ratio > profile["max_a_defect_ratio"] or max_single_defect_ratio > (profile["max_a_single_defect"] / 100.0):
        defect_flags.append("surface_blemishes")
    if defect_ratio > (profile["max_a_defect_ratio"] * 2.5) or (defect_count >= 6 and defect_ratio > profile["max_a_defect_ratio"]):
        defect_flags.append("moderate_damage")
    if defect_ratio >= profile["max_b_defect_ratio"] or max_single_defect_ratio >= (profile["max_b_single_defect"] / 100.0) or defect_count >= 10:
        defect_flags.append("severe_rot_damage")

    # Defect Score Calculation (0-100)
    defect_score = 100.0
    defect_score -= (defect_ratio * 400.0)
    defect_score -= (max_single_defect_ratio * 250.0)
    defect_score -= (defect_count * 2.0)
    defect_score = max(0.0, min(100.0, defect_score))

    metrics = {
        "defect_ratio": round(defect_ratio, 4),
        "defect_count": defect_count,
        "max_single_defect_pct": round(max_single_defect_ratio * 100.0, 2),
        "total_defect_area_px": int(total_defect_area),
        "produce_area_px": int(produce_area),
    }

    return defect_score, defect_flags, defect_mask, significant_defects, metrics

# ── Color & Ripeness Health Analysis ────────────────────────────────────────
def analyze_color_health(img_bgr: np.ndarray, produce_mask: np.ndarray, profile: Dict[str, Any]) -> Tuple[float, List[str]]:
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    produce_pixels = produce_mask > 0
    if np.sum(produce_pixels) == 0:
        return 50.0, []

    s_ch = hsv[:, :, 1][produce_pixels]
    v_ch = hsv[:, :, 2][produce_pixels]

    mean_sat = float(np.mean(s_ch))
    mean_val = float(np.mean(v_ch))

    flags = []
    color_score = 88.0

    # Low saturation = pale / washed out
    if mean_sat < 40:
        color_score -= 22.0
        flags.append("pale_discoloration")
    elif mean_sat > 75:
        color_score += 7.0

    # Low value = dark / dull
    if mean_val < 60:
        color_score -= 16.0
        flags.append("dull_appearance")

    return max(0.0, min(100.0, color_score)), flags

# ── Color Uniformity Analysis ───────────────────────────────────────────────
def analyze_color_uniformity(img_bgr: np.ndarray, produce_mask: np.ndarray) -> Tuple[float, List[str]]:
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    produce_pixels = produce_mask > 0
    if np.sum(produce_pixels) == 0:
        return 75.0, []

    h_ch = hsv[:, :, 0][produce_pixels].astype(np.float32)
    s_ch = hsv[:, :, 1][produce_pixels].astype(np.float32)
    v_ch = hsv[:, :, 2][produce_pixels].astype(np.float32)

    # Use circular statistics for Hue to prevent 0/180 wrap-around false variance
    angles = h_ch * (np.pi / 90.0)
    mean_cos = np.mean(np.cos(angles))
    mean_sin = np.mean(np.sin(angles))
    circ_var = float(1.0 - np.sqrt(mean_cos**2 + mean_sin**2))

    s_std = float(np.std(s_ch))
    v_std = float(np.std(v_ch))

    combined_var = (0.50 * (circ_var * 40.0)) + (0.25 * (s_std / 2.0)) + (0.25 * (v_std / 2.0))
    flags = []
    if combined_var > 35.0:
        flags.append("uneven_ripening")

    uniformity_score = np.clip((40.0 - combined_var) / 30.0, 0.0, 1.0) * 100.0
    return float(max(20.0, min(100.0, uniformity_score))), flags

# ── Shape Regularity Analysis ───────────────────────────────────────────────
def analyze_shape_regularity(contour: Optional[np.ndarray]) -> Tuple[float, List[str]]:
    if contour is None or len(contour) < 5:
        return 80.0, []

    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)
    if perimeter == 0 or area < 100:
        return 80.0, []

    circularity = (4 * np.pi * area) / (perimeter * perimeter)
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0.85

    flags = []
    if circularity < 0.25 or solidity < 0.75:
        flags.append("shape_irregularity")

    circ_norm = np.clip((circularity - 0.20) / 0.70, 0.0, 1.0) * 100.0
    sol_norm = np.clip((solidity - 0.70) / 0.30, 0.0, 1.0) * 100.0
    shape_score = 0.5 * circ_norm + 0.5 * sol_norm

    return float(max(0.0, min(100.0, shape_score))), flags

# ── Visual Overlay Generation ───────────────────────────────────────────────
def generate_annotated_overlay(
    img_bgr: np.ndarray,
    produce_mask: np.ndarray,
    defects: List[Dict[str, Any]],
    grade: str,
    overall_score: float,
    defect_ratio_pct: float
) -> np.ndarray:
    """Creates a HUD overlay showing Produce ROI perimeter and highlighted defect polygons."""
    annotated = img_bgr.copy()

    # 1. Produce ROI boundary contour in Cyan
    produce_contours, _ = cv2.findContours(produce_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(annotated, produce_contours, -1, (255, 200, 0), 2)

    # 2. Defect Contours & Bounding Boxes in High-Visibility Red
    for d in defects:
        c = d["contour"]
        x, y, w, h = d["bbox"]
        rel_pct = d["relative_area_pct"]

        # Red filled semi-transparent overlay over defect
        overlay = annotated.copy()
        cv2.drawContours(overlay, [c], -1, (0, 0, 240), -1)
        cv2.addWeighted(overlay, 0.45, annotated, 0.55, 0, annotated)

        # Crisp Red boundary & bounding box
        cv2.drawContours(annotated, [c], -1, (0, 0, 255), 2)
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 0, 255), 1)

        # Defect metric label tag
        lbl = f"Defect: {rel_pct:.1f}%"
        cv2.putText(annotated, lbl, (x, max(15, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1, cv2.LINE_AA)

    # 3. Top Banner HUD
    h, w = annotated.shape[:2]
    cv2.rectangle(annotated, (0, 0), (w, 38), (15, 23, 42), -1)
    
    grade_color = (0, 255, 0) if grade == "A" else ((0, 200, 255) if grade == "B" else (0, 0, 255))
    hud_text = f"AgriSync Vision: GRADE {grade} | Score: {overall_score:.0f}/100 | Defect Ratio: {defect_ratio_pct:.1f}%"
    cv2.putText(annotated, hud_text, (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, grade_color, 2, cv2.LINE_AA)

    return annotated

# ── Master Grading Function ──────────────────────────────────────────────────
def grade_image(img_bgr: np.ndarray, crop_type: Optional[str] = "Tomato") -> GradingResult:
    """Full OpenCV quality grading execution with strict defect dominance rules."""
    # 1. Image Quality Check
    valid, quality_msg = validate_image_quality(img_bgr)
    if not valid:
        return GradingResult(
            grade="REVIEW_REQUIRED",
            quality_score=0.0,
            confidence=0.30,
            grading_status="review_required",
            defect_flags=["poor_image_quality"],
            notes=quality_msg,
            features={"error": quality_msg},
            analysis={"imageQualityValid": False, "reason": quality_msg},
        )

    # 2. Preprocess
    img = preprocess_image(img_bgr)
    profile = get_crop_profile(crop_type)

    # 3. Produce ROI Segmentation
    produce_mask, primary_contour, produce_ratio, object_count = extract_produce_roi(img, profile)
    if object_count > 1:
        return GradingResult(
            grade="REVIEW_REQUIRED",
            quality_score=0.0,
            confidence=0.35,
            grading_status="review_required",
            defect_flags=["multiple_produce_detected"],
            notes=f"Multiple produce items detected ({object_count} objects in frame). Please capture a single produce item for individual grading certification.",
            features={"detectedObjectCount": object_count, "produceCoverageRatio": round(produce_ratio, 3)},
            analysis={"roiDetected": True, "multipleObjects": True},
        )

    if produce_ratio < 0.02:
        return GradingResult(
            grade="REVIEW_REQUIRED",
            quality_score=0.0,
            confidence=0.40,
            grading_status="review_required",
            defect_flags=["no_produce_detected"],
            notes="No clear produce object could be isolated from the background. Please center the crop in good lighting.",
            features={"produceCoverageRatio": round(produce_ratio, 3)},
            analysis={"roiDetected": False},
        )

    # 4. Multi-Feature Analysis
    defect_score, defect_flags, defect_mask, defect_list, defect_metrics = detect_defects_in_roi(img, produce_mask, profile)
    color_score, color_flags = analyze_color_health(img, produce_mask, profile)
    uniformity_score, unif_flags = analyze_color_uniformity(img, produce_mask)
    shape_score, shape_flags = analyze_shape_regularity(primary_contour)

    all_flags = list(dict.fromkeys(defect_flags + color_flags + unif_flags + shape_flags))

    # 5. Weighted Overall Quality Score
    raw_overall = (
        (W_DEFECT * defect_score) +
        (W_COLOR * color_score) +
        (W_SHAPE * shape_score) +
        (W_UNIFORMITY * uniformity_score)
    )

    defect_ratio = defect_metrics["defect_ratio"]
    max_single_defect = defect_metrics["max_single_defect_pct"]
    defect_count = defect_metrics["defect_count"]

    # ── STRICT DEFECT DOMINANCE RULES ───────────────────────────────────────
    # Under no circumstances should visibly defective produce receive Grade A!
    overall = raw_overall
    grade = "A"

    is_severe_defect = (
        defect_ratio >= profile["max_b_defect_ratio"] or
        max_single_defect >= profile["max_b_single_defect"] or
        (defect_count >= 10 and defect_ratio >= 0.04) or
        "severe_rot_damage" in all_flags
    )

    is_moderate_defect = (
        defect_ratio > profile["max_a_defect_ratio"] or
        max_single_defect > profile["max_a_single_defect"] or
        (defect_count >= 3 and defect_ratio >= 0.005) or
        defect_count >= profile.get("max_a_defect_count", 5) or
        "moderate_damage" in all_flags
    )

    if is_severe_defect:
        # Severe damage -> MUST be Grade C
        overall = min(overall, 38.0)
        grade = "C"
        note_summary = "Significant rot, fungal damage, or severe surface lesions detected across produce."
    elif is_moderate_defect:
        # Moderate damage -> MUST be Grade B (cannot be Grade A)
        overall = min(overall, 68.0)
        grade = "B"
        note_summary = "Moderate surface blemishes or minor discoloration detected; acceptable commercial grade."
    elif overall >= GRADE_A_THRESHOLD:
        grade = "A"
        note_summary = "Visually clean produce with minimal surface defects meeting premium export grade."
    elif overall >= GRADE_B_THRESHOLD:
        grade = "B"
        note_summary = "Fair quality produce meeting standard APMC mandi specifications."
    else:
        grade = "C"
        note_summary = "Sub-optimal quality with multiple defects detected."

    # 6. Confidence Score
    confidence = round(float(np.clip(0.80 + (produce_ratio * 0.15) - (0.05 if len(all_flags) > 2 else 0), 0.70, 0.98)), 2)

    # 7. Generate Visual Overlay
    defect_ratio_pct = defect_ratio * 100.0
    annotated = generate_annotated_overlay(img, produce_mask, defect_list, grade, overall, defect_ratio_pct)

    features = {
        "colorScore": round(color_score, 1),
        "defectScore": round(defect_score, 1),
        "shapeScore": round(shape_score, 1),
        "uniformityScore": round(uniformity_score, 1),
        "defectRatio": round(defect_ratio, 4),
        "defectCount": defect_count,
        "maxSingleDefectPct": max_single_defect,
    }

    notes = f"{note_summary} (Overall Score: {overall:.1f}/100, Defect Ratio: {defect_ratio_pct:.1f}%)"

    return GradingResult(
        grade=grade,
        quality_score=round(overall, 1),
        confidence=confidence,
        grading_status="completed",
        defect_flags=all_flags,
        notes=notes,
        features=features,
        analysis={
            "roiDetected": True,
            "produceCoveragePct": round(produce_ratio * 100, 1),
            "imageQualityValid": True,
        },
        annotated_image=annotated,
        defect_mask=defect_mask,
    )
