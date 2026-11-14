import { BrandMark } from './BrandMark';
import { TERACORE_BRAND, buildWhatsAppUrl } from '../data/teracoreData';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="inline-block focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-md"
            >
              <BrandMark inverted />
            </a>
            <p className="text-sm leading-relaxed text-slate-400">
              Delivering dependable solar energy systems, intelligent CCTV security, and professional IT infrastructure for homes and businesses across Nigeria.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {TERACORE_BRAND.tagline}
            </p>
          </div>

          {/* Column 2: Service Divisions */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Service Divisions</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/services/solar"
                  onClick={(e) => handleLink(e, '/services/solar')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Solar Energy Solutions
                </a>
              </li>
              <li>
                <a
                  href="/services/cctv"
                  onClick={(e) => handleLink(e, '/services/cctv')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  CCTV &amp; Security Systems
                </a>
              </li>
              <li>
                <a
                  href="/services/it"
                  onClick={(e) => handleLink(e, '/services/it')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  IT &amp; Network Solutions
                </a>
              </li>
              <li>
                <a
                  href="/request-a-quote"
                  onClick={(e) => handleLink(e, '/request-a-quote')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Request a Free Quote
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  About Teracore &amp; Leadership
                </a>
              </li>
              <li>
                <a
                  href="/projects"
                  onClick={(e) => handleLink(e, '/projects')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Projects &amp; Case Studies
                </a>
              </li>
              <li>
                <a
                  href="/insights"
                  onClick={(e) => handleLink(e, '/insights')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Insights &amp; Guides
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLink(e, '/contact')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  onClick={(e) => handleLink(e, '/admin')}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Staff Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">Consultation Desk</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>{TERACORE_BRAND.headquarters}</li>
              <li>{TERACORE_BRAND.operatingAreas}</li>
              <li>
                <a href={TERACORE_BRAND.phoneHref} className="text-white hover:text-emerald-400 transition-colors font-mono tabular-nums">
                  {TERACORE_BRAND.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${TERACORE_BRAND.email}`} className="text-slate-300 hover:text-white transition-colors">
                  {TERACORE_BRAND.email}
                </a>
              </li>
              <li className="pt-1">
                <a
                  href={buildWhatsAppUrl('Hello Teracore, I would like to schedule a consultation.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {TERACORE_BRAND.name}. All rights reserved. Led by {TERACORE_BRAND.ceoName}, {TERACORE_BRAND.ceoTitle}.</p>
          <div className="flex items-center gap-6">
            <a
              href="/privacy-policy"
              onClick={(e) => handleLink(e, '/privacy-policy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLink(e, '/terms')}
              className="hover:text-white transition-colors"
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
