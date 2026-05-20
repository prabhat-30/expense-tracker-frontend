import React from 'react';

export default function UndoToast({ message, onUndo, visible }) {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '1px solid #334155',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease'
        }}>
            <span>{message}</span>
            <button
                onClick={onUndo}
                style={{
                    background: '#6366f1',
                    border: 'none',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                UNDO
            </button>
        </div>
    );
}