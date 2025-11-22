import React from 'react';

interface Note {
  text: string;
  completed: boolean;
}

interface NoteListProps {
  notes: Note[];
}

const NoteList: React.FC<NoteListProps> = ({ notes }) => {
  return (
    <div className="card">
      <h3>Notes</h3>
      <ul className="notes">
        {notes.map((note, index) => (
          <li key={index}>{note.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default NoteList;
