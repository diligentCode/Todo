import "./style.css";
import { initApp } from "./app.js";
import { renderSidebar, renderTasks, setupEventListeners } from "./dom.js";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupEventListeners();
  renderSidebar();
  renderTasks();
});
