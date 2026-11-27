import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServiceSolarPage } from './pages/ServiceSolarPage';
import { ServiceCctvPage } from './pages/ServiceCctvPage';
import { ServiceItPage } from './pages/ServiceItPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ContactPage } from './pages/ContactPage';
import { QuotePage } from './pages/QuotePage';
import { LegalPage } from './pages/LegalPage';
import { AdminPage } from './pages/AdminPage';
import { DEFAULT_INSIGHTS, REFERENCE_PROJECTS } from './data/teracoreData';
import {
  fetchApprovedTestimonials,
  fetchPublishedInsights,
  fetchPublishedProjects,
} from './services/firestoreService';
import type {
  EnquiryServiceType,
  InsightArticle,
  ProjectItem,
  ServiceDivision,
  TestimonialItem,
} from './types/teracore';

interface NavState {
  prefillService?: EnquiryServiceType;
  prefillSummary?: string;
  prefillLocation?: string;
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Teracore Integrated Solution – Solar Energy, CCTV Security & IT Solutions',
    description:
      'Teracore Integrated Solution delivers dependable solar energy systems, intelligent CCTV security, and professional IT solutions for homes and businesses across Nigeria.',
  },
  '/about': {
    title: 'About Teracore Integrated Solution | Steve Onwubiko, CEO',
    description:
      'Learn about Teracore Integrated Solution, our engineering standards, and Chief Executive Officer Steve Onwubiko.',
  },
  '/services/solar': {
    title: 'Solar Energy & Hybrid Inverter Installations | Teracore Integrated Solution',
    description:
      'Residential and commercial solar PV, hybrid inverters, lithium battery storage, and interactive solar load sizing by Teracore Integrated Solution.',
  },
  '/services/cctv': {
    title: 'CCTV & IP Security Camera Installations | Teracore Integrated Solution',
    description:
      'Commercial and residential IP camera networks, NVR storage, remote monitoring, and security assessments by Teracore Integrated Solution.',
  },
  '/services/it': {
    title: 'Business IT Infrastructure & Structured Cabling | Teracore Integrated Solution',
    description:
      'Enterprise office networking, Cat6a cabling, server racks, hardware supply, and ongoing business IT support by Teracore Integrated Solution.',
  },
  '/projects': {
    title: 'Projects & Reference Architectures | Teracore Integrated Solution',
    description:
      'Explore Teracore Integrated Solution deployments and engineering architectures across solar power, CCTV security, and IT networking.',
  },
  '/insights': {
    title: 'Technical Insights & Guides | Teracore Integrated Solution',
    description:
      'Practical engineering guides on sizing solar inverters, selecting IP CCTV cameras, and building reliable business networks.',
  },
  '/contact': {
    title: 'Contact Teracore Integrated Solution | Consultation & Enquiries',
    description:
      'Contact Teracore Integrated Solution via WhatsApp, phone, email, or online enquiry for solar, CCTV, and IT projects.',
  },
  '/request-a-quote': {
    title: 'Request a Quote | Teracore Integrated Solution',
    description:
      'Submit a tailored project quote request for solar energy, CCTV surveillance, or business IT infrastructure.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Teracore Integrated Solution',
    description: 'How Teracore Integrated Solution collects, protects, and handles client enquiry information.',
  },
  '/terms': {
    title: 'Terms & Conditions | Teracore Integrated Solution',
    description: 'Service terms governing Teracore Integrated Solution engineering estimates, site assessments, and installations.',
  },
  '/admin': {
    title: 'Staff Operations Console | Teracore Integrated Solution',
    description: 'Authorized staff console for managing enquiries, projects, and insights.',
  },
};

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navState, setNavState] = useState<NavState>({});
  const [projects, setProjects] = useState<ProjectItem[]>(REFERENCE_PROJECTS);
  const [insights, setInsights] = useState<InsightArticle[]>(DEFAULT_INSIGHTS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const normalized = currentPath === '/blog' ? '/insights' : currentPath;
    const meta = PAGE_META[normalized] ?? PAGE_META['/'];
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', meta.description);
    }
  }, [currentPath]);

  useEffect(() => {
    let active = true;
    async function hydratePublicContent() {
      try {
        const [dbProjects, dbInsights, dbTestimonials] = await Promise.all([
          fetchPublishedProjects(),
          fetchPublishedInsights(),
          fetchApprovedTestimonials(),
        ]);
        if (!active) return;
        if (dbProjects.length > 0) {
          setProjects([...dbProjects, ...REFERENCE_PROJECTS]);
        }
        if (dbInsights.length > 0) {
          setInsights([...dbInsights, ...DEFAULT_INSIGHTS]);
        }
        if (dbTestimonials.length > 0) {
          setTestimonials(dbTestimonials);
        }
      } catch {
        // Fallback smoothly to built-in verified reference content if Firestore public read is empty/offline
      }
    }
    void hydratePublicContent();
    return () => {
      active = false;
    };
  }, []);

  const navigate = (
    path: string,
    state?: {
      prefillService?: ServiceDivision | EnquiryServiceType;
      prefillSummary?: string;
      prefillLocation?: string;
    }
  ) => {
    const target = path || '/';
    if (target !== currentPath) {
      window.history.pushState({}, '', target);
      setCurrentPath(target);
    }
    setNavState(state ?? {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    const normalized = currentPath === '/blog' ? '/insights' : currentPath;

    switch (normalized) {
      case '/':
        return <HomePage onNavigate={navigate} projects={projects} testimonials={testimonials} />;
      case '/about':
        return <AboutPage onNavigate={navigate} />;
      case '/services/solar':
        return <ServiceSolarPage projects={projects} />;
      case '/services/cctv':
        return <ServiceCctvPage projects={projects} />;
      case '/services/it':
        return <ServiceItPage projects={projects} />;
      case '/projects':
        return <ProjectsPage projects={projects} onNavigate={navigate} />;
      case '/insights':
        return <InsightsPage insights={insights} onNavigate={navigate} />;
      case '/contact':
        return <ContactPage onNavigate={navigate} />;
      case '/request-a-quote':
        return (
          <QuotePage
            prefillService={navState.prefillService}
            prefillSummary={navState.prefillSummary}
            prefillLocation={navState.prefillLocation}
          />
        );
      case '/privacy-policy':
        return <LegalPage mode="privacy" />;
      case '/terms':
        return <LegalPage mode="terms" />;
      case '/admin':
        return <AdminPage />;
      default:
        return <HomePage onNavigate={navigate} projects={projects} testimonials={testimonials} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">{renderPage()}</main>
      <Footer onNavigate={navigate} />
      <FloatingActions currentPath={currentPath} onNavigate={navigate} />
    </div>
  );
}
