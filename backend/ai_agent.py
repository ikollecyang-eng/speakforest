"""
SpeakForest AI Agent
Handles: conversation, grammar check, pronunciation eval, summary generation
Uses: Anthropic API (Claude) + Whisper for STT
"""

import os
import json
import httpx
from typing import List, Optional
import base64

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SCENARIO_PROMPTS = {
    "coffee_shop": """You are a friendly Panda barista at a cozy forest café called "Panda Café". 
Your role is to help the customer practice English ordering food and drinks.
- Start by greeting and asking what they'd like to order
- React naturally to their orders (confirm, suggest add-ons, mention specials)
- Keep responses SHORT (1-2 sentences max) and natural
- If they make a grammar error, gently correct it naturally in your reply (e.g., "Oh, you mean you'd like a...?")
- After 5-6 exchanges, complete the order and say goodbye warmly
- Be warm, patient, and encouraging""",

    "job_interview": """You are a professional Fox HR Manager conducting a mock job interview at a tech company.
- Ask standard interview questions (Tell me about yourself, strengths/weaknesses, situational questions)
- Give brief, professional feedback on their answers
- Keep responses SHORT and professional
- If they use awkward expressions, model the better phrasing naturally
- Ask follow-up questions to deepen the conversation
- Be encouraging but professional""",

    "shopping": """You are a cheerful Squirrel shopkeeper at a clothing boutique in the forest.
- Help the customer find items, answer questions about sizes, colors, prices
- Suggest alternatives if something isn't available
- Keep responses SHORT (1-2 sentences)
- React naturally and model correct English phrases
- Be enthusiastic and helpful""",

    "asking_directions": """You are a helpful Shiba Inu local guide in Forest Town.
- Give clear, step-by-step directions when asked
- Ask clarifying questions about where they want to go
- Use natural direction-giving language (turn left, go straight, you'll see...)
- Keep responses SHORT and clear
- Be friendly and patient""",

    "business_meeting": """You are a wise Owl professor facilitating a business meeting discussion.
- Discuss business topics, project updates, ideas
- Ask for opinions and elaboration
- Model professional meeting language (Could you elaborate on..., I'd like to add...)
- Keep responses concise but substantive
- Encourage more formal/professional expression""",

    "travel": """You are a helpful airport/hotel staff (Traveler Bear) assisting an English-speaking traveler.
- Help with check-in, directions, recommendations
- Handle travel-related vocabulary and phrases
- Keep responses SHORT and practical
- Be patient with non-native speakers
- Model natural travel English"""
}

GRAMMAR_SYSTEM = """You are an expert English teacher. Analyze the student's English sentence for grammar and expression errors.
Respond ONLY with a JSON object (no markdown) like this:
{
  "has_error": true/false,
  "errors": [
    {
      "original": "the wrong part",
      "correction": "the correct form",
      "explanation": "brief why (max 10 words)",
      "type": "grammar|vocabulary|expression|pronunciation"
    }
  ],
  "improved_version": "the full corrected sentence or null if no errors",
  "score": 85
}
If no errors, return has_error: false, errors: [], improved_version: null, score: 95-100."""

PRONUNCIATION_SYSTEM = """You are an English pronunciation expert. 
The student was supposed to say a sentence, and here is what was transcribed from their speech.
Evaluate their pronunciation accuracy by comparing the two texts.
Respond ONLY with a JSON object (no markdown):
{
  "overall_score": 85,
  "pronunciation_score": 82,
  "fluency_score": 78,
  "intonation_score": 80,
  "completeness_score": 90,
  "word_scores": [
    {"word": "coffee", "score": 95, "status": "excellent"},
    {"word": "please", "score": 70, "status": "needs_work"}
  ],
  "feedback": "One sentence of specific actionable feedback",
  "grade": "A"
}
Grades: A (90+), B (80-89), C (70-79), D (60-69), F (<60)"""


