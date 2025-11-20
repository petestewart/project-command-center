import React, { useEffect } from 'react';
import { Header, Sidebar, TicketDetails, TodoList, TerminalCard } from './components';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize terminal when component mounts
    const script1 = document.createElement('script');
    script1.src = 'xterm.js';
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'dist/terminal.js';
    script2.async = true;
    document.head.appendChild(script2);

    return () => {
      // Cleanup scripts when component unmounts
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  const todos = [
    { text: 'Build login form', completed: false },
    { text: 'Implement validation', completed: false },
    { text: 'Create worktree', completed: true }
  ];

  return (
    <div className="app">
      <Header />

      <div className="layout">
        <Sidebar />

        <main className="content">
          <TicketDetails
            ticket="FE-1234"
            branch="feature/login-ui"
            port={5173}
            database="postgres://localhost:5432/loginui"
          />

          <TodoList todos={todos} />

          <TerminalCard />
        </main>
      </div>
    </div>
  );
};

export default App;
