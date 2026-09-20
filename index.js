let index = 0;

const slides = document.querySelectorAll("section.slide");
const timelines = document.querySelectorAll("[data-timeline]");
const graphs = document.querySelectorAll("[data-graph]");
const lines = document.querySelectorAll("[data-linegraph]");

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LEAVE_MS = REDUCED ? 0 : 600;    // how long a slide stays visible while it leaves
const ENTER_MS = REDUCED ? 0 : 2000;   // how long the enter classes (and the stagger) stay on
const MOTION_CLASSES = ["enter-next", "enter-prev", "enter-start", "leave-next", "leave-prev", "leaving"];
const STEP_SELECTOR =
  "[data-flip], [data-fade], .timeline-element, .graph-element, .line-point, .table-row";

/* ---------- HELPERS ---------- */

// "12.5" -> 1 decimal, "40" -> 0
function decimalsOf(str) {
  return ((str || "").split(".")[1] || "").length;
}

// 1600 -> "1,600"
function fmt(v, decimals = 0) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// counts a label (HTML or SVG text) up or down to a value
function countTo(label, to, ms = 800) {
  cancelAnimationFrame(label._raf);
  const from = label._current || 0;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    label._current = from + (to - from) * eased;
    label.textContent = fmt(label._current, label._decimals) + label._unit;
    if (t < 1) label._raf = requestAnimationFrame(frame);
  }
  label._raf = requestAnimationFrame(frame);
}

/* ---------- SETUP ---------- */

// data-content -> text of the element (only if the element is empty).
// Timeline events use data-content for their own description, so skip them.
function setupContent() {
  document.querySelectorAll("[data-content]:not(.timeline-element)").forEach(el => {
    if (!el.children.length && !el.textContent.trim()) {
      el.textContent = el.dataset.content;
    }
  });
}

