"use client"

import Image from 'next/image'
import React from 'react'

export default function ToolCard({ tool, onOpen }) {
  return (
    <article className="card flex items-start space-x-4">
      <img src={tool.logo} alt={tool.name} className="logo" />

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{tool.name}</h4>
            <div className="text-sm text-slate-500">{tool.about}</div>
          </div>
          <div className="text-xs text-slate-400">{tool.tags.slice(0,2).join(' • ')}</div>
        </div>

        <p className="mt-3 text-sm text-slate-600">{tool.summary}</p>

        <div className="mt-3 flex items-center">
          {tool.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>

        <div className="mt-4">
          <button onClick={onOpen} className="text-sm px-3 py-2 rounded-md bg-slate-100">View details</button>
        </div>
      </div>
    </article>
  )
}
