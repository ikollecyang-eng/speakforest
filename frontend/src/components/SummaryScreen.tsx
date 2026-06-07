'use client'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const gradeGlow: Record<string, string> = {
  A: '0 0 30px rgba(34,197,94,0.5)',
  B: '0 0 30px rgba(250,204,21,0.5)',
  C: '0 0 30px rgba(249,115,22,0.5)',
  D: '0 0 30px rgba(239,68,68,0.5)',
  F: '0 0 30px rgba(239,68,68,0.5)',
}

const gradeColor: Record<string, string> = {
  A: 'text-green-400', B: 'text-yellow-400', C: 'text-orange-400', D: 'text-red-400', F: 'text-red-500'
}

export default function SummaryScreen() {
  const { summary, selectedScenario, resetSession, setScreen, userStats } = useGameStore()
  const [showXP, setShowXP] = useState(false)
  const [animScore, setAnimScore] = useState(0)

  useEffect(() => {
    setTimeout(() => setShowXP(true), 800)
    if (summary) {
      let start = 0
      const target = summary.xp_earned
      const step = setInterval(() => {
        start += 2
        setAnimScore(Math.min(start, target))
        if (start >= target) clearInterval(step)
      }, 30)
    }
  }, [summary])

  if (!summary) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-white font-game text-xl">生成总结中...</div>
    </div>
  )

  const grade = summary.overall_grade || 'B'
  const scores = summary.scores

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #0d2818 0%, #1a3a28 100%)' }}>
      
      <div className="w-full max-w-3xl space-y-4 page-enter">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-2">{selectedScenario?.icon ?? '🎓'}</div>
          <h1 className="text-3xl font-display text-yellow-300 drop-shadow-lg">课后报告</h1>
          <p className="text-green-400/70 font-game text-sm mt-1">{selectedScenario?.name} · {selectedScenario?.name_zh}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: Main stats */}
          <div className="space-y-3">
            {/* Grade & Score */}
            <div className="panel overflow-hidden">
              <div className="panel-header"><span>🏆</span><h3>综合评分</h3></div>
              <div className="p-4 flex items-center justify-around">
                <div className="text-center">
                  <div 
                    className={`text-8xl font-pixel ${gradeColor[grade]}`}
                    style={{ textShadow: gradeGlow[grade] || '' }}>
                    {grade}
                  </div>
                  <div className="text-green-400/70 font-game text-xs mt-2">总评</div>
                </div>
                <div className="space-y-3">
                  {Object.entries(scores).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-300 font-game capitalize">{
                          { pronunciation: '发音', grammar: '语法', fluency: '流利度', vocabulary: '词汇' }[key] || key
                        }</span>
                        <span className="text-white font-bold">{val}</span>
                      </div>
                      <div className="score-bar-track w-36">
                        <div className="score-bar-fill bg-gradient-to-r from-green-600 to-green-400 h-full rounded"
                          style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Session info */}
            <div className="panel overflow-hidden">
              <div className="panel-header"><span>📊</span><h3>本次练习</h3></div>
              <div className="p-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-yellow-300 font-bold text-lg">{summary.duration_estimate}</div>
                  <div className="text-green-400/70 text-xs font-game">时长</div>
                </div>
                <div>
                  <div className="text-yellow-300 font-bold text-lg">{summary.turn_count}</div>
                  <div className="text-green-400/70 text-xs font-game">对话轮数</div>
                </div>
                <div>
                  <div className={`font-bold text-lg ${gradeColor[grade]}`}>+{animScore}</div>
                  <div className="text-green-400/70 text-xs font-game">XP 获得</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feedback */}
          <div className="space-y-3">
            <div className="panel overflow-hidden">
              <div className="panel-header"><span>✅</span><h3>表现优秀</h3></div>
              <div className="p-3 space-y-2">
                {summary.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">👍</span>
                    <span className="text-green-300 text-sm font-game">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="panel-header"><span>📈</span><h3>需要改进</h3></div>
              <div className="p-3 space-y-2">
                {summary.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">💡</span>
                    <span className="text-orange-200 text-sm font-game">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="panel-header"><span>🤖</span><h3>AI 学习建议</h3></div>
              <div className="p-3">
                <p className="text-parchment font-game text-sm">{summary.ai_suggestion}</p>
              </div>
            </div>
          </div>
        </div>

        {/* XP Gain animation */}
        {showXP && (
          <div className="panel p-3 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-yellow-300 font-bold font-game">经验值 +{summary.xp_earned}</div>
                <div className="text-xs text-green-400/70 font-game">Lv.{userStats.level} | {userStats.xp % 200}/200 XP</div>
              </div>
            </div>
            <div className="flex-1 mx-6">
              <div className="score-bar-track">
                <div className="xp-bar h-3 rounded-full"
                  style={{ width: `${Math.min(100, ((userStats.xp % 200) / 200) * 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span className="text-yellow-300 font-bold font-game">+{Math.floor(summary.xp_earned / 3)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { resetSession(); setScreen('scenario_select') }}
            className="flex-1 py-3 rounded-xl font-display text-lg text-white border-2 border-yellow-500 hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            🔄 再练一次
          </button>
          <button
            onClick={() => { resetSession(); setScreen('home') }}
            className="flex-1 py-3 rounded-xl font-display text-lg text-white border-2 border-yellow-900/50 hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #4b5563, #374151)' }}>
            🏠 返回小镇
          </button>
        </div>
      </div>
    </div>
  )
}
