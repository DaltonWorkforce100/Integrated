import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ASSETS, TERACORE_BRAND } from '../data/teracoreData';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div>
      {/* Header Band */}
      <section className="bg-navy-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-xs font-semibold text-emerald-400 mb-3">About Teracore</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Engineering Reliable Power, Intelligent Security, and Connected IT Systems
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mt-5 max-w-2xl">
            Teracore is a corporate technology and infrastructure solutions company helping homes and businesses across Nigeria operate reliably, securely, and intelligently.
          </p>
        </div>
      </section>

      {/* Brand Positioning & Integrated Model */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              One Unified Infrastructure Standard
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Modern homes and commercial facilities rarely suffer from isolated technical problems. An unstable power supply disables CCTV cameras and interrupts internet routers; poorly planned office cabling creates hazards and slows down teams; unverified hardware leads to recurring maintenance costs.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Teracore was built to solve this fragmentation. Rather than operating as three disconnected trades, our Solar Energy, CCTV &amp; Security, and IT Solutions divisions operate under one engineering standard—delivering clean installations, genuine equipment, and accountable after-sales support.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="font-display text-lg font-bold text-slate-900">Our Mission</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To deliver reliable solar energy, intelligent surveillance, and dependable IT systems engineered around real customer operating requirements.
                </p>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="font-display text-lg font-bold text-slate-900">Our Vision</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To set a trusted corporate benchmark for integrated energy, physical security, and workplace technology across Nigeria.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-7 space-y-5 self-start">
            <h3 className="font-display text-lg font-bold text-slate-900">How We Hold Ourselves Accountable</h3>
            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                <span>Every proposal begins with load, coverage, or network assessment—never guesswork.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                <span>Tier-1 inverters, battery banks, IP optics, and structured cabling matched to local conditions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                <span>Clean conduit routing, labelled electrical/rack panels, and clear handover documentation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                <span>Ongoing technical support and preventative maintenance options post-installation.</span>
              </li>
            </ul>
            <div className="pt-2 text-xs text-slate-500">
              Operating Footprint: {TERACORE_BRAND.operatingAreas}
            </div>
          </div>
        </div>
      </section>

      {/* CEO Profile: Steve Onwubiko */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 aspect-[3/4] lg:aspect-auto bg-slate-200">
              <ImageWithFallback
                src={ASSETS.ceoPortrait}
                alt="Steve Onwubiko, Chief Executive Officer of Teracore"
                category="general"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
              <div>
                <div className="text-xs font-semibold text-emerald-700">Executive Leadership</div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {TERACORE_BRAND.ceoName}
                </h2>
                <div className="text-sm font-medium text-slate-600 mt-0.5">
                  {TERACORE_BRAND.ceoTitle}, {TERACORE_BRAND.name}
                </div>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  Steve Onwubiko leads Teracore with a clear operational mandate: combine sound technical engineering, verified equipment standards, and transparent customer service across every solar, security, and IT engagement.
                </p>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-1">
                    Leadership Philosophy &amp; Vision
                  </h3>
                  <p>
                    Under Steve’s leadership, Teracore prioritizes long-term system reliability over short-term cost cutting. Every project is evaluated on how seamlessly it will perform months and years after commissioning—backed by responsive support teams and honest communication.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-1">
                    Commitment to Clients &amp; Innovation
                  </h3>
                  <p>
                    Whether sizing a commercial hybrid solar installation, securing multi-site premises with IP surveillance, or structuring a growing office network, Teracore treats client uptime and asset protection as direct leadership responsibilities.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/request-a-quote')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Schedule a Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
