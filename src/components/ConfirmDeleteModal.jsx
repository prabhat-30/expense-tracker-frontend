import React from "react";
import "../CSS/modal.css";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">

      <div className="modal-box">

        <h2>Confirm Delete</h2>

        <p>
          Are you sure you want to delete this expense?
          This action cannot be undone.
        </p>

        <div className="modal-actions">

          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default ConfirmDeleteModal;