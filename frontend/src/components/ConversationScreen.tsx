'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore, Turn, PronunciationResult } from '@/store/gameStore'
import { apiPost, apiPostAudio } from '@/lib/api'
import PronunciationPanel from './PronunciationPanel'
import GrammarTooltip from './GrammarTooltip'

type MicState = 'idle' | 'recording' | 'processing'

export default function ConversationScreen() {
  const { selectedScenario, sessionId, turns, addTurn, setScreen, setSummary, setPronunciation, lastPronunciation } = useGameStore()
  const [micState, setMicState] = useState<MicState>('idle')
  const [inputText, setInputText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [statusMsg, setStatusMsg] = useState('点击麦克风开始说话')
  const [turnCount, setTurnCount] = useState(0)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const npc = selectedScenario?.icon ?? '🐼'
  const scenario = selectedScenario?.id ?? 'coffee_shop'
  const maxTurns = 6

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [turns])

  // Build history for API
  const buildHistory = () =>
    turns.map(t => ({ role: t.role, content: t.content }))

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    
    const userTurn: Turn = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    addTurn(userTurn)
    setStatusMsg('AI 思考中...')
    setMicState('processing')

    try {
      const res = await apiPost('/chat', {
        session_id: sessionId,
        user_message: text,
        scenario,
        history: buildHistory(),
      })

      // Grammar feedback
      const turnWithGrammar: Turn = {
        ...userTurn,
        grammarFeedback: res.grammar_feedback,
      }

      const aiTurn: Turn = {
        role: 'assistant',
        content: res.reply,
        timestamp: Date.now(),
      }
      addTurn(aiTurn)

      const newCount = turnCount + 1
      setTurnCount(newCount)
      setStatusMsg(res.session_complete ? '对话完成！查看总结' : '你的回合 - 点击麦克风说话')

      if (res.session_complete || newCount >= maxTurns) {
        setTimeout(() => handleEndSession(), 1500)
      }

      // Auto pronounce evaluation (mock with last user message)
      if (text.length > 3) {
        apiPost('/eval/pronunciation', {
          original_text: text,
          user_text: text,
          scenario,
        }).then(setPronunciation).catch(() => {})
      }

    } catch (e) {
      // Demo mode: generate a response locally
      const demoReply = getDemoReply(scenario, text, turns.length)
      addTurn({ role: 'assistant', content: demoReply, timestamp: Date.now() })
      
      const newCount = turnCount + 1
      setTurnCount(newCount)
      setStatusMsg(newCount >= maxTurns ? '对话完成！' : '你的回合 - 点击麦克风说话')
      
      if (newCount >= maxTurns) setTimeout(() => handleEndSession(), 1500)
      
      // Mock pronunciation
      setPronunciation({
        overall_score: 75 + Math.floor(Math.random() * 20),
        pronunciation_score: 72 + Math.floor(Math.random() * 22),
        fluency_score: 70 + Math.floor(Math.random() * 25),
        intonation_score: 74 + Math.floor(Math.random() * 20),
        completeness_score: 85 + Math.floor(Math.random() * 15),
        word_scores: text.split(' ').slice(0, 6).map(w => ({
          word: w.replace(/[^a-zA-Z]/g, ''),
          score: 65 + Math.floor(Math.random() * 35),
          status: Math.random() > 0.3 ? 'excellent' : 'good',
        })).filter(w => w.word),
        feedback: "Good effort! Focus on clear articulation of each word.",
        grade: 'B',
      })
    }

    setMicState('idle')
  }, [turns, sessionId, scenario, turnCount])

  const startRecording = async () => {
    // Try Web Speech API first (no backend needed)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setMicState('recording')
      setStatusMsg('正在聆听... 请说话')
      
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        setInputText(transcript)
        setMicState('processing')
        setStatusMsg(`识别到: "${transcript}"`)
        setTimeout(() => sendMessage(transcript), 500)
      }
      
      recognition.onerror = () => {
        setMicState('idle')
        setStatusMsg('语音识别失败，请使用文字输入')
        setShowInput(true)
      }
      
      recognition.onend = () => {
        if (micState === 'recording') setMicState('idle')
      }
      
      recognition.start()
      return
    }

    // Fallback: MediaRecorder → Whisper
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []
      
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data)
      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setMicState('processing')
        setStatusMsg('识别语音中...')
        try {
          const res = await apiPostAudio('/transcribe', blob, 'audio.webm')
          await sendMessage(res.text)
        } catch {
          setShowInput(true)
          setMicState('idle')
          setStatusMsg('请使用文字输入')
        }
      }
      
      setMicState('recording')
      setStatusMsg('正在录音... 点击停止')
      mediaRecorder.current.start()
    } catch {
      setShowInput(true)
      setMicState('idle')
      setStatusMsg('请使用文字输入')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleMicClick = () => {
    if (micState === 'idle') startRecording()
    else if (micState === 'recording') stopRecording()
  }

  const handleEndSession = async () => {
    try {
      const summary = await apiPost(`/session/${sessionId}/summary`, {})
      setSummary(summary)
    } catch {
      // Mock summary
      setSummary({
        duration_estimate: '05:30',
        turn_count: turnCount,
        strengths: ['Completed the full conversation', 'Good response length'],
        improvements: ['Practice article usage (a/an/the)', 'Try more descriptive vocabulary'],
        ai_suggestion: '多练习形容词搭配，让表达更生动',
        scores: { pronunciation: 78, grammar: 82, fluency: 75, vocabulary: 70 },
        overall_grade: 'B',
        xp_earned: 45,
      })
    }
    setScreen('summary')
  }

  return (
    <div className="h-screen flex" style={{ background: 'linear-gradient(180deg, #0d2818 0%, #1a3a28 100%)' }}>
      {/* Left: Conversation */}
      <div className="flex-1 flex flex-col" style={{ maxWidth: '55%' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-yellow-900/40"
          style={{ background: 'rgba(13,40,24,0.95)' }}>
          <button onClick={() => setScreen('scenario_select')}
            className="text-green-400 hover:text-yellow-300 text-sm font-game">← 退出</button>
          <span className="text-2xl">{npc}</span>
          <div>
            <div className="text-white font-bold font-game text-sm">{selectedScenario?.name_zh} - {selectedScenario?.name}</div>
            <div className="text-green-400/70 text-xs font-game">对话进度 {Math.min(turnCount, maxTurns)}/{maxTurns}</div>
          </div>
          {/* Progress bar */}
          <div className="flex-1 mx-4">
            <div className="score-bar-track">
              <div className="score-bar-fill bg-gradient-to-r from-green-600 to-green-400"
                style={{ width: `${(Math.min(turnCount, maxTurns) / maxTurns) * 100}%` }} />
            </div>
          </div>
          <button onClick={handleEndSession}
            className="px-3 py-1.5 rounded-lg text-sm font-game text-white border border-red-900/50 hover:bg-red-900/30 transition-colors">
            结束对话
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {turns.map((turn, i) => (
            <div key={i} className={`flex gap-3 ${turn.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="text-3xl flex-shrink-0 self-end mb-1">
                {turn.role === 'assistant' ? npc : '🧑'}
              </div>
              <div className="max-w-xs">
                <div className={`speech-bubble ${turn.role === 'user' ? 'user' : 'npc'}`}>
                  {turn.content}
                </div>
                {/* Grammar feedback */}
                {turn.role === 'user' && turn.grammarFeedback?.has_error && (
                  <GrammarTooltip feedback={turn.grammarFeedback} />
                )}
              </div>
            </div>
          ))}

          {micState === 'processing' && (
            <div className="flex gap-3">
              <div className="text-3xl">{npc}</div>
              <div className="speech-bubble npc">
                <div className="loading-dots flex gap-1">
                  <span className="text-gray-400 text-xl">•</span>
                  <span className="text-gray-400 text-xl">•</span>
                  <span className="text-gray-400 text-xl">•</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-yellow-900/40" style={{ background: 'rgba(13,40,24,0.95)' }}>
          {/* Status */}
          <div className="text-center text-green-400/70 text-xs font-game mb-3">{statusMsg}</div>
          
          {/* Waveform (when recording) */}
          {micState === 'recording' && (
            <div className="waveform justify-center mb-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="waveform-bar"
                  style={{ animationDelay: `${i * 0.05}s`, height: `${8 + Math.random() * 20}px` }} />
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {/* Speaker / Sound button */}
            <button className="text-2xl hover:scale-110 transition-transform" title="重播NPC音频">🔊</button>

            {/* Text input (optional) */}
            <div className="flex-1 relative">
              {showInput ? (
                <div className="flex gap-2">
                  <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(inputText)}
                    placeholder="Type your response..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-yellow-900/50 text-white font-game text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <button onClick={() => sendMessage(inputText)}
                    className="px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-game text-sm">
                    发送
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button onClick={() => setShowInput(true)}
                    className="text-green-400/50 text-xs font-game hover:text-green-400 transition-colors">
                    📝 切换文字输入
                  </button>
                </div>
              )}
            </div>

            {/* Mic Button */}
            <button
              onClick={handleMicClick}
              disabled={micState === 'processing'}
              className={`mic-btn ${micState}`}>
              {micState === 'idle' && <span className="text-2xl">🎤</span>}
              {micState === 'recording' && <span className="text-2xl animate-pulse">⏹️</span>}
              {micState === 'processing' && <span className="text-2xl animate-spin">⏳</span>}
            </button>
          </div>

          {/* Hint button */}
          <div className="flex justify-center mt-2">
            <button
              onClick={async () => {
                const hint = await apiPost('/chat', {
                  session_id: sessionId,
                  user_message: '[HINT REQUEST - give the user a hint about what to say next, in English, max 15 words]',
                  scenario,
                  history: buildHistory(),
                }).catch(() => ({ reply: 'Try saying: "I would like to order a coffee please."' }))
                setStatusMsg(`💡 提示: ${hint.reply}`)
              }}
              className="text-yellow-600 hover:text-yellow-400 text-xs font-game transition-colors">
              💡 提示
            </button>
          </div>
        </div>
      </div>

      {/* Right: Pronunciation + Info Panels */}
      <div className="w-80 flex flex-col gap-3 p-3 border-l border-yellow-900/40 overflow-y-auto">
        {lastPronunciation && <PronunciationPanel data={lastPronunciation} />}

        {/* Scenario info */}
        <div className="panel overflow-hidden">
          <div className="panel-header">
            <span>🎭</span>
            <h3>场景信息</h3>
          </div>
          <div className="p-3 space-y-2">
            <div className="text-center py-2 text-5xl npc-sprite">{npc}</div>
            <p className="text-green-300/70 text-xs font-game text-center">{selectedScenario?.description}</p>
            <div className="text-xs text-yellow-600 font-game text-center">{selectedScenario?.npc}</div>
          </div>
        </div>

        {/* Quick phrases */}
        <div className="panel overflow-hidden">
          <div className="panel-header">
            <span>📝</span>
            <h3>常用表达</h3>
          </div>
          <div className="p-3 space-y-1">
            {getQuickPhrases(scenario).map((phrase, i) => (
              <button key={i}
                onClick={() => sendMessage(phrase)}
                className="w-full text-left px-2 py-1.5 rounded text-xs font-game text-green-300 hover:bg-green-900/30 hover:text-white transition-colors border border-transparent hover:border-green-900/50">
                💬 {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getQuickPhrases(scenario: string): string[] {
  const phrases: Record<string, string[]> = {
    coffee_shop: ["I'd like a latte, please.", "Can I have a chocolate cake?", "How much is that?", "For here, please.", "Could I get that to go?"],
    job_interview: ["I have 3 years of experience in...", "My greatest strength is...", "I'm very passionate about...", "Could you tell me more about the role?"],
    shopping: ["Do you have this in a smaller size?", "How much does this cost?", "Can I try this on?", "I'll take this one."],
    asking_directions: ["Excuse me, how do I get to...?", "Is it far from here?", "Could you repeat that please?", "Should I turn left or right?"],
    business_meeting: ["I'd like to propose...", "In my opinion...", "Could you elaborate on that?", "I agree with your point."],
    travel: ["I have a reservation under...", "Could I have a window seat?", "Where is the baggage claim?", "What time does boarding start?"],
  }
  return phrases[scenario] || phrases['coffee_shop']
}

function getDemoReply(scenario: string, userMsg: string, turnIndex: number): string {
  const replies: Record<string, string[]> = {
    coffee_shop: ["Great choice! Would you like that with milk?", "Coming right up! Anything else for you today?", "Of course! That'll be $5.50. Would you like a receipt?", "Perfect! Your order will be ready in about 3 minutes.", "Enjoy your coffee! Have a wonderful day! ☕"],
    job_interview: ["That's impressive! Could you tell me about a challenge you overcame?", "Excellent. Where do you see yourself in 5 years?", "Interesting perspective. How do you handle working under pressure?", "Great answer. Do you have any questions for us?"],
    shopping: ["We have it in blue, red, and green! Which do you prefer?", "The fitting rooms are right over there!", "That looks amazing on you! Will you be paying by card or cash?", "We also have a 20% discount today! Interested?"],
    asking_directions: ["Sure! Go straight for two blocks, then turn left at the traffic light.", "It's about a 5 minute walk from here.", "You'll see a big red building on your right. You can't miss it!", "No problem! Come back if you need more help."],
    business_meeting: ["That's a great point. How would you implement that?", "I see. What's the timeline you're proposing?", "Excellent suggestion. Does anyone else have thoughts on this?", "Thank you. Let's move on to the next agenda item."],
    travel: ["Of course! May I see your passport please?", "You're all checked in! Your gate is B12.", "Boarding starts in 30 minutes. Have a pleasant flight!", "The hotel shuttle arrives every 20 minutes. Here's your key card."],
  }
  const list = replies[scenario] || replies['coffee_shop']
  return list[Math.min(turnIndex, list.length - 1)]
}
