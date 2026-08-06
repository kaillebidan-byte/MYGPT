# Setup

## 1. Custom GPTを作成する

GPT Builderで新しいGPTを作成し、画像生成機能を有効にします。

このプロジェクトの自動品質監査を使う場合は、`actions/github-audit-openapi.yaml`をActionsへ追加します。画像生成だけを試す場合はActionなしでも動作しますが、監査は実行されません。

Action追加後も、機能欄の「画像生成」が有効になっていることを再確認します。Actionsを使うため、Proモードは選びません。

「コードインタープリターとデータ分析」はOFFにします。このプロジェクトでは画像をPythonや内部ファイルとして作成せず、組み込み画像生成機能だけを使います。これにより、完成画像の代わりに`/mnt/data/...`のような内部パスだけが返る誤動作を避けます。

## 2. Knowledgeへアップロードする

次の3ファイルをKnowledgeへアップロードします。

- `knowledge/hatch-pet-mygpt.md`
- `knowledge/pet-state-list.md`
- `knowledge/pet-output-spec.md`

OpenAI公式の生の`hatch-pet-SKILL.md`は同時に入れません。Codex専用の命令がCustom GPTの画像生成と競合する可能性があるためです。

## 3. Instructionsを設定する

`instructions/mygpt-instructions.md`の本文を、GPT BuilderのInstructions欄へ貼り付けます。

GitHub上のInstructionsを更新しても、GPT Builder内のInstructionsは自動更新されません。リポジトリを更新した後は、GPT Builderの内容を全文置き換え、GPTを保存または更新します。

設定変更後は、以前の会話を続けず新しいプレビューチャットを開始します。

## 4. Actionを設定する

1. `actions/github-audit-openapi.yaml`をActionsへ読み込みます。
2. AuthenticationはAPI Keyを選びます。
3. Auth typeはBearerにします。
4. `MYGPT`リポジトリだけを対象にしたGitHub fine-grained personal access tokenを登録します。
5. Repository permissionsは次の通りです。

- Contents: Read and write
- Actions: Read-only
- Issues: Read-only
- Metadata: Read-only（自動付与）

## 5. テンプレートを使う

`assets/sprite-template-8x9.svg`は次の仕様です。

- 1536 × 1872 px
- 8列 × 9行
- 1セル 192 × 208 px
- 透明背景

テンプレートはKnowledgeへ置くより、複数状態を生成するときに基準キャラクター画像と一緒に会話へ添付する方が確実です。

テンプレートは配置だけの基準です。最終画像には枠線を残さないよう指示します。

## 6. 画像生成だけを切り分けて試す

Actionとの連携を試す前に、新しいプレビューチャットで次を送ります。

```text
透明背景に赤い丸を1枚生成して。この試験では監査Actionを呼ばない。
```

この段階では、CAASパス、ローカルパス、GitHub、Google Drive、ファイルIDは不要です。

画像が生成されれば、画像生成機能は正常です。画像を生成せず「画像生成機能へアクセスできない」「CAASパス付きの画像を返せない」などと返した場合は、次を確認します。

- GPT Builderの画像生成機能が有効か
- 「コードインタープリターとデータ分析」がOFFか
- 最新の`instructions/mygpt-instructions.md`を貼り直したか
- GPTを保存または更新したか
- 設定変更後に新しいチャットを開始したか
- Actionsを利用できないProモードを選んでいないか

画像生成だけの試験が成功してから、自動監査付き生成を試します。

## 7. 生成と監査をまとめて試す

新しいチャットで基準画像を添付し、単一状態から試します。

```text
添付画像を唯一のデザイン正本として、このキャラクターが小さく手を振る8フレームの横一列ループアニメーションを生成して。背景は完全透過。画像生成が完了した後、その生成画像を品質監査へ渡して。
```

次にテンプレートも添付し、2〜4状態をまとめて試します。

```text
1枚目をキャラクターの正本、2枚目を配置テンプレートとして使って。
1行目にsearching、2行目にvalidating、3行目にconfused、4行目にcompletedを配置して。
各行8フレームの独立した自然なループ。残りの行は透過のまま。テンプレートの枠線は最終画像へ残さない。
画像生成が完了した後、その生成画像を品質監査へ渡して。
```

## 8. 修正

一部だけ崩れた場合は、対象行を指定します。

```text
2行目のvalidatingだけ修正して。左右の画面を見比べ、最後に小さくうなずく動作にする。ほかの行、キャラクターデザイン、セル寸法、足元位置は維持して。
```

## 運用上の目安

- 一括生成は2〜4状態から始める。
- 9状態一括は可能だが、顔、縮尺、セル位置のぶれが増える場合がある。
- 文字は崩れやすいため、札は無地で生成して後から文字を入れる方法も使う。
- 別チャットでは基準画像を再添付する。
