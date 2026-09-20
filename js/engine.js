import {  } from "./animator.js";
import {  } from "./utils.js";

function setupElements()
{
  document.querySelectorAll("[data-content]:not(.timeline)").forEach(el => {
    el.innerText = el.dataset.content;
  });

  document.querySelectorAll("[data-bg]").forEach(el => {
    el.style.setProperty('--bg', el.dataset.bg);
  });

  document.querySelectorAll("[data-fg]").forEach(el => {
    el.style.setProperty('--fg', el.dataset.bg);
  });

  document.querySelectorAll("[data-width]").forEach(el => {
    el.style.setProperty('--width', el.dataset.bg);
  });

  document.querySelectorAll("[data-height]").forEach(el => {
    el.style.setProperty('--height', el.dataset.bg);
  });
}
