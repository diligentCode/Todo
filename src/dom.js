import {
  getProjects,
  getCurrentFilter,
  setCurrentFilter,
  getFilteredTasks,
  addProject,
  addTodo,
  updateTodoStatus,
  updateTodoPriority,
  deleteTodo,
} from "./app.js";
import { format, parseISO } from "date-fns";

const SELECTORS = {
  projectsContainer: ".projects",
  taskContainer: ".task-container",
  addProjectForm: ".modal-form",
  projectModalToggle: "#add-project-toggle",
  columnHeaderTitle: ".column-header h2",
  addTaskBtn: ".add-task-btn",
};

const createElement = (tag, classNames = "", textContent = "") => {
  const el = document.createElement(tag);
  if (classNames) el.className = classNames;
  if (textContent) el.textContent = textContent;
  return el;
};

export const renderSidebar = () => {
  const container = document.querySelector(SELECTORS.projectsContainer);
  container.innerHTML = "";

  getProjects().forEach((project) => {
    const div = createElement("a", "nav-item project-item");
    div.href = "#";
    div.textContent = `# ${project.title}`;
    div.dataset.id = project.id;

    if (getCurrentFilter() === project.id) {
      div.classList.add("active");
    }

    div.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
      div.classList.add("active");
      setCurrentFilter(project.id);
      renderTasks();
    });

    container.appendChild(div);
  });
};

