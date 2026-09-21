# FormCheck AI

A dashboard for checking exercise technique before it turns into an injury. Upload a photo or video of a lift (squat, deadlift, or bench press) and get color-coded feedback: green for what's correct, amber for what puts you at risk, each with a short fix.

This build is plain HTML/CSS/JS — no build step, no dependencies. The analysis shown is **mocked** (randomized from a feedback bank per exercise) so the full interface is demonstrable without a real computer-vision backend.

## Run it locally

Just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub

```bash
cd formcheck-ai
git init
git add .
git commit -m "Initial commit: FormCheck AI dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### Host it free with GitHub Pages

1. Push the repo (above).
2. On GitHub: **Settings → Pages → Source → Deploy from branch → main → / (root)**.
3. Your site will be live at `https://<your-username>.github.io/<your-repo>/`.

## Project structure

```
formcheck-ai/
├── index.html      # markup: upload zone, analysis panel, history
├── css/style.css    # dark theme, cyan/green/amber tokens
├── js/script.js     # upload handling, mock analysis, history rendering
└── README.md
```

## Connecting a real AI model

The mock logic lives in one place: `runMockAnalysis()` in `js/script.js`. To wire up real pose analysis:

1. Send the uploaded file (`state.currentFile`) to a backend endpoint.
2. On the backend, run a pose-estimation model (e.g. [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) or OpenPose) against the video/image.
3. Convert the model's joint-angle output into rule-based checks (e.g. knee-valgus angle > threshold → "Knees caving in").
4. Return JSON shaped like:
   ```json
   {
     "score": 82,
     "items": [
       { "status": "good", "title": "Back alignment", "tip": "Neutral spine held through the rep." },
       { "status": "risk", "title": "Knees caving in", "tip": "Push knees outward in line with your toes." }
     ]
   }
   ```
5. Replace the `setTimeout(...)` call in `handleFile()` with a `fetch()` to that endpoint, and pass its response into `renderAnalysis()`.

## Customizing

- **Colors / fonts**: all defined as CSS custom properties at the top of `css/style.css`.
- **Feedback bank**: edit `FEEDBACK_BANK` in `js/script.js` to change what mock feedback appears per exercise.
- **Exercises**: add a new tab in `index.html` (`.exercise-tabs`) and a matching key in `FEEDBACK_BANK`.
