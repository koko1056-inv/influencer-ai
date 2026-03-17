"""SNS自動投稿システム - メインオーケストレーション"""

import argparse
import logging
import os
import sys
import time

import schedule

from config import LOG_DIR, SCHEDULE_TIMES
from accounts import load_accounts
from text_generator import generate_post_text
from image_generator import generate_image, generate_image_with_gemini
from buffer_client import create_post

# ログ設定
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "app.log"), encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def process_account(account: dict, theme: str = "") -> bool:
    """
    1つのアカウントに対して、テキスト生成→画像生成→Buffer投稿のフローを実行する。

    Args:
        account: アカウントのマスタデータ
        theme: 投稿テーマ

    Returns:
        成功した場合True
    """
    name = account.get("name", "不明")
    profile_ids = account.get("buffer_profile_ids", [])

    if not profile_ids:
        logger.warning(f"[{name}] Buffer Profile IDが設定されていません。スキップします。")
        return False

    logger.info(f"=== [{name}] 投稿処理開始 ===")

    # ステップ1: テキスト生成
    try:
        result = generate_post_text(account, theme)
        post_text = result["post_text"]
        image_prompt = result["image_prompt"]
        logger.info(f"[{name}] 投稿テキスト: {post_text[:80]}...")
    except Exception as e:
        logger.error(f"[{name}] テキスト生成でエラー: {e}")
        return False

    # ステップ2: 画像生成
    image_path = None
    try:
        image_path = generate_image(account, image_prompt)
        if image_path is None:
            logger.info(f"[{name}] Imagen失敗。Geminiネイティブ画像生成を試行...")
            image_path = generate_image_with_gemini(account, image_prompt)
    except Exception as e:
        logger.warning(f"[{name}] 画像生成でエラー（テキストのみで続行）: {e}")

    # ステップ3: Buffer API投稿
    try:
        result = create_post(
            profile_ids=profile_ids,
            text=post_text,
            image_path=image_path,
        )
        if result.get("success"):
            logger.info(f"[{name}] 投稿完了!")
            return True
        else:
            logger.error(f"[{name}] Buffer投稿失敗: {result}")
            return False
    except Exception as e:
        logger.error(f"[{name}] Buffer投稿でエラー: {e}")
        return False


def run_all(theme: str = ""):
    """全アカウントに対して投稿処理を実行"""
    accounts = load_accounts()
    if not accounts:
        logger.error("アカウントが見つかりません。data/accounts.json を確認してください。")
        return

    success_count = 0
    for account in accounts:
        if not account.get("enabled", True):
            logger.info(f"[{account.get('name', '不明')}] 無効化されています。スキップ。")
            continue

        success = process_account(account, theme)
        if success:
            success_count += 1
        time.sleep(2)  # API負荷を避けるため間隔を空ける

    logger.info(f"投稿完了: {success_count}/{len(accounts)} アカウント成功")


def run_single(account_id: str, theme: str = ""):
    """指定アカウントのみ投稿処理を実行"""
    from accounts import get_account

    account = get_account(account_id)
    if not account:
        logger.error(f"アカウントが見つかりません: {account_id}")
        return

    process_account(account, theme)


def start_scheduler():
    """定期実行スケジューラーを起動"""
    logger.info(f"スケジューラー起動。投稿時間: {SCHEDULE_TIMES}")

    for t in SCHEDULE_TIMES:
        schedule.every().day.at(t).do(run_all)

    while True:
        schedule.run_pending()
        time.sleep(60)


def main():
    parser = argparse.ArgumentParser(description="SNS自動投稿システム")
    subparsers = parser.add_subparsers(dest="command", help="実行コマンド")

    # 即時実行（全アカウント）
    run_parser = subparsers.add_parser("run", help="全アカウントに即時投稿")
    run_parser.add_argument("--theme", default="", help="投稿テーマ")

    # 単一アカウント実行
    single_parser = subparsers.add_parser("single", help="指定アカウントに即時投稿")
    single_parser.add_argument("account_id", help="アカウントID")
    single_parser.add_argument("--theme", default="", help="投稿テーマ")

    # スケジューラー起動
    subparsers.add_parser("schedule", help="定期実行スケジューラーを起動")

    # Bufferプロフィール一覧
    subparsers.add_parser("profiles", help="Buffer登録プロフィール一覧を表示")

    args = parser.parse_args()

    if args.command == "run":
        run_all(args.theme)
    elif args.command == "single":
        run_single(args.account_id, args.theme)
    elif args.command == "schedule":
        start_scheduler()
    elif args.command == "profiles":
        from buffer_client import get_profiles
        profiles = get_profiles()
        for p in profiles:
            print(f"  ID: {p['id']}  |  {p.get('service', '?')}  |  @{p.get('service_username', '?')}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