export const renderTasks = () => {
  const container = document.querySelector(SELECTORS.taskContainer);
  container.innerHTML = "";

  const titleMap = {
    Dashboard: "All Tasks",
    "My Task": "Today's Tasks",
    Tomorrow: "Tomorrow's Tasks",
  };

  const current = getCurrentFilter();
  const headerTitle = document.querySelector(SELECTORS.columnHeaderTitle);

  if (titleMap[current]) {
    headerTitle.textContent = titleMap[current];
  } else {
    const p = getProjects().find((proj) => proj.id === current);
    headerTitle.textContent = p ? p.title : "Tasks";
  }

  const tasks = getFilteredTasks();

  tasks.forEach((task) => {
    const card = createElement("div", "task-card");
    if (task.completed) card.style.opacity = "0.6";

    // Priority Ring
    const ring = createElement("div", "priority-ring");
    ring.style.width = "12px";
    ring.style.height = "12px";
    ring.style.borderRadius = "50%";
    ring.style.flexShrink = "0";
    ring.style.marginTop = "4px";
    if (task.priority === "high") ring.style.backgroundColor = "#ef4444";
    else if (task.priority === "moderate")
      ring.style.backgroundColor = "#f59e0b";
    else ring.style.backgroundColor = "#3b82f6";

    const content = createElement("div", "task-content");

    const topRow = createElement("div");
    topRow.style.display = "flex";
    topRow.style.justifyContent = "space-between";
    topRow.style.alignItems = "flex-start";

    const h3 = createElement("h3", "", task.title);
    if (task.completed) h3.style.textDecoration = "line-through";

    const delBtn = createElement("button", "", "×");
    delBtn.style.background = "none";
    delBtn.style.border = "none";
    delBtn.style.color = "#ef4444";
    delBtn.style.cursor = "pointer";
    delBtn.style.fontSize = "24px";
    delBtn.style.lineHeight = "1";
    delBtn.addEventListener("click", () => {
      deleteTodo(task.id);
      renderTasks();
    });

    topRow.append(h3, delBtn);

    const p = createElement("p", "", task.description);

    const meta = createElement("div", "task-meta");

    // Priority Dropdown
    const pGroup = createElement("div", "control-group");
    const pLabel = createElement("span", "meta-label", "Priority:");
    const pWrapper = createElement("div", "select-wrapper priority-wrapper");
    const pSelect = createElement("select", "custom-select priority-select");

    ["high", "moderate", "low"].forEach((lvl) => {
      const opt = createElement(
        "option",
        "",
        lvl.charAt(0).toUpperCase() + lvl.slice(1),
      );
      opt.value = lvl;
      if (task.priority === lvl) opt.selected = true;
      pSelect.appendChild(opt);
    });

    pSelect.addEventListener("change", (e) => {
      updateTodoPriority(task.id, e.target.value);
      renderTasks();
    });

    pWrapper.appendChild(pSelect);
    pGroup.append(pLabel, pWrapper);

    // Completed Checkbox
    const cGroup = createElement("div", "control-group checkbox-group");
    const cLabel = createElement("label", "custom-checkbox");
    const cInput = createElement("input", "completed-checkbox");
    cInput.type = "checkbox";
    cInput.checked = task.completed;
    const cCheckmark = createElement("span", "checkmark");
    const cText = createElement("span", "checkbox-label", "Completed");

    cInput.addEventListener("change", (e) => {
      updateTodoStatus(task.id, e.target.checked);
      renderTasks();
    });

    cLabel.append(cInput, cCheckmark, cText);
    cGroup.appendChild(cLabel);

    // Date Display
    let dateText = "No Due Date";
    if (task.dueDate) {
      try {
        dateText = `Due: ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`;
      } catch (e) {
        dateText = task.dueDate;
      }
    }
    const dSpan = createElement("span", "due-date", dateText);

    meta.append(pGroup, cGroup, dSpan);
    content.append(topRow, p, meta);

    // Setup card expanding logic on content click (ignore inputs/buttons)
    content.addEventListener("click", (e) => {
      if (["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
      p.style.display = p.style.display === "none" ? "block" : "none";
    });

    // Default collapse description for neatness, expand on click
    p.style.display = "none";

    card.append(ring, content);
    container.appendChild(card);
  });
};

export const showAddTaskForm = () => {
  const container = document.querySelector(SELECTORS.taskContainer);

  // Prevent multiple forms
  if (container.querySelector(".inline-task-form")) return;

  const form = createElement("form", "task-card inline-task-form");
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "12px";
  form.style.padding = "20px";

  const titleInput = createElement("input");
  titleInput.type = "text";
  titleInput.placeholder = "Task Title (e.g., Read documentation)";
  titleInput.required = true;
  titleInput.style.padding = "10px";
  titleInput.style.border = "1px solid #e2e8f0";
  titleInput.style.borderRadius = "6px";

  const descInput = createElement("textarea");
  descInput.placeholder = "Task Description...";
  descInput.rows = 2;
  descInput.style.padding = "10px";
  descInput.style.border = "1px solid #e2e8f0";
  descInput.style.borderRadius = "6px";

  const row = createElement("div");
  row.style.display = "flex";
  row.style.gap = "15px";

  const dateInput = createElement("input");
  dateInput.type = "date";
  dateInput.style.padding = "10px";
  dateInput.style.border = "1px solid #e2e8f0";
  dateInput.style.borderRadius = "6px";

  const filter = getCurrentFilter();
  if (["Dashboard", "My Task"].includes(filter)) {
    dateInput.value = format(new Date(), "yyyy-MM-dd");
  }

  const prioritySelect = createElement("select");
  prioritySelect.style.padding = "10px";
  prioritySelect.style.border = "1px solid #e2e8f0";
  prioritySelect.style.borderRadius = "6px";
  ["low", "moderate", "high"].forEach((lvl) => {
    const opt = createElement(
      "option",
      "",
      lvl.charAt(0).toUpperCase() + lvl.slice(1),
    );
    opt.value = lvl;
    if (lvl === "moderate") opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  row.append(dateInput, prioritySelect);

  const btnRow = createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.marginTop = "5px";

  const submitBtn = createElement("button", "submit-btn", "Save Task");
  submitBtn.type = "submit";
  submitBtn.style.padding = "10px 20px";
  submitBtn.style.borderRadius = "6px";
  submitBtn.style.border = "none";
  submitBtn.style.background = "var(--primary-color, #3b82f6)";
  submitBtn.style.color = "#fff";
  submitBtn.style.cursor = "pointer";

  const cancelBtn = createElement("button", "", "Cancel");
  cancelBtn.type = "button";
  cancelBtn.style.padding = "10px 20px";
  cancelBtn.style.borderRadius = "6px";
  cancelBtn.style.border = "1px solid #e2e8f0";
  cancelBtn.style.background = "transparent";
  cancelBtn.style.cursor = "pointer";
  cancelBtn.addEventListener("click", () => renderTasks());

  btnRow.append(submitBtn, cancelBtn);
  form.append(titleInput, descInput, row, btnRow);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentFilter = getCurrentFilter();

    let targetProjectId = getProjects()[0].id;
    if (!["Dashboard", "My Task", "Tomorrow"].includes(currentFilter)) {
      targetProjectId = currentFilter;
    }

    addTodo(
      titleInput.value,
      descInput.value,
      dateInput.value,
      prioritySelect.value,
      targetProjectId,
    );
    renderTasks();
  });

  container.prepend(form);
};

export const setupEventListeners = () => {
  // Static Navigation Menu Items
  const navItems = document.querySelectorAll(".nav-menu-list .nav-item");
  navItems.forEach((nav) => {
    nav.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
      nav.classList.add("active");
      setCurrentFilter(nav.textContent.trim());
      renderTasks();
    });
  });

  // Add Task Button
  const addTaskBtn = document.querySelector(SELECTORS.addTaskBtn);
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => showAddTaskForm());
  }

  // Add Project Form Modal
  const addProjectForm = document.querySelector(SELECTORS.addProjectForm);
  if (addProjectForm) {
    addProjectForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = addProjectForm.querySelectorAll("input, textarea, select");
      const title = inputs[0].value;
      const desc = inputs[1].value;
      const deadline = inputs[2].value;
      const priority = inputs[3].value;

      addProject(title, desc, deadline, priority);

      addProjectForm.reset();
      document.querySelector(SELECTORS.projectModalToggle).checked = false;
      renderSidebar();
    });
  }
};

JavaScript;

// filename: index.js
import "./style.css";
import { initApp } from "./app.js";
import { renderSidebar, renderTasks, setupEventListeners } from "./dom.js";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupEventListeners();
  renderSidebar();
  renderTasks();
});
