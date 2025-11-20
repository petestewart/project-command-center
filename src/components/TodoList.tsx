import React from 'react';

interface Todo {
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
}

const TodoList: React.FC<TodoListProps> = ({ todos }) => {
  return (
    <div className="card">
      <h3>Todos</h3>
      <ul className="todos">
        {todos.map((todo, index) => (
          <li key={index}>
            {todo.completed ? '🔲' : '☑️'} {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
