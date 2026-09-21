#!/usr/bin/env python3
"""
AgriSync — Crop Grading CLI Runner

Command line interface for OpenCV Produce Quality Grading.
Executes deterministic classical computer vision analysis and generates
HUD-annotated defect overlay images.

Usage:
    python grade_cli.py <image_path> [crop_type] [annotated_out_path]
"""

import sys
import os
import json
import cv2
import numpy as np

# Ensure grading module in current or parent directory can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from grading import grade_image, GradingResult

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing image path argument. Usage: grade_cli.py <image_path> [crop_type] [annotated_out_path]"
        }))
        sys.exit(1)

    image_path = sys.argv[1]
    crop_type = sys.argv[2] if len(sys.argv) > 2 else "Tomato"
    annotated_out_path = sys.argv[3] if len(sys.argv) > 3 else None

    if not os.path.exists(image_path):
        print(json.dumps({
            "success": False,
            "error": f"Image file not found: {image_path}"
        }))
        sys.exit(1)

    # Read image using OpenCV
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(json.dumps({
            "success": False,
            "error": f"Failed to decode image from path: {image_path}"
        }))
        sys.exit(1)

    try:
        result: GradingResult = grade_image(img_bgr, crop_type=crop_type)

        # If an annotated image was requested and produced, save it
        if annotated_out_path and result.annotated_image is not None:
            out_dir = os.path.dirname(annotated_out_path)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)
            cv2.imwrite(annotated_out_path, result.annotated_image)

        output = {
            "success": True,
            "grade": result.grade,
            "quality_score": result.quality_score,
            "confidence": result.confidence,
            "grading_status": result.grading_status,
            "defect_flags": result.defect_flags,
            "notes": result.notes,
            "features": result.features,
            "analysis": result.analysis,
            "annotated_saved": bool(annotated_out_path and result.annotated_image is not None),
        }
        print(json.dumps(output))
        sys.exit(0)
    except Exception as exc:
        print(json.dumps({
            "success": False,
            "error": f"Grading pipeline exception: {str(exc)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
