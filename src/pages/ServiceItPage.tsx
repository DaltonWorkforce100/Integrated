import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ASSETS, IT_FAQS } from '../data/teracoreData';
import type { ProjectItem } from '../types/teracore';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { SmartQuoteForm } from '../components/SmartQuoteForm';

interface ServiceItPageProps {
  projects: ProjectItem[];
}

export function ServiceItPage({ projects }: ServiceItPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const itProjects = projects.filter((p) => p.category === 'it');

  const scrollToForm = () => {
    document.getElementById('it-consultation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* 1. IT Hero & Introduction */}
      <section className="bg-navy-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div className="text-xs font-mono font-medium text-blue-400">
              Division 03 · IT &amp; Network Solutions
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Smarter Technology for a Connected Business.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Eliminate office network drops, messy cabling, and recurring workstation downtime with structured Cat6a networks, enterprise Wi-Fi, hardware provisioning, and responsive IT support.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Request an IT Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto rounded-xl overflow-hidden border border-slate-800">
            <ImageWithFallback
              src={ASSETS.itInfrastructure}
              alt="Structured network server rack and enterprise cabling installed by Teracore"
              category="it"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2-8. Core IT Capabilities */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Business Technology &amp; Network Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Practical IT engineering designed to keep offices fast, documented, and dependable every working day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Computer & Hardware Solutions',
                desc: 'Procurement, imaging, and workstation setup for business laptops, desktops, printers, UPS backups, and conference room peripherals.',
              },
              {
                title: 'Network Installation & Configuration',
                desc: 'Managed switches, enterprise Wi-Fi access points, VLAN segmentation, and dual-WAN failover routers configured for uninterrupted office connectivity.',
              },
              {
                title: 'Structured Cabling',
                desc: 'Clean, labelled Cat6/Cat6a Ethernet and fiber optic backbone runs terminated cleanly into wall faceplates and ventilated patch panels.',
              },
              {
                title: 'IT Infrastructure & Server Racks',
                desc: 'Organized 12U to 42U server cabinets, airflow management, rack-mounted UPS protection, and on-premise file/backup storage.',
              },
              {
                title: 'Systems Setup & Troubleshooting',
                desc: 'Rapid fault isolation for slow networks, printer sharing issues, workstation bottlenecks, and office relocation IT cutovers.',
              },
              {
                title: 'Ongoing IT Support & Maintenance',
                desc: 'Scheduled preventative checkups, firmware updates, endpoint hygiene, and direct helpdesk escalation for growing organizations.',
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

      {/* Featured IT Projects & FAQs */}
      <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">IT Reference Architecture</h2>
            <div className="space-y-4">
              {itProjects.map((proj) => (
                <div key={proj.id} className="p-6 bg-white border border-slate-200 rounded-xl space-y-2.5">
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
            <h2 className="font-display text-2xl font-bold text-slate-900">IT Frequently Asked Questions</h2>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {IT_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={faq.q}>
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

      {/* 11. Request IT Consultation Form */}
      <section id="it-consultation-form" className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SmartQuoteForm
            initialService="it"
            lockService
            heading="Request an IT Consultation"
            subheading="Share your team size, device count, and networking requirements for a structured IT proposal."
          />
        </div>
      </section>
    </div>
  );
}
