import { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink, FileSpreadsheet, MapPin } from 'lucide-react';
import type { EnquiryServiceType, PublicGoogleFormConfig } from '../types/teracore';
import { SmartQuoteForm } from '../components/SmartQuoteForm';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap';
import { fetchPublishedGoogleForm } from '../services/firestoreService';

interface QuotePageProps {
  prefillService?: EnquiryServiceType;
  prefillSummary?: string;
  prefillLocation?: string;
}

function buildEmbeddedGoogleFormUrl(responderUri: string): string {
  const separator = responderUri.includes('?') ? '&' : '?';
  return `${responderUri}${separator}embedded=true`;
}

export function QuotePage({
  prefillService = 'solar',
  prefillSummary = '',
  prefillLocation = '',
}: QuotePageProps) {
  const [selectedLocation, setSelectedLocation] = useState(prefillLocation);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [publishedForm, setPublishedForm] = useState<PublicGoogleFormConfig | null>(null);
  const [activeMode, setActiveMode] = useState<'google' | 'smart'>('smart');

  useEffect(() => {
    if (prefillLocation) {
      setSelectedLocation(prefillLocation);
    }
  }, [prefillLocation]);

  useEffect(() => {
    let active = true;
    async function loadPublicForm() {
      try {
        const config = await fetchPublishedGoogleForm();
        if (active && config) {
          setPublishedForm(config);
          if (!prefillSummary) {
            setActiveMode('google');
          }
        }
      } catch {
        // Keep SmartQuoteForm visible if public form is unconfigured
      }
    }
    void loadPublicForm();
    return () => {
      active = false;
    };
  }, [prefillSummary]);

  return (
    <div>
      <section className="bg-navy-900 text-white py-14 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="text-xs font-semibold text-emerald-400">Request a Quote</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Smart Project &amp; Consultation Request
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Tell us which Teracore division you require and our adaptive form will capture only the technical details relevant to your project.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {publishedForm && (
            <div className="bg-white border border-slate-200 rounded-xl p-2 inline-flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveMode('google')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'google'
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Google Form ({publishedForm.title})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('smart')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeMode === 'smart'
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Teracore Smart Quote Form</span>
              </button>
            </div>
          )}

          {publishedForm && activeMode === 'google' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {publishedForm.title}
                  </h2>
                  {publishedForm.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {publishedForm.description}
                    </p>
                  )}
                </div>
                <a
                  href={publishedForm.responderUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  <span>Open Form in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                src={buildEmbeddedGoogleFormUrl(publishedForm.responderUri)}
                title={publishedForm.title}
                className="w-full h-[760px] border-0 bg-white"
              >
                Loading Google Form…
              </iframe>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
                <div className="text-xs sm:text-sm text-slate-700">
                  Need to look up or verify your exact site address on a map before submitting?
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapPicker((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showMapPicker ? 'Hide Site Map Picker' : 'Pick Site on Map'}</span>
                </button>
              </div>

              {showMapPicker && (
                <ServiceCoverageMap
                  title="Pin or Search Your Project Address"
                  subtitle="Search your property address or click a point on the map, then select 'Use This Address in Form' to fill your site location automatically."
                  onSelectAddress={(address) => {
                    setSelectedLocation(address);
                  }}
                />
              )}

              <SmartQuoteForm
                initialService={prefillService}
                initialSummary={prefillSummary}
                initialLocation={selectedLocation}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
