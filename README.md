# SNS自動投稿システム（インフルエンサーAI）

Gemini APIでテキスト・画像を自動生成し、Buffer API経由でSNS（X, Instagram等）へ自動投稿するシステムです。
アカウントごとにペルソナ（キャラクター）を設定し、そのインフルエンサーらしい投稿を自動生成します。

## ディレクトリ構成

```
インフルエンサーAI/
├── main.py              # メイン実行スクリプト
├── config.py            # 設定管理
├── accounts.py          # アカウント（マスタデータ）管理
├── text_generator.py    # Gemini APIテキスト生成
├── image_generator.py   # Imagen / Gemini 画像生成
├── buffer_client.py     # Buffer API連携
├── requirements.txt     # Python依存パッケージ
├── .env.example         # 環境変数テンプレート
├── data/
│   └── accounts.json    # アカウント設定（マスタデータ）
├── output/              # 生成画像の一時保存
└── logs/                # 実行ログ
```

## セットアップ

### 1. 依存パッケージのインストール
```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定
```bash
cp .env.example .env
```
`.env` ファイルを編集し、APIキーを設定:
- `GEMINI_API_KEY`: Google Generative AI (Gemini) のAPIキー
- `BUFFER_ACCESS_TOKEN`: Buffer APIのアクセストークン

### 3. アカウント設定
`data/accounts.json` を編集し、インフルエンサー情報を設定:
- `buffer_profile_ids`: Bufferに登録したSNSプロフィールのID
- `persona`: 口調・性格・発信テーマなどのペルソナ設定
- `image_style`: 画像生成時のスタイル指定

Buffer Profile IDは以下のコマンドで確認できます:
```bash
python main.py profiles
```

## 使い方

### 全アカウント即時投稿
```bash
python main.py run
python main.py run --theme "春のおすすめスポット"
```

### 特定アカウントのみ投稿
```bash
python main.py single influencer_01
python main.py single influencer_01 --theme "新作コスメ"
```

### 定期自動投稿（スケジューラー）
```bash
python main.py schedule
```
デフォルトで毎日 9:00 / 12:00 / 18:00 に全アカウントへ投稿します。
`config.py` の `SCHEDULE_TIMES` で変更可能です。

## 処理フロー

1. **アカウント情報取得** - `accounts.json` からペルソナ・スタイル設定を読み込み
2. **テキスト生成** - Gemini APIでペルソナに沿ったSNS投稿文＋画像プロンプトを生成
3. **画像生成** - Imagen API（またはGeminiネイティブ）で画像を生成
4. **Buffer投稿** - テキスト＋画像をBuffer API経由でSNSに投稿

## 注意事項
- APIキーは `.env` ファイルで管理し、絶対にソースコードにハードコードしないでください
- 画像生成AIの特性上、同じキャラクターでも顔が毎回微妙に変化します
- セーフティフィルターに引っかかった場合、テキストのみの投稿にフォールバックします
