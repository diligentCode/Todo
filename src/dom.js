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

// 1. Render Sidebar Projects
export const renderSidebar = () => {
  const container = document.querySelector(SELECTORS.projectsContainer);
  container.innerHTML = "";

  getProjects().forEach((project) => {
    const link = document.createElement("a");
    link.className = "nav-item project-item";
    link.href = "#";
    link.textContent = `# ${project.title}`;
    link.dataset.id = project.id;

    if (getCurrentFilter() === project.id) {
      link.classList.add("active");
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
      link.classList.add("active");
      setCurrentFilter(project.id);
      renderTasks();
    });

    container.appendChild(link);
  });
};

// 2. Render Task Cards using the HTML <template>
export const renderTasks = () => {
  const container = document.querySelector(SELECTORS.taskContainer);
  const template = document.querySelector("#task-card-template");
  container.innerHTML = "";

  // Set the correct Column Title based on active filter
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

  // Generate Task Cards
  const tasks = getFilteredTasks();
  tasks.forEach((task) => {
    // Clone the HTML structure from the template
    const clone = template.content.cloneNode(true);

    // Set Text Content
    clone.querySelector(".task-title").textContent = task.title;

    const descEl = clone.querySelector(".task-description");
    descEl.textContent = task.description;
    descEl.classList.add("hidden-toggle"); // Hide description by default

    // Format and Set Date
    let dateText = "No Due Date";
    if (task.dueDate) {
      try {
        dateText = `Due: ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`;
      } catch (e) {
        dateText = task.dueDate;
      }
    }
    clone.querySelector(".due-date").textContent = dateText;

    // Sync Inputs (Your CSS dynamically styles the card based on these!)
    const select = clone.querySelector(".priority-select");
    select.value = task.priority;

    const checkbox = clone.querySelector(".completed-checkbox");
    checkbox.checked = task.completed;

    // --- Add Event Listeners to the cloned elements ---

    // Delete Task
    clone.querySelector(".delete-task-btn").addEventListener("click", () => {
      deleteTodo(task.id);
      renderTasks();
    });

    // Change Priority
    select.addEventListener("change", (e) => {
      updateTodoPriority(task.id, e.target.value);
      renderTasks();
    });

    // Toggle Complete
    checkbox.addEventListener("change", (e) => {
      updateTodoStatus(task.id, e.target.checked);
      renderTasks();
    });

    // Expand/Collapse Description on Click
    clone.querySelector(".task-content").addEventListener("click", (e) => {
      // Don't expand if they clicked a button, select, or checkbox
      if (["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
      descEl.classList.toggle("hidden-toggle");
    });

    // Append finished card to container
    container.appendChild(clone);
  });
};

// 3. Show Inline "Add Task" Form
export const showAddTaskForm = () => {
  const container = document.querySelector(SELECTORS.taskContainer);

  // Prevent opening multiple forms
  if (container.querySelector(".inline-task-form")) return;

  const form = document.createElement("form");
  form.className = "task-card inline-task-form task-content modal-form";

  // Pre-fill date if looking at Today or Dashboard
  const filter = getCurrentFilter();
  const defaultDate = ["Dashboard", "My Task"].includes(filter)
    ? format(new Date(), "yyyy-MM-dd")
    : "";

  // Build form using your existing CSS classes (No inline styles!)
  form.innerHTML = `
    <div class="form-group">
      <input type="text" class="form-title" placeholder="Task Title (e.g., Read documentation)" required>
    </div>
    <div class="form-group">
      <textarea class="form-desc" placeholder="Task Description..." rows="2"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <input type="date" class="form-date" value="${defaultDate}">
      </div>
      <div class="form-group">
        <select class="modal-select form-priority">
          <option value="low">Low</option>
          <option value="moderate" selected>Moderate</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <button type="submit" class="submit-btn">Save Task</button>
      <button type="button" class="submit-btn cancel-btn" class="close-btn">Cancel</button>
    </div>
  `;

  // Cancel Button Logic
  form
    .querySelector(".cancel-btn")
    .addEventListener("click", () => renderTasks());

  // Submit Logic
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentFilter = getCurrentFilter();

    // Determine which project to add to
    let targetProjectId = getProjects()[0].id;
    if (!["Dashboard", "My Task", "Tomorrow"].includes(currentFilter)) {
      targetProjectId = currentFilter;
    }

    addTodo(
      form.querySelector(".form-title").value,
      form.querySelector(".form-desc").value,
      form.querySelector(".form-date").value,
      form.querySelector(".form-priority").value,
      targetProjectId,
    );

    renderTasks();
  });

  container.prepend(form);
};

// 4. Global Event Listeners Setup
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

  // Top-Right "Add Task" Button
  const addTaskBtn = document.querySelector(SELECTORS.addTaskBtn);
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => showAddTaskForm());
  }

  // Create Project Modal Form
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
