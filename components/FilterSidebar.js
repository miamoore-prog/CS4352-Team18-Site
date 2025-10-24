"use client"

import React from 'react'

export default function FilterSidebar({ tags = [], selected, onSelect }) {
  return (
    <div className="flex flex-col">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`text-sm mb-2 text-left px-3 py-2 rounded-md ${selected === tag ? 'bg-primary/10 text-primary font-semibold' : 'bg-slate-50'}`}>
          #{tag}
        </button>
      ))}
    </div>
  )
}
