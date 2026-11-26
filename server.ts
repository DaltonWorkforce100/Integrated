import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const TERACORE_SYSTEM_INSTRUCTION = `You are the Teracore Integrated Solution Technical Concierge, helping home and business visitors understand our three integrated infrastructure divisions in Nigeria:
1. Solar Energy Solutions: Residential & commercial solar PV installations, hybrid inverter systems, lithium battery storage, energy audits & system sizing, and preventative maintenance.
2. CCTV & Security Solutions: IP network camera installations, HD surveillance, remote mobile & desktop monitoring, NVR/DVR recording systems, commercial & residential security setups, and system upgrades.
3. IT Solutions: Business computer & hardware procurement/deployment, LAN/Wi-Fi network installation & configuration, structured Cat6a/fiber cabling, server/rack infrastructure, and ongoing IT support & troubleshooting.

Company Facts:
- Exact Business Name: Teracore Integrated Solution ("Powering Possibilities. Securing What Matters. Connecting the Future.")
- Chief Executive Officer: Steve Onwubiko
- Official Phone / WhatsApp: +234 706 602 2908
- Official Email: trevorstones336@gmail.com
- Headquarters: Enugu State, Nigeria
- Service Areas: Enugu State, Lagos, Abuja, Port Harcourt, and commercial deployments across Nigeria.

Strict Grounding & Policy Rules:
- NEVER invent specific Teracore package prices, hardware quotes, client counts, years of operation, or certifications that were not provided to you.
- When using Google Search or Google Maps grounding, cite factual external information accurately without fabricating company pricing.
- If a visitor asks for a Teracore quote, guide them to the Solar System Estimator (/services/solar), CCTV Coverage Assistant (/services/cctv), Smart Quote Form (/request-a-quote), or WhatsApp (+234 706 602 2908).
- Keep responses concise, helpful, authoritative, and easy to scan.`;

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'teracore-web' });
});

app.get('/api/maps-config', (_req: Request, res: Response) => {
  const apiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  res.json({ apiKey });
});

interface ChatMessageInput {
  role: 'user' | 'assistant';
  text: string;
}

interface WebSource {
  title: string;
  uri: string;
}

interface MapSource {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

app.post('/api/assistant', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      message?: unknown;
      history?: unknown;
      currentPath?: unknown;
      mode?: unknown;
      latLng?: unknown;
    };
    const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';

    if (!rawMessage || rawMessage.length > 1000) {
      res.status(400).json({ error: 'Please provide a valid question between 1 and 1000 characters.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Assistant service is temporarily unavailable. Please use our Quote Request form or WhatsApp consultation.',
      });
      return;
    }

    const mode: 'search' | 'maps' = body.mode === 'maps' ? 'maps' : 'search';

    const historyItems: ChatMessageInput[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is ChatMessageInput =>
              typeof item === 'object' &&
              item !== null &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.text === 'string'
          )
          .slice(-6)
      : [];

    const contextLines = historyItems.map(
      (m) => `${m.role === 'user' ? 'Visitor' : 'Teracore Concierge'}: ${m.text}`
    );
    const pageContext = typeof body.currentPath === 'string' ? `Visitor current page: ${body.currentPath}\n` : '';
    const prompt = `${pageContext}${contextLines.length ? `Recent conversation:\n${contextLines.join('\n')}\n\n` : ''}Visitor: ${rawMessage}`;

    const rawLatLng = body.latLng as { latitude?: unknown; longitude?: unknown } | undefined;
    const hasValidLatLng =
      rawLatLng &&
      typeof rawLatLng.latitude === 'number' &&
      typeof rawLatLng.longitude === 'number' &&
      Number.isFinite(rawLatLng.latitude) &&
      Number.isFinite(rawLatLng.longitude);

