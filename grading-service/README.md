# AgriSync — Produce Grading Service

> **Classical OpenCV rule-based produce quality grading.**
> This service is **NOT** a trained machine-learning model.
> The only trained model in the AgriSync system is YOLO11n
> (animal intrusion detection). Produce grading uses deterministic,
> explainable computer-vision heuristics.

---

## What It Does

Accepts an uploaded produce image and returns a structured quality
grade (**A**, **B**, or **C**) along with detected defect flags and
human-readable notes, using classical OpenCV analysis.

---

## Tech Stack

| Component       | Technology               |
|-----------------|--------------------------|
| Web framework   | FastAPI                  |
| Image processing| OpenCV (headless)        |
| Numeric compute | NumPy                    |
| ASGI server     | Uvicorn                  |
| Language        | Python 3.10+             |

No PyTorch, TensorFlow, YOLO, or any ML framework is used.

---

## Installation

```bash
cd grading-service

# create a virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
# source venv/bin/activate

pip install -r requirements.txt
```

---

## Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The service starts at `http://localhost:8001`.

Health check: `GET /health`

API docs (auto-generated): `http://localhost:8001/docs`

---

## API

### `POST /grade`

**Content-Type:** `multipart/form-data`

| Field   | Type   | Required | Description               |
|---------|--------|----------|---------------------------|
| `image` | file   | yes      | Produce image (JPEG, PNG, BMP, TIFF, WebP) |

#### Example Request (curl)

```bash
curl -X POST http://localhost:8001/grade \
  -F "image=@tomato.jpg"
```

#### Example Success Response (200)

```json
{
  "grade": "A",
  "defect_flags": [],
  "notes": "Produce appears visually healthy with minimal detected issues. (scores: overall=78.4/100, color=85.0, defect=92.3, shape=61.2, uniformity=55.0)"
}
```

#### Example Response — Lower Quality (200)

```json
{
  "grade": "C",
  "defect_flags": ["discoloration", "blemish", "possible_damage"],
  "notes": "Produce shows significant visual issues; lower quality detected. Detected: discoloration, blemish, possible_damage. (scores: overall=28.6/100, color=32.0, defect=18.5, shape=45.0, uniformity=30.2)"
}
```

#### Error Responses

| Status | Condition                          | Body example                                       |
|--------|------------------------------------|----------------------------------------------------||
| 400    | No image / unsupported type        | `{"error": "No image file provided..."}`            |
| 400    | Corrupted / undecipherable image   | `{"error": "Could not decode image..."}`            |
| 500    | Internal processing error          | `{"detail": "An internal error occurred..."}`       |

---

## Grades

| Grade | Overall Score | Meaning                                        |
|-------|---------------|------------------------------------------------|
| **A** | ≥ 70          | Visually healthy, minimal defects detected     |
| **B** | ≥ 40, < 70    | Acceptable quality, moderate issues detected   |
| **C** | < 40          | Significant visual issues detected             |

> **Important:** These thresholds are heuristic defaults. They have
> NOT been validated against labelled production datasets. Calibrate
> with real-world produce samples before using in production.

---

## Scoring Formula

```
weighted_score = (
    0.30 × color_score
  + 0.35 × defect_score
  + 0.20 × shape_score
  + 0.15 × uniformity_score
)

overall_score = weighted_score - total_flag_penalty
```

All sub-scores range 0–100 (higher = better).

| Weight | Sub-score      | What it measures                              |
|--------|----------------|-----------------------------------------------|
| 0.30   | color_score    | HSV color/ripeness health                     |
| 0.35   | defect_score   | Surface blemish/defect severity (inverted)    |
| 0.20   | shape_score    | Circularity + solidity regularity             |
| 0.15   | uniformity     | HSV channel standard deviation (inverted)     |

### Flag-Severity Penalty

When defect flags are triggered, an additive penalty is applied to
ensure flagged defects meaningfully reduce the grade even when other
sub-scores are high:

| Flag                 | Penalty |
|----------------------|---------|
| `possible_damage`    | 18      |
| `bruising`           | 12      |
| `blemish`            | 10      |
| `discoloration`      | 8       |
| `shape_irregularity` | 5       |

Penalties are cumulative.  For example, `blemish` + `discoloration`
totals 18, which is subtracted from the weighted score and typically
pushes a borderline score below the grade A threshold.

---

## Defect Flag Vocabulary

| Flag                 | Penalty | Detection method                                     |
|----------------------|---------|------------------------------------------------------|
| `discoloration`      | 8       | Abnormal dark, pale, or brownish regions in HSV      |
| `blemish`            | 10      | Surface dark spots via adaptive threshold + contours |
| `possible_damage`    | 18      | Large blemish area (> 8% of produce region)          |
| `bruising`           | 12      | High count of distinct blemish contours (> 8)        |
| `shape_irregularity` | 5       | Low circularity (< 0.30) or solidity (< 0.80)       |

Only flags supported by actually implemented CV rules are returned.

---

## CV Techniques Used

1. **HSV color-space analysis** — ripeness, discoloration, browning
2. **Adaptive Gaussian thresholding** — dark-spot / blemish detection
3. **Contour detection** — blemish counting, shape measurement
4. **Morphological operations** — noise removal (open/close)
5. **Connected component analysis** — produce region isolation
6. **Circularity + solidity metrics** — shape regularity
7. **Channel std-dev** — color uniformity

---

## Known Limitations

- **Not crop-specific.** The algorithm does not identify the produce
  species. Thresholds are generic and may over- or under-penalise
  certain crops (e.g., very dark eggplant vs. pale cauliflower).
- **Background sensitivity.** If the produce is not visually distinct
  from the background (e.g., green on green), mask extraction may be
  inaccurate.
- **Lighting dependency.** Strong shadows or overexposure can skew
  color and defect scores.
- **Single item.** The pipeline analyses the single largest region.
  Multiple produce items in one image are not individually graded.
- **No depth / weight.** Only 2D visual features are used.
- **Heuristic thresholds.** Weights and thresholds are not trained or
  validated — they are reasonable starting points for demo/evaluation.
  Calibrate with labelled samples before production deployment.

---

## Performance

- Images are resized to max 1024 px on the longest edge before
  processing to keep latency manageable.
- Target: approximately < 3 seconds per image on commodity hardware.
- Actual performance varies with image size and system load.

---

## Project Context

This service is part of the **AgriSync (SIH26193)** post-harvest
module. It will be called by the Node.js lot controller when a
farmer uploads produce photos for grading during lot creation.

The service runs independently and communicates via HTTP, keeping
the grading logic decoupled from the main Express backend.
