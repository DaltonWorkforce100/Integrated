import { GoogleGenAI } from '@google/genai';

interface ServerlessReq {
  method?: string;
  body?: unknown;
}

interface ServerlessRes {
  status: (code: number) => ServerlessRes;
  json: (body: unknown) => void;
}

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

export default async function handler(req: ServerlessReq, res: ServerlessRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody =
      typeof req.body === 'string' ? (JSON.parse(req.body) as Record<string, unknown>) : req.body;
    const body = (rawBody ?? {}) as {
      message?: unknown;
      history?: unknown;
      currentPath?: unknown;
      mode?: unknown;
      latLng?: unknown;
    };

    const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
    if (!rawMessage || rawMessage.length > 1000) {
      res
        .status(400)
        .json({ error: 'Please provide a valid question between 1 and 1000 characters.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'Assistant API key is not configured on this deployment. Add GEMINI_API_KEY in your hosting environment variables, or contact our team via WhatsApp or the Quote Request form.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
    const pageContext =
      typeof body.currentPath === 'string' ? `Visitor current page: ${body.currentPath}\n` : '';
    const prompt = `${pageContext}${
      contextLines.length ? `Recent conversation:\n${contextLines.join('\n')}\n\n` : ''
    }Visitor: ${rawMessage}`;

    const rawLatLng = body.latLng as { latitude?: unknown; longitude?: unknown } | undefined;
    const hasValidLatLng =
      rawLatLng &&
      typeof rawLatLng.latitude === 'number' &&
      typeof rawLatLng.longitude === 'number' &&
      Number.isFinite(rawLatLng.latitude) &&
      Number.isFinite(rawLatLng.longitude);

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
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: { systemInstruction: TERACORE_SYSTEM_INSTRUCTION },
        });
      } catch (secondErr: unknown) {
        if (!isQuotaError(secondErr)) throw secondErr;
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

    res.status(200).json({ reply, webSources, mapSources, mode });
  } catch (error: unknown) {
    console.error('Teracore serverless assistant error:', error);
    const errObj = error as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 500;
    const msg = typeof errObj?.message === 'string' ? errObj.message : '';

    if (status === 403 || status === 401 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
      res.status(status).json({
        error:
          'Assistant API key is missing or unauthorized. Check GEMINI_API_KEY in your hosting environment variables.',
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
}
