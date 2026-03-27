const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-OAI-Key, X-ANT-Key',
};

const TEMPLATES = {
  quality: `以下は品質会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
具体的な数値・品名・ロット番号・日付が出た場合は必ず含めてください。
会話中に言及された人名はそのまま（音声認識のままの表記で）記載してください。

【สรุปการประชุมคุณภาพ】

ภาพรวม（概要）
・

ปัญหา/ของเสียที่พบ（不良内容・発生状況・件数・品名・ロット）
・

การวิเคราะห์สาเหตุ（原因分析・議論の経緯も含む）
・

มาตรการแก้ไขชั่วคราว（暫定対策・内容・実施時期）
・

มาตรการแก้ไขถาวร（恒久対策・内容・実施時期）
・

การขยายผลในแนวนอน（水平展開・対象範囲）
・

ผู้รับผิดชอบและกำหนดเวลา（責任者・期限）
・

สถานะ CAR / การดำเนินการแก้ไข（CARステータス・是正処置状況）
・

ประเด็นค้างและการติดตาม（未決事項・次回確認）
・

---

【品質会議要約】

概要
・

不良内容・発生状況（品名・ロット・件数など）
・

原因分析（議論の経緯も含む）
・

暫定対策（内容・実施時期）
・

恒久対策（内容・実施時期）
・

水平展開（対象範囲）
・

責任者・期限
・

CARステータス・是正処置状況
・

未決事項・次回確認
・`,

  standard: `以下は定例会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
具体的な数値・日付・固有名詞が出た場合は必ず含めてください。
会話中に言及された人名はそのまま（音声認識のままの表記で）記載してください。

【สรุปการประชุมประจำ】

ภาพรวม（概要）
・

รายงานของแต่ละแผนก（各部門・担当からの報告内容）
・

ประเด็นที่หารือ（議論・意見交換の内容）
・

การตัดสินใจ（決定事項）
・

ประเด็นที่ยังไม่ได้ข้อสรุป（未決事項・持ち越し）
・

สิ่งที่ต้องดำเนินการ（アクションアイテム・担当・期限）
・

---

【定例会議要約】

概要
・

各部門・担当からの報告内容
・

議論・意見交換の内容
・

決定事項
・

未決事項・持ち越し
・

アクションアイテム（担当・期限）
・`,

  supplier: `以下はサプライヤーとの会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
具体的な数値・品名・日付・コミット内容が出た場合は必ず含めてください。
会話中に言及された人名・会社名はそのまま（音声認識のままの表記で）記載してください。

【สรุปการประชุมกับ Supplier】

ภาพรวม（概要・訪問先・目的）
・

หัวข้อที่พูดคุย（議題ごとの詳細）
　品質：
　納期：
　コスト：
　その他：

คำอธิบาย/มุมมองของ Supplier（サプライヤー側の説明・見解）
・

ข้อตกลง/ข้อผูกมัดของ Supplier（サプライヤー側のコミット・約束内容）
・

ข้อเรียกร้องและเงื่อนไขของเรา（こちらの要求事項・条件）
・

ประเด็นที่ยังต้องติดตาม（未解決事項）
・

การติดตามครั้งถัดไป（次回フォローアップ日・方法）
・

---

【サプライヤー会議要約】

概要（訪問先・目的）
・

議題ごとの詳細
　品質：
　納期：
　コスト：
　その他：

サプライヤー側の説明・見解
・

サプライヤー側のコミット・約束内容
・

こちらの要求事項・条件
・

未解決事項
・

次回フォローアップ日・方法
・`,

  customer: `以下はお客様との会議・クレーム対応の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
具体的な数値・品名・クレーム内容・約束事項が出た場合は必ず含めてください。
会話中に言及された人名・会社名はそのまま（音声認識のままの表記で）記載してください。

【สรุปการประชุมกับลูกค้า】

ภาพรวม（概要・目的・形式：対面/Web会議など）
・

ข้อร้องเรียน/ความต้องการของลูกค้า（お客様からの指摘・クレーム・要望の詳細）
・

คำอธิบายจากฝ่ายเรา（こちらの説明・回答内容）
・

การวิเคราะห์สาเหตุที่นำเสนอ（提示した原因分析）
・

มาตรการแก้ไขที่นำเสนอ（提示した対策・再発防止策）
・

ข้อผูกมัด/คำสัญญาต่อลูกค้า（お客様への約束・コミット内容・期限）
・

ประเด็นที่ต้องดำเนินการภายใน（社内での追加対応が必要な事項）
・

การติดตามครั้งถัดไป（次回フォローアップ・報告期限）
・

---

【お客様対応要約】

概要（目的・形式：対面/Web会議など）
・

お客様からの指摘・クレーム・要望の詳細
・

こちらの説明・回答内容
・

提示した原因分析
・

提示した対策・再発防止策
・

お客様への約束・コミット内容（期限含む）
・

社内での追加対応が必要な事項
・

次回フォローアップ・報告期限
・`,

  oneOnOne: `以下は1on1ミーティングの文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
会話中に言及された人名はそのまま（音声認識のままの表記で）記載してください。

【สรุป 1on1】

ภาพรวม（概要）
・

หัวข้อที่พูดคุยโดยละเอียด（話した内容の詳細）
・

ความคิดเห็น/ความกังวลของอีกฝ่าย（相手の意見・懸念・状況）
・

ข้อตกลงและแผนการดำเนินการ（合意事項・対応方針）
・

สิ่งที่ต้องติดตาม（フォローアップ・次回確認事項）
・

---

【1on1 要約】

概要
・

話した内容の詳細
・

相手の意見・懸念・状況
・

合意事項・対応方針
・

フォローアップ・次回確認事項
・`,

  brief: `以下は会議の文字起こしです。タイ語と日本語で、箇条書きで簡潔にまとめてください。要点を3〜5点に絞ってください。

【สรุปสั้นๆ】
・

---

【簡易メモ】
・`
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        return await handleProcess(request, env);
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleProcess(request, env) {
  const formData = await request.formData();
  const audioFile = formData.get('audio');
  const language = formData.get('language') || '';
  const template = formData.get('template') || 'standard';

  // APIキー: Workerのシークレット優先、なければリクエストヘッダーから取得
  const oaiKey = env.OAI_KEY || request.headers.get('X-OAI-Key');
  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');

  if (!oaiKey || !antKey) {
    return jsonResponse({ error: 'APIキーが設定されていません' }, 400);
  }
  if (!audioFile) {
    return jsonResponse({ error: '音声ファイルがありません' }, 400);
  }

  // Step 1: Whisper文字起こし
  const whisperForm = new FormData();
  whisperForm.append('file', audioFile);
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('response_format', 'verbose_json');
  if (language) whisperForm.append('language', language);

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + oaiKey },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    let msg = 'Whisperエラー: ' + whisperRes.status;
    try { const e = await whisperRes.json(); msg = e.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const whisperData = await whisperRes.json();

  // Step 2: Claude要約
  const promptTemplate = TEMPLATES[template] || TEMPLATES['standard'];
  const prompt = promptTemplate + '\n\n---文字起こし---\n' + whisperData.text;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': antKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeRes.ok) {
    let msg = 'Claudeエラー: ' + claudeRes.status;
    try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const claudeData = await claudeRes.json();

  return jsonResponse({
    transcript: whisperData.text,
    segments: whisperData.segments || [],
    duration: whisperData.duration || 0,
    summary: claudeData.content[0].text,
    usage: claudeData.usage,
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
