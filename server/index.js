import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import './tools/mapTools.js';
import { toPromptList } from './tools/registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const fallbackModel = 'gemini-2.5-flash-lite';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/** responseSchema for unified-chat: text reply + JS code string + short intent */
const UNIFIED_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    code: { type: 'string' },
    intent: { type: 'string' },
  },
  required: ['text', 'code', 'intent'],
};

/** responseSchema for graph-request parsing */
const GRAPH_SCHEMA = {
  type: 'object',
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  required: ['fields'],
};

async function callGemini(prompt, config = {}) {
  try {
    return await ai.models.generateContent({ model, contents: prompt, config });
  } catch (e) {
    if (model !== fallbackModel) {
      return await ai.models.generateContent({ model: fallbackModel, contents: prompt, config });
    }
    throw e;
  }
}

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/gemini-status', async (_, res) => {
  if (!apiKey?.trim()) {
    return res.json({ ok: false, reason: 'GEMINI_API_KEY is missing in server environment' });
  }
  return res.json({ ok: true, reason: 'Configured and ready' });
});

/** Chart analysis - SSE streaming for immediate token-by-token display */
app.post('/api/chat/stream', async (req, res) => {
  const { messages, context } = req.body;
  if (!apiKey?.trim()) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Add it to server/.env' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const history = Array.isArray(messages) ? messages : [];
    const lastMsg = history[history.length - 1] || {};
    const userText = lastMsg.text || '';
    const historyBlock = history.length > 1
      ? history.slice(0, -1).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : '';

    const prompt = `You are an expert ArduPilot flight log analyst. Answer in the same language as the user.

RULES:
- Match the user's terms to fields using fieldLabels and conceptToFields (e.g. "גובה"=Alt, "גלגול"=Roll).
- Use allStats for min/max/avg/count of ANY field. Use downsampled for trends.
- You have full access to the data. Answer any question about the log.
- Be precise and avoid speculation. If uncertain, explicitly say what is uncertain.
- Unless the user asks to expand, keep it concise and focused.
- If the question is about "when", use absolute clock times when available from absoluteTimeHints (format HH:MM:SS).

OUTPUT FORMAT (keep it short and structured):
- בקצרה: משפט אחד שמסכם את התשובה
- ממצאים: עד 3 bullet points קצרים עם מספרים קונקרטיים
- ביטחון: גבוה/בינוני/נמוך + סיבה קצרה (שורה אחת)
- אם צריך המשך: שאלה קצרה אחת, או אל תכתוב כלום

Context:
${JSON.stringify(context || {}, null, 2)}

${historyBlock ? `Previous conversation:\n${historyBlock}\n\n` : ''}User: ${userText}`;

    let stream;
    try {
      stream = await ai.models.generateContentStream({ model, contents: prompt });
    } catch (e) {
      if (model !== fallbackModel) {
        stream = await ai.models.generateContentStream({ model: fallbackModel, contents: prompt });
      } else throw e;
    }

    for await (const chunk of stream) {
      if (chunk.text) send({ delta: chunk.text });
    }
    send({ done: true });
    res.end();
  } catch (err) {
    let errMsg = err.message || 'Gemini API error';
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      errMsg = 'המפתח לא תקין. קבל מפתח חדש מ־https://aistudio.google.com/apikey והדבק ב־server/.env (בלי מרכאות)';
    }
    send({ error: errMsg });
    res.end();
  }
});

/** Legacy non-streaming chart chat (kept for backward compat) */
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;
  if (!apiKey?.trim()) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Add it to server/.env' });
  }
  try {
    const history = Array.isArray(messages) ? messages : [];
    const lastMsg = history[history.length - 1] || {};
    const userText = lastMsg.text || '';
    const historyBlock = history.length > 1
      ? history.slice(0, -1).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : '';
    const prompt = `You are an expert ArduPilot flight log analyst. Answer in the same language as the user.

RULES:
- Match the user's terms to fields using fieldLabels and conceptToFields (e.g. "גובה"=Alt, "גלגול"=Roll).
- Use allStats for min/max/avg/count of ANY field. Use downsampled for trends and "what happened when" questions.
- If the user asks about something with an imprecise name, find the best matching field from availableFields.
- You have full access to the data. Answer any question about the log.
- Be precise and avoid speculation. If uncertain, explicitly say what is uncertain.
- Unless the user asks to expand, keep it concise and focused.
- If the question is about "when", use absolute clock times when available from absoluteTimeHints (format HH:MM:SS).

RESPONSE SHAPE:
- בקצרה: line 1
- ממצאים: up to 3 bullets with concrete values
- ביטחון: high/medium/low with short reason

Context about the loaded log:
${JSON.stringify(context || {}, null, 2)}

${historyBlock ? `Previous conversation:\n${historyBlock}\n\n` : ''}User: ${userText}`;
    const response = await callGemini(prompt);
    res.json({ text: response?.text ?? '' });
  } catch (err) {
    let errMsg = err.message || 'Gemini API error';
    if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
      errMsg = 'המפתח לא תקין. קבל מפתח חדש מ־https://aistudio.google.com/apikey והדבק ב־server/.env (בלי מרכאות)';
    }
    console.error('Gemini error:', err);
    res.status(500).json({ error: errMsg });
  }
});

