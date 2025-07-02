import React from 'react';

interface ConfirmDeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({ onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}>
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete this chat session?</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#eee',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}