import React from 'react';

interface Worktree {
  name: string;
  active?: boolean;
}

const Sidebar: React.FC = () => {
  const worktrees: Worktree[] = [
    { name: 'feature/login-ui', active: true },
    { name: 'bugfix/prod-timeout' },
    { name: 'refactor/db-layer' }
  ];

  return (
    <aside className="sidebar">
      <h2>Worktrees</h2>
      <ul>
        {worktrees.map((worktree) => (
          <li key={worktree.name} className={worktree.active ? 'active' : ''}>
            {worktree.name}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;

