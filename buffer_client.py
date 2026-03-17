"""Buffer API連携モジュール"""

import logging
import time
import requests
from config import BUFFER_ACCESS_TOKEN, BUFFER_API_BASE

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 5  # 秒


def _request_with_retry(method: str, url: str, **kwargs) -> requests.Response:
    """リトライ付きHTTPリクエスト"""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.request(method, url, timeout=30, **kwargs)

            if response.status_code == 429:
                wait = RETRY_DELAY * (attempt + 1)
                logger.warning(f"レートリミット到達。{wait}秒後にリトライ ({attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue

            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            if attempt < MAX_RETRIES - 1:
                logger.warning(f"リクエスト失敗。リトライ ({attempt + 1}/{MAX_RETRIES}): {e}")
                time.sleep(RETRY_DELAY)
            else:
                raise

    raise requests.exceptions.RequestException(f"{MAX_RETRIES}回リトライしましたが失敗しました")


def get_profiles() -> list[dict]:
    """Buffer に登録されている全プロフィール（SNSアカウント）を取得"""
    url = f"{BUFFER_API_BASE}/profiles.json"
    params = {"access_token": BUFFER_ACCESS_TOKEN}
    response = _request_with_retry("GET", url, params=params)
    return response.json()


def create_post(
    profile_ids: list[str],
    text: str,
    image_path: str | None = None,
    scheduled_at: str | None = None,
) -> dict:
    """
    Buffer API経由でSNS投稿を作成する。

    Args:
        profile_ids: 投稿先のBuffer Profile IDリスト
        text: 投稿テキスト
        image_path: 画像ファイルパス（なければテキストのみ投稿）
        scheduled_at: 予約投稿時間（ISO 8601形式）。Noneなら即時投稿（Bufferキューに追加）

    Returns:
        Buffer APIのレスポンス
    """
    url = f"{BUFFER_API_BASE}/updates/create.json"

    data = {
        "access_token": BUFFER_ACCESS_TOKEN,
        "text": text,
        "profile_ids[]": profile_ids,
        "now": "true" if not scheduled_at else "false",
    }

    if scheduled_at:
        data["scheduled_at"] = scheduled_at

    files = None
    if image_path:
        try:
            files = {"media[photo]": open(image_path, "rb")}
        except FileNotFoundError:
            logger.warning(f"画像ファイルが見つかりません: {image_path}。テキストのみで投稿します。")

    try:
        response = _request_with_retry("POST", url, data=data, files=files)
        result = response.json()

        if result.get("success"):
            logger.info(f"投稿成功: {text[:50]}...")
        else:
            logger.error(f"投稿失敗: {result}")

        return result

    finally:
        if files:
            for f in files.values():
                f.close()
