'use client'
import { useGameStore } from '@/store/gameStore'

const BUILDINGS = [
  { id: 'coffee_shop', label: '咖啡馆', sublabel: 'Coffee Shop', emoji: '☕', x: 15, y: 55 },
  { id: 'job_interview', label: '面试中心', sublabel: 'Interview', emoji: '💼', x: 42, y: 35 },
  { id: 'business_meeting', label: '会议室', sublabel: 'Meeting Room', emoji: '🏢', x: 65, y: 38 },
  { id: 'library', label: '图书馆', sublabel: 'Library', emoji: '📚', x: 10, y: 72 },
  { id: 'shopping', label: '商店', sublabel: 'Shop', emoji: '🛍️', x: 75, y: 62 },
  { id: 'travel', label: '机场', sublabel: 'Airport', emoji: '✈️', x: 55, y: 68 },
]

const NPCS = [
  { emoji: '🐼', x: 28, y: 60, label: 'Panda' },
  { emoji: '🦊', x: 50, y: 50, label: 'Fox' },
  { emoji: '🦉', x: 22, y: 45, label: 'Owl' },
]

export default function HomeScreen() {
  const { setScreen, userStats } = useGameStore()
  const xpPct = Math.min(100, ((userStats.xp % 200) / 200) * 100)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top HUD */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-yellow-900/40"
        style={{ background: 'rgba(13,40,24,0.95)' }}>
        
        {/* Avatar + Level */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg border-2 border-yellow-500">
            🧑
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-xs font-pixel">Lv.{userStats.level}</div>
            <div className="w-24 h-2 bg-black/40 rounded-full border border-yellow-900/60 mt-0.5">
              <div className="xp-bar h-full rounded-full" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="text-xs text-green-400 font-game">{userStats.xp % 200}/200 XP</div>
          </div>
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <div className="text-2xl font-display text-yellow-300 drop-shadow-lg">🌲 SpeakForest</div>
          <div className="text-xs text-green-400 font-game tracking-wider">英语森友镇</div>
        </div>

        {/* Resources */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span className="text-white font-bold font-game text-sm">120/120</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🪙</span>
            <span className="text-yellow-300 font-bold font-game text-sm">{userStats.coins}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💎</span>
            <span className="text-blue-300 font-bold font-game text-sm">50</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span className="text-orange-300 font-bold font-game text-sm">{userStats.total_sessions}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4">
        {/* Forest Map */}
        <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-yellow-900/50"
          style={{ 
            minHeight: '500px',
            background: 'linear-gradient(180deg, #1a5c33 0%, #2d6a4f 40%, #4a7c5a 70%, #8b7355 100%)',
          }}>
          
          {/* Sky / background trees (decorative) */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(ellipse at 20% 80%, #0d4a2a 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, #0d4a2a 0%, transparent 40%)'
          }} />

          {/* Ground path */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M20 85 Q40 70 50 55 Q60 40 65 35" stroke="#c8a96e" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M50 55 Q70 60 80 65" stroke="#c8a96e" strokeWidth="2" fill="none" opacity="0.4"/>
          </svg>

          {/* NPC Sprites */}
          {NPCS.map((npc) => (
            <div key={npc.label}
              className="absolute text-4xl npc-sprite cursor-pointer hover:scale-110 transition-transform"
              style={{ left: `${npc.x}%`, top: `${npc.y}%`, animationDelay: `${Math.random() * 2}s` }}
              title={npc.label}>
              {npc.emoji}
            </div>
          ))}

          {/* Player character */}
          <div className="absolute text-4xl" style={{ left: '40%', top: '58%' }}>
            🧑
          </div>

          {/* Buildings */}
          {BUILDINGS.map((b) => (
            <div key={b.id}
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => setScreen('scenario_select')}>
              
              <div className="text-5xl transition-transform group-hover:scale-110 drop-shadow-lg" 
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                {b.emoji}
              </div>
              <div className="mt-1 text-center">
                <div className="text-white font-bold text-xs font-game bg-black/50 px-2 py-0.5 rounded whitespace-nowrap">
                  {b.label}
                </div>
                <div className="text-green-300 text-xs font-game opacity-80">{b.sublabel}</div>
              </div>
            </div>
          ))}

          {/* Decorative trees */}
          {['5%', '32%', '58%', '82%', '90%'].map((x, i) => (
            <div key={i} className="absolute text-4xl opacity-70 pointer-events-none"
              style={{ left: x, top: `${10 + i * 8}%` }}>
              🌲
            </div>
          ))}

          {/* Title overlay on map */}
          <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
            <div className="inline-block bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-yellow-900/40">
              <p className="text-green-300 text-sm font-game">点击建筑或右侧选择场景开始练习</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col gap-3">
          {/* Quick Start */}
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <span>🎯</span>
              <h3>快速开始</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { id: 'coffee_shop', name: '☕ 咖啡点餐', sub: 'Coffee Order · ★☆☆' },
                { id: 'shopping', name: '🛍️ 商场购物', sub: 'Shopping · ★☆☆' },
                { id: 'asking_directions', name: '🗺️ 问路指南', sub: 'Directions · ★★☆' },
                { id: 'job_interview', name: '💼 面试练习', sub: 'Interview · ★★★' },
                { id: 'business_meeting', name: '🏢 商务会议', sub: 'Meeting · ★★★★' },
                { id: 'travel', name: '✈️ 旅行英语', sub: 'Travel · ★★☆' },
              ].map((s) => (
                <button key={s.id}
                  onClick={() => setScreen('scenario_select')}
                  className="w-full text-left px-3 py-2 rounded-lg border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-yellow-900/20 transition-all group">
                  <div className="text-parchment font-bold text-sm font-game group-hover:text-yellow-300 transition-colors">{s.name}</div>
                  <div className="text-green-400/70 text-xs">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <span>📊</span>
              <h3>我的进度</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-300 font-game">完成场景</span>
                <span className="text-yellow-300 font-bold">{userStats.total_sessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-300 font-game">总经验值</span>
                <span className="text-yellow-300 font-bold">{userStats.xp} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-300 font-game">金币</span>
                <span className="text-yellow-300 font-bold">🪙 {userStats.coins}</span>
              </div>
              
              <div className="mt-2 pt-2 border-t border-yellow-900/30">
                <div className="text-green-300 text-xs font-game mb-1">成就徽章</div>
                <div className="flex gap-2">
                  {['⭐', '🎤', '☕', '📚', '🗺️'].map((badge, i) => (
                    <div key={i} className={`achievement text-lg ${i < 3 ? 'unlocked' : 'locked'}`}>
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            onClick={() => setScreen('scenario_select')}
            className="w-full py-4 rounded-xl font-display text-xl text-white border-2 border-yellow-500 transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
            🌲 开始练习！
          </button>
        </div>
      </div>
    </div>
  )
}
