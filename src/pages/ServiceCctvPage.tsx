import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ASSETS, CCTV_FAQS } from '../data/teracoreData';
import type { ProjectItem } from '../types/teracore';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { CctvAssistant } from '../components/CctvAssistant';
import { SmartQuoteForm } from '../components/SmartQuoteForm';

interface ServiceCctvPageProps {
  projects: ProjectItem[];
}

export function ServiceCctvPage({ projects }: ServiceCctvPageProps) {
  const [cctvSummary, setCctvSummary] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cctvProjects = projects.filter((p) => p.category === 'cctv');

  const scrollToForm = () => {
    document.getElementById('cctv-assessment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* 1. CCTV Hero & Introduction */}
      <section className="bg-navy-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div className="text-xs font-mono font-medium text-blue-400">
              Division 02 · CCTV &amp; Security Solutions
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Intelligent Security. Greater Peace of Mind.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Protect commercial facilities, offices, warehouses, and homes with crisp IP and HD surveillance systems, reliable NVR storage, night-vision perimeter monitoring, and mobile viewing.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Request a Security Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cctv-assistant')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
              >
                Plan Camera Coverage
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto rounded-xl overflow-hidden border border-slate-800">
            <ImageWithFallback
              src={ASSETS.cctvSurveillance}
              alt="Commercial IP turret and bullet CCTV cameras installed by Teracore"
              category="cctv"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2-8. Core CCTV Capabilities */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              End-to-End Surveillance Infrastructure
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Engineered to eliminate blind spots, withstand outdoor weather, and keep recording during power disruptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'IP Camera Installation',
                desc: 'Power-over-Ethernet (PoE) network cameras delivering high-definition facial and vehicle detail over structured Cat6 cabling.',
              },
              {
                title: 'HD Surveillance Systems',
                desc: 'Dependable HD-TVI and coaxial camera upgrades for properties seeking crisp clarity without replacing existing infrastructure.',
              },
              {
                title: 'Remote Mobile & Desktop Monitoring',
                desc: 'Securely configured mobile apps and control-room screens allowing authorized managers to view live feeds and playback anywhere.',
              },
              {
                title: 'DVR & NVR Storage Architecture',
                desc: 'Surveillance-grade hard drives sized specifically for your required 14, 30, or 60-day continuous footage retention policy.',
              },
              {
                title: 'Commercial & Residential Coverage',
                desc: 'Custom camera placement for gates, perimeter walls, lobbies, cash points, loading bays, and multi-unit residential estates.',
              },
              {
                title: 'System Upgrades & Maintenance',
                desc: 'Diagnostics, faulty camera replacements, power-backup integration, lens alignment, and firmware hardening for existing sites.',
              },
            ].map((item) => (
              <div key={item.title} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <h3 className="font-display text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive CCTV Coverage Assistant */}
      <section id="cctv-assistant" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-blue-700">Surveillance Planning Tool</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Estimate Your Camera &amp; Recorder Scope
            </h2>
          </div>

          <CctvAssistant
            onApplyToQuote={(summary) => {
              setCctvSummary(summary);
              scrollToForm();
            }}
          />
        </div>
      </section>

      {/* Portfolio & FAQs */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">Security Reference Topology</h2>
            <div className="space-y-4">
              {cctvProjects.map((proj) => (
                <div key={proj.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-xs text-slate-500">{proj.location}</div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                  <div className="text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Equipment: </span>
                    {proj.equipmentUsed}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">CCTV Frequently Asked Questions</h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {CCTV_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={faq.q} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-sm sm:text-base font-semibold text-slate-900">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 11. Request Security Assessment Form */}
      <section id="cctv-assessment-form" className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SmartQuoteForm
            initialService="cctv"
            lockService
            initialSummary={cctvSummary}
            heading="Request a Security Assessment"
            subheading="Tell us about your premises and coverage goals so our security engineers can schedule a site inspection."
          />
        </div>
      </section>
    </div>
  );
}
