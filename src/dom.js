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
    link.textContent = `${project.title}`;
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

// 2. Render Task Cards
export const renderTasks = () => {
  const container = document.querySelector(SELECTORS.taskContainer);
  const template = document.querySelector("#task-card-template");
  container.innerHTML = "";

  // Set Column Title
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

  // Generate Cards
  const tasks = getFilteredTasks();
  tasks.forEach((task) => {
    const clone = template.content.cloneNode(true);

    clone.querySelector(".task-title").textContent = task.title;

    const descEl = clone.querySelector(".task-description");
    descEl.textContent = task.description;
    descEl.classList.add("hidden-toggle");

    let dateText = "No Due Date";
    if (task.dueDate) {
      try {
        dateText = `Due: ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`;
      } catch (e) {
        dateText = task.dueDate;
      }
    }
    clone.querySelector(".due-date").textContent = dateText;

    const select = clone.querySelector(".priority-select");
    select.value = task.priority;

    const checkbox = clone.querySelector(".completed-checkbox");
    checkbox.checked = task.completed;

    // Events
    clone.querySelector(".delete-task-btn").addEventListener("click", () => {
      deleteTodo(task.id);
      renderTasks();
    });

    select.addEventListener("change", (e) => {
      updateTodoPriority(task.id, e.target.value);
      renderTasks();
    });

    checkbox.addEventListener("change", (e) => {
      updateTodoStatus(task.id, e.target.checked);
      renderTasks();
    });

    clone.querySelector(".task-content").addEventListener("click", (e) => {
      if (["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
      descEl.classList.toggle("hidden-toggle");
    });

    container.appendChild(clone);
  });
};

// 3. Show "Add Task" Modal Form
export const showAddTaskForm = () => {
  // Prevent opening multiple modals
  if (document.querySelector(".task-modal-overlay")) return;

  // Create the modal container
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay task-modal-overlay active-modal";

  const filter = getCurrentFilter();
  const defaultDate = ["Dashboard", "My Task"].includes(filter)
    ? format(new Date(), "yyyy-MM-dd")
    : "";

  // Reusing your beautiful HTML structure and CSS classes
  modalOverlay.innerHTML = `
    <div class="modal-card">
      <label class="close-modal close-task-btn">&times;</label>
      <h2>Create New Task</h2>
      <p>Add a new task to your current view.</p>
      
      <form class="modal-form" id="dynamic-task-form">
        <div class="form-group">
          <label>Task Title</label>
          <input type="text" class="form-title" placeholder="e.g., Read documentation" required>
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-desc" placeholder="Task Description..." rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Deadline</label>
            <input type="date" class="form-date" value="${defaultDate}">
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select class="modal-select form-priority">
              <option value="high">High</option>
              <option value="moderate" selected>Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        
        <button type="submit" class="submit-btn">Save Task</button>
      </form>
    </div>
  `;

  // Function to close/destroy the modal
  const closeModal = () => modalOverlay.remove();

  // Close when clicking the 'X' button
  modalOverlay
    .querySelector(".close-task-btn")
    .addEventListener("click", closeModal);

  // Close when clicking outside the white card (on the dark overlay)
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Submit Logic
  modalOverlay
    .querySelector("#dynamic-task-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const currentFilter = getCurrentFilter();

      let targetProjectId = getProjects()[0].id;
      if (!["Dashboard", "My Task", "Tomorrow"].includes(currentFilter)) {
        targetProjectId = currentFilter;
      }

      addTodo(
        modalOverlay.querySelector(".form-title").value,
        modalOverlay.querySelector(".form-desc").value,
        modalOverlay.querySelector(".form-date").value,
        modalOverlay.querySelector(".form-priority").value,
        targetProjectId,
      );

      renderTasks();
      closeModal(); // Remove the modal after successful save
    });

  // Attach modal to the body so it covers the whole screen
  document.body.appendChild(modalOverlay);
};

// 4. Global Event Listeners Setup
export const setupEventListeners = () => {
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

  const addTaskBtn = document.querySelector(SELECTORS.addTaskBtn);
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => showAddTaskForm());
  }

  const addProjectForm = document.querySelector(SELECTORS.addProjectForm);
  if (addProjectForm) {
    addProjectForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = addProjectForm.querySelectorAll("input, textarea, select");

      addProject(
        inputs[0].value,
        inputs[1].value,
        inputs[2].value,
        inputs[3].value,
      );

      addProjectForm.reset();
      document.querySelector(SELECTORS.projectModalToggle).checked = false;
      renderSidebar();
    });
  }
};
