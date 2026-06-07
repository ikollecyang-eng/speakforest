import { create } from 'zustand'

export type Screen = 'home' | 'scenario_select' | 'conversation' | 'summary'

export interface Turn {
  role: 'user' | 'assistant'
  content: string
  grammarFeedback?: GrammarFeedback | null
  timestamp: number
}

export interface GrammarFeedback {
  has_error: boolean
  errors: Array<{
    original: string
    correction: string
    explanation: string
    type: string
  }>
  improved_version: string | null
  score: number
}

export interface PronunciationResult {
  overall_score: number
  pronunciation_score: number
  fluency_score: number
  intonation_score: number
  completeness_score: number
  word_scores: Array<{ word: string; score: number; status: string }>
  feedback: string
  grade: string
}

export interface SessionSummary {
  duration_estimate: string
  turn_count: number
  strengths: string[]
  improvements: string[]
  ai_suggestion: string
  scores: { pronunciation: number; grammar: number; fluency: number; vocabulary: number }
  overall_grade: string
  xp_earned: number
}

export interface Scenario {
  id: string
  name: string
  name_zh: string
  description: string
  npc: string
  icon: string
  difficulty: number
}

interface GameState {
  screen: Screen
  selectedScenario: Scenario | null
  sessionId: string | null
  turns: Turn[]
  lastPronunciation: PronunciationResult | null
  summary: SessionSummary | null
  userStats: { level: number; xp: number; coins: number; total_sessions: number }
  isLoading: boolean
  isRecording: boolean
  
  // Actions
  setScreen: (s: Screen) => void
  setScenario: (s: Scenario) => void
  startSession: (id: string, greeting: string) => void
  addTurn: (turn: Turn) => void
  setPronunciation: (p: PronunciationResult) => void
  setSummary: (s: SessionSummary) => void
  setStats: (stats: GameState['userStats']) => void
  setLoading: (v: boolean) => void
  setRecording: (v: boolean) => void
  resetSession: () => void
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'home',
  selectedScenario: null,
  sessionId: null,
  turns: [],
  lastPronunciation: null,
  summary: null,
  userStats: { level: 1, xp: 0, coins: 100, total_sessions: 0 },
  isLoading: false,
  isRecording: false,

  setScreen: (screen) => set({ screen }),
  setScenario: (selectedScenario) => set({ selectedScenario }),
  startSession: (sessionId, greeting) => set({
    sessionId,
    turns: [{ role: 'assistant', content: greeting, timestamp: Date.now() }],
  }),
  addTurn: (turn) => set((s) => ({ turns: [...s.turns, turn] })),
  setPronunciation: (lastPronunciation) => set({ lastPronunciation }),
  setSummary: (summary) => set({ summary }),
  setStats: (userStats) => set({ userStats }),
  setLoading: (isLoading) => set({ isLoading }),
  setRecording: (isRecording) => set({ isRecording }),
  resetSession: () => set({ sessionId: null, turns: [], lastPronunciation: null, summary: null }),
}))