    // Note: googleMaps and googleSearch cannot be combined in the same request.
    // Never set responseMimeType or responseSchema when googleMaps is enabled.
    const groundedConfig = {
      systemInstruction: TERACORE_SYSTEM_INSTRUCTION,
      tools: mode === 'maps' ? [{ googleMaps: {} }] : [{ googleSearch: {} }],
      ...(mode === 'maps' && hasValidLatLng
        ? {
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: rawLatLng.latitude as number,
                  longitude: rawLatLng.longitude as number,
                },
              },
            },
          }
        : {}),
    };

    const isQuotaError = (err: unknown): boolean => {
      const obj = err as { status?: number; message?: string };
      return obj?.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(obj?.message || '');
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: groundedConfig,
      });
    } catch (firstErr: unknown) {
      if (!isQuotaError(firstErr)) throw firstErr;
      // Retry without Search/Maps grounding tools (grounding has stricter free-tier limits)
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: { systemInstruction: TERACORE_SYSTEM_INSTRUCTION },
        });
      } catch (secondErr: unknown) {
        if (!isQuotaError(secondErr)) throw secondErr;
        // Final real-model fallback to lighter-weight flash-lite model
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: { systemInstruction: TERACORE_SYSTEM_INSTRUCTION },
        });
      }
    }

    const reply = response.text?.trim();
    if (!reply) {
      res.status(502).json({ error: 'Unable to generate a response right now. Please try again.' });
      return;
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const webSources: WebSource[] = [];
    const mapSources: MapSource[] = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        webSources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri,
        });
      }
      if (chunk.maps?.uri) {
        const snippets = Array.isArray(chunk.maps.placeAnswerSources?.reviewSnippets)
          ? chunk.maps.placeAnswerSources.reviewSnippets
              .map((s) => (typeof s === 'string' ? s : (s as { content?: string })?.content || ''))
              .filter(Boolean)
          : undefined;
        mapSources.push({
          title: chunk.maps.title || 'View on Google Maps',
          uri: chunk.maps.uri,
          reviewSnippets: snippets && snippets.length > 0 ? snippets : undefined,
        });
      }
    }

    res.json({ reply, webSources, mapSources, mode });
  } catch (error: unknown) {
    console.error('Teracore assistant error:', error);
    const errObj = error as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 500;
    const msg = typeof errObj?.message === 'string' ? errObj.message : '';

    if (status === 403 || status === 401 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
      res.status(status).json({
        error:
          'Assistant API key is missing or unauthorized. Please check GEMINI_API_KEY in Settings → Secrets (or your hosting environment variables).',
      });
      return;
    }
    if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(msg)) {
      res.status(429).json({
        error:
          'Your Gemini API key has hit its quota limit (often because the Google Cloud project needs billing enabled or the free tier is exhausted). Enable billing on the API key in Google AI Studio / Settings → Secrets, or reach our team via WhatsApp.',
      });
      return;
    }

    res.status(status >= 400 && status < 600 ? status : 500).json({
      error:
        'Unable to reach the AI assistant right now. Please try again or contact our engineering team via WhatsApp or the Quote Request form.',
    });
  }
});

const APPS_SCRIPT_URL_REGEX =
  /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]{10,200}\/exec$/;
const BOOTSTRAPPED_ADMIN_EMAIL = 'allidavid473@gmail.com';

function getFirebaseApiKey(): string {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return parsed.apiKey || '';
  } catch {
    return '';
  }
}

async function verifyFirebaseAdminToken(idToken: string): Promise<boolean> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey || !idToken) return false;

  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!lookupRes.ok) return false;
  const data = (await lookupRes.json()) as {
    users?: Array<{ email?: string; emailVerified?: boolean; localId?: string }>;
  };
  const user = data.users?.[0];
  return Boolean(
    user?.localId &&
      user?.emailVerified === true &&
      user?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL
  );
}

