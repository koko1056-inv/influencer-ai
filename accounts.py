"""アカウント（インフルエンサー）マスタデータ管理モジュール"""

import json
import os
import logging
from config import ACCOUNTS_FILE

logger = logging.getLogger(__name__)


def load_accounts() -> list[dict]:
    """accounts.json からアカウント一覧を読み込む"""
    if not os.path.exists(ACCOUNTS_FILE):
        logger.error(f"アカウント設定ファイルが見つかりません: {ACCOUNTS_FILE}")
        return []

    with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
        accounts = json.load(f)

    logger.info(f"{len(accounts)} 件のアカウントを読み込みました")
    return accounts


def get_account(account_id: str) -> dict | None:
    """指定IDのアカウント情報を取得"""
    accounts = load_accounts()
    for account in accounts:
        if account.get("id") == account_id:
            return account
    logger.warning(f"アカウントが見つかりません: {account_id}")
    return None
