import React from 'react';
import Terminal from './Terminal';

interface TerminalCardProps {
  title?: string;
}

const TerminalCard: React.FC<TerminalCardProps> = ({
  title = "Terminal (Mock)"
}) => {
  return (
    <div className="card terminal-card">
      <h3>{title}</h3>
      <Terminal />
    </div>
  );
};

export default TerminalCard;

