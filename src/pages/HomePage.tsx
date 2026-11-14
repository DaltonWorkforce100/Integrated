import { useState } from 'react';
import { ArrowRight, Sun, Shield, Server, Calculator, Camera, CheckCircle2 } from 'lucide-react';
import {
  ASSETS,
  PROCESS_STEPS,
  TERACORE_BRAND,
  TRUST_PILLARS,
  WHY_TERACORE_BENEFITS,
  buildWhatsAppUrl,
} from '../data/teracoreData';
import type { ProjectItem, ServiceDivision, TestimonialItem } from '../types/teracore';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface HomePageProps {
  onNavigate: (path: string, state?: { prefillService?: ServiceDivision; prefillSummary?: string }) => void;
  projects: ProjectItem[];
  testimonials: TestimonialItem[];
}

export function HomePage({ onNavigate, projects, testimonials }: HomePageProps) {
  const [projectFilter, setProjectFilter] = useState<'all' | ServiceDivision>('all');

  const filteredProjects =
    projectFilter === 'all' ? projects.slice(0, 6) : projects.filter((p) => p.category === projectFilter).slice(0, 6);

  return (
    <div>
      {/* Section 2: Hero Section */}
      <section className="bg-navy-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-semibold text-emerald-400 tracking-wide">
                {TERACORE_BRAND.operatingAreas}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Intelligent Energy. Smarter Security. Better Technology.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Teracore delivers dependable solar energy systems, advanced CCTV security, and professional IT solutions designed to power, protect, and connect homes and businesses.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('/request-a-quote')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Get a Free Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('core-services');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explore Our Services
                </button>
              </div>

              {/* Three Division Indicators (Unboxed Inline Links) */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300">
                <button
                  type="button"
                  onClick={() => onNavigate('/services/solar')}
                  className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sun className="w-4 h-4 text-emerald-400" />
                  <span>Solar &amp; Renewable Energy</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/services/cctv')}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 text-slate-300" />
                  <span>CCTV &amp; Surveillance</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/services/it')}
                  className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>IT &amp; Technology</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-navy-950 aspect-video lg:aspect-auto lg:min-h-[420px]">
                <ImageWithFallback
                  src={ASSETS.heroInfrastructure}
                  alt="Modern commercial headquarters powered by Teracore rooftop solar arrays, perimeter CCTV surveillance, and enterprise IT connectivity"
                  category="general"
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Trust and Credibility Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="space-y-1">
                <div className="font-display text-sm font-bold text-slate-900">{pillar.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Three Core Service Divisions (Asymmetric Hierarchy) */}
      <section id="core-services" className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold text-emerald-700">Integrated Technology Divisions</div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              One engineering partner across power, security, and IT infrastructure.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Rather than managing disconnected vendors, Teracore aligns your solar backup, surveillance visibility, and office network into a dependable whole.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Division 01: Marquee Solar Card */}
            <article className="lg:col-span-12 bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-mono font-medium text-emerald-700">01 · Solar Energy Solutions</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                    Dependable Solar &amp; Hybrid Inverter Power
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Power systems engineered to provide consistent daytime and overnight electricity while reducing reliance on unstable grid supply and expensive fuel generators.
                  </p>
                  <div className="pt-2 text-xs text-slate-500">
                    Residential Solar · Commercial Microgrids · Hybrid Inverters · LiFePO4 Battery Storage
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('/services/solar')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Solar Solutions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services/solar')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Open Solar Estimator</span>
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto bg-slate-100">
                <ImageWithFallback
                  src={ASSETS.solarArray}
                  alt="Commercial solar photovoltaic panels with hybrid inverter and lithium battery wall installation"
                  category="solar"
                  className="w-full h-full object-cover"
                />
              </div>
            </article>

            {/* Division 02: CCTV & Security */}
            <article className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100">
                <ImageWithFallback
                  src={ASSETS.cctvSurveillance}
                  alt="Commercial IP turret and bullet CCTV security cameras mounted on corporate building facade"
                  category="cctv"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-medium text-slate-600">02 · CCTV &amp; Security Solutions</div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Intelligent Surveillance &amp; Remote Visibility
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    IP and HD camera networks, NVR/DVR recording, and mobile monitoring engineered to protect commercial sites, retail outlets, and residences—even during grid outages.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services/cctv')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Security Solutions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>

            {/* Division 03: IT Solutions */}
            <article className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100">
                <ImageWithFallback
                  src={ASSETS.itInfrastructure}
                  alt="Structured Cat6a network cabling and enterprise server rack deployed by Teracore IT division"
                  category="it"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono font-medium text-blue-700">03 · IT &amp; Network Solutions</div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Connected Office Networks &amp; IT Support
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Structured Cat6a cabling, enterprise Wi-Fi, hardware procurement, server rack setups, and ongoing technical support that keep teams productive without network bottlenecks.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services/it')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore IT Solutions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section 5: Why Choose Teracore */}
      <section className="py-16 lg:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold text-emerald-700">Operational Standards</div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              Why Businesses and Homeowners Choose Teracore
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {WHY_TERACORE_BENEFITS.map((benefit) => (
              <div key={benefit.index} className="pt-5 border-t border-slate-200 space-y-2">
                <div className="font-mono text-xs font-medium text-slate-400 tabular-nums">{benefit.index}</div>
                <h3 className="font-display text-lg font-bold text-slate-900">{benefit.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Featured Projects & Interactive Filter */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="text-xs font-semibold text-emerald-700">Engineering Portfolio</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Reference Deployments &amp; Field Capabilities
              </h2>
              <p className="text-sm text-slate-600">
                Explore how Teracore architects reliable solar power, surveillance coverage, and structured business IT systems.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start">
              {(
                [
                  { id: 'all', label: 'All Divisions' },
                  { id: 'solar', label: 'Solar' },
                  { id: 'cctv', label: 'CCTV' },
                  { id: 'it', label: 'IT' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProjectFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    projectFilter === tab.id
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100">
                    <ImageWithFallback
                      src={project.imageUrl}
                      alt={project.title}
                      category={project.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-800 uppercase">{project.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{project.location}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                      <span className="font-semibold text-slate-700">Equipment: </span>
                      {project.equipmentUsed}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('/request-a-quote', {
                        prefillService: project.category,
                        prefillSummary: `Interested in similar setup: ${project.title}`,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Request Similar System</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <span>View Full Project Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 7: How We Work */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-emerald-700">Delivery Process</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              How Teracore Delivers Every Project
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step) => (
              <div key={step.step} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-mono text-sm font-bold text-emerald-700 tabular-nums">{step.step}</div>
                <h3 className="font-display text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Interactive Tools Banner */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Planning a Solar or Security Project?
              </h3>
              <p className="text-sm text-slate-600">
                Use our interactive engineering tools to estimate your inverter kVA load or CCTV camera and storage requirements before booking a site visit.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/services/solar')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Solar Load Estimator</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/services/cctv')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>CCTV Coverage Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Authentic Client Testimonials / Verification Policy */}
      <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-emerald-700">Client References</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Verified Customer Feedback
            </h2>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                >
                  <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                  <footer className="pt-3 border-t border-slate-100">
                    <div className="text-sm font-bold text-slate-900">{item.clientName}</div>
                    <div className="text-xs text-slate-500">
                      {item.organization} · {item.serviceReceived.toUpperCase()}
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authentic Verification Standard</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Teracore publishes client feedback only with explicit customer authorization. Prospective commercial and residential clients can request relevant site references directly during their technical consultation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
              >
                Request Client References
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section 9: Final Conversion Banner */}
      <section className="bg-navy-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Ready to Power, Protect and Upgrade Your Business?
            </h2>
            <p className="text-base text-slate-300">
              Let’s discuss your next solar energy, CCTV security, or IT infrastructure project with our engineering team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/request-a-quote')}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Talk to Teracore Today</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={buildWhatsAppUrl('Hello Teracore, I am ready to discuss a project.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap"
            >
              WhatsApp Consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
