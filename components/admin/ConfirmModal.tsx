"use client";

import React, { useEffect } from "react";
import { AlertCircleIcon, XIcon } from "@/components/ui/icons";
import AdminButton from "./AdminButton";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200/90 bg-white p-6 shadow-2xl transition-all animate-scaleUp z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                variant === "danger"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-purple-50 text-[#7C3AED] border border-purple-100"
              }`}
            >
              <AlertCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-base font-bold text-stone-900"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-lg hover:bg-stone-100"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pl-13">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </AdminButton>

          <AdminButton
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