class AIAgent:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def _claude(self, system: str, messages: list, max_tokens: int = 300) -> str:
        """Call Claude API"""
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": "claude-opus-4-5",
            "max_tokens": max_tokens,
            "system": system,
            "messages": messages
        }
        resp = await self.client.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]

    async def get_greeting(self, scenario: str, user_name: str) -> str:
        """Get opening NPC greeting for scenario"""
        system = SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS["coffee_shop"])
        greeting = await self._claude(system, [
            {"role": "user", "content": f"[The customer {user_name} just entered. Give your opening greeting.]"}
        ])
        return greeting

    async def chat(self, user_message: str, scenario: str, history: List[dict]) -> dict:
        """Main conversation turn"""
        system = SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS["coffee_shop"])
        
        # Build message history
        messages = []
        for turn in history[-10:]:  # last 10 turns for context
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})
        
        turn_count = len([m for m in history if m.get("role") == "user"]) + 1
        session_complete = turn_count >= 6
        
        if session_complete:
            system += "\n\nThis is the final exchange. Wrap up the conversation naturally and warmly."
        
        reply = await self._claude(system, messages)
        
        return {
            "reply": reply,
            "turn_count": turn_count,
            "session_complete": session_complete
        }

    async def check_grammar(self, text: str) -> dict:
        """Check grammar and expression"""
        try:
            result = await self._claude(
                GRAMMAR_SYSTEM,
                [{"role": "user", "content": f"Check this student sentence: \"{text}\""}],
                max_tokens=400
            )
            # Clean and parse JSON
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except Exception as e:
            return {"has_error": False, "errors": [], "improved_version": None, "score": 85}

    async def evaluate_pronunciation(self, original: str, transcribed: str, scenario: str) -> dict:
        """Evaluate pronunciation quality"""
        try:
            prompt = f"""Original sentence to say: "{original}"
What the student actually said (from speech-to-text): "{transcribed}"
Evaluate their pronunciation."""
            
            result = await self._claude(
                PRONUNCIATION_SYSTEM,
                [{"role": "user", "content": prompt}],
                max_tokens=500
            )
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except Exception as e:
            return {
                "overall_score": 82,
                "pronunciation_score": 82,
                "fluency_score": 78,
                "intonation_score": 80,
                "completeness_score": 90,
                "word_scores": [],
                "feedback": "Keep practicing! Focus on clear pronunciation.",
                "grade": "B"
            }

    async def transcribe(self, audio_bytes: bytes, filename: str) -> str:
        """Transcribe audio using OpenAI Whisper"""
        if not OPENAI_API_KEY:
            return "[Transcription unavailable - add OPENAI_API_KEY to .env]"
        
        try:
            files = {"file": (filename, audio_bytes, "audio/webm")}
            data = {"model": "whisper-1", "language": "en"}
            headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
            
            resp = await self.client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=20.0
            )
            resp.raise_for_status()
            return resp.json().get("text", "")
        except Exception as e:
            return f"[Transcription error: {str(e)}]"

    async def generate_summary(self, session_data: dict) -> dict:
        """Generate post-session learning summary"""
        turns = session_data.get("turns", [])
        scenario = session_data.get("scenario", "unknown")
        
        if not turns:
            return self._default_summary()
        
        conversation_text = "\n".join([
            f"{'Student' if t['role']=='user' else 'NPC'}: {t['content']}"
            for t in turns
        ])
        
        try:
            system = """You are an English learning analytics expert. 
Analyze a conversation and generate learning feedback.
Respond ONLY with JSON (no markdown):
{
  "duration_estimate": "05:30",
  "turn_count": 6,
  "strengths": ["Clear pronunciation", "Good vocabulary range"],
  "improvements": ["Watch article usage (a/an/the)", "Try more complex sentences"],
  "ai_suggestion": "One specific actionable tip in Chinese (20 chars max)",
  "scores": {
    "pronunciation": 82,
    "grammar": 78,
    "fluency": 80,
    "vocabulary": 75
  },
  "overall_grade": "B",
  "xp_earned": 45
}"""
            
            result = await self._claude(system, [
                {"role": "user", "content": f"Scenario: {scenario}\n\nConversation:\n{conversation_text}"}
            ], max_tokens=600)
            
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except:
            return self._default_summary()
    
    def _default_summary(self):
        return {
            "duration_estimate": "05:00",
            "turn_count": 6,
            "strengths": ["Completed the conversation", "Good effort"],
            "improvements": ["Practice more vocabulary", "Work on fluency"],
            "ai_suggestion": "多练习日常对话，增强表达流利度",
            "scores": {"pronunciation": 80, "grammar": 78, "fluency": 75, "vocabulary": 72},
            "overall_grade": "B",
            "xp_earned": 40
        }
