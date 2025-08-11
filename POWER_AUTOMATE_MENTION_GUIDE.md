# Power Automate メンション機能実装ガイド

## 概要
営業積算支援システムのTEAMSチャット通知にメンション機能を追加するためのPower Automate設定手順です。

## 前提条件
- 既存のPower AutomateフローがHTTPトリガーで動作している
- Microsoft Teamsでのメンション機能を使用する権限がある
- Adaptive Card形式でのメッセージ送信が可能

## 実装手順

### 1. HTTPトリガーの修正
既存のHTTPトリガーで受け取るJSONデータに以下のフィールドを追加：

```json
{
  "notificationType": "assignment",
  "title": "🎯 新しい積算依頼が割り当てられました",
  "subtitle": "営業積算支援システムからの自動通知",
  "projectName": "案件名",
  "personName": "担当者名",
  "email": "email@example.com",
  "datetime": "2025-01-15 14:30:00",
  "color": "good",
  "systemUrl": "https://ltkgmmbapafctihusddh.supabase.co",
  "actionText": "システムにログイン",
  "mentionUsers": ["user1@example.com", "user2@example.com"],
  "mentionUserNames": ["ユーザー1", "ユーザー2"]
}
```

### 2. @mentionトークン取得アクションの追加

Power Automateフローに以下のアクションを追加：

1. **「Apply to each」** コントロールを追加
   - 入力: `triggerBody()?['mentionUsers']`

2. **「ユーザーの@mentionトークンを取得する」** アクション
   - ユーザー (UPN): `item()` (Apply to eachの現在の項目)
   - 出力変数名: `mentionToken`

3. **「作成」** アクション (配列操作用)
   - 入力: 各メンショントークンを配列として収集

### 3. Adaptive Card テンプレートの修正

既存のメッセージをAdaptive Card形式に変更し、メンション機能を追加：

```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.2",
  "body": [
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['title']}",
      "weight": "Bolder",
      "size": "Medium",
      "color": "Accent"
    },
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['subtitle']}",
      "size": "Small",
      "color": "Dark",
      "spacing": "None"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "案件名:",
          "value": "@{triggerBody()?['projectName']}"
        },
        {
          "title": "担当者:",
          "value": "@{triggerBody()?['personName']}"
        },
        {
          "title": "日時:",
          "value": "@{triggerBody()?['datetime']}"
        }
      ]
    },
    {
      "type": "TextBlock",
      "text": "メンション対象: @{join(outputs('メンションユーザー名取得'), ', ')}",
      "size": "Small",
      "color": "Dark",
      "isVisible": "@{greater(length(triggerBody()?['mentionUserNames']), 0)}"
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "@{triggerBody()?['actionText']}",
      "url": "@{triggerBody()?['systemUrl']}"
    }
  ],
  "msteams": {
    "entities": "@{variables('mentionEntities')}"
  }
}
```

### 4. メンションエンティティの作成

メンション情報を含むエンティティ配列を作成：

1. **「変数を初期化する」** アクション
   - 名前: `mentionEntities`
   - 種類: 配列
   - 値: `[]`

2. **「Apply to each」** (メンション用)
   - 入力: `triggerBody()?['mentionUsers']`

3. 各ループ内で **「配列変数に追加」** アクション:
```json
{
  "type": "mention",
  "text": "<at>@{items('Apply_to_each_2')}</at>",
  "mentioned": {
    "id": "@{items('Apply_to_each_2')}",
    "name": "@{items('Apply_to_each_2')}"
  }
}
```

### 5. Teamsチャンネルへの投稿

**「チャット メッセージまたはチャンネル メッセージを投稿する」** アクション:
- Team: 対象チーム
- Channel: 対象チャンネル
- Message: Adaptive Card JSON
- Post as: Flow bot

## 動作確認

### テスト用データ
```json
{
  "notificationType": "assignment",
  "title": "🎯 テスト：新しい積算依頼が割り当てられました",
  "subtitle": "営業積算支援システムからの自動通知",
  "projectName": "テスト案件",
  "personName": "テスト担当者",
  "email": "test@example.com",
  "datetime": "2025-01-15 14:30:00",
  "color": "good",
  "systemUrl": "https://ltkgmmbapafctihusddh.supabase.co",
  "actionText": "システムにログイン",
  "mentionUsers": ["mention-user@example.com"],
  "mentionUserNames": ["メンションユーザー"]
}
```

## 注意事項

1. **権限要件**
   - メンション対象ユーザーは同じTeamsテナント内である必要があります
   - Power AutomateにTeamsでのメンション権限が必要です

2. **制限事項**
   - 一度に大量のユーザーをメンションするとパフォーマンスに影響する可能性があります
   - メンション対象ユーザーのメールアドレスが正確である必要があります

3. **エラーハンドリング**
   - 無効なメールアドレスの場合のフォールバック処理を実装してください
   - ネットワークエラー時の再試行機能を検討してください

## トラブルシューティング

### よくある問題
1. **メンションが表示されない**
   - ユーザーのメールアドレスが正しいか確認
   - msteamsエンティティが正しく設定されているか確認

2. **Adaptive Cardが表示されない**
   - JSON形式が正しいか確認
   - 必須フィールドが全て含まれているか確認

3. **権限エラー**
   - Power Automateの実行アカウントにTeams投稿権限があるか確認
   - 対象チャンネル・チームへのアクセス権限があるか確認