"use client";

import React from "react";
import { Button } from "./ui";

export default function FilterSidebar({ tags = [], selected, onSelect }) {
  return (
    <div className="flex flex-col">
      {tags.map((tag) => (
        <Button
          key={tag}
          onClick={() => onSelect(tag)}
          variant="ghost"
          className={`text-sm mb-2 text-left w-full ${
            selected === tag
              ? "bg-primary/10 text-primary font-semibold"
              : "bg-slate-50"
          }`}
        >
          #{tag}
        </Button>
      ))}
    </div>
  );
}
