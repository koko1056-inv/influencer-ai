"""設定管理モジュール"""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BUFFER_ACCESS_TOKEN = os.getenv("BUFFER_ACCESS_TOKEN")

# パス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
LOG_DIR = os.path.join(BASE_DIR, "logs")
ACCOUNTS_FILE = os.path.join(DATA_DIR, "accounts.json")

# Gemini モデル設定
GEMINI_MODEL = "gemini-2.0-flash"
IMAGEN_MODEL = "imagen-3.0-generate-002"

# Buffer API
BUFFER_API_BASE = "https://api.bufferapp.com/1"

# スケジュール設定（毎日の投稿時間）
SCHEDULE_TIMES = ["09:00", "12:00", "18:00"]
