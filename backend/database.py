"""
SpeakForest Database - SQLite
Handles session storage, user stats, conversation history
"""

import sqlite3
import json
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "speakforest.db"


class Database:
    def __init__(self):
        self.init_db()

    def get_conn(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    scenario TEXT NOT NULL,
                    user_name TEXT DEFAULT 'Player',
                    created_at REAL DEFAULT (unixepoch()),
                    summary TEXT
                );

                CREATE TABLE IF NOT EXISTS turns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    grammar_feedback TEXT,
                    timestamp REAL DEFAULT (unixepoch()),
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                );

                CREATE TABLE IF NOT EXISTS user_stats (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    level INTEGER DEFAULT 1,
                    xp INTEGER DEFAULT 0,
                    coins INTEGER DEFAULT 100,
                    total_sessions INTEGER DEFAULT 0,
                    total_turns INTEGER DEFAULT 0,
                    streak_days INTEGER DEFAULT 0,
                    last_session_date TEXT
                );

                INSERT OR IGNORE INTO user_stats (id, level, xp, coins) VALUES (1, 1, 0, 100);
            """)

    def create_session(self, session_id: str, scenario: str, user_name: str = "Player"):
        with self.get_conn() as conn:
            conn.execute(
                "INSERT INTO sessions (id, scenario, user_name) VALUES (?, ?, ?)",
                (session_id, scenario, user_name)
            )

    def add_turn(self, session_id: str, user_msg: str, ai_reply: str, grammar: dict):
        with self.get_conn() as conn:
            # User turn
            conn.execute(
                "INSERT INTO turns (session_id, role, content, grammar_feedback) VALUES (?, ?, ?, ?)",
                (session_id, "user", user_msg, json.dumps(grammar))
            )
            # AI turn
            conn.execute(
                "INSERT INTO turns (session_id, role, content) VALUES (?, ?, ?)",
                (session_id, "assistant", ai_reply)
            )
            # Update stats
            conn.execute(
                "UPDATE user_stats SET total_turns = total_turns + 1 WHERE id = 1"
            )

    def get_session(self, session_id: str) -> dict:
        with self.get_conn() as conn:
            session = conn.execute(
                "SELECT * FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()
            
            if not session:
                return None
            
            turns = conn.execute(
                "SELECT role, content, grammar_feedback FROM turns WHERE session_id = ? ORDER BY id",
                (session_id,)
            ).fetchall()
            
            return {
                "id": session["id"],
                "scenario": session["scenario"],
                "user_name": session["user_name"],
                "turns": [
                    {
                        "role": t["role"],
                        "content": t["content"],
                        "grammar": json.loads(t["grammar_feedback"]) if t["grammar_feedback"] else None
                    }
                    for t in turns
                ]
            }

    def save_summary(self, session_id: str, summary: dict):
        with self.get_conn() as conn:
            conn.execute(
                "UPDATE sessions SET summary = ? WHERE id = ?",
                (json.dumps(summary), session_id)
            )
            xp = summary.get("xp_earned", 30)
            conn.execute(
                """UPDATE user_stats SET 
                   xp = xp + ?,
                   total_sessions = total_sessions + 1,
                   coins = coins + ?,
                   last_session_date = date('now')
                   WHERE id = 1""",
                (xp, xp // 3)
            )
            # Level up check (every 200 XP)
            conn.execute("""
                UPDATE user_stats 
                SET level = (xp / 200) + 1
                WHERE id = 1
            """)

    def get_stats(self) -> dict:
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM user_stats WHERE id = 1").fetchone()
            if not row:
                return {"level": 1, "xp": 0, "coins": 100, "total_sessions": 0}
            return dict(row)
