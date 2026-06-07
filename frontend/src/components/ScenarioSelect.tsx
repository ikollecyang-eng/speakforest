'use client'
import { useState, useEffect } from 'react'
import { useGameStore, Scenario } from '@/store/gameStore'
import { apiGet, apiPost } from '@/lib/api'

const FALLBACK_SCENARIOS: Scenario[] = [
  { id: 'coffee_shop', name: 'Coffee Order', name_zh: '点餐', description: 'Practice ordering food and drinks at a café', npc: 'Panda Barista', icon: '🐼', difficulty: 1 },
  { id: 'job_interview', name: 'Job Interview', name_zh: '面试', description: 'Practice answering interview questions professionally', npc: 'Fox HR Manager', icon: '🦊', difficulty: 3 },
  { id: 'shopping', name: 'Shopping', name_zh: '购物', description: 'Practice buying clothes, asking for sizes and prices', npc: 'Squirrel Shopkeeper', icon: '🐿️', difficulty: 1 },
  { id: 'asking_directions', name: 'Asking Directions', name_zh: '问路', description: 'Practice asking for and understanding directions', npc: 'Shiba Inu Guide', icon: '🐕', difficulty: 2 },
  { id: 'business_meeting', name: 'Business Meeting', name_zh: '会议', description: 'Practice presenting ideas in meetings', npc: 'Owl Professor', icon: '🦉', difficulty: 4 },
  { id: 'travel', name: 'Travel', name_zh: '旅游', description: 'Practice at airports, hotels and tourist spots', npc: 'Traveler Bear', icon: '🧳', difficulty: 2 },
]

const CATEGORY_TABS = ['全部', '日常生活', '职场', '学习']

export default function ScenarioSelect() {
  const { setScreen, setScenario, startSession } = useGameStore()
  const [scenarios, setScenarios] = useState<Scenario[]>(FALLBACK_SCENARIOS)
  const [selected, setSelected] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('全部')

  useEffect(() => {
    apiGet('/scenarios').then(d => setScenarios(d.scenarios)).catch(() => {})
  }, [])

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await apiPost('/session/start', { scenario: selected.id, user_name: 'Player' })
      setScenario(selected)
      startSession(res.session_id, res.greeting)
      setScreen('conversation')
    } catch (e) {
      // Demo mode fallback
      setScenario(selected)
      startSession('demo_session', getDemoGreeting(selected.id))
      setScreen('conversation')
    }
    setLoading(false)
  }

  const getDemoGreeting = (id: string) => {
    const greetings: Record<string, string> = {
      coffee_shop: "Welcome to Panda Café! ☕ What would you like to order today?",
      job_interview: "Good morning! Please have a seat. Let's start with: could you tell me a bit about yourself?",
      shopping: "Hi there! Welcome to Forest Boutique! Are you looking for anything special today?",
      asking_directions: "Hello! Can I help you find something? Where are you trying to get to?",
      business_meeting: "Good morning everyone! Let's start our meeting. Could you give us a quick project update?",
      travel: "Welcome! Are you checking in today? May I see your passport please?",
    }
    return greetings[id] || "Hello! Let's practice English together!"
  }

  const difficultyLabel = (d: number) => {
    const stars = '★'.repeat(d) + '☆'.repeat(4 - d)
    const labels = ['', 'Easy', 'Easy', 'Medium', 'Hard']
    return { stars, label: labels[d] || 'Expert' }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0d2818 0%, #1a3a28 100%)' }}>
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-yellow-900/40"
        style={{ background: 'rgba(13,40,24,0.95)' }}>
        <button onClick={() => setScreen('home')}
          className="text-green-400 hover:text-yellow-300 transition-colors font-game text-sm flex items-center gap-1">
          ← 返回
        </button>
        <h1 className="text-xl font-display text-yellow-300">🗺️ 选择练习场景</h1>
      </div>

      <div className="flex gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Scenario Grid */}
        <div className="flex-1">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4">
            {CATEGORY_TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-game text-sm transition-all border ${
                  activeTab === tab
                    ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300'
                    : 'border-yellow-900/30 text-green-400 hover:border-yellow-900/60'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <div key={s.id}
                onClick={() => setSelected(s)}
                className={`scenario-card panel overflow-hidden ${selected?.id === s.id ? 'selected' : ''}`}>
                
                {/* NPC Image Area */}
                <div className="h-28 flex items-center justify-center text-6xl relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 100%)' }}>
                  <span className="npc-sprite">{s.icon}</span>
                  {/* Difficulty */}
                  <div className="absolute top-2 right-2 text-xs text-yellow-400 font-pixel">
                    {difficultyLabel(s.difficulty).stars}
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold font-game text-sm">{s.name_zh}</span>
                    <span className="text-green-400/70 text-xs">{s.name}</span>
                  </div>
                  <p className="text-green-300/70 text-xs font-game leading-relaxed">{s.description}</p>
                  <div className="mt-2 text-xs text-yellow-600 font-game">{s.npc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-64 space-y-3">
          {selected ? (
            <>
              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <span>{selected.icon}</span>
                  <h3>{selected.name_zh}</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-8xl text-center py-4 npc-sprite">{selected.icon}</div>
                  
                  <div className="text-center">
                    <div className="text-white font-bold font-game">{selected.name}</div>
                    <div className="text-green-300/70 text-xs font-game mt-1">{selected.description}</div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-yellow-900/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-300 font-game">NPC</span>
                      <span className="text-white">{selected.npc}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-300 font-game">难度</span>
                      <span className="text-yellow-400">{'★'.repeat(selected.difficulty)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-300 font-game">奖励</span>
                      <span className="text-yellow-300">🪙 +{selected.difficulty * 10} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-4 rounded-xl font-display text-xl text-white border-2 border-yellow-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
                {loading ? '进入中...' : '🎤 开始对话'}
              </button>

              <div className="text-xs text-green-400/50 text-center font-game">
                平均时长: 5-8分钟
              </div>
            </>
          ) : (
            <div className="panel p-6 text-center">
              <div className="text-5xl mb-3">👆</div>
              <p className="text-green-300 font-game text-sm">选择一个场景开始练习</p>
            </div>
          )}

          {/* Tips */}
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <span>💡</span>
              <h3>练习提示</h3>
            </div>
            <div className="p-3 space-y-2 text-xs text-green-300/80 font-game">
              <p>• 大声说出来，不要害怕</p>
              <p>• AI会实时纠正语法错误</p>
              <p>• 完成后获得发音评分</p>
              <p>• 每次对话约6轮</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
