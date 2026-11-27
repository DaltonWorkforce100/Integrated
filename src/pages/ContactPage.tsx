import { useEffect, useRef, useState } from 'react';
import { ClipboardList, ExternalLink, Mail, MapPin, MessageSquare, PhoneCall } from 'lucide-react';
import { TERACORE_BRAND, buildWhatsAppUrl } from '../data/teracoreData';
import { SmartQuoteForm } from '../components/SmartQuoteForm';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap';
import { fetchPublishedGoogleForm } from '../services/firestoreService';
import type { PublicGoogleFormConfig } from '../types/teracore';

interface ContactPageProps {
  onNavigate?: (path: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [publishedForm, setPublishedForm] = useState<PublicGoogleFormConfig | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadPublicForm() {
      try {
        const config = await fetchPublishedGoogleForm();
        if (active) setPublishedForm(config);
      } catch {
        // Non-blocking
      }
    }
    void loadPublicForm();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectAddress = (address: string) => {
    setSelectedLocation(address);
    formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <section className="bg-navy-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-semibold text-emerald-400">Contact Teracore</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl">
            Speak With Our Engineering &amp; Consultation Desk
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Reach out via WhatsApp, phone, email, or our structured enquiry form for solar installations, CCTV assessments, and business IT support.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-xl font-bold text-slate-900">Direct Channels</h2>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3.5">
                    <PhoneCall className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Phone Enquiries</div>
                      <a
                        href={TERACORE_BRAND.phoneHref}
                        className="text-slate-600 hover:text-emerald-700 font-mono tabular-nums mt-0.5 block"
                      >
                        {TERACORE_BRAND.phoneDisplay}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">WhatsApp Consultation</div>
                      <p className="text-slate-600 mt-0.5 mb-2">
                        Fastest way to share site photos or schedule an assessment.
                      </p>
                      <a
                        href={buildWhatsAppUrl('Hello Teracore, I would like to make an enquiry.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Start WhatsApp Chat
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Email</div>
                      <a
                        href={`mailto:${TERACORE_BRAND.email}`}
                        className="text-slate-600 hover:text-slate-900 mt-0.5 block"
                      >
                        {TERACORE_BRAND.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Service Coverage</div>
                      <div className="text-slate-600 mt-0.5">{TERACORE_BRAND.headquarters}</div>
                      <div className="text-xs text-slate-500 mt-1">{TERACORE_BRAND.operatingAreas}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={formContainerRef} className="lg:col-span-7 scroll-mt-24 space-y-4">
              {publishedForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {publishedForm.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        You can also complete our Google Form directly on the Request a Quote page or in a new tab.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onNavigate ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('/request-a-quote')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        Go to Request a Quote
                      </button>
                    ) : (
                      <a
                        href="/request-a-quote"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg whitespace-nowrap"
                      >
                        Go to Request a Quote
                      </a>
                    )}
                    <a
                      href={publishedForm.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                    >
                      <span>Open Google Form</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
              <SmartQuoteForm
                initialService="general"
                initialLocation={selectedLocation}
                heading="Send a General or Project Enquiry"
                subheading="Choose your required division, enter or pin your site location below, or submit a general question."
              />
            </div>
          </div>

          <ServiceCoverageMap onSelectAddress={handleSelectAddress} />
        </div>
      </section>
    </div>
  );
}
