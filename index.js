let index = 0;

const slides = document.querySelectorAll("section.slide");
const timelines = document.querySelectorAll("[data-timeline]");
const graphs = document.querySelectorAll("[data-graph]");
const STEP_SELECTOR = "[data-flip], [data-fade], .timeline-element, .graph-element";

function setupElements() {
  document.querySelectorAll("[data-width], [data-height]").forEach(el => {
    if (el.dataset.width)  el.style.setProperty("--width", el.dataset.width);
    if (el.dataset.height) el.style.setProperty("--height", el.dataset.height);
  });

  document.querySelectorAll("[data-flip]").forEach(el => {
    const front = document.createElement("div");
    front.className = "flip-face flip-front";
    front.append(...el.childNodes);

    const back = document.createElement("div");
    back.className = "flip-face flip-back";
    back.textContent = el.dataset.back || "";

    el.append(front, back);
  });
}

function setupGraphs() {
  graphs.forEach(graph => {
    const items = [...graph.querySelectorAll(".graph-element")];
    const values = items.map(el => parseFloat(el.dataset.value) || 0);
    const max = parseFloat(graph.dataset.max) || Math.max(...values) || 1;
    const unit = graph.dataset.unit || "";

    items.forEach((el, i) => {
      el.style.setProperty("--h", Math.max(values[i], 0) / max);

      const track = document.createElement("div");
      track.className = "graph-track";

      const bar = document.createElement("div");
      bar.className = "graph-bar";

      const value = document.createElement("div");
      value.className = "graph-value";
      value.textContent = (0).toFixed(decimalsOf(el.dataset.value)) + unit;
      value._target = values[i];
      value._decimals = decimalsOf(el.dataset.value);
      value._unit = unit;
      value._shown = false;

      const name = document.createElement("div");
      name.className = "graph-name";
      name.textContent = el.dataset.name;

      bar.append(value);
      track.append(bar);
      el.append(track, name);
    });
  });
}

function setupTimelines() {
  timelines.forEach(timeline => {
    const items = [...timeline.querySelectorAll(".timeline-element")];
    const n = items.length;

    // bar + glowing fill
    const bar = document.createElement("div");
    bar.className = "timeline-bar";
    const fill = document.createElement("div");
    fill.className = "timeline-fill";
    bar.append(fill);

    const dot = document.createElement("div");
    dot.className = "timeline-dot";

    timeline.append(bar, dot);

    items.forEach((el, i) => {
      // position along the bar: 0 (start) to 1 (end), evenly spaced
      el.style.setProperty("--p", (i + 0.5) / n);
      el.classList.add(i % 2 ? "up" : "down");

      const year = document.createElement("div");
      year.className = "timeline-year";
      year.textContent = el.dataset.year;

      const title = document.createElement("div");
      title.className = "timeline-title";
      title.textContent = el.dataset.title;

      const content = document.createElement("div");
      content.className = "timeline-content";
      content.textContent = el.dataset.content;

      el.append(year, title, content);
    });
  });

  updateTimelines();
}

// moves the dot / bar to the last revealed event
function updateTimelines() {
  timelines.forEach(timeline => {
    const revealed = timeline.querySelectorAll(".timeline-element.revealed");
    const last = revealed[revealed.length - 1];
    const progress = last ? parseFloat(last.style.getPropertyValue("--p")) : 0;
    timeline.style.setProperty("--progress", progress);
  });
}

function resetSlide(slide) {
  slide.querySelectorAll(STEP_SELECTOR).forEach(el => el.classList.remove("revealed"));
}

function switchSlides(n) {
  if (!slides.length) return;

  const next = (index + n + slides.length) % slides.length;
  console.log(`Switching from ${index} to ${next}`);

  slides[index].classList.remove("active");
  resetSlide(slides[index]);
  updateTimelines();
  updateGraphs();

  index = next;
  slides[index].classList.add("active");
}

function forwardProgress(n) {
  if (!slides.length) return;

  const steps = [...slides[index].querySelectorAll(STEP_SELECTOR)];

  if (n > 0) {
    const next = steps.find(el => !el.classList.contains("revealed"));
    if (next) next.classList.add("revealed");
  } else {
    const last = steps.reverse().find(el => el.classList.contains("revealed"));
    if (last) last.classList.remove("revealed");
  }

  updateGraphs();
  updateTimelines();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    switchSlides(-1);
  } else if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    switchSlides(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    forwardProgress(1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    forwardProgress(-1);
  }
});

// "12.5" -> 1 decimal, "40" -> 0, so the count-up matches your data
function decimalsOf(str) {
  return ((str || "").split(".")[1] || "").length;
}

function countTo(label, to, ms = 800) {
  cancelAnimationFrame(label._raf);
  const from = label._current || 0;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - t, 3);          // fast start, soft landing
    label._current = from + (to - from) * eased;
    label.textContent = label._current.toFixed(label._decimals) + label._unit;
    if (t < 1) label._raf = requestAnimationFrame(frame);
  }
  label._raf = requestAnimationFrame(frame);
}

// starts a count animation whenever a bar gets revealed or hidden
function updateGraphs() {
  document.querySelectorAll(".graph-element").forEach(el => {
    const label = el.querySelector(".graph-value");
    if (!label) return;

    const revealed = el.classList.contains("revealed");
    if (revealed === label._shown) return;      // nothing changed

    label._shown = revealed;
    countTo(label, revealed ? label._target : 0);
  });
}

setupElements();
setupTimelines();
setupGraphs();

if (slides.length) slides[0].classList.add("active");
