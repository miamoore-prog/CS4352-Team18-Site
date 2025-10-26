"use client";

import React from "react";
import clsx from "clsx";

export default function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm",
        className
      )}
      {...props}
    />
  );
}
