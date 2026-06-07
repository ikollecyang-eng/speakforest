"""
SpeakForest Backend - FastAPI
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import time
import asyncio

from ai_agent import AIAgent
from database import Database

app = FastAPI(title="SpeakForest API", version="1.0.0")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()
agent = AIAgent()

# ─── Models ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    user_message: str
    scenario: str
    history: List[dict] = []

class EvalRequest(BaseModel):
    original_text: str
    user_text: str
    scenario: str

class SessionStart(BaseModel):
    scenario: str
    user_name: str = "Player"

class TranscribeRequest(BaseModel):
    audio_base64: str
    scenario: str

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"msg": "SpeakForest API 🌲", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/session/start")
async def start_session(req: SessionStart):
    """Start a new conversation session"""
    session_id = f"session_{int(time.time())}_{req.scenario}"
    greeting = await agent.get_greeting(req.scenario, req.user_name)
    db.create_session(session_id, req.scenario, req.user_name)
    return {
        "session_id": session_id,
        "greeting": greeting,
        "scenario": req.scenario
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    """Main conversation endpoint"""
    # Get AI response
    response = await agent.chat(
        user_message=req.user_message,
        scenario=req.scenario,
        history=req.history
    )
    
    # Quick grammar check
    grammar_check = await agent.check_grammar(req.user_message)
    
    # Save to DB
    db.add_turn(req.session_id, req.user_message, response["reply"], grammar_check)
    
    return {
        "reply": response["reply"],
        "grammar_feedback": grammar_check,
        "turn_count": response.get("turn_count", 1),
        "session_complete": response.get("session_complete", False)
    }


@app.post("/eval/pronunciation")
async def evaluate_pronunciation(req: EvalRequest):
    """Evaluate pronunciation by comparing transcribed text to original"""
    result = await agent.evaluate_pronunciation(req.original_text, req.user_text, req.scenario)
    return result


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio using Whisper API"""
    audio_bytes = await file.read()
    result = await agent.transcribe(audio_bytes, file.filename or "audio.webm")
    return {"text": result}


@app.post("/session/{session_id}/summary")
async def get_summary(session_id: str):
    """Generate post-session summary"""
    session_data = db.get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    summary = await agent.generate_summary(session_data)
    db.save_summary(session_id, summary)
    return summary


@app.get("/scenarios")
def get_scenarios():
    """Return available scenarios"""
    return {
        "scenarios": [
            {
                "id": "coffee_shop",
                "name": "Coffee Order",
                "name_zh": "点餐",
                "description": "Practice ordering food and drinks at a café",
                "npc": "Panda Barista",
                "icon": "🐼",
                "difficulty": 1
            },
            {
                "id": "job_interview", 
                "name": "Job Interview",
                "name_zh": "面试",
                "description": "Practice answering interview questions professionally",
                "npc": "Fox HR Manager",
                "icon": "🦊",
                "difficulty": 3
            },
            {
                "id": "shopping",
                "name": "Shopping",
                "name_zh": "购物",
                "description": "Practice buying clothes, asking for sizes and prices",
                "npc": "Squirrel Shopkeeper",
                "icon": "🐿️",
                "difficulty": 1
            },
            {
                "id": "asking_directions",
                "name": "Asking Directions",
                "name_zh": "问路",
                "description": "Practice asking for and understanding directions",
                "npc": "Shiba Inu Guide",
                "icon": "🐕",
                "difficulty": 2
            },
            {
                "id": "business_meeting",
                "name": "Business Meeting",
                "name_zh": "会议",
                "description": "Practice presenting ideas and discussing in meetings",
                "npc": "Owl Professor",
                "icon": "🦉",
                "difficulty": 4
            },
            {
                "id": "travel",
                "name": "Travel",
                "name_zh": "旅游",
                "description": "Practice at airports, hotels and tourist spots",
                "npc": "Traveler Bear",
                "icon": "🧳",
                "difficulty": 2
            }
        ]
    }


@app.get("/user/stats")
def get_user_stats():
    """Get user progress statistics"""
    return db.get_stats()
