import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  ExternalLink,
  Globe,
  LocateFixed,
  MapPin,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { buildWhatsAppUrl } from '../data/teracoreData';

interface FloatingActionsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
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

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  mode?: 'search' | 'maps';
  webSources?: WebSource[];
  mapSources?: MapSource[];
}

const SEARCH_STARTER_PROMPTS = [
  'How do I size a solar system for my office?',
  'Do your CCTV cameras record when power goes out?',
  'Can Teracore handle office cabling and Wi-Fi setup?',
];

const MAPS_STARTER_PROMPTS = [
  'Commercial districts in Victoria Island Lagos for office IT deployment',
  'Coverage & logistics notes for solar installations in Central Business District Abuja',
  'Key access considerations for industrial CCTV deployments in GRA Port Harcourt',
];

export function FloatingActions({ currentPath, onNavigate }: FloatingActionsProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Welcome to Teracore. Ask any question about our Solar Energy, CCTV Security, or Business IT divisions, or switch to Maps & Location mode for Google Maps-grounded area insights.',
    },
  ]);

  const handleRequestLocation = () => {
    if (userCoords) {
      setUserCoords(null);
      setGeoStatus(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported in this browser.');
      return;
    }
    setGeoStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoStatus('Current area attached');
      },
      () => {
        setGeoStatus('Location access declined');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const activeMode = mode;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          currentPath,
          mode: activeMode,
          ...(activeMode === 'maps' && userCoords ? { latLng: userCoords } : {}),
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        webSources?: WebSource[];
        mapSources?: MapSource[];
        error?: string;
      };
      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              data.error ||
              'Our technical desk is available directly via the Request a Quote page or WhatsApp if you need immediate assistance.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply!,
            mode: activeMode,
            webSources: Array.isArray(data.webSources) ? data.webSources : undefined,
            mapSources: Array.isArray(data.mapSources) ? data.mapSources : undefined,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Connection interrupted. You can reach our engineering team directly via WhatsApp or the Quote Request form.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const activeStarterPrompts =
    mode === 'maps' ? MAPS_STARTER_PROMPTS : SEARCH_STARTER_PROMPTS;

  return (
    <>
      {/* Compact bottom-right action dock (under 15% mobile height budget) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setAssistantOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-md border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          aria-label="Open Teracore Technical Assistant"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Ask Teracore</span>
        </button>

        <a
          href={buildWhatsAppUrl('Hello Teracore, I would like to enquire about your services.')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors whitespace-nowrap"
          aria-label="Chat with Teracore on WhatsApp"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Technical Assistant Panel */}
      {assistantOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[26rem] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden"
          role="dialog"
          aria-label="Teracore Technical Assistant"
        >
          <div className="bg-navy-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold">Teracore Technical Assistant</div>
              <div className="text-xs text-slate-300">Solar · CCTV Security · IT Infrastructure</div>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white rounded-md cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grounding Mode Switcher */}
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setMode('search')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'search'
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web Search</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('maps')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'maps'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Maps &amp; Location</span>
              </button>
            </div>

            {mode === 'maps' && (
              <button
                type="button"
                onClick={handleRequestLocation}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  userCoords
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Optional: share browser coordinates for nearby Google Maps grounding"
              >
                <LocateFixed className="w-3 h-3" />
                <span>{userCoords ? 'Location On' : 'Share Area'}</span>
              </button>
            )}
          </div>

          {mode === 'maps' && geoStatus && (
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
              {geoStatus}
            </div>
          )}

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div
                  className={`text-sm leading-relaxed rounded-lg px-3.5 py-2.5 whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-navy-900 text-white ml-8'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Google Search Grounding Sources */}
                {msg.role === 'assistant' && msg.webSources && msg.webSources.length > 0 && (
                  <div className="mr-6 bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500">Web Sources</div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.webSources.slice(0, 4).map((src, sIdx) => (
                        <a
                          key={`${src.uri}-${sIdx}`}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-navy-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors max-w-full"
                        >
                          <Globe className="w-3 h-3 text-cobalt-600 shrink-0" />
                          <span className="truncate max-w-[180px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Maps Grounding Sources */}
                {msg.role === 'assistant' && msg.mapSources && msg.mapSources.length > 0 && (
                  <div className="mr-6 bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500">
                      Google Maps Places
                    </div>
                    <div className="space-y-1.5">
                      {msg.mapSources.slice(0, 4).map((src, mIdx) => (
                        <div key={`${src.uri}-${mIdx}`} className="space-y-1">
                          <a
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          </a>
                          {src.reviewSnippets && src.reviewSnippets.length > 0 && (
                            <p className="text-[11px] text-slate-600 italic pl-1">
                              “{src.reviewSnippets[0]}”
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium text-slate-500">
                  {mode === 'maps' ? 'Location & coverage prompts:' : 'Common enquiries:'}
                </div>
                {activeStarterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="w-full text-left text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 mr-6">
                {mode === 'maps'
                  ? 'Checking Google Maps context...'
                  : 'Searching & reviewing your question...'}
              </div>
            )}
          </div>

          <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAssistantOpen(false);
                onNavigate('/request-a-quote');
              }}
              className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800 cursor-pointer whitespace-nowrap"
            >
              <span>Request Formal Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAssistantOpen(false);
                onNavigate('/contact');
              }}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer whitespace-nowrap"
            >
              Coverage Map
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'maps'
                  ? 'Ask about a city, district, or site area...'
                  : 'Ask about solar, CCTV, or IT...'
              }
              maxLength={400}
              className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
