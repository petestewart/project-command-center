import React from 'react';

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
  database
}) => {
  return (
    <div className="card">
      <h3>Ticket Details</h3>
      <p><strong>Ticket:</strong> {ticket}</p>
      <p><strong>Branch:</strong> {branch}</p>
      <p><strong>Port:</strong> {port}</p>
      <p><strong>DB:</strong> {database}</p>
    </div>
  );
};

export default TicketDetails;

