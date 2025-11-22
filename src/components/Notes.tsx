import React, { useState, useEffect } from "react";
import { FaLink, FaEdit, FaTrash } from "react-icons/fa";

export interface Note {
  title: string;
  url: string;
  type: "external" | "local";
}

interface NoteListProps {
  notes: Note[];
  onAddNote?: (note: Note) => void;
  onUpdateNote?: (index: number, note: Note) => void;
  onDeleteNote?: (index: number) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [lastFetchedUrl, setLastFetchedUrl] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isFetchingEditTitle, setIsFetchingEditTitle] = useState(false);
  const [lastFetchedEditUrl, setLastFetchedEditUrl] = useState("");

  // Reset title when URL changes significantly
  useEffect(() => {
    const trimmedUrl = linkUrl.trim();
    if (trimmedUrl && trimmedUrl !== lastFetchedUrl && linkTitle.trim()) {
      // If URL changed and we have a title, clear it to allow re-fetch
      setLinkTitle("");
    }
  }, [linkUrl, lastFetchedUrl, linkTitle]);

  // Fetch page title when URL changes
  useEffect(() => {
    const fetchTitle = async () => {
      const trimmedUrl = linkUrl.trim();
      if (!trimmedUrl || !showLinkModal) return;

      // Only fetch if URL looks valid and title is empty
      if (
        (trimmedUrl.startsWith("http://") ||
          trimmedUrl.startsWith("https://") ||
          trimmedUrl.includes(".")) &&
        !linkTitle.trim() &&
        window.electronAPI &&
        trimmedUrl !== lastFetchedUrl
      ) {
        console.log(`[Notes] Attempting to fetch title for: ${trimmedUrl}`);
        setIsFetchingTitle(true);
        try {
          const result = await window.electronAPI.fetchPageTitle(trimmedUrl);
          console.log(`[Notes] Fetch result:`, result);
          if (result.success && result.title) {
            setLinkTitle(result.title);
            setLastFetchedUrl(trimmedUrl);
          }
        } catch (error) {
          console.error(`[Notes] Error fetching title:`, error);
        } finally {
          setIsFetchingTitle(false);
        }
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchTitle, 800);
    return () => clearTimeout(timeoutId);
  }, [linkUrl, showLinkModal, linkTitle, lastFetchedUrl]);
  const handleNoteClick = async (
    e: React.MouseEvent,
    note: Note,
    index: number
  ) => {
    // If Cmd (Mac) or Ctrl (Windows/Linux) is pressed, open edit modal instead
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      handleEditClick(e, index, note);
      return;
    }

    if (note.type === "external") {
      // Open external links in default browser
      if (window.electronAPI) {
        await window.electronAPI.openExternal(note.url);
      } else {
        window.open(note.url, "_blank");
      }
    } else {
      // Open local files
      if (window.electronAPI) {
        await window.electronAPI.openPath(note.url);
      } else {
        // Fallback for non-electron environment
        console.warn(
          "Cannot open local file in non-electron environment:",
          note.url
        );
      }
    }
  };

  const handleAddNote = async () => {
    if (!window.electronAPI || !onAddNote) {
      console.warn(
        "Cannot create note: electronAPI not available or onAddNote not provided"
      );
      return;
    }

    try {
      // Generate a unique filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const fileName = `note-${timestamp}.md`;

      // Create blank markdown file
      const content = "";

      // Create the file (path will be handled in main process)
      const result = await window.electronAPI.createMarkdownFile(
        fileName,
        content
      );

      if (result.success && result.filePath) {
        // Create the note object
        const newNote: Note = {
          title: `Note - ${fileName}`,
          url: result.filePath,
          type: "local",
        };

        // Add to notes list
        onAddNote(newNote);

        // Open the file
        await window.electronAPI.openPath(result.filePath);
      } else {
        console.error("Failed to create note:", result.error);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleAddLinkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setLinkUrl("");
    setLinkTitle("");
    setLastFetchedUrl("");
    setShowLinkModal(true);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!onAddNote) {
      console.warn("Cannot add link: onAddNote not provided");
      return;
    }

    const url = linkUrl.trim();
    if (!url) return;

    const title = linkTitle.trim() || url;

    // Create the note object
    const newNote: Note = {
      title: title || url,
      url: url,
      type: "external",
    };

    // Add to notes list
    onAddNote(newNote);

    // Reset and close modal
    setLinkUrl("");
    setLinkTitle("");
    setLastFetchedUrl("");
    setShowLinkModal(false);
  };

  const handleLinkCancel = () => {
    setLinkUrl("");
    setLinkTitle("");
    setLastFetchedUrl("");
    setShowLinkModal(false);
  };

  const handleEditClick = (e: React.MouseEvent, index: number, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingIndex(index);
    setEditUrl(note.url);
    setEditTitle(note.title);
    setLastFetchedEditUrl("");
  };

  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteNote) {
      onDeleteNote(index);
    }
  };

  // Fetch page title when edit URL changes
  useEffect(() => {
    const updateTitle = async () => {
      const trimmedUrl = editUrl.trim();
      if (!trimmedUrl || editingIndex === null) return;

      // Check if it's a file path (not a URL)
      const isFilepath =
        !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://");

      if (isFilepath) {
        // Extract filename from path
        const fileName = trimmedUrl.split(/[/\\]/).pop() || trimmedUrl;
        // Update title to show the filename (only if URL changed)
        if (trimmedUrl !== lastFetchedEditUrl) {
          setEditTitle(`Note - ${fileName}`);
          setLastFetchedEditUrl(trimmedUrl);
        }
      } else {
        // For URLs, fetch the title if it's empty
        if (
          !editTitle.trim() &&
          window.electronAPI &&
          trimmedUrl !== lastFetchedEditUrl
        ) {
          setIsFetchingEditTitle(true);
          try {
            const result = await window.electronAPI.fetchPageTitle(trimmedUrl);
            if (result.success && result.title) {
              setEditTitle(result.title);
              setLastFetchedEditUrl(trimmedUrl);
            }
          } catch (error) {
            console.error(`[Notes] Error fetching title:`, error);
          } finally {
            setIsFetchingEditTitle(false);
          }
        }
      }
    };

    // Debounce the update
    const timeoutId = setTimeout(updateTitle, 300);
    return () => clearTimeout(timeoutId);
  }, [editUrl, editingIndex, editTitle, lastFetchedEditUrl]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!onUpdateNote || editingIndex === null) {
      console.warn(
        "Cannot update note: onUpdateNote not provided or no editing index"
      );
      return;
    }

    const url = editUrl.trim();
    if (!url) return;

    const title = editTitle.trim() || url;

    // Create the updated note object
    const updatedNote: Note = {
      title: title || url,
      url: url,
      type:
        url.startsWith("http://") || url.startsWith("https://")
          ? "external"
          : "local",
    };

    // Update the note
    onUpdateNote(editingIndex, updatedNote);

    // Reset and close modal
    setEditUrl("");
    setEditTitle("");
    setLastFetchedEditUrl("");
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditUrl("");
    setEditTitle("");
    setLastFetchedEditUrl("");
    setEditingIndex(null);
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Notes</div>
          <div className="card-actions">
            <button
              onClick={handleAddLinkClick}
              className="add-link-button"
              title="Add new link"
              type="button"
            >
              <FaLink />
            </button>
            <button
              onClick={handleAddNote}
              className="add-note-button"
              title="Add new note"
              type="button"
            >
              +
            </button>
          </div>
        </div>
        <ul className="notes">
          {notes.map((note, index) => (
            <li key={index} className="note-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNoteClick(e, note, index);
                }}
                className="note-link"
              >
                {note.title}
              </a>
              <div className="note-actions">
                <button
                  onClick={(e) => handleEditClick(e, index, note)}
                  className="note-action-button edit-button"
                  title="Edit note"
                  type="button"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, index)}
                  className="note-action-button delete-button"
                  title="Delete note"
                  type="button"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showLinkModal && (
        <div className="modal-overlay" onClick={handleLinkCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Link</h3>
            <form onSubmit={handleLinkSubmit}>
              <div className="form-group">
                <label htmlFor="link-url">URL *</label>
                <input
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="link-title">
                  Title (optional)
                  {isFetchingTitle && (
                    <span className="fetching-indicator"> - Fetching...</span>
                  )}
                </label>
                <input
                  id="link-title"
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder={
                    isFetchingTitle
                      ? "Fetching title..."
                      : "Leave empty to use URL as title"
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleLinkCancel}>
                  Cancel
                </button>
                <button type="submit">Add Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingIndex !== null && (
        <div className="modal-overlay" onClick={handleEditCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Note</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-url">URL or File Path *</label>
                <input
                  id="edit-url"
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com or /path/to/file.md"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-title">
                  Title (optional)
                  {isFetchingEditTitle && (
                    <span className="fetching-indicator"> - Fetching...</span>
                  )}
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={
                    isFetchingEditTitle
                      ? "Fetching title..."
                      : "Leave empty to use URL as title"
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleEditCancel}>
                  Cancel
                </button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteList;
