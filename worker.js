const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-OAI-Key, X-ANT-Key',
};

const TEMPLATES = {
  standard: `以下は会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で要約を作成してください。

【สรุปการประชุม】
（タイ語で2〜3文の概要）

ประเด็นหลักและการตัดสินใจ（主な議題・決定事項）
・
・

สิ่งที่ต้องดำเนินการ（アクションアイテム）
・

---

【会議要約】
（日本語で2〜3文の概要）

主な議題・決定事項
・
・

アクションアイテム
・`,
  oneOnOne: `以下は1on1ミーティングの文字起こしです。
タイ語と日本語の両方で要約してください。

【สรุป 1on1】
หัวข้อที่พูดคุย（話した内容）
・

ข้อตกลง（合意事項）
・

สิ่งที่ต้องติดตาม（フォローアップ）
・

---

【1on1 要約】
話した内容
・

合意事項
・

フォローアップ
・`,
  quality: `以下は品質会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で要約を作成してください。

【สรุปการประชุมคุณภาพ】
（タイ語で概要）

ปัญหา/ของเสียที่พบ（不良内容・発生状況）
・

การวิเคราะห์สาเหตุ（原因分析）
・

มาตรการแก้ไข（対策：暫定・恒久）
・

ผู้รับผิดชอบ/กำหนดเวลา（責任者・期限）
・

การขยายผลในแนวนอน（水平展開）
・

---

【品質会議要約】
（日本語で概要）

不良内容・発生状況
・

原因分析
・

対策（暫定・恒久）
・

責任者・期限
・

水平展開
・`,
  supplier: `以下はサプライヤーとの会議の文字起こしです（日本語・タイ語混在）。
タイ語と日本語の両方で、以下の形式で要約を作成してください。

【สรุปการประชุมกับ Supplier】
（タイ語で概要）

หัวข้อที่พูดคุย（議題：品質/納期/コスト）
・

คำตอบ/ข้อตกลงของ Supplier（サプライヤー側の回答・コミット）
・

ข้อเรียกร้องของเรา（こちらの要求事項）
・

การติดตามครั้งถัดไป（次回フォローアップ日）
・

---

【サプライヤー会議要約】
（日本語で概要）

議題（品質/納期/コスト）
・

サプライヤー側の回答・コミット
・

こちらの要求事項
・

次回フォローアップ日
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
