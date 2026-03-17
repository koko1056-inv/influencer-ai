"""Gemini / Imagen APIを使った画像生成モジュール"""

import base64
import logging
import os
import time
from io import BytesIO

from PIL import Image
import google.generativeai as genai
from config import GEMINI_API_KEY, IMAGEN_MODEL, OUTPUT_DIR

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)


def generate_image(account: dict, image_prompt: str) -> str | None:
    """
    画像生成プロンプトとアカウント設定に基づいて画像を生成し、ファイルパスを返す。

    Args:
        account: アカウントのマスタデータ（ベース画像やスタイル情報を含む）
        image_prompt: 画像生成用プロンプト

    Returns:
        生成された画像のファイルパス（失敗時はNone）
    """
    name = account.get("name", "unknown")
    image_style = account.get("image_style", "")
    base_image_url = account.get("base_image_url", "")

    # スタイル指示を付加した最終プロンプト
    full_prompt = f"{image_prompt}, style: {image_style}" if image_style else image_prompt

    try:
        imagen = genai.ImageGenerationModel(IMAGEN_MODEL)
        result = imagen.generate_images(
            prompt=full_prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            safety_filter_level="block_only_high",
        )

        if not result.images:
            logger.warning(f"[{name}] 画像が生成されませんでした（セーフティフィルタの可能性）")
            return None

        # 画像を保存
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        timestamp = int(time.time())
        file_path = os.path.join(OUTPUT_DIR, f"{name}_{timestamp}.png")

        image_data = result.images[0]._pil_image
        image_data.save(file_path)
        logger.info(f"[{name}] 画像生成成功: {file_path}")
        return file_path

    except Exception as e:
        logger.error(f"[{name}] 画像生成失敗: {e}")
        return None


def generate_image_with_gemini(account: dict, image_prompt: str) -> str | None:
    """
    Gemini のネイティブ画像生成機能を使って画像を生成する（Imagen が利用できない場合の代替）。

    Args:
        account: アカウントのマスタデータ
        image_prompt: 画像生成用プロンプト

    Returns:
        生成された画像のファイルパス（失敗時はNone）
    """
    name = account.get("name", "unknown")
    image_style = account.get("image_style", "")

    full_prompt = f"Generate an image: {image_prompt}. Style: {image_style}" if image_style else f"Generate an image: {image_prompt}"

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                response_modalities=["image", "text"],
            ),
        )

        # レスポンスから画像パートを探す
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data.mime_type.startswith("image/"):
                image_bytes = base64.b64decode(part.inline_data.data)
                image = Image.open(BytesIO(image_bytes))

                os.makedirs(OUTPUT_DIR, exist_ok=True)
                timestamp = int(time.time())
                file_path = os.path.join(OUTPUT_DIR, f"{name}_{timestamp}.png")
                image.save(file_path)
                logger.info(f"[{name}] Gemini画像生成成功: {file_path}")
                return file_path

        logger.warning(f"[{name}] Geminiレスポンスに画像が含まれていません")
        return None

    except Exception as e:
        logger.error(f"[{name}] Gemini画像生成失敗: {e}")
        return None
