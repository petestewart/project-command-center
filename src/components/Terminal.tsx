import React, { useEffect, useRef } from "react";

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This will be called after the xterm script loads
    const initTerminal = () => {
      if (terminalRef.current && (window as any).Terminal) {
        const Terminal = (window as any).Terminal;
        const term = new Terminal();
        term.open(terminalRef.current);
        term.writeln("Mock Terminal Ready...");
        term.writeln("> npm run dev");
        term.writeln("Starting server...");
      }
    };

    // Check if xterm is already loaded
    if ((window as any).Terminal) {
      initTerminal();
    } else {
      // Wait for xterm to load
      const checkXterm = setInterval(() => {
        if ((window as any).Terminal) {
          clearInterval(checkXterm);
          initTerminal();
        }
      }, 100);
    }
  }, []);

  return <div ref={terminalRef} id="terminal"></div>;
};

export default Terminal;
