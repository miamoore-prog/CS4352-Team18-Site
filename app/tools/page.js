"use client"

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import toolsData from '../../data/tools.json'
import SearchBar from '../../components/SearchBar'
import FilterSidebar from '../../components/FilterSidebar'
import ToolCard from '../../components/ToolCard'
import ToolModal from '../../components/ToolModal'

export default function ToolsPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('query') || ''
  const [query, setQuery] = useState(initialQuery)
  const [selectedTag, setSelectedTag] = useState(null)
  const [activeTool, setActiveTool] = useState(null)

  const tags = useMemo(() => {
    const s = new Set()
    toolsData.forEach(t => t.tags.forEach(tag => s.add(tag)))
    return Array.from(s)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return toolsData.filter((t) => {
      if (selectedTag && !t.tags.includes(selectedTag)) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.about.toLowerCase().includes(q) ||
        t.tags.join(' ').toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
      )
    })
  }, [query, selectedTag])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <div className="card">
          <SearchBar value={query} onChange={setQuery} onSearch={()=>{}} />
        </div>

        <div className="card mt-4">
          <h4 className="font-semibold mb-2">Filter by tag</h4>
          <FilterSidebar tags={tags} selected={selectedTag} onSelect={setSelectedTag} />
          {selectedTag && (
            <button className="mt-4 text-sm text-primary underline" onClick={() => setSelectedTag(null)}>Clear filter</button>
          )}
        </div>
      </aside>

      <section className="md:col-span-3">
        <div className="mb-4 text-sm text-slate-600">Showing {filtered.length} tool(s)</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <ToolCard key={t.id} tool={t} onOpen={() => setActiveTool(t)} />
          ))}
        </div>
      </section>

      {activeTool && (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </div>
  )
}
