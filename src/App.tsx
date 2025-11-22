import React, { useState } from "react";
import {
  Header,
  NoteList,
  Sidebar,
  TodoList,
  TerminalCard,
} from "./components";
import { Note } from "./components/Notes";

const App: React.FC = () => {
  const ticketNumber = "FE-1234";
  const ticketName = "Login UI Implementation";

  const [todos, setTodos] = useState([
    { text: "Build login form", completed: false },
    { text: "Implement validation", completed: false },
    { text: "Create worktree", completed: true },
  ]);

  const [notes, setNotes] = useState<Note[]>([
    {
      title: "Design Spec - Google Doc",
      url: "https://docs.google.com/document/d/example",
      type: "external" as const,
    },
    {
      title: "Confluence Page - Requirements",
      url: "https://confluence.example.com/pages/12345",
      type: "external" as const,
    },
    {
      title: "Test Notes - test-notes.md",
      url: "/Users/petestewart/Projects/project-command-center/test-notes.md",
      type: "local" as const,
    },
    {
      title: "Meeting Notes - notes.txt",
      url: "/Users/petestewart/Projects/project-command-center/notes.txt",
      type: "local" as const,
    },
  ]);

  const handleAddNote = (note: Note) => {
    setNotes([...notes, note]);
  };

  const handleUpdateNote = (index: number, note: Note) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = note;
    setNotes(updatedNotes);
  };

  const handleDeleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
  };

  const handleAddTodo = (todo: { text: string; completed: boolean }) => {
    setTodos([...todos, todo]);
  };

  const handleDeleteTodo = (index: number) => {
    const updatedTodos = todos.filter((_, i) => i !== index);
    setTodos(updatedTodos);
  };

  const handleToggleTodo = (index: number) => {
    const updatedTodos = todos.map((todo, i) =>
      i === index ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
  };

  return (
    <div className="app">
      <Header ticketNumber={ticketNumber} ticketName={ticketName} />

      <div className="layout">
        <Sidebar
          ticket={ticketNumber}
          branch="feature/login-ui"
          port={5173}
          database="localhost:5432/loginui"
        />

        <main className="content">
          <TodoList
            todos={todos}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
            onToggleTodo={handleToggleTodo}
          />
          <NoteList
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />

          {/* <TerminalCard /> */}
        </main>
      </div>
    </div>
  );
};

export default App;
