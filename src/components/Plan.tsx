/// <reference path="../electron.d.ts" />
import React, { useState, useEffect } from "react";
import { FaLink, FaEdit, FaTrash } from "react-icons/fa";
import { Note } from "./Notes";

interface PlanListProps {
  plans: Note[];
  onAddPlan?: (plan: Note) => void;
  onUpdatePlan?: (index: number, plan: Note) => void;
  onDeletePlan?: (index: number) => void;
}

const PlanList: React.FC<PlanListProps> = ({
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
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
        console.log(`[Plan] Attempting to fetch title for: ${trimmedUrl}`);
        setIsFetchingTitle(true);
        try {
          const result = await window.electronAPI.fetchPageTitle(trimmedUrl);
          console.log(`[Plan] Fetch result:`, result);
          if (result.success && result.title) {
            setLinkTitle(result.title);
            setLastFetchedUrl(trimmedUrl);
          }
        } catch (error) {
          console.error(`[Plan] Error fetching title:`, error);
        } finally {
          setIsFetchingTitle(false);
        }
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchTitle, 800);
    return () => clearTimeout(timeoutId);
  }, [linkUrl, showLinkModal, linkTitle, lastFetchedUrl]);
  const handlePlanClick = async (
    e: React.MouseEvent,
    plan: Note,
    index: number
  ) => {
    // If Cmd (Mac) or Ctrl (Windows/Linux) is pressed, open edit modal instead
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      handleEditClick(e, index, plan);
      return;
    }

    if (plan.type === "external") {
      // Open external links in default browser
      if (window.electronAPI) {
        await window.electronAPI.openExternal(plan.url);
      } else {
        window.open(plan.url, "_blank");
      }
    } else {
      // Open local files
      if (window.electronAPI) {
        await window.electronAPI.openPath(plan.url);
      } else {
        // Fallback for non-electron environment
        console.warn(
          "Cannot open local file in non-electron environment:",
          plan.url
        );
      }
    }
  };

  const handleAddPlan = async () => {
    if (!window.electronAPI || !onAddPlan) {
      console.warn(
        "Cannot create plan: electronAPI not available or onAddPlan not provided"
      );
      return;
    }

    try {
      // Generate a unique filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const fileName = `plan-${timestamp}.md`;

      // Create blank markdown file
      const content = "";

      // Create the file (path will be handled in main process)
      const result = await window.electronAPI.createMarkdownFile(
        fileName,
        content
      );

      if (result.success && result.filePath) {
        // Create the plan object
        const newPlan: Note = {
          title: `Plan - ${fileName}`,
          url: result.filePath,
          type: "local",
        };

        // Add to plans list
        onAddPlan(newPlan);

        // Open the file
        await window.electronAPI.openPath(result.filePath);
      } else {
        console.error("Failed to create plan:", result.error);
      }
    } catch (error) {
      console.error("Error creating plan:", error);
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

    if (!onAddPlan) {
      console.warn("Cannot add link: onAddPlan not provided");
      return;
    }

    const url = linkUrl.trim();
    if (!url) return;

    const title = linkTitle.trim() || url;

    // Create the plan object
    const newPlan: Note = {
      title: title || url,
      url: url,
      type: "external",
    };

    // Add to plans list
    onAddPlan(newPlan);

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

  const handleEditClick = (e: React.MouseEvent, index: number, plan: Note) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingIndex(index);
    setEditUrl(plan.url);
    setEditTitle(plan.title);
    setLastFetchedEditUrl("");
  };

  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeletePlan) {
      onDeletePlan(index);
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
          setEditTitle(`Plan - ${fileName}`);
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
            console.error(`[Plan] Error fetching title:`, error);
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

    if (!onUpdatePlan || editingIndex === null) {
      console.warn(
        "Cannot update plan: onUpdatePlan not provided or no editing index"
      );
      return;
    }

    const url = editUrl.trim();
    if (!url) return;

    const title = editTitle.trim() || url;

    // Create the updated plan object
    const updatedPlan: Note = {
      title: title || url,
      url: url,
      type:
        url.startsWith("http://") || url.startsWith("https://")
          ? "external"
          : "local",
    };

    // Update the plan
    onUpdatePlan(editingIndex, updatedPlan);

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
          <div className="card-title">Plan</div>
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
              onClick={handleAddPlan}
              className="add-note-button"
              title="Add new plan"
              type="button"
            >
              +
            </button>
          </div>
        </div>
        <ul className="notes">
          {plans.map((plan, index) => (
            <li key={index} className="note-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePlanClick(e, plan, index);
                }}
                className="note-link"
              >
                {plan.title}
              </a>
              <div className="note-actions">
                <button
                  onClick={(e) => handleEditClick(e, index, plan)}
                  className="note-action-button edit-button"
                  title="Edit plan"
                  type="button"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, index)}
                  className="note-action-button delete-button"
                  title="Delete plan"
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
                <label htmlFor="plan-link-url">URL *</label>
                <input
                  id="plan-link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="plan-link-title">
                  Title (optional)
                  {isFetchingTitle && (
                    <span className="fetching-indicator"> - Fetching...</span>
                  )}
                </label>
                <input
                  id="plan-link-title"
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
            <h3>Edit Plan</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="plan-edit-url">URL or File Path *</label>
                <input
                  id="plan-edit-url"
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com or /path/to/file.md"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="plan-edit-title">
                  Title (optional)
                  {isFetchingEditTitle && (
                    <span className="fetching-indicator"> - Fetching...</span>
                  )}
                </label>
                <input
                  id="plan-edit-title"
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

export default PlanList;