/**
 * Unified map+flight chat.
 * Gemini returns { text, code } where code is JS that calls api.* methods.
 * The client executes code in a restricted scope (new Function('api', code)).
 */
app.post('/api/unified-chat', async (req, res) => {
  const { messages, context, path, mapView, availableFields, currentMapState, savedCommands } = req.body;
  if (!apiKey?.trim()) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  try {
    const history = Array.isArray(messages) ? messages : [];
    const lastMsg = history[history.length - 1] || {};
    const userText = lastMsg.text || '';
    const historyBlock = history.length > 1
      ? history.slice(0, -1).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : '';
    const pathSummary = path?.length
      ? {
          pointCount: path.length,
          start: path[0],
          end: path[path.length - 1],
          bounds: path.reduce(
            (b, p) => ({
              minLat: Math.min(b.minLat, p[0]), maxLat: Math.max(b.maxLat, p[0]),
              minLng: Math.min(b.minLng, p[1]), maxLng: Math.max(b.maxLng, p[1]),
            }),
            { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
          ),
        }
      : null;

    const savedBlock = Array.isArray(savedCommands) && savedCommands.length
      ? `\nSAVED COMMANDS (user-approved, reuse or adapt for similar requests):\n${savedCommands.map((s, i) => `${i + 1}. [${s.intent}]: ${s.code}`).join('\n')}\n`
      : '';

    const prompt = `You are an expert ArduPilot flight log analyst AND map controller.
Respond in the same language as the user.

CRITICAL: You have FULL control. NEVER say "cannot", "impossible", "not supported", or "the interface doesn't support". 
ALWAYS implement map coloring requests with code. Use api.setSegmentColors + data.getValues for ANY custom logic (ranges, wrapping 0/360, multi-condition, gradients).
When user requests exact colors/ranges, use them exactly (no approximations, no substitutions).

You control the map using a JavaScript \`api\` object and read flight data from \`data\`.

API METHODS (use ONLY these):
- api.setColor(hexColor) — color entire path one solid color
- api.colorByThreshold(field, threshold, aboveColor, belowColor) — color segments above/below a value
- api.colorByField(field, positiveColor, negativeColor, zeroColor) — color by positive/negative/zero
- api.setSegmentColors(colorsArray) — set a hex color per path segment (most powerful: use for any custom logic)
- api.resetColor() — reset path to default blue
- api.addMarker(lat, lng, label) — add a labeled pin
- api.clearMarkers() — remove all pins
- api.setCenter(lat, lng) — pan map to coordinates
- api.setZoom(level) — set zoom level (1–18)
- api.fitBounds([[lat,lng],[lat,lng]]) — fit viewport to area

FLIGHT DATA (read-only):
- data.getValues(fieldName) → number[] aligned to path segments (use exact field name from availableFields)
- data.fieldNames → string[] of all available field names
- data.segmentCount → total number of path segments

PREFER api.setSegmentColors + data.getValues for any complex coloring (ranges, wrapping, multi-condition):
Example — color heading near north (wrapping 350–360 and 0–10):
const yaw = data.getValues('ATT.Yaw');
api.setSegmentColors(yaw.map(v => { const d = ((v%360)+360)%360; return (d>=350||d<=10)?'#800080':'#0000FF'; }));

Example — color altitude gradient from blue (low) to red (high):
const alt = data.getValues('POS.Alt'); const max = Math.max(...alt.filter(Boolean));
api.setSegmentColors(alt.map(v => { if(!v)return'#58a6ff'; const r=Math.round((v/max)*255); return \`#\${r.toString(16).padStart(2,'0')}00\${(255-r).toString(16).padStart(2,'0')}\`; }));

CURRENT MAP STATE (use this when user says "replace", "change", "instead", etc.):
${JSON.stringify(currentMapState || {})}

FLIGHT CONTEXT:
${JSON.stringify(context || {}, null, 2)}

MAP CONTEXT:
- Path: ${JSON.stringify(pathSummary)}
- Current view: ${JSON.stringify(mapView || {})}
- Available fields: ${JSON.stringify(availableFields || [])}

COLOR REFERENCE (always use hex):
yellow/צהוב=#FFFF00, red/אדום=#FF0000, green/ירוק=#00FF00, blue/כחול=#0000FF,
orange/כתום=#FFA500, purple/סגול=#800080, pink/ורוד=#FF69B4, white/לבן=#FFFFFF,
black/שחור=#000000, cyan/תכלת=#00FFFF, gold/זהב=#FFD700, turquoise/טורקיז=#40E0D0

${savedBlock}${historyBlock ? `Conversation so far:\n${historyBlock}\n\n` : ''}User: ${userText}

Return JSON: { "text": "reply in user's language", "code": "JS using api.* only, or empty string", "intent": "short English description of what the code does, or empty if no code" }

TEXT OUTPUT STYLE (for the JSON \`text\` field):
- Max 6 lines total
- Line 1: "בקצרה:" + קצר
- Lines 2-5: עד 3 bullet points
- No long paragraphs
- Flight questions → text answer, code: "", intent: ""
- Map coloring/actions → ALWAYS write code. Use api.setSegmentColors + data.getValues for complex conditions. Brief confirmation in text.
- If user specifies exact threshold/range/value, preserve it exactly in code.
- Modifications (replace/change color) → read CURRENT MAP STATE, keep unchanged params, only change what user asked
- If a SAVED COMMAND matches the request, adapt it instead of writing from scratch
- NEVER return empty code for a map coloring request. If unsure about field name, try common ones (ATT.Yaw, GPS.NumSat, POS.Alt, etc.)`;

    const response = await callGemini(prompt, {
      responseMimeType: 'application/json',
      responseSchema: UNIFIED_SCHEMA,
    });

    const parsed = JSON.parse(response.text);
    res.json({ text: parsed.text || '', code: parsed.code || '', intent: parsed.intent || '' });
  } catch (err) {
    console.error('Unified chat error:', err);
    res.status(500).json({ error: err?.message || 'Internal Server Error', code: '', intent: '' });
  }
});

/** Graph field parsing - responseSchema guaranteed JSON */
app.post('/api/parse-graph-request', async (req, res) => {
  const { request, availableFields } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  try {
    const prompt = `You parse ArduPilot flight log graph field requests. Map natural language (including informal/non-technical phrasing) to exact field names from the available list.

Available fields (MessageType.FieldName): ${JSON.stringify(availableFields)}

Common concept → field mappings (Hebrew and English):
- roll, רול, גלגול, הטיה צידית → ATT.Roll, ATT.DesRoll, ATT.NavRoll
- pitch, פיץ', עלרוד, הטיה קדמית → ATT.Pitch, ATT.DesPitch, ATT.NavPitch
- yaw, סיבוב, כיוון → ATT.Yaw, ATT.DesYaw, ATT.NavYaw
- altitude, גובה, גבוה, כמה גבוה → BARO.Alt, CTUN.Alt, GPS.Alt, BARO.BarAlt
- baro altitude, ברומטרי → BARO.Alt, BARO.BarAlt
- pressure, לחץ → BARO.Press, BARO.BPrs
- speed, מהירות, מהר → GPS.Spd, ARSPD.Airspeed, GPS.GSpd, CTUN.Aspd
- vertical speed, מהירות אנכית, עלייה ירידה → CTUN.VSpd, GPS.VZ
- throttle, מצערת, גז, עוצמת מנוע → CTUN.Thr, CTUN.ThrOut, RCOU.C3
- satellites, לוויינים, GPS signal → GPS.NSats, GPS.HDop
- voltage, מתח, סוללה, battery → BAT.Volt, BAT.V
- current, זרם, ampere → BAT.Curr, BAT.C
- gyro, ג'יירו, סיבוב גירו → GYR.GyrX, GYR.GyrY, GYR.GyrZ
- accel, תאוצה, acceleration → ACC.AccX, ACC.AccY, ACC.AccZ
- temperature, טמפרטורה, חום → BARO.Temp, IMU.Temp
- vibration, רעידות → VIBE.VibeX, VIBE.VibeY, VIBE.VibeZ
- mode, מצב טיסה → MODE.Mode
- heading, כיוון, compass → MAG.MagX, GPS.GCrs

User request: "${request}"

Rules:
- Count distinct measurements the user asked for (comma lists, "and"/"ו", "וגם", etc.). Return that many different fields when possible — e.g. three concepts like altitude, speed, and throttle → three fields from the list, not two.
- Return ALL fields that match the request. If the user mentions multiple data types (e.g. "גובה ומהירות", "roll and pitch", "הצג X, Y, Z"), return ALL of them.
- Use fuzzy/semantic matching: prefer a reasonable match over returning nothing. If the concept clearly exists in the available field list, return it even if the phrasing is informal.
- Fields MUST exist in the available list — do not invent field names.
- COLOR: If the user specifies a color (e.g. red/אדום, blue/כחול, green/ירוק, yellow/צהוב, orange/כתום, purple/סגול, pink/ורוד), set "color" to the matching hex. Otherwise omit "color". Hex: red=#f85149, blue=#58a6ff, green=#3fb950, yellow=#e6b800, orange=#da6700, purple=#a371f7, pink=#ff69b4, white=#ffffff, cyan=#79c0ff
- If the request is completely unrelated to any flight data field, return empty array [].`;

    const response = await callGemini(prompt, {
      responseMimeType: 'application/json',
      responseSchema: GRAPH_SCHEMA,
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: err.message, fields: [] });
  }
});

// Generate flight report (returns structured rows for jsPDF)
app.post('/api/generate-report', async (req, res) => {
  const { title, observations, stats, outputLanguage } = req.body || {};

  const prompt = `You are a flight data analyst. Output MUST be English only (ASCII/Latin text) for PDF compatibility — no Hebrew or other scripts in any string field.

Flight title (may be non-English; translate to a short English title for "englishTitle"): "${title || 'Flight Report'}"
Observations (user may write in any language): "${observations || 'No observations provided'}"
Statistics per field: ${JSON.stringify(stats || [])}
Requested output language: ${outputLanguage || 'en'}

Return a JSON object with:
- "englishTitle": short English title for the flight (e.g. "Flight over coastal area — Mar 2026")
- "executiveSummaryEn": concise engineering summary paragraph referencing the most important parameters
- "keyFindingsEn": array of 3-6 short bullet-style findings in English
- "engineeringConclusionEn": concise conclusion paragraph focused on flight quality and risk
- "rows": array of objects, one per field, with:
  - "field": keep the original technical field key from input when possible (e.g. "CTUN.Alt")
  - "min": minimum value (string)
  - "max": maximum value (string)
  - "avg": average value (string)
  - "std": standard deviation (string; use input value when provided)
  - "p95": 95th percentile (string; use input value when provided)
  - "trend": trend delta first->last (string; use input value when provided)
  - "riskLevel": LOW | MEDIUM | HIGH
  - "note": one concise engineering insight sentence in English for THIS field. If no insight can be inferred from current data, write a fallback comparative sentence such as "Compared with previous flights, this parameter appears within normal range." Do not leave note empty.
  - "recommendation": one practical follow-up recommendation sentence in English (can be empty only if truly none).

Rules:
- rows length MUST equal stats length (one note per field, never skip a field)
- Mention concrete interpretation when possible (stability, spikes, saturation, efficiency, responsiveness).
- If observations conflict with stats, mention uncertainty briefly but keep a note anyway.
- Keep notes concise and practical for pilot decisions.`;

  try {
    const REPORT_SCHEMA = {
      type: 'object',
      properties: {
        englishTitle: { type: 'string' },
        executiveSummaryEn: { type: 'string' },
        keyFindingsEn: { type: 'array', items: { type: 'string' } },
        engineeringConclusionEn: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              min: { type: 'string' },
              max: { type: 'string' },
              avg: { type: 'string' },
              std: { type: 'string' },
              p95: { type: 'string' },
              trend: { type: 'string' },
              riskLevel: { type: 'string' },
              note: { type: 'string' },
              recommendation: { type: 'string' },
            },
            required: ['field', 'min', 'max', 'avg', 'std', 'p95', 'trend', 'riskLevel', 'note', 'recommendation'],
          },
        },
      },
      required: ['englishTitle', 'executiveSummaryEn', 'keyFindingsEn', 'engineeringConclusionEn', 'rows'],
    };

    const response = await callGemini(prompt, {
      responseMimeType: 'application/json',
      responseSchema: REPORT_SCHEMA,
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: err.message, rows: [] });
  }
});

app.use(express.static(join(__dirname, '../client/dist')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server: http://localhost:${PORT}`);
});
