import React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownViewerProps {
  content: string
  className?: string
}

export default function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">{renderInline(line.slice(2))}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-base font-semibold text-gray-800 mt-5 mb-2">{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-sm font-semibold text-gray-700 mt-4 mb-1.5">{renderInline(line.slice(4))}</h3>)
    } else if (line.match(/^\|.+\|/)) {
      // Table rows
      const rows: string[][] = []
      let isHeader = true
      while (i < lines.length && lines[i].match(/^\|.+\|/)) {
        if (lines[i].match(/^\|[-| :]+\|/)) {
          isHeader = false
          i++
          continue
        }
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim())
        rows.push(cells)
        i++
      }
      if (rows.length > 0) {
        const [headerRow, ...bodyRows] = rows
        elements.push(
          <div key={key++} className="overflow-x-auto my-3">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  {headerRow.map((cell, ci) => (
                    <th key={ci} className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">{renderInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-gray-200 px-3 py-2 text-gray-600">{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2 text-gray-600 text-sm">
          {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
        </ul>
      )
      continue
    } else if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-2 text-gray-600 text-sm">
          {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
        </ol>
      )
      continue
    } else if (line === '') {
      // skip blank
    } else {
      elements.push(<p key={key++} className="text-sm text-gray-600 leading-relaxed my-1.5">{renderInline(line)}</p>)
    }

    i++
  }

  return (
    <div className={cn('py-1', className)}>
      {elements}
    </div>
  )
}
