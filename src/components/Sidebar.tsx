import React from "react";
import TicketDetails from "./TicketDetails";

interface Worktree {
  name: string;
  active?: boolean;
}

interface Project {
  name: string;
  worktrees: Worktree[];
  active?: boolean;
}

interface SidebarProps {
  ticket: string;
  branch: string;
  port: number;
  database: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  ticket,
  branch,
  port,
  database,
}) => {
  const projects: Project[] = [
    {
      name: "Login UI",
      worktrees: [{ name: "feature/login-ui", active: true }],
      active: true,
    },
    {
      name: "Prod Timeout",
      worktrees: [{ name: "bugfix/prod-timeout" }],
    },
    {
      name: "DB Layer Refactor",
      worktrees: [{ name: "refactor/db-layer" }],
    },
  ];

  return (
    <aside className="sidebar">
      <h2>Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.name} className={project.active ? "active" : ""}>
            <div className="project-name">{project.name}</div>
            <ul className="worktrees">
              {project.worktrees.map((worktree) => (
                <li
                  key={worktree.name}
                  className={worktree.active ? "active" : ""}
                >
                  {worktree.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <TicketDetails
        ticket={ticket}
        branch={branch}
        port={port}
        database={database}
      />
    </aside>
  );
};

export default Sidebar;
