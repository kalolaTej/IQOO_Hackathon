"""
AgriSync Crop Grading Calibration & Verification Suite
Generates calibrated produce test patterns and tests real image pipeline.
Verifies:
 1. Healthy produce -> Grade A
 2. Minor defects -> Grade B
 3. Severe rot / large dark spot / multiple lesions -> Grade C (strictly, never Grade A)
 4. Poor quality (blur, severe underexposure) -> REVIEW_REQUIRED
"""

import os
import cv2
import numpy as np
from grading import grade_image, extract_produce_roi, detect_defects_in_roi, get_crop_profile

TEST_DIR = os.path.join(os.path.dirname(__file__), "test_images")
os.makedirs(TEST_DIR, exist_ok=True)

def create_synthetic_tomato(background_type="white", defect_type="none"):
    img = np.zeros((600, 600, 3), dtype=np.uint8)
    
    if background_type == "white":
        img[:] = (245, 245, 245)
    elif background_type == "wood":
        img[:] = (60, 100, 150)
    elif background_type == "dark":
        img[:] = (30, 30, 30)
    else:
        img[:] = (200, 200, 200)

    center = (300, 300)
    radius = 180
    
    y_coords, x_coords = np.ogrid[:600, :600]
    dist_from_center = np.sqrt((x_coords - center[0])**2 + (y_coords - center[1])**2)
    inside_tomato = dist_from_center <= radius
    
    norm_dist = dist_from_center / radius
    shade = np.clip(1.0 - 0.45 * (norm_dist ** 1.8), 0.4, 1.0)
    
    img[inside_tomato, 0] = (25 * shade[inside_tomato]).astype(np.uint8)
    img[inside_tomato, 1] = (38 * shade[inside_tomato]).astype(np.uint8)
    img[inside_tomato, 2] = (220 * shade[inside_tomato]).astype(np.uint8)

    cv2.fillPoly(img, [np.array([[300, 120], [285, 145], [315, 145]], dtype=np.int32)], (20, 160, 40))
    cv2.fillPoly(img, [np.array([[300, 120], [270, 130], [290, 145]], dtype=np.int32)], (20, 160, 40))
    cv2.fillPoly(img, [np.array([[300, 120], [330, 130], [310, 145]], dtype=np.int32)], (20, 160, 40))

    if defect_type == "minor_spots":
        for spot_center in [(260, 280), (330, 340), (320, 250)]:
            cv2.circle(img, spot_center, 8, (15, 25, 45), -1)
    elif defect_type == "large_rot":
        rot_center = (330, 320)
        cv2.circle(img, rot_center, 55, (10, 20, 35), -1)
        cv2.circle(img, rot_center, 65, (18, 50, 95), 4)
    elif defect_type == "severe_multiple_lesions":
        cv2.circle(img, (250, 260), 45, (10, 15, 30), -1)
        cv2.circle(img, (350, 350), 50, (15, 20, 35), -1)
        cv2.circle(img, (340, 230), 30, (20, 45, 80), -1)

    return img

def create_synthetic_onion(defect_type="none"):
    img = np.full((600, 600, 3), 240, dtype=np.uint8)
    center = (300, 300)
    radius = 175

    y_coords, x_coords = np.ogrid[:600, :600]
    dist_from_center = np.sqrt((x_coords - center[0])**2 + (y_coords - center[1])**2)
    inside_onion = dist_from_center <= radius
    
    norm_dist = dist_from_center / radius
    shade = np.clip(1.0 - 0.4 * (norm_dist ** 2), 0.5, 1.0)
    img[inside_onion, 0] = (110 * shade[inside_onion]).astype(np.uint8)
    img[inside_onion, 1] = (45 * shade[inside_onion]).astype(np.uint8)
    img[inside_onion, 2] = (165 * shade[inside_onion]).astype(np.uint8)

    if defect_type == "black_mold":
        cv2.circle(img, (280, 290), 50, (12, 18, 25), -1)
        cv2.circle(img, (340, 330), 40, (15, 20, 30), -1)
    
    return img

