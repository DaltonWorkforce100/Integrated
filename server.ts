import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
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
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
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
      },
    });

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
  } catch (error) {
    console.error('Teracore assistant error:', error);
    res.status(500).json({
      error: 'We could not process your question right now. Please submit your enquiry on the Request a Quote page.',
    });
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
