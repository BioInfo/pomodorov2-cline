'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
}

export default function Modal({ isOpen, onClose, title, children, onSave }: ModalProps) {
  const modalRoot = useRef<Element | null>(null);
  const modalContent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRoot.current = document.getElementById('modal-root') || createModalRoot();
    
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Create modal root if it doesn't exist
  const createModalRoot = () => {
    const root = document.createElement('div');
    root.setAttribute('id', 'modal-root');
    document.body.appendChild(root);
    return root;
  };

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalContent.current && !modalContent.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalContent}
        className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-zinc-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          {onSave && (
            <Button
              onClick={onSave}
              className="px-4 py-2"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, modalRoot.current!);
}
