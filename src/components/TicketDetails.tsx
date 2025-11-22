import React from "react";
import {
  FaTicketAlt,
  FaCodeBranch,
  FaServer,
  FaDatabase,
} from "react-icons/fa";

interface TicketDetailsProps {
  ticket: string;
  branch: string;
  port: number;
  database: string;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  branch,
  port,
  database,
}) => {
  return (
    <div className="card">
      <p>
        <strong>
          <FaTicketAlt style={{ display: "inline", marginRight: "4px" }} />
        </strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{ticket}</span>
      </p>
      <p>
        <strong>
          <FaCodeBranch style={{ display: "inline", marginRight: "4px" }} />
        </strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{branch}</span>
      </p>
      <p>
        <strong>
          <FaServer style={{ display: "inline", marginRight: "4px" }} />
        </strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{port}</span>
      </p>
      <p>
        <strong>
          <FaDatabase style={{ display: "inline", marginRight: "4px" }} />
        </strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{database}</span>
      </p>
    </div>
  );
};

export default TicketDetails;
