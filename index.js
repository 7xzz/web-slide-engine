let index = 0;

const slides = document.querySelectorAll("section.slide");
const timelines = document.querySelectorAll("[data-timeline]");
const STEP_SELECTOR = "[data-flip], [data-fade], .timeline-element";

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
      el.style.setProperty("--p", n > 1 ? i / (n - 1) : 0.5);
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

setupElements();
setupTimelines();

if (slides.length) slides[0].classList.add("active");
