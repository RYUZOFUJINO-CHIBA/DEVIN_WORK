# Python 3.11 の公式 Slim イメージを使用
FROM python:3.11-slim

# 作業ディレクトリの作成
WORKDIR /app

# requirements.txt をコピーしてインストール
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY . .

# ポート 8080 を使用
EXPOSE 8080

# サーバー起動コマンド
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

