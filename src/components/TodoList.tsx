import React, { useState } from "react";
import {
  FaTrash,
  FaRegCheckSquare,
  FaRegSquare,
  FaCheck,
} from "react-icons/fa";

export interface Todo {
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onAddTodo?: (todo: Todo) => void;
  onDeleteTodo?: (index: number) => void;
  onToggleTodo?: (index: number) => void;
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  onAddTodo,
  onDeleteTodo,
  onToggleTodo,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskDescription("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!onAddTodo) {
      console.warn("Cannot add task: onAddTodo not provided");
      return;
    }

    const text = taskDescription.trim();
    if (!text) return;

    const newTodo: Todo = {
      text: text,
      completed: false,
    };

    onAddTodo(newTodo);

    setTaskDescription("");
    setShowModal(false);
  };

  const handleCancel = () => {
    setTaskDescription("");
    setShowModal(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteTodo) {
      onDeleteTodo(index);
    }
  };

  const handleToggleClick = (index: number) => {
    if (onToggleTodo) {
      onToggleTodo(index);
    }
  };

  const handleFilterClick = () => {
    setShowCompleted(!showCompleted);
  };

  // Map todos with their indices, then filter
  const todosWithIndices = todos.map((todo, index) => ({ todo, index }));
  const filteredTodosWithIndices = showCompleted
    ? todosWithIndices
    : todosWithIndices.filter(({ todo }) => !todo.completed);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4>Tasks</h4>
          <div className="card-actions">
            <button
              onClick={handleFilterClick}
              className={`filter-button ${showCompleted ? "" : "active"}`}
              title={
                showCompleted ? "Hide completed tasks" : "Show completed tasks"
              }
              type="button"
            >
              <FaCheck />
            </button>
            <button
              onClick={handleAddClick}
              className="add-note-button"
              title="Add new task"
              type="button"
            >
              +
            </button>
          </div>
        </div>
        <ul className="todos">
          {filteredTodosWithIndices.map(({ todo, index }) => (
            <li key={index} className="todo-item">
              <span
                className="todo-text"
                onClick={() => handleToggleClick(index)}
              >
                {todo.completed ? (
                  <FaRegCheckSquare className="todo-checkbox" />
                ) : (
                  <FaRegSquare className="todo-checkbox" />
                )}{" "}
                {todo.text}
              </span>
              <div className="todo-actions">
                <button
                  onClick={(e) => handleDeleteClick(e, index)}
                  className="todo-action-button delete-button"
                  title="Delete task"
                  type="button"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Task</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="task-description">Task Description *</label>
                <input
                  id="task-description"
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TodoList;
