import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X, Sun, Shield, Server, PhoneCall } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { TERACORE_BRAND, buildWhatsAppUrl } from '../data/teracoreData';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLink = (path: string) => {
    setServicesOpen(false);
    setMobileOpen(false);
    onNavigate(path);
  };

  const isServiceActive = currentPath.startsWith('/services');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleLink('/');
          }}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 rounded-md whitespace-nowrap shrink-0"
          aria-label="Teracore Home"
        >
          <BrandMark />
        </a>

        {/* Zone 2: 5 Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Main navigation">
          <a
            href="/about"
            onClick={(e) => {
              e.preventDefault();
              handleLink('/about');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 ${
              currentPath === '/about' ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8' : ''
            }`}
          >
            About Us
          </a>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setServicesOpen((prev) => !prev)}
              aria-expanded={servicesOpen}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 cursor-pointer ${
                isServiceActive ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8' : ''
              }`}
            >
              <span>Services</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicesOpen && (
              <div className="absolute left-0 mt-3 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
                <button
                  type="button"
                  onClick={() => handleLink('/services/solar')}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <Sun className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Solar Energy Solutions</div>
                    <div className="text-xs text-slate-500 mt-0.5">Hybrid inverters, PV arrays &amp; lithium storage</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('/services/cctv')}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <Shield className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">CCTV &amp; Security Systems</div>
                    <div className="text-xs text-slate-500 mt-0.5">IP cameras, NVR storage &amp; remote monitoring</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('/services/it')}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">IT &amp; Network Solutions</div>
                    <div className="text-xs text-slate-500 mt-0.5">Structured cabling, hardware &amp; business support</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <a
            href="/projects"
            onClick={(e) => {
              e.preventDefault();
              handleLink('/projects');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 ${
              currentPath === '/projects' ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8' : ''
            }`}
          >
            Projects
          </a>

          <a
            href="/insights"
            onClick={(e) => {
              e.preventDefault();
              handleLink('/insights');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 ${
              currentPath === '/insights' ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8' : ''
            }`}
          >
            Insights
          </a>

          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleLink('/contact');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 ${
              currentPath === '/contact' ? 'text-slate-900 font-semibold underline decoration-emerald-600 decoration-2 underline-offset-8' : ''
            }`}
          >
            Contact
          </a>
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/request-a-quote"
            onClick={(e) => {
              e.preventDefault();
              handleLink('/request-a-quote');
            }}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Get a Free Quote
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1">
          <button
            type="button"
            onClick={() => handleLink('/')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLink('/about')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            About Us
          </button>
          <div className="pt-1 pb-1 pl-3 border-l border-slate-200 ml-3 space-y-1">
            <div className="px-3 py-1 text-xs font-semibold text-slate-400">Service Divisions</div>
            <button
              type="button"
              onClick={() => handleLink('/services/solar')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Solar Energy Solutions
            </button>
            <button
              type="button"
              onClick={() => handleLink('/services/cctv')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              CCTV &amp; Security Systems
            </button>
            <button
              type="button"
              onClick={() => handleLink('/services/it')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              IT &amp; Network Solutions
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleLink('/projects')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => handleLink('/insights')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Insights
          </button>
          <button
            type="button"
            onClick={() => handleLink('/contact')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg"
          >
            Contact
          </button>
          <div className="pt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleLink('/request-a-quote')}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-center"
            >
              Get a Free Quote
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={TERACORE_BRAND.phoneHref}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Desk</span>
              </a>
              <a
                href={buildWhatsAppUrl('Hello Teracore, I would like to discuss a Solar, CCTV, or IT project.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
