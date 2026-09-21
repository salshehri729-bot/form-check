/**
 * FormCheck AI — demo logic
 *
 * The analysis below is MOCKED: it picks from a bank of plausible
 * feedback per exercise so the UI is fully demonstrable without a
 * real computer-vision backend.
 *
 * To wire up real analysis:
 *   1. Replace `runMockAnalysis()` with a call to your pose-estimation
 *      service (e.g. a MediaPipe/OpenPose model running server-side).
 *   2. Feed it the uploaded File (see `state.currentFile`).
 *   3. Map its output into the same shape `runMockAnalysis()` returns:
 *      { score: number, items: [{ id, status: 'good'|'risk', title, tip }] }
 */

const FEEDBACK_BANK = {
  squat: [
    { status: "good", title: "Back alignment", tip: "Neutral spine held through the full rep." },
    { status: "good", title: "Depth", tip: "Hips reached below knee level." },
    { status: "risk", title: "Knees caving in", tip: "Push knees outward, in line with your toes, on the way up." },
    { status: "risk", title: "Heels lifting", tip: "Shift weight back into your heels; consider a wider stance." },
    { status: "good", title: "Bar path", tip: "Stayed stacked over mid-foot throughout." },
  ],
  deadlift: [
    { status: "good", title: "Hip hinge", tip: "Clean hinge pattern, hips driving the pull." },
    { status: "risk", title: "Rounded lower back", tip: "Brace your core and keep your chest up before breaking the floor." },
    { status: "good", title: "Bar proximity", tip: "Bar stayed close to the shins and thighs." },
    { status: "risk", title: "Early hip rise", tip: "Drive through your legs first — don't let hips shoot up before the bar moves." },
    { status: "good", title: "Lockout", tip: "Full hip extension at the top, no lean-back." },
  ],
  bench: [
    { status: "good", title: "Shoulder position", tip: "Shoulder blades retracted and stayed pinned." },
    { status: "risk", title: "Flared elbows", tip: "Tuck elbows to roughly 45° to protect your shoulders." },
    { status: "good", title: "Bar path", tip: "Controlled path down to mid-chest." },
    { status: "risk", title: "Bouncing off chest", tip: "Pause briefly at the bottom instead of using rebound momentum." },
    { status: "good", title: "Foot drive", tip: "Legs stayed planted, driving stability through the lift." },
  ],
};

const HISTORY_SEED = [
  { name: "Back Squat", score: 88, date: "Today, 6:12 AM" },
  { name: "Deadlift", score: 61, date: "Yesterday, 5:40 PM" },
  { name: "Bench Press", score: 92, date: "Mon, 7:03 AM" },
  { name: "Back Squat", score: 74, date: "Sat, 6:20 AM" },
];

const state = {
  exercise: "squat",
  currentFile: null,
};

const els = {
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  dropzoneEmpty: document.getElementById("dropzoneEmpty"),
  dropzonePreview: document.getElementById("dropzonePreview"),
  previewVideo: document.getElementById("previewVideo"),
  previewImage: document.getElementById("previewImage"),
  replaceBtn: document.getElementById("replaceBtn"),
  uploadStatus: document.getElementById("uploadStatus"),
  analysisEmpty: document.getElementById("analysisEmpty"),
  checklist: document.getElementById("checklist"),
  scoreWrap: document.getElementById("scoreWrap"),
  scoreNumber: document.getElementById("scoreNumber"),
  scoreCircle: document.getElementById("scoreCircle"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  historyList: document.getElementById("historyList"),
  tabs: document.querySelectorAll(".tab"),
};

const RING_CIRCUMFERENCE = 213.6;

init();

function init() {
  bindUpload();
  bindTabs();
  renderHistory();
}

/* ---------------- Upload interactions ---------------- */

function bindUpload() {
  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      els.fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((evt) =>
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropzone.classList.add("is-dragover");
    })
  );

  ["dragleave", "drop"].forEach((evt) =>
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove("is-dragover");
    })
  );

  els.dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });

  els.fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });

  els.replaceBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    els.fileInput.value = "";
    els.fileInput.click();
  });

  els.analyzeBtn.addEventListener("click", () => {
    els.fileInput.value = "";
    resetToEmpty();
  });
}

