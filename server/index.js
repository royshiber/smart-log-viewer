import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey });

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  try {
    const history = Array.isArray(messages) ? messages : [];
    const lastMsg = history.length ? history[history.length - 1] : {};
    const userText = lastMsg.text || '';
    const historyBlock = history.length > 1
      ? history.slice(0, -1).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : '';
    const prompt = `You are an expert ArduPilot flight log analyst. Answer in the same language as the user.

Context about the loaded log:
${JSON.stringify(context || {}, null, 2)}

${historyBlock ? `Previous conversation:\n${historyBlock}\n\n` : ''}User: ${userText}

Assistant:`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });
    const text = response.text ?? '';
    res.json({ text });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: err.message || 'Gemini API error' });
  }
});

app.post('/api/parse-graph-request', async (req, res) => {
  const { request, availableFields } = req.body;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  try {
    const prompt = `Parse this graph request into JSON. Available fields (format: MessageType.FieldName): ${JSON.stringify(availableFields)}\n\nUser request (Hebrew or English): "${request}"\n\nRespond with ONLY valid JSON, no markdown: { "fields": [{"name": "ATT.Roll", "color": "#ff0000"}, ...] }`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });
    const raw = (response.text ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { fields: [] };
    res.json(parsed);
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: err.message, fields: [] });
  }
});

app.use(express.static(join(__dirname, '../client/dist')));

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
