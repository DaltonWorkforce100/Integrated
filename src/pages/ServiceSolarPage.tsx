import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { ASSETS, SOLAR_FAQS } from '../data/teracoreData';
import type { ProjectItem } from '../types/teracore';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { SolarEstimator } from '../components/SolarEstimator';
import { SmartQuoteForm } from '../components/SmartQuoteForm';

interface ServiceSolarPageProps {
  projects: ProjectItem[];
}

export function ServiceSolarPage({ projects }: ServiceSolarPageProps) {
  const [estimateSummary, setEstimateSummary] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const solarProjects = projects.filter((p) => p.category === 'solar');

  const scrollToForm = () => {
    document.getElementById('solar-consultation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* 1. Solar Hero & Introduction */}
      <section className="bg-navy-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div className="text-xs font-mono font-medium text-emerald-400">
              Division 01 · Solar Energy Solutions
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Reliable Energy Solutions for Homes and Businesses.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Reduce generator fuel spend, eliminate sudden power interruptions, and run essential residential or commercial equipment with properly engineered solar PV, hybrid inverters, and lithium battery storage.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Request a Solar Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('solar-estimator')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
              >
                Calculate Your Load
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto rounded-xl overflow-hidden border border-slate-800">
            <ImageWithFallback
              src={ASSETS.solarArray}
              alt="Teracore solar photovoltaic panels, hybrid inverter, and lithium storage installation"
              category="solar"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2-6. Core Solar Capabilities */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Complete Solar Engineering Scope
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Every solar system we install is sized to your real appliance profile, roof geometry, and autonomy requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Residential Solar Installations',
                desc: 'Quiet, clean backup power for apartments, duplexes, and residential estates—keeping lighting, refrigeration, fans, inverter ACs, and home offices online around the clock.',
              },
              {
                title: 'Commercial Solar Installations',
                desc: 'Single-phase and three-phase solar power plants built for offices, clinics, schools, retail outlets, and warehouses to stabilize operating costs and daytime uptime.',
              },
              {
                title: 'Hybrid Inverter Systems',
                desc: 'Intelligent inverters combining solar PV generation, grid input, generator integration, and battery charging with fast automatic changeover.',
              },
              {
                title: 'Lithium Battery Storage Solutions',
                desc: 'High-cycle LiFePO4 wall-mount and rack-mounted battery banks engineered for deeper usable capacity, faster recharging, and reliable nighttime backup.',
              },
              {
                title: 'Solar Panel Installation & Protection',
                desc: 'Precision aluminum roof/ground mounting, proper string sizing, DC isolators, earthing, and surge protection built for heavy seasonal weather.',
              },
              {
                title: 'Maintenance & Technical Support',
                desc: 'Scheduled system health checks, terminal inspection, cleaning guidance, inverter diagnostics, and expansion planning as your power demand grows.',
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

      {/* 7. Energy Assessment & System Sizing (Interactive Estimator) */}
      <section id="solar-estimator" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-emerald-700">Energy Assessment &amp; Sizing</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Estimate Your Inverter &amp; Battery Requirement
            </h2>
          </div>

          <SolarEstimator
            onApplyToQuote={(summary) => {
              setEstimateSummary(summary);
              scrollToForm();
            }}
          />
        </div>
      </section>

      {/* 8-9. Featured Solar Projects & FAQs */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">Featured Solar Architecture</h2>
            <div className="space-y-4">
              {solarProjects.map((proj) => (
                <div key={proj.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-xs text-slate-500">{proj.location}</div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                  <div className="text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Specification: </span>
                    {proj.equipmentUsed}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Need an On-Site Energy Audit?</span>
              </div>
              <p className="text-sm text-emerald-900/80">
                Our engineers measure real phase loads with clamp meters and evaluate roof shading before finalizing your Bill of Materials.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">Solar Frequently Asked Questions</h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {SOLAR_FAQS.map((faq, idx) => {
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

      {/* 11. Request a Solar Consultation Form */}
      <section id="solar-consultation-form" className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SmartQuoteForm
            initialService="solar"
            lockService
            initialSummary={estimateSummary}
            heading="Request a Solar Consultation"
            subheading="Share your property details and power challenges. Our solar engineering team will prepare a tailored assessment."
          />
        </div>
      </section>
    </div>
  );
}
