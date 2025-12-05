"use client";

import React from "react";
import { Card, Button } from "./ui";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <Card className="z-10 max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={
              danger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-sky-600 hover:bg-sky-700 text-white"
            }
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