function setupElements() {
  document.querySelectorAll("[data-width], [data-height], [data-spacing]").forEach(el => {
    if (el.dataset.width)   el.style.setProperty("--width", el.dataset.width);
    if (el.dataset.height)  el.style.setProperty("--height", el.dataset.height);
    if (el.dataset.spacing) el.style.setProperty("--spacing", el.dataset.spacing);
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

function setupTimelines() {
  timelines.forEach(timeline => {
    const items = [...timeline.querySelectorAll(".timeline-element")];
    const n = items.length;

    const bar = document.createElement("div");
    bar.className = "timeline-bar";
    const fill = document.createElement("div");
    fill.className = "timeline-fill";
    bar.append(fill);

    const dot = document.createElement("div");
    dot.className = "timeline-dot";

    timeline.append(bar, dot);

    items.forEach((el, i) => {
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

function setupGraphs() {
  graphs.forEach(graph => {
    const items = [...graph.querySelectorAll(".graph-element")];
    const values = items.map(el => parseFloat(el.dataset.value) || 0);
    const max = parseFloat(graph.dataset.max) || Math.max(...values) || 1;
    const unit = graph.dataset.unit || "";

    graph.style.setProperty("--n", items.length);   // bar count sets the chart width

    items.forEach((el, i) => {
      el.style.setProperty("--h", Math.max(values[i], 0) / max);

      const track = document.createElement("div");
      track.className = "graph-track";

      const bar = document.createElement("div");
      bar.className = "graph-bar";

      const value = document.createElement("div");
      value.className = "graph-value";
      value._decimals = decimalsOf(el.dataset.value);
      value._target = values[i];
      value._unit = unit;
      value._shown = false;
      value.textContent = fmt(0, value._decimals) + unit;

      const name = document.createElement("div");
      name.className = "graph-name";
      name.textContent = el.dataset.name;

      bar.append(value);
      track.append(bar);
      el.append(track, name);
    });
  });
}

/* Line chart: draws an SVG. Each .line-point is one step (one more segment).
   If every data-name is a number (years), points are spaced proportionally. */
function setupLineGraphs() {
  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, attrs = {}, text) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  lines.forEach(chart => {
    const items = [...chart.querySelectorAll(".line-point")];
    if (!items.length) return;

    const W = 800, H = 440, L = 80, R = 40, T = 40, B = 90, PAD = 30;
    const unit = chart.dataset.unit || "";
    const values = items.map(el => parseFloat(el.dataset.value) || 0);
    const max = parseFloat(chart.dataset.max) || Math.max(...values) || 1;

    const nums = items.map(el => Number(el.dataset.name));
    const lo = Math.min(...nums), hi = Math.max(...nums);
    const numeric = items.length > 1 && nums.every(Number.isFinite) && hi > lo;

    const plotW = W - L - R - 2 * PAD;
    const plotH = H - T - B;
    const xAt = i => {
      if (items.length === 1) return L + PAD + plotW / 2;
      const f = numeric ? (nums[i] - lo) / (hi - lo) : i / (items.length - 1);
      return L + PAD + f * plotW;
    };
    const yAt = v => T + (1 - Math.min(Math.max(v, 0), max) / max) * plotH;

    const svg = make("svg", {
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
      "aria-label": chart.dataset.ylabel || "Line chart",
    });

    // gridlines + y ticks
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4;
      const y = yAt(v);
      svg.append(
        make("line", { class: "lg-grid", x1: L, x2: W - R, y1: y, y2: y }),
        make("text", { class: "lg-tick", x: L - 12, y: y + 5 }, fmt(v, Number.isInteger(v) ? 0 : 1) + unit)
      );
    }

    // axis titles
    if (chart.dataset.ylabel) {
      svg.append(make("text", {
        class: "lg-axis", x: 18, y: T + plotH / 2,
        transform: `rotate(-90 18 ${T + plotH / 2})`,
      }, chart.dataset.ylabel));
    }
    if (chart.dataset.xlabel) {
      svg.append(make("text", { class: "lg-axis", x: L + (W - L - R) / 2, y: H - 14 }, chart.dataset.xlabel));
    }

    // segments, dots, value labels, x labels
    const parts = items.map((el, i) => {
      const seg = i > 0
        ? make("path", {
            class: "line-seg",
            pathLength: 1,
            d: `M${xAt(i - 1)} ${yAt(values[i - 1])} L${xAt(i)} ${yAt(values[i])}`,
          })
        : null;

      const dot = make("circle", { class: "line-dot", cx: xAt(i), cy: yAt(values[i]), r: 7 });

      const value = make("text", { class: "line-value", x: xAt(i), y: yAt(values[i]) - 18 });
      value._decimals = decimalsOf(el.dataset.value);
      value._target = values[i];
      value._unit = unit;
      value._shown = false;
      value.textContent = fmt(0, value._decimals) + unit;

      return { el, seg, dot, value };
    });

    parts.forEach(p => p.seg && svg.append(p.seg));
    parts.forEach(p => svg.append(p.dot));
    parts.forEach(p => svg.append(p.value));
    items.forEach((el, i) => {
      svg.append(make("text", { class: "lg-name", x: xAt(i), y: T + plotH + 28 }, el.dataset.name));
    });

    chart._parts = parts;
    chart.append(svg);
  });
}

/* ---------- UPDATES ---------- */

// moves the dot / bar to the last revealed event
function updateTimelines() {
  timelines.forEach(timeline => {
    const revealed = timeline.querySelectorAll(".timeline-element.revealed");
    const last = revealed[revealed.length - 1];
    const progress = last ? parseFloat(last.style.getPropertyValue("--p")) : 0;
    timeline.style.setProperty("--progress", progress);
  });
}

// starts a count animation whenever a bar gets revealed or hidden
function updateGraphs() {
  document.querySelectorAll(".graph-element").forEach(el => {
    const label = el.querySelector(".graph-value");
    if (!label) return;

    const revealed = el.classList.contains("revealed");
    if (revealed === label._shown) return;

    label._shown = revealed;
    countTo(label, revealed ? label._target : 0);
  });
}

// draws / retracts line segments and counts the point labels
function updateLineGraphs() {
  lines.forEach(chart => {
    (chart._parts || []).forEach(({ el, seg, dot, value }) => {
      const on = el.classList.contains("revealed");
      if (seg) seg.classList.toggle("on", on);
      dot.classList.toggle("on", on);
      value.classList.toggle("on", on);

      if (on !== value._shown) {
        value._shown = on;
        countTo(value, on ? value._target : 0);
      }
    });
  });
}

function updateAll() {
  updateTimelines();
  updateGraphs();
  updateLineGraphs();
}

/* ---------- NAVIGATION ---------- */

function resetSlide(slide) {
  slide.querySelectorAll(STEP_SELECTOR).forEach(el => el.classList.remove("revealed"));
}

function clearMotion(slide) {
  slide.classList.remove(...MOTION_CLASSES);
}

function enterSlide(slide, dir) {
  clearTimeout(slide._timer);

  if (slide._leaving) {            // came back before it finished leaving
    slide._leaving = false;
    resetSlide(slide);
    updateAll();
  }

  clearMotion(slide);
  slide.classList.add("active", `enter-${dir}`);
  slide._timer = setTimeout(() => slide.classList.remove(`enter-${dir}`), ENTER_MS);
}

function leaveSlide(slide, dir) {
  clearTimeout(slide._timer);
  clearMotion(slide);

  slide.classList.remove("active");
  slide.classList.add("leaving", `leave-${dir}`);
  slide._leaving = true;

  // reset the steps only after it is gone, so nothing flips back while it fades out
  slide._timer = setTimeout(() => {
    clearMotion(slide);
    slide._leaving = false;
    resetSlide(slide);
    updateAll();
  }, LEAVE_MS);
}

function switchSlides(n) {
  if (!slides.length) return;

  const next = (index + n + slides.length) % slides.length;
  if (next === index) return;

  const dir = n > 0 ? "next" : "prev";
  leaveSlide(slides[index], dir);
  index = next;
  enterSlide(slides[index], dir);
  updateChrome();
}

/* progress bar + slide counter */
const deckCounter = document.createElement("div");

function setupChrome() {
  const progress = document.createElement("div");
  progress.className = "deck-progress";
  progress.innerHTML = '<div class="deck-progress-bar"></div>';

  deckCounter.className = "deck-counter";
  document.body.append(progress, deckCounter);

  // index for the staggered entrance of each slide's top-level elements
  slides.forEach(slide => {
    [...slide.children].forEach((child, i) => child.style.setProperty("--i", i));
  });
}

function updateChrome() {
  document.documentElement.style.setProperty("--deck", (index + 1) / slides.length);
  deckCounter.textContent = `${index + 1} / ${slides.length}`;
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

  updateAll();
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

/* ---------- INIT ---------- */

setupContent();     // must run before setupElements (flip wraps the text)
setupElements();
setupTimelines();
setupGraphs();
setupLineGraphs();

setupChrome();

if (slides.length) {
  enterSlide(slides[0], "start");
  updateChrome();
}
