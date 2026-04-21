import { createProject } from "./project.js";
import { createTodo } from "./todo.js";
import { saveToStorage, loadFromStorage } from "./storage.js";
import { isToday, isTomorrow, parseISO } from "date-fns";

let projects = [];
let currentFilter = "Dashboard"; // 'Dashboard', 'My Task', 'Tomorrow', or a projectId

// Initialize the app by loading projects from storage or creating a default one
export const initApp = () => {
  const stored = loadFromStorage();
  if (stored && stored.length > 0) {
    // Rehydrate objects to restore methods after JSON parse
    projects = stored.map((pData) => {
      const rehydratedTodos = pData.todos.map((tData) =>
        createTodo(
          tData.title,
          tData.description,
          tData.dueDate,
          tData.priority,
          tData.projectId,
          tData.completed,
          tData.id,
        ),
      );
      return createProject(
        pData.title,
        pData.description,
        pData.deadline,
        pData.priority,
        rehydratedTodos,
        pData.id,
      );
    });
  } else {
    const defaultProj = createProject(
      "Default Project",
      "Your general tasks space",
    );
    projects.push(defaultProj);
    saveToStorage(projects);
  }
};

export const getProjects = () => projects;
export const getCurrentFilter = () => currentFilter;
export const setCurrentFilter = (filter) => {
  currentFilter = filter;
};

export const addProject = (title, desc, deadline, priority) => {
  const p = createProject(title, desc, deadline, priority);
  projects.push(p);
  saveToStorage(projects);
  return p;
};

export const addTodo = (title, desc, dueDate, priority, projectId) => {
  const targetProj = projects.find((p) => p.id === projectId) || projects[0];
  const todo = createTodo(title, desc, dueDate, priority, targetProj.id);
  targetProj.addTodo(todo);
  saveToStorage(projects);
};

export const updateTodoStatus = (todoId, isCompleted) => {
  for (const p of projects) {
    const t = p.todos.find((task) => task.id === todoId);
    if (t) {
      t.completed = isCompleted;
      saveToStorage(projects);
      return;
    }
  }
};

export const updateTodoPriority = (todoId, newPriority) => {
  for (const p of projects) {
    const t = p.todos.find((task) => task.id === todoId);
    if (t) {
      t.updatePriority(newPriority);
      saveToStorage(projects);
      return;
    }
  }
};

export const deleteTodo = (todoId) => {
  for (const p of projects) {
    const index = p.todos.findIndex((t) => t.id === todoId);
    if (index > -1) {
      p.removeTodo(todoId);
      saveToStorage(projects);
      return;
    }
  }
};

const sortTasks = (tasks) => {
  const weights = { high: 3, moderate: 2, low: 1 };
  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (weights[b.priority] || 0) - (weights[a.priority] || 0);
  });
};

export const getFilteredTasks = () => {
  let allTasks = projects.flatMap((p) => p.todos);
  let filtered = [];

  if (currentFilter === "Dashboard") {
    filtered = allTasks;
  } else if (currentFilter === "My Task") {
    filtered = allTasks.filter(
      (t) => t.dueDate && isToday(parseISO(t.dueDate)),
    );
  } else if (currentFilter === "Tomorrow") {
    filtered = allTasks.filter(
      (t) => t.dueDate && isTomorrow(parseISO(t.dueDate)),
    );
  } else {
    const p = projects.find((proj) => proj.id === currentFilter);
    filtered = p ? p.todos : [];
  }

  return sortTasks(filtered);
};
