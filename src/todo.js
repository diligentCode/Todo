export const createTodo = (
  title,
  description,
  dueDate,
  priority,
  projectId,
  completed = false,
  id = null,
) => {
  return {
    id: id || Date.now().toString() + Math.random().toString(16).slice(2),
    title,
    description,
    dueDate,
    priority,
    projectId,
    completed,
    toggleComplete() {
      this.completed = !this.completed;
    },
    updatePriority(newPriority) {
      this.priority = newPriority;
    },
  };
};