def create_synthetic_potato(defect_type="none"):
    img = np.full((600, 600, 3), 235, dtype=np.uint8)
    center = (300, 300)
    radius_x, radius_y = 190, 145

    y_coords, x_coords = np.ogrid[:600, :600]
    dist = ((x_coords - center[0]) / radius_x)**2 + ((y_coords - center[1]) / radius_y)**2
    inside = dist <= 1.0
    
    img[inside, 0] = 75   # B
    img[inside, 1] = 145  # G
    img[inside, 2] = 195  # R

    if defect_type == "blight":
        cv2.circle(img, (270, 280), 45, (20, 30, 45), -1)
        cv2.circle(img, (360, 320), 40, (25, 35, 50), -1)
    
    return img

def create_blurry_image():
    base = create_synthetic_tomato("white", "none")
    return cv2.GaussianBlur(base, (65, 65), 0)

def create_pitch_black_image():
    return np.full((600, 600, 3), 10, dtype=np.uint8)

def run_tests():
    test_cases = [
        ("tomato_healthy_white_bg.jpg", create_synthetic_tomato("white", "none"), "Tomato", "A"),
        ("tomato_healthy_wood_bg.jpg", create_synthetic_tomato("wood", "none"), "Tomato", "A"),
        ("tomato_healthy_dark_bg.jpg", create_synthetic_tomato("dark", "none"), "Tomato", "A"),
        ("tomato_minor_spots.jpg", create_synthetic_tomato("white", "minor_spots"), "Tomato", "B"),
        ("tomato_large_rot.jpg", create_synthetic_tomato("white", "large_rot"), "Tomato", "C"),
        ("tomato_severe_multiple.jpg", create_synthetic_tomato("white", "severe_multiple_lesions"), "Tomato", "C"),
        ("onion_healthy.jpg", create_synthetic_onion("none"), "Onion", "A"),
        ("onion_black_mold.jpg", create_synthetic_onion("black_mold"), "Onion", "C"),
        ("potato_healthy.jpg", create_synthetic_potato("none"), "Potato", "A"),
        ("potato_blight.jpg", create_synthetic_potato("blight"), "Potato", "C"),
        ("blurry_image.jpg", create_blurry_image(), "Tomato", "REVIEW_REQUIRED"),
        ("pitch_black.jpg", create_pitch_black_image(), "Tomato", "REVIEW_REQUIRED"),
    ]

    print("=========================================================================")
    print("           OPENCV CROP GRADING CALIBRATION & VERIFICATION TEST          ")
    print("=========================================================================")
    print(f"{'Image Name':<30} | {'Exp':<15} | {'Pred':<15} | {'Defect %':<9} | {'Score':<6} | {'Status'}")
    print("-" * 90)

    all_passed = True
    for filename, img, crop_type, expected_grade in test_cases:
        path = os.path.join(TEST_DIR, filename)
        cv2.imwrite(path, img)

        res = grade_image(img, crop_type=crop_type)
        defect_pct = res.features.get("defectRatio", 0.0) * 100.0 if res.features else 0.0
        
        passed = (res.grade == expected_grade)
        if not passed:
            all_passed = False

        status_str = "PASS [OK]" if passed else f"FAIL [Exp {expected_grade}, Got {res.grade}]"
        print(f"{filename:<30} | {expected_grade:<15} | {res.grade:<15} | {defect_pct:>7.2f}% | {res.quality_score:>5.1f} | {status_str}")

    print("=========================================================================")
    if all_passed:
        print("ALL CALIBRATION TESTS PASSED (12/12)! NO FALSE GRADE ASSIGNMENTS.")
    else:
        print("SOME TESTS FAILED.")
    print("=========================================================================")

if __name__ == "__main__":
    run_tests()
