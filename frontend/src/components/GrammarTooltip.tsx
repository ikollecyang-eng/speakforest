'use client'
import { useState } from 'react'
import { GrammarFeedback } from '@/store/gameStore'

interface Props { feedback: GrammarFeedback }

export default function GrammarTooltip({ feedback }: Props) {
  const [open, setOpen] = useState(true)
  if (!feedback.has_error || !open) return null

  return (
    <div className="mt-1 rounded-lg overflow-hidden border border-yellow-500/30 text-xs"
      style={{ background: 'rgba(120,80,20,0.3)' }}>
      <div className="flex items-center justify-between px-2 py-1 border-b border-yellow-900/30">
        <span className="text-yellow-400 font-game">✏️ 语法建议</span>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="p-2 space-y-1">
        {feedback.errors.map((e, i) => (
          <div key={i} className="font-game">
            <span className="grammar-error">{e.original}</span>
            <span className="text-green-400 mx-1">→</span>
            <span className="text-green-300 font-bold">{e.correction}</span>
            <div className="text-gray-400 mt-0.5">{e.explanation}</div>
          </div>
        ))}
        {feedback.improved_version && (
          <div className="mt-1 pt-1 border-t border-yellow-900/30">
            <span className="text-green-400">💡 </span>
            <span className="text-green-200">{feedback.improved_version}</span>
          </div>
        )}
      </div>
    </div>
  )
}
