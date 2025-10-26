"use client";

import React from "react";
import clsx from "clsx";

export default function Button({
  children,
  className,
  variant = "default",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    default: "bg-primary text-white px-3 py-2 shadow-sm hover:opacity-95",
    ghost: "bg-transparent text-primary px-2 py-1 hover:bg-slate-100",
    accent: "bg-accent text-white px-3 py-2 hover:opacity-95",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
