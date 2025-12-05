"use client";

import React from "react";
import clsx from "clsx";

export default function Button({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus:ring-sky-500",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500",
    accent: "bg-violet-600 text-white shadow-sm hover:bg-violet-700 focus:ring-violet-500",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
  };

  const sizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-2.5",
  };

  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
