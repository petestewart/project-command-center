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
      <h4>Tasks</h4>
      {/* <ul className="todos"> */}
        {todos.map((todo, index) => (
          <div key={index}>
            {todo.completed ? '🔲' : '☑️'} {todo.text}
          </div>
        ))}
      {/* </ul> */}
    </div>
  );
};

export default TodoList;