function diagnoseAppsScriptHtml(html: string, finalUrl: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const titleMatch = withoutScripts.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || '';
  const plainText = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const combined = `${title} ${plainText}`.trim();

  if (
    /script function not found:\s*dopost|scriptfunctie niet gevonden:\s*dopost|not found:\s*dopost/i.test(
      combined
    )
  ) {
    return 'Apps Script says "Script function not found: doPost". In Apps Script, paste the Code.gs script, click Save (Ctrl+S), then click Deploy → Manage deployments → Edit (pencil) → set Version to "New version" → Deploy.';
  }
  if (/accounts\.google\.com|servicelogin/i.test(finalUrl) || /sign in|google accounts/i.test(title)) {
    return 'Google Apps Script redirected to a sign-in page. Check Deploy → Manage deployments: ensure Type is "Web app", Execute as is "Me", Who has access is "Anyone", and Version is a saved version with Code.gs.';
  }
  if (/unable to open the file|sorry, unable to open/i.test(combined)) {
    return 'Google Apps Script returned "Unable to open the file" (often caused by multiple Google accounts signed in at once). Open the Google Sheet in an Incognito window signed only into allidavid473@gmail.com and create a New deployment there.';
  }
  if (/authorization is required|need permission/i.test(combined)) {
    return 'Apps Script requires authorization. In Apps Script, click Run on doPost (or Deploy → New deployment) and complete Authorize access → Advanced → Go to project → Allow.';
  }

  const snippet = (plainText || title).slice(0, 180);
  return snippet
    ? `Google Apps Script returned an unexpected page instead of JSON: "${snippet}"`
    : 'Google Apps Script returned an HTML page instead of JSON. Make sure Code.gs is saved and deployed as a New version with "Who has access: Anyone".';
}

app.post('/api/sheets-webhook', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ error: 'Administrator sign-in token is required.' });
      return;
    }

    const isAdmin = await verifyFirebaseAdminToken(token);
    if (!isAdmin) {
      res.status(403).json({ error: 'Only verified Teracore administrators can sync spreadsheets.' });
      return;
    }

    const body = req.body as { webhookUrl?: unknown; rows?: unknown };
    const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
    if (!APPS_SCRIPT_URL_REGEX.test(webhookUrl)) {
      res.status(400).json({
        error:
          'Please enter a valid Google Apps Script Web App URL starting with https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    if (
      !Array.isArray(body.rows) ||
      body.rows.length === 0 ||
      body.rows.length > 5000 ||
      !body.rows.every(
        (r) => Array.isArray(r) && r.length <= 20 && r.every((cell) => typeof cell === 'string')
      )
    ) {
      res.status(400).json({ error: 'Invalid spreadsheet row payload.' });
      return;
    }

    const scriptRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: body.rows }),
      redirect: 'follow',
    });

    const contentType = scriptRes.headers.get('content-type') || '';
    const text = await scriptRes.text();

    if (!scriptRes.ok) {
      res.status(502).json({
        error: `Google Apps Script returned status ${scriptRes.status}. Verify the Web App deployment settings.`,
      });
      return;
    }

    if (contentType.includes('text/html') || text.trim().startsWith('<')) {
      res.status(400).json({
        error: diagnoseAppsScriptHtml(text, scriptRes.url || ''),
      });
      return;
    }

    let parsed: { ok?: boolean; count?: number; error?: string } = {};
    try {
      parsed = JSON.parse(text) as { ok?: boolean; count?: number; error?: string };
    } catch {
      parsed = { ok: true };
    }

    if (parsed.ok === false) {
      res.status(502).json({ error: parsed.error || 'Google Apps Script reported an error.' });
      return;
    }

    res.json({
      ok: true,
      count: typeof parsed.count === 'number' ? parsed.count : Math.max(0, body.rows.length - 1),
    });
  } catch (error) {
    console.error('Sheets webhook sync error:', error);
    res.status(500).json({ error: 'Unable to reach your Google Apps Script Web App URL.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teracore server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
