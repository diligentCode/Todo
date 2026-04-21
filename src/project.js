export const createProject = (
  title,
  description = "",
  deadline = "",
  priority = "low",
  todos = [],
  id = null,
) => {
  return {
    id: id || Date.now().toString() + Math.random().toString(16).slice(2),
    title,
    description,
    deadline,
    priority,
    todos,
    addTodo(todo) {
      this.todos.push(todo);
    },
    removeTodo(todoId) {
      this.todos = this.todos.filter((t) => t.id !== todoId);
    },
  };
};
