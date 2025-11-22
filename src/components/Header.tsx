import React from "react";

interface HeaderProps {
  ticketNumber: string;
  ticketName: string;
}

const Header: React.FC<HeaderProps> = ({ ticketNumber, ticketName }) => {
  return (
    <header>
      {ticketNumber} - {ticketName}
    </header>
  );
};

export default Header;
