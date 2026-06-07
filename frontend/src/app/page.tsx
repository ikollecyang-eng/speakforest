'use client'
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import HomeScreen from '@/components/HomeScreen'
import ScenarioSelect from '@/components/ScenarioSelect'
import ConversationScreen from '@/components/ConversationScreen'
import SummaryScreen from '@/components/SummaryScreen'
import { apiGet } from '@/lib/api'

export default function Page() {
  const { screen, setStats } = useGameStore()

  useEffect(() => {
    apiGet('/user/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0d2818 0%, #1a3a28 100%)' }}>
      {screen === 'home' && <HomeScreen />}
      {screen === 'scenario_select' && <ScenarioSelect />}
      {screen === 'conversation' && <ConversationScreen />}
      {screen === 'summary' && <SummaryScreen />}
    </div>
  )
}
