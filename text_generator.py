"""Gemini APIを使った投稿テキスト生成モジュール"""

import logging
import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)


def generate_post_text(account: dict, theme: str = "") -> dict:
    """
    アカウントのペルソナ設定に基づいてSNS投稿テキストと画像生成プロンプトを生成する。

    Args:
        account: アカウントのマスタデータ
        theme: 投稿テーマ（空の場合はペルソナ設定のデフォルトテーマを使用）

    Returns:
        {"post_text": "投稿テキスト", "image_prompt": "画像生成用プロンプト"}
    """
    persona = account.get("persona", "")
    image_style = account.get("image_style", "")
    name = account.get("name", "インフルエンサー")

    system_prompt = f"""あなたは「{name}」というSNSインフルエンサーです。
以下のペルソナ設定に従って、本人が書いたような自然で魅力的なSNS投稿を作成してください。

【ペルソナ設定】
{persona}

【ルール】
- 投稿テキストはSNSに適した長さ（280文字以内）にしてください
- ハッシュタグを2〜5個含めてください
- 絵文字を適度に使用してください
- 宣伝っぽくならず、自然な語りにしてください
"""

    user_prompt = f"""以下のテーマに基づいてSNS投稿を作成してください。
また、この投稿に添える画像を生成するための英語の画像生成プロンプトも作成してください。
画像のスタイル: {image_style}

テーマ: {theme if theme else "日常の出来事や最近のトレンドから自由に"}

以下のJSON形式で出力してください（他の文字は不要）:
{{"post_text": "投稿テキスト", "image_prompt": "英語の画像生成プロンプト"}}"""

    try:
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=system_prompt,
        )
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.9,
            ),
        )

        import json
        result = json.loads(response.text)
        logger.info(f"[{name}] テキスト生成成功")
        return result

    except Exception as e:
        logger.error(f"[{name}] テキスト生成失敗: {e}")
        raise
