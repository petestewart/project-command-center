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
      <h4>Notes</h4>
      <ul className="notes">
        {notes.map((note, index) => (
          <li key={index}>{note.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default NoteList;
