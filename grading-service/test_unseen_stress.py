"""
AgriSync — Comprehensive OpenCV Crop Grading Unseen Stress Test Suite
Evaluates 30 diverse unseen images across Tomato, Onion, Potato, Mango, Wheat
under varied lighting (sunlight, warm indoor, flash, harsh shadows),
varied backgrounds (grass, soil, wood, white, dark),
geometric variations (sizes, rotations, distances),
and multiple defect severities.

Generates:
  1. Intermediate debug visual artifacts (Original, Produce ROI, Inner ROI, Defect Mask, HUD Overlay).
  2. Confusion Matrix (A, B, C, REVIEW_REQUIRED).
  3. Strict C -> A critical failure check.
"""

import os
import sys
import cv2
import numpy as np
from typing import Dict, List, Tuple, Any

# Add grading module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from grading import (
    grade_image,
    preprocess_image,
    get_crop_profile,
    extract_produce_roi,
    detect_defects_in_roi,
    validate_image_quality,
    generate_annotated_overlay,
    GradingResult,
)

DEBUG_DIR = os.path.join(os.path.dirname(__file__), "debug_output")
os.makedirs(DEBUG_DIR, exist_ok=True)

# ── Synthetic Generator Helpers for Real-World Condition Simulation ──────────

def create_base_canvas(width=640, height=640, bg_type="white"):
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    if bg_type == "white":
        canvas[:] = (242, 244, 245)
    elif bg_type == "dark":
        canvas[:] = (25, 28, 30)
    elif bg_type == "wood":
        # Simulate wooden table with grain
        for y in range(height):
            grain = int(15 * np.sin(y / 18.0) + 5 * np.cos(y / 7.0))
            canvas[y, :] = (max(0, 50 + grain), max(0, 85 + grain), max(0, 140 + grain))
    elif bg_type == "grass":
        # Green outdoor grass background
        canvas[:, :] = (35, 110, 45)
        noise = np.random.randint(-15, 15, (height, width, 3), dtype=np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    elif bg_type == "soil":
        # Brown soil background
        canvas[:, :] = (45, 65, 85)
        noise = np.random.randint(-12, 12, (height, width, 3), dtype=np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return canvas

def draw_sphere(
    canvas,
    center=(320, 320),
    radius=(170, 170),
    bgr_color=(25, 38, 220),
    lighting="diffuse",
    angle=0,
):
    h, w = canvas.shape[:2]
    y_grid, x_grid = np.ogrid[:h, :w]
    
    rx, ry = radius
    dx = (x_grid - center[0]) * np.cos(np.radians(angle)) + (y_grid - center[1]) * np.sin(np.radians(angle))
    dy = -(x_grid - center[0]) * np.sin(np.radians(angle)) + (y_grid - center[1]) * np.cos(np.radians(angle))
    dist = (dx / rx)**2 + (dy / ry)**2
    inside = dist <= 1.0

    norm_dist = np.sqrt(dist[inside])
    
    if lighting == "diffuse":
        shade = np.clip(1.0 - 0.45 * (norm_dist ** 1.8), 0.40, 1.0)
    elif lighting == "sunlight":
        # Brighter high-contrast sunlight with warmer highlights
        shade = np.clip(1.15 - 0.50 * (norm_dist ** 1.6), 0.35, 1.25)
    elif lighting == "warm_indoor":
        shade = np.clip(0.95 - 0.40 * (norm_dist ** 1.8), 0.38, 1.0)
    elif lighting == "flash":
        # Sharp central specular highlight
        highlight = np.exp(-12.0 * (norm_dist ** 2)) * 0.45
        shade = np.clip(1.0 - 0.45 * (norm_dist ** 1.8) + highlight, 0.40, 1.35)
    elif lighting == "harsh_shadow":
        # One-sided strong shadow on the right
        x_norm = (dx[inside] / rx)
        shade = np.clip(1.0 - 0.35 * norm_dist - 0.45 * np.clip(x_norm, 0, 1), 0.30, 1.0)
    else:
        shade = np.clip(1.0 - 0.40 * norm_dist, 0.45, 1.0)

    for c in range(3):
        canvas[inside, c] = np.clip(bgr_color[c] * shade, 0, 255).astype(np.uint8)

    return inside

# ── 30 Diverse Unseen Test Cases Generator ──────────────────────────────────

def generate_unseen_dataset() -> List[Tuple[str, np.ndarray, str, str]]:
    dataset = []

    # 1. Tomato - Sunlight Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (175, 175), (20, 35, 230), "sunlight")
    cv2.fillPoly(img, [np.array([[320, 140], [305, 165], [335, 165]], dtype=np.int32)], (20, 160, 40))
    dataset.append(("tomato_sunlight_healthy.jpg", img, "Tomato", "A"))

    # 2. Tomato - Warm Indoor Healthy -> Grade A
    img = create_base_canvas(640, 640, "wood")
    draw_sphere(img, (320, 320), (165, 165), (25, 45, 215), "warm_indoor")
    cv2.fillPoly(img, [np.array([[320, 150], [305, 175], [335, 175]], dtype=np.int32)], (20, 160, 40))
    dataset.append(("tomato_warm_indoor_healthy.jpg", img, "Tomato", "A"))

    # 3. Tomato - Flash Specular Highlight Healthy -> Grade A
    img = create_base_canvas(640, 640, "dark")
    draw_sphere(img, (320, 320), (170, 170), (20, 30, 220), "flash")
    dataset.append(("tomato_flash_healthy.jpg", img, "Tomato", "A"))

    # 4. Tomato - Harsh Shadow Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (175, 175), (25, 38, 220), "harsh_shadow")
    dataset.append(("tomato_harsh_shadow_healthy.jpg", img, "Tomato", "A"))

    # 5. Tomato - Outdoor Grass Background Healthy -> Grade A
    img = create_base_canvas(640, 640, "grass")
    draw_sphere(img, (320, 320), (170, 170), (20, 35, 225), "diffuse")
    dataset.append(("tomato_grass_bg_healthy.jpg", img, "Tomato", "A"))

    # 6. Tomato - Soil Ground Background Healthy -> Grade A
    img = create_base_canvas(640, 640, "soil")
    draw_sphere(img, (320, 320), (170, 170), (20, 35, 225), "diffuse")
    dataset.append(("tomato_soil_bg_healthy.jpg", img, "Tomato", "A"))

    # 7. Tomato - Distant / Smaller Scale Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (110, 110), (25, 38, 220), "diffuse") # ~9% area
    dataset.append(("tomato_smaller_scale_healthy.jpg", img, "Tomato", "A"))

    # 8. Tomato - Large Close-Up Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (240, 240), (25, 38, 220), "diffuse") # ~45% area
    dataset.append(("tomato_large_closeup_healthy.jpg", img, "Tomato", "A"))

    # 9. Tomato - Small Bruise Minor -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    cv2.circle(img, (320, 320), 16, (15, 25, 45), -1) # Single ~0.9% bruise
    dataset.append(("tomato_single_bruise_minor.jpg", img, "Tomato", "B"))

    # 10. Tomato - Multiple Speckles Minor -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    for pt in [(280, 290), (350, 340), (330, 260), (270, 350)]:
        cv2.circle(img, pt, 9, (12, 22, 40), -1)
    dataset.append(("tomato_multiple_speckles_minor.jpg", img, "Tomato", "B"))

    # 11. Tomato - Moderate Lesion -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    cv2.circle(img, (330, 330), 32, (15, 35, 60), -1) # ~3.5% lesion
    dataset.append(("tomato_moderate_lesion.jpg", img, "Tomato", "B"))

    # 12. Tomato - Severe Anthracnose Necrotic Rot -> Grade C
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    cv2.circle(img, (330, 330), 65, (8, 15, 25), -1) # ~14.6% black rot
    cv2.circle(img, (330, 330), 75, (15, 45, 80), 4) # Fungal ring
    dataset.append(("tomato_severe_anthracnose_rot.jpg", img, "Tomato", "C"))

    # 13. Tomato - Edge Rot Damage -> Grade C
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    cv2.circle(img, (240, 270), 55, (10, 18, 28), -1) # ~10.4% side rot
    dataset.append(("tomato_edge_rot_damage.jpg", img, "Tomato", "C"))

    # 14. Onion - Wooden Table Healthy -> Grade A
    img = create_base_canvas(640, 640, "wood")
    draw_sphere(img, (320, 320), (165, 165), (110, 45, 165), "diffuse")
    dataset.append(("onion_wood_table_healthy.jpg", img, "Onion", "A"))

    # 15. Onion - White Surface Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (165, 165), (115, 48, 170), "diffuse")
    dataset.append(("onion_white_surface_healthy.jpg", img, "Onion", "A"))

    # 16. Onion - Minor Surface Blemish -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (165, 165), (110, 45, 165), "diffuse")
    cv2.circle(img, (310, 310), 18, (15, 20, 35), -1)
    dataset.append(("onion_minor_blemish.jpg", img, "Onion", "B"))

    # 17. Onion - Soft Rot Moderate -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (165, 165), (110, 45, 165), "diffuse")
    cv2.circle(img, (330, 320), 32, (18, 28, 45), -1)
    dataset.append(("onion_soft_rot_moderate.jpg", img, "Onion", "B"))

    # 18. Onion - Severe Black Mold -> Grade C
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (165, 165), (110, 45, 165), "diffuse")
    cv2.circle(img, (290, 300), 55, (8, 14, 20), -1)
    cv2.circle(img, (360, 350), 40, (10, 16, 22), -1)
    dataset.append(("onion_severe_black_mold.jpg", img, "Onion", "C"))

    # 19. Potato - Dark Bench Healthy -> Grade A
    img = create_base_canvas(640, 640, "dark")
    draw_sphere(img, (320, 320), (180, 135), (75, 145, 195), "diffuse")
    dataset.append(("potato_dark_bench_healthy.jpg", img, "Potato", "A"))

    # 20. Potato - Rotated 45deg Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (180, 135), (75, 145, 195), "diffuse", angle=45)
    dataset.append(("potato_rotated_healthy.jpg", img, "Potato", "A"))

    # 21. Potato - Mild Greenish Bruise -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (180, 135), (75, 145, 195), "diffuse")
    cv2.circle(img, (310, 310), 22, (20, 30, 45), -1)
    dataset.append(("potato_mild_bruise_minor.jpg", img, "Potato", "B"))

    # 22. Potato - Severe Blight Scab -> Grade C
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (180, 135), (75, 145, 195), "diffuse")
    cv2.circle(img, (280, 300), 52, (15, 25, 38), -1)
    cv2.circle(img, (370, 330), 45, (18, 28, 42), -1)
    dataset.append(("potato_severe_blight.jpg", img, "Potato", "C"))

    # 23. Mango - White Plate Healthy -> Grade A
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 130), (35, 175, 225), "diffuse")
    dataset.append(("mango_white_plate_healthy.jpg", img, "Mango", "A"))

    # 24. Mango - Minor Surface Blemish -> Grade B
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 130), (35, 175, 225), "diffuse")
    cv2.circle(img, (310, 320), 18, (15, 25, 40), -1)
    dataset.append(("mango_minor_blemish.jpg", img, "Mango", "B"))

    # 25. Mango - Severe Anthracnose Spots -> Grade C
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (170, 130), (35, 175, 225), "diffuse")
    cv2.circle(img, (310, 320), 55, (10, 18, 28), -1)
    dataset.append(("mango_severe_anthracnose.jpg", img, "Mango", "C"))

    # 26. Multiple Produce Objects (2 Tomatoes) -> REVIEW_REQUIRED
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (200, 320), (110, 110), (25, 38, 220), "diffuse")
    draw_sphere(img, (440, 320), (110, 110), (25, 38, 220), "diffuse")
    dataset.append(("two_tomatoes_in_frame.jpg", img, "Tomato", "REVIEW_REQUIRED"))

    # 27. Multiple Produce Objects (3 Onions) -> REVIEW_REQUIRED
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (200, 240), (95, 95), (110, 45, 165), "diffuse")
    draw_sphere(img, (440, 240), (95, 95), (110, 45, 165), "diffuse")
    draw_sphere(img, (320, 440), (95, 95), (110, 45, 165), "diffuse")
    dataset.append(("three_onions_in_frame.jpg", img, "Onion", "REVIEW_REQUIRED"))

    # 28. Blurry / Shaky Capture -> REVIEW_REQUIRED
    base = create_base_canvas(640, 640, "white")
    draw_sphere(base, (320, 320), (170, 170), (25, 38, 220), "diffuse")
    blurry = cv2.GaussianBlur(base, (75, 75), 0)
    dataset.append(("blurry_shaky_capture.jpg", blurry, "Tomato", "REVIEW_REQUIRED"))

    # 29. Pitch Black Night Shot -> REVIEW_REQUIRED
    pitch_black = np.full((640, 640, 3), 8, dtype=np.uint8)
    dataset.append(("pitch_black_night_shot.jpg", pitch_black, "Tomato", "REVIEW_REQUIRED"))

    # 30. Tiny Crop Distant Background -> REVIEW_REQUIRED
    img = create_base_canvas(640, 640, "white")
    draw_sphere(img, (320, 320), (35, 35), (25, 38, 220), "diffuse") # < 1% area
    dataset.append(("tiny_crop_distant.jpg", img, "Tomato", "REVIEW_REQUIRED"))

    return dataset

