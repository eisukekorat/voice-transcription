const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-GEM-Key, X-ANT-Key',
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

// ArrayBuffer を base64 文字列に変換（Cloudflare Workers 対応）
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

// Gemini で音声を文字起こし
async function transcribeWithGemini(audioFile, gemKey, language) {
  const MAX_INLINE = 20 * 1024 * 1024;

  let langInstruction = '';
  if (!language || language === '') {
    langInstruction = '日本語とタイ語が混在しています。日本語はひらがな・カタカナ・漢字で、タイ語はタイ文字で文字起こしをしてください。';
  } else if (language === 'ja') {
    langInstruction = '音声は日本語です。';
  } else if (language === 'th') {
    langInstruction = '音声はタイ語です。タイ文字で文字起こしをしてください。';
  } else if (language === 'en') {
    langInstruction = 'The audio is in English.';
  }

  const prompt = `この音声ファイルを正確に文字起こしをしてください。${langInstruction}句読点や改行を適切に入れてください。タイムスタンプは不要です。文字起こしの内容のみを出力してください。`;
  const mimeType = audioFile.type || 'audio/webm';

  let requestBody;

  if (audioFile.size <= MAX_INLINE) {
    // 小さいファイル: base64 インライン送信
    const arrayBuf = await audioFile.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuf);
    requestBody = {
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]}]
    };
  } else {
    // 大きいファイル: Gemini File API 経由
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${gemKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(audioFile.size),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { display_name: audioFile.name } }),
      }
    );
    if (!initRes.ok) {
      let m = 'Gemini File APIエラー: ' + initRes.status;
      try { const e = await initRes.json(); m = e.error?.message || m; } catch {}
      throw new Error(m);
    }
    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error('Gemini File APIのアップロードURLが取得できませんでした');

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
        'Content-Type': mimeType,
      },
      body: audioFile,
    });
    if (!uploadRes.ok) {
      let m = 'Geminiアップロードエラー: ' + uploadRes.status;
      try { const e = await uploadRes.json(); m = e.error?.message || m; } catch {}
      throw new Error(m);
    }
    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;
    if (!fileUri) throw new Error('Gemini File APIのファイルURIが取得できませんでした');

    // ファイルが ACTIVE になるまで待機（最大 30 秒）
    let fileState = uploadData.file?.state || 'PROCESSING';
    if (fileState !== 'ACTIVE') {
      for (let i = 0; i < 10 && fileState !== 'ACTIVE'; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const stateRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/files/${uploadData.file.name}?key=${gemKey}`
        );
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          fileState = stateData.state || fileState;
        }
      }
      if (fileState !== 'ACTIVE') throw new Error('Gemini ファイル処理タイムアウト');
    }

    requestBody = {
      contents: [{ parts: [
        { text: prompt },
        { file_data: { mime_type: mimeType, file_uri: fileUri } }
      ]}]
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );
  if (!res.ok) {
    let m = 'Geminiエラー: ' + res.status;
    try { const e = await res.json(); m = e.error?.message || m; } catch {}
    throw new Error(m);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const geminiUsage = data.usageMetadata || {};
  return { text, geminiUsage };
}

// Claude で要約
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
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/submit' && request.method === 'POST') {
      try { return await handleSubmit(request, env, ctx); }
      catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    if (url.pathname.startsWith('/poll/') && request.method === 'GET') {
      return handlePoll(url.pathname.slice(6), env);
    }

    if (url.pathname === '/process' && request.method === 'POST') {
      try { return await handleProcess(request, env); }
      catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    if (url.pathname === '/summarize' && request.method === 'POST') {
      try { return await handleSummarize(request, env); }
      catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    return new Response('Not Found', { status: 404 });
  }
};

// --- ジョブキュー（非同期・バックグラウンド処理） ---

async function handleSubmit(request, env, ctx) {
  const formData = await request.formData();
  const audioFile = formData.get('audio');
  const language = formData.get('language') || '';
  const template = formData.get('template') || 'understand';

  const gemKey = env.GEM_KEY || request.headers.get('X-GEM-Key');
  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');

  if (!gemKey || !antKey) return jsonResponse({ error: 'APIキーが設定されていません' }, 400);
  if (!audioFile) return jsonResponse({ error: '音声ファイルがありません' }, 400);

  // KV 未設定時は同期処理にフォールバック
  if (!env.KV_JOBS) {
    return handleProcessFromData(audioFile, language, template, gemKey, antKey);
  }

  const jobId = crypto.randomUUID();
  const audioData = await audioFile.arrayBuffer();
  const audioBlob = new File([audioData], audioFile.name, { type: audioFile.type || 'audio/webm' });

  await env.KV_JOBS.put(jobId, JSON.stringify({ status: 'processing' }), { expirationTtl: 86400 });
  ctx.waitUntil(processJobAsync(env, jobId, audioBlob, gemKey, antKey, language, template));

  return jsonResponse({ jobId });
}

async function processJobAsync(env, jobId, audioFile, gemKey, antKey, language, template) {
  try {
    const { text, geminiUsage } = await transcribeWithGemini(audioFile, gemKey, language);

    await env.KV_JOBS.put(jobId, JSON.stringify({
      status: 'summarizing',
      transcript: text,
    }), { expirationTtl: 86400 });

    const promptTemplate = TEMPLATES[template] || TEMPLATES['understand'];
    const prompt = promptTemplate + '\n\n---文字起こし---\n' + text;
    const claudeData = await callClaude(antKey, prompt);

    await env.KV_JOBS.put(jobId, JSON.stringify({
      status: 'done',
      transcript: text,
      summary: claudeData.content[0].text,
      geminiUsage,
      usage: claudeData.usage,
    }), { expirationTtl: 86400 });

  } catch (err) {
    await env.KV_JOBS.put(jobId, JSON.stringify({
      status: 'error',
      message: err.message,
    }), { expirationTtl: 86400 }).catch(() => {});
  }
}

async function handlePoll(jobId, env) {
  if (!env.KV_JOBS) return jsonResponse({ error: 'KVが設定されていません' }, 503);
  const data = await env.KV_JOBS.get(jobId, 'json');
  if (!data) return jsonResponse({ error: 'ジョブが見つかりません（期限切れか無効なID）' }, 404);
  return jsonResponse(data);
}

// --- レガシー同期処理 ---

async function handleProcess(request, env) {
  const formData = await request.formData();
  const audioFile = formData.get('audio');
  const language = formData.get('language') || '';
  const template = formData.get('template') || 'understand';
  const gemKey = env.GEM_KEY || request.headers.get('X-GEM-Key');
  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');

  if (!gemKey || !antKey) return jsonResponse({ error: 'APIキーが設定されていません' }, 400);
  if (!audioFile) return jsonResponse({ error: '音声ファイルがありません' }, 400);

  return handleProcessFromData(audioFile, language, template, gemKey, antKey);
}

async function handleProcessFromData(audioFile, language, template, gemKey, antKey) {
  const { text, geminiUsage } = await transcribeWithGemini(audioFile, gemKey, language);

  const promptTemplate = TEMPLATES[template] || TEMPLATES['understand'];
  const prompt = promptTemplate + '\n\n---文字起こし---\n' + text;
  const claudeData = await callClaude(antKey, prompt);

  return jsonResponse({
    transcript: text,
    summary: claudeData.content[0].text,
    geminiUsage,
    usage: claudeData.usage,
  });
}

async function handleSummarize(request, env) {
  const body = await request.json();
  const { text, template } = body;
  const antKey = env.ANT_KEY || request.headers.get('X-ANT-Key');

  if (!antKey) return jsonResponse({ error: 'Anthropic APIキーが設定されていません' }, 400);
  if (!text) return jsonResponse({ error: 'テキストがありません' }, 400);

  const promptTemplate = TEMPLATES[template] || TEMPLATES['understand'];
  const prompt = promptTemplate + '\n\n---文字起こし---\n' + text;
  const claudeData = await callClaude(antKey, prompt);

  return jsonResponse({ summary: claudeData.content[0].text, usage: claudeData.usage });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
