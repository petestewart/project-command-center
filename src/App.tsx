import React from "react";
import {
  Header,
  NoteList,
  Sidebar,
  TodoList,
  TerminalCard,
} from "./components";

const App: React.FC = () => {
  const ticketNumber = "FE-1234";
  const ticketName = "Login UI Implementation";

  const todos = [
    { text: "Build login form", completed: false },
    { text: "Implement validation", completed: false },
    { text: "Create worktree", completed: true },
  ];

  const notes = [
    { text: "needs to utilize blah blah blah", completed: false },
    {
      text: "for some reason, drawings are not gettig deleted http://slack.com/1234",
      completed: false,
    },
  ];

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
          <TodoList todos={todos} />
          <NoteList notes={notes} />

          <TerminalCard />
        </main>
      </div>
    </div>
  );
};

export default App;
