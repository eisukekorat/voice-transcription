const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-OAI-Key, X-ANT-Key',
};

const TEMPLATES = {
  understand: `以下は会議の文字起こしです（タイ語・日本語混在の場合あり）。
自分が会議の内容を理解するための要約を日本語で作成してください。
以下の方針で詳細に要約してください：
・会議の流れを時系列に沿って説明する
・誰が何についてどういう主張や発言をしたか、できる限り拾う
・決定に至った経緯や背景、議論の流れも説明する
・タイ語の専門用語や独特な表現があれば、日本語で意味を補足する
・議論の温度感（意見の対立・強い主張・合意の雰囲気など）があれば記載する
・具体的な数値・品名・日付・人名が出た場合は必ず含める

【会議内容の理解】

全体の概要
・

議論の流れ（時系列）
・

重要なポイント・各者の発言
・

決定事項（理由・経緯も含む）
・

未決事項
・

アクションアイテム
・`,

  quality: `以下は品質会議の文字起こしです（日本語・タイ語混在の場合あり）。
タイ語と日本語の両方で、以下の形式で詳細に要約を作成してください。
この要約は是正処置報告書（CAR）の作成に使用します。
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

  minutes: `以下は会議の文字起こしです（日本語・タイ語混在の場合あり）。
メールで関係者に共有するための議事録を作成してください。
タイ語と日本語の両方で、以下の形式で詳細に作成してください。
具体的な数値・日付・固有名詞が出た場合は必ず含めてください。
会話中に言及された人名・会社名はそのまま（音声認識のままの表記で）記載してください。

【รายงานการประชุม】

ภาพรวม（概要・目的・相手先）
・

หัวข้อที่พูดคุย（議題ごとの詳細）
・

ความเห็นและมุมมองของแต่ละฝ่าย（各者の発言・見解）
・

การตัดสินใจ/ข้อตกลง（決定事項・合意内容）
・

ข้อผูกมัดและกำหนดเวลา（コミット・約束内容・期限）
・

ประเด็นที่ยังไม่ได้ข้อสรุป（未解決事項）
・

สิ่งที่ต้องดำเนินการ（アクションアイテム・担当・期限）
・

การติดตามครั้งถัดไป（次回フォローアップ）
・

---

【議事録】

概要（目的・相手先）
・

議題ごとの詳細
・

各者の発言・見解
・

決定事項・合意内容
・

コミット・約束内容（期限含む）
・

未解決事項
・

アクションアイテム（担当・期限）
・

次回フォローアップ
・`,

  brief: `以下は会議の文字起こしです。タイ語と日本語で、箇条書きで簡潔にまとめてください。要点を3〜5点に絞ってください。

【สรุปสั้นๆ】
・

---

【簡易メモ】
・`
};

async function callClaude(antKey, prompt) {
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': antKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeRes.ok) {
    let msg = 'Claudeエラー: ' + claudeRes.status;
    try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  return await claudeRes.json();
}

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

    if (url.pathname === '/summarize' && request.method === 'POST') {
      try {
        return await handleSummarize(request, env);
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
  const template = formData.get('template') || 'understand';

  const oaiKey = env.OAI_KEY || request.headers.get('X-OAI-Key');
  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');

  if (!oaiKey || !antKey) {
    return jsonResponse({ error: 'APIキーが設定されていません' }, 400);
  }
  if (!audioFile) {
    return jsonResponse({ error: '音声ファイルがありません' }, 400);
  }

  // Step 1: Whisper
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

  // Step 2: Claude
  const promptTemplate = TEMPLATES[template] || TEMPLATES['understand'];
  const prompt = promptTemplate + '\n\n---文字起こし---\n' + whisperData.text;
  const claudeData = await callClaude(antKey, prompt);

  return jsonResponse({
    transcript: whisperData.text,
    segments: whisperData.segments || [],
    duration: whisperData.duration || 0,
    summary: claudeData.content[0].text,
    usage: claudeData.usage,
  });
}

async function handleSummarize(request, env) {
  const body = await request.json();
  const { text, template } = body;

  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');
  if (!antKey) {
    return jsonResponse({ error: 'Anthropic APIキーが設定されていません' }, 400);
  }
  if (!text) {
    return jsonResponse({ error: 'テキストがありません' }, 400);
  }

  const promptTemplate = TEMPLATES[template] || TEMPLATES['understand'];
  const prompt = promptTemplate + '\n\n---文字起こし---\n' + text;
  const claudeData = await callClaude(antKey, prompt);

  return jsonResponse({
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
