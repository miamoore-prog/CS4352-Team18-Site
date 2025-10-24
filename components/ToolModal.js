"use client"

import React, { useState } from 'react'

export default function ToolModal({ tool, onClose }) {
  const [showHowTo, setShowHowTo] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{tool.name}</h3>
            <p className="text-sm text-slate-600">{tool.about}</p>
          </div>
          <div>
            <button onClick={onClose} className="text-slate-500">Close</button>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-700">{tool.details}</div>

        <div className="mt-4">
          <h4 className="font-semibold">Tags</h4>
          <div className="mt-2">
            {tool.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-500">Quick summary: {tool.summary}</div>
          <div>
            <button onClick={() => setShowHowTo(!showHowTo)} className="bg-accent text-white px-3 py-2 rounded-md text-sm mr-2">How to guide</button>
            <button onClick={onClose} className="px-3 py-2 rounded-md bg-slate-100 text-sm">Done</button>
          </div>
        </div>

        {showHowTo && (
          <div className="mt-4 bg-slate-50 p-4 rounded-md">
            <h5 className="font-semibold">How to use {tool.name}</h5>
            <ol className="list-decimal pl-5 mt-2 text-sm text-slate-700">
              {tool.howTo.map((step, i) => (
                <li key={i} className="mb-2">{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
