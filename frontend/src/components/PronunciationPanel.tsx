'use client'
import { PronunciationResult } from '@/store/gameStore'

interface Props { data: PronunciationResult }

const SCORE_COLORS: Record<string, string> = {
  pronunciation: 'from-blue-500 to-cyan-400',
  fluency: 'from-green-500 to-emerald-400',
  intonation: 'from-purple-500 to-violet-400',
  completeness: 'from-yellow-500 to-amber-400',
}

const gradeColor = (g: string) => {
  if (g === 'A') return 'text-green-400'
  if (g === 'B') return 'text-yellow-400'
  if (g === 'C') return 'text-orange-400'
  return 'text-red-400'
}

const statusClass = (s: string) => {
  if (s === 'excellent') return 'excellent'
  if (s === 'good') return 'good'
  return 'needs-work'
}

export default function PronunciationPanel({ data }: Props) {
  const metrics = [
    { label: '发音 Pronunciation', key: 'pronunciation', value: data.pronunciation_score },
    { label: '流利度 Fluency', key: 'fluency', value: data.fluency_score },
    { label: '语调 Intonation', key: 'intonation', value: data.intonation_score },
    { label: '完整度 Completeness', key: 'completeness', value: data.completeness_score },
  ]

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <span>🎯</span>
        <h3>发音评测</h3>
      </div>
      
      <div className="p-3 space-y-3">
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-4xl font-pixel text-yellow-300 drop-shadow">{data.overall_score}</div>
            <div className="text-xs text-green-400/70 font-game mt-1">综合评分</div>
          </div>
          <div className={`text-5xl font-pixel ${gradeColor(data.grade)} drop-shadow-lg`}>
            {data.grade}
          </div>
        </div>

        {/* Score Bars */}
        <div className="space-y-2">
          {metrics.map(m => (
            <div key={m.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-300/80 font-game">{m.label}</span>
                <span className="text-white font-bold">{m.value}</span>
              </div>
              <div className="score-bar-track">
                <div
                  className={`score-bar-fill bg-gradient-to-r ${SCORE_COLORS[m.key]}`}
                  style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Word scores */}
        {data.word_scores && data.word_scores.length > 0 && (
          <div>
            <div className="text-xs text-green-400/70 font-game mb-2">单词评分（点击听原音）</div>
            <div className="flex flex-wrap gap-1">
              {data.word_scores.filter(w => w.word).map((w, i) => (
                <div key={i} className={`word-chip ${statusClass(w.status)}`}>
                  <span>{w.word}</span>
                  <span className="text-xs opacity-70">{w.score}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2 text-xs font-game">
              <span className="text-green-600">● 优秀</span>
              <span className="text-yellow-600">● 一般</span>
              <span className="text-red-600">● 需改进</span>
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="bg-black/20 rounded-lg p-2 border border-yellow-900/30">
          <p className="text-xs text-green-300/90 font-game">{data.feedback}</p>
        </div>
      </div>
    </div>
  )
}