# ── Stress Runner with Visual ROI & Confusion Matrix Generation ──────────────

def run_stress_test():
    dataset = generate_unseen_dataset()
    print("=========================================================================================")
    print("           OPENCV CROP GRADING — 30-CASE UNSEEN STRESS TEST & VALIDATION                 ")
    print("=========================================================================================")
    print(f"{'Image Name':<34} | {'Crop':<7} | {'Exp':<15} | {'Pred':<15} | {'Defect%':<8} | {'Score':<6} | {'Status'}")
    print("-" * 105)

    grades = ["A", "B", "C", "REVIEW_REQUIRED"]
    confusion_matrix = {exp: {pred: 0 for pred in grades} for exp in grades}

    all_passed = True
    c_to_a_failures = 0
    results_by_crop = {}

    for filename, img_bgr, crop_type, expected_grade in dataset:
        case_name = os.path.splitext(filename)[0]
        case_debug_dir = os.path.join(DEBUG_DIR, case_name)
        os.makedirs(case_debug_dir, exist_ok=True)

        # 1. Save Original
        cv2.imwrite(os.path.join(case_debug_dir, "01_original.jpg"), img_bgr)

        # Preprocess
        img = preprocess_image(img_bgr)
        profile = get_crop_profile(crop_type)

        # Run Grading
        res: GradingResult = grade_image(img_bgr, crop_type=crop_type)
        pred_grade = res.grade
        defect_pct = res.features.get("defectRatio", 0.0) * 100.0 if res.features else 0.0

        # Save Intermediate Visual ROI Artifacts
        if res.analysis.get("roiDetected", False):
            produce_mask, hull, _, _ = extract_produce_roi(img, profile)
            cv2.imwrite(os.path.join(case_debug_dir, "02_produce_roi.jpg"), produce_mask)

            erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            inner_roi = cv2.erode(produce_mask, erode_kernel, iterations=1)
            cv2.imwrite(os.path.join(case_debug_dir, "03_inner_roi.jpg"), inner_roi)

            if res.defect_mask is not None:
                cv2.imwrite(os.path.join(case_debug_dir, "04_defect_mask.jpg"), res.defect_mask)

        if res.annotated_image is not None:
            cv2.imwrite(os.path.join(case_debug_dir, "05_annotated_hud.jpg"), res.annotated_image)

        # Record Confusion
        confusion_matrix[expected_grade][pred_grade] = confusion_matrix[expected_grade].get(pred_grade, 0) + 1

        if expected_grade == "C" and pred_grade == "A":
            c_to_a_failures += 1

        passed = (pred_grade == expected_grade)
        if not passed:
            all_passed = False

        if crop_type not in results_by_crop:
            results_by_crop[crop_type] = {"total": 0, "passed": 0}
        results_by_crop[crop_type]["total"] += 1
        if passed:
            results_by_crop[crop_type]["passed"] += 1

        status_str = "PASS [OK]" if passed else f"FAIL [Got {pred_grade}]"
        print(f"{filename:<34} | {crop_type:<7} | {expected_grade:<15} | {pred_grade:<15} | {defect_pct:>6.2f}% | {res.quality_score:>5.1f} | {status_str}")

    print("=========================================================================================")
    print("\nCONFUSION MATRIX (Expected vs Predicted):")
    print("-" * 65)
    print(f"{'Expected \\ Predicted':<22} | {'A':<6} | {'B':<6} | {'C':<6} | {'REVIEW_REQ':<10}")
    print("-" * 65)
    for exp in grades:
        row_str = f"{exp:<22} | {confusion_matrix[exp]['A']:<6} | {confusion_matrix[exp]['B']:<6} | {confusion_matrix[exp]['C']:<6} | {confusion_matrix[exp]['REVIEW_REQUIRED']:<10}"
        print(row_str)
    print("-" * 65)

    print("\nRESULTS BY CROP COMMODITY:")
    print("-" * 45)
    for crop, stats in results_by_crop.items():
        acc = (stats["passed"] / stats["total"]) * 100.0
        print(f"{crop:<15}: {stats['passed']}/{stats['total']} ({acc:.1f}% accuracy)")
    print("-" * 45)

    print(f"\nCRITICAL C -> A FAILURES: {c_to_a_failures} (Must be 0)")
    print(f"INTERMEDIATE DEBUG ARTIFACTS SAVED TO: {DEBUG_DIR}")
    print("=========================================================================================")

    return all_passed, confusion_matrix, c_to_a_failures

if __name__ == "__main__":
    success, matrix, c_to_a = run_stress_test()
    if not success:
        sys.exit(1)