function handleFile(file) {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    els.uploadStatus.textContent = "Unsupported file type. Please upload a JPG, PNG, MP4 or MOV.";
    return;
  }

  state.currentFile = file;
  const url = URL.createObjectURL(file);

  els.dropzoneEmpty.hidden = true;
  els.dropzonePreview.hidden = false;

  if (isVideo) {
    els.previewVideo.src = url;
    els.previewVideo.hidden = false;
    els.previewImage.hidden = true;
  } else {
    els.previewImage.src = url;
    els.previewImage.hidden = false;
    els.previewVideo.hidden = true;
  }

  els.uploadStatus.textContent = `Analyzing ${file.name}…`;

  // Simulate processing latency, then show mock results.
  setTimeout(() => {
    const result = runMockAnalysis(state.exercise);
    renderAnalysis(result);
    els.uploadStatus.textContent = `Analysis complete for ${file.name}.`;
  }, 900);
}

function resetToEmpty() {
  els.dropzoneEmpty.hidden = false;
  els.dropzonePreview.hidden = true;
  els.previewVideo.hidden = true;
  els.previewImage.hidden = true;
  els.uploadStatus.textContent = "";

  els.analysisEmpty.hidden = false;
  els.checklist.hidden = true;
  els.checklist.innerHTML = "";
  els.scoreWrap.hidden = true;
  els.analyzeBtn.hidden = true;

  state.currentFile = null;
}

/* ---------------- Tabs ---------------- */

function bindTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      state.exercise = tab.dataset.exercise;

      const label = tab.textContent.trim();
      const empty = els.dropzoneEmpty.querySelector(".dropzone__title");
      if (empty) empty.textContent = `Drop your ${label.toLowerCase()} here`;
    });
  });
}

/* ---------------- Mock analysis ---------------- */

function runMockAnalysis(exercise) {
  const bank = FEEDBACK_BANK[exercise] || FEEDBACK_BANK.squat;
  // Take 4 items so results feel varied but not overwhelming.
  const items = shuffle([...bank]).slice(0, 4);
  const riskCount = items.filter((i) => i.status === "risk").length;
  const score = Math.max(45, 96 - riskCount * 14 - Math.floor(Math.random() * 6));

  return { score, items };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------- Render analysis ---------------- */

function renderAnalysis({ score, items }) {
  els.analysisEmpty.hidden = true;
  els.checklist.hidden = false;
  els.scoreWrap.hidden = false;
  els.analyzeBtn.hidden = false;

  els.scoreNumber.textContent = score;
  const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * score) / 100;
  els.scoreCircle.style.strokeDashoffset = offset;
  els.scoreCircle.style.stroke = score >= 75 ? "var(--green)" : score >= 55 ? "var(--amber)" : "var(--red)";

  els.checklist.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = `check-item is-${item.status}`;
    li.innerHTML = `
      <span class="check-item__dot"></span>
      <div class="check-item__body">
        <p class="check-item__title">${item.title}</p>
        <p class="check-item__tip">${item.tip}</p>
      </div>
    `;
    els.checklist.appendChild(li);
  });
}

/* ---------------- History ---------------- */

function renderHistory() {
  els.historyList.innerHTML = "";
  HISTORY_SEED.forEach((session) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const scoreClass = session.score >= 75 ? "good" : "risk";
    div.innerHTML = `
      <div class="history-item__row">
        <span class="history-item__name">${session.name}</span>
        <span class="history-item__score ${scoreClass}">${session.score}</span>
      </div>
      <p class="history-item__date">${session.date}</p>
    `;
    els.historyList.appendChild(div);
  });
}
