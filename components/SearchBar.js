"use client"

import React from 'react'

export default function SearchBar({ value, onChange, onSearch }) {
  return (
    <div className="flex items-center space-x-2">
      <input
        aria-label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e)=>{ if(e.key === 'Enter') onSearch() }}
        placeholder="What do you want to learn?"
        className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        onClick={onSearch}
        className="bg-primary text-white rounded-md px-3 py-2 text-sm"
      >Search</button>
    </div>
  )
}
