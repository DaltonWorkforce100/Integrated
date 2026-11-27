import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  LayoutList,
  LogOut,
  Plus,
  ShieldAlert,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  clearGoogleAccessToken,
  db,
  getGoogleAccessToken,
  signInWithGoogleAdmin,
} from '../firebase/client';
import {
  createInsight,
  createProject,
  createTestimonial,
  deleteEnquiry,
  deleteInsight,
  deleteProject,
  deleteTestimonial,
  subscribeAllInsights,
  subscribeAllProjects,
  subscribeAllTestimonials,
  subscribeEnquiries,
  toggleInsightPublished,
  toggleProjectPublished,
  toggleTestimonialApproved,
  updateEnquiryStatus,
} from '../services/firestoreService';
import { buildEnquiriesCsv, buildEnquiriesTsv } from '../services/googleSheetsService';
import { AdminSheetsPanel } from '../components/AdminSheetsPanel';
import { AdminFormsPanel } from '../components/AdminFormsPanel';
import type {
  EnquiryRecord,
  EnquiryServiceType,
  EnquiryStatus,
  InsightArticle,
  ProjectItem,
  ServiceDivision,
  TestimonialItem,
} from '../types/teracore';

type AdminTab = 'enquiries' | 'forms' | 'projects' | 'insights' | 'testimonials';
type EnquiriesViewMode = 'spreadsheet' | 'cards';

export function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sheetsAccessToken, setSheetsAccessToken] = useState<string | null>(() =>
    getGoogleAccessToken()
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('enquiries');
  const [enquiriesView, setEnquiriesView] = useState<EnquiriesViewMode>('spreadsheet');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);

  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [insights, setInsights] = useState<InsightArticle[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedTsv, setCopiedTsv] = useState(false);

  // New project form
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState<ServiceDivision>('solar');
  const [projLocation, setProjLocation] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projEquip, setProjEquip] = useState('');
  const [projResults, setProjResults] = useState('');

  // New insight form
  const [insTitle, setInsTitle] = useState('');
  const [insCategory, setInsCategory] = useState<ServiceDivision | 'general'>('solar');
  const [insSummary, setInsSummary] = useState('');
  const [insBody, setInsBody] = useState('');
  const [insReadTime, setInsReadTime] = useState('4 min read');

  // New testimonial form
  const [testClient, setTestClient] = useState('');
  const [testOrg, setTestOrg] = useState('');
  const [testService, setTestService] = useState<EnquiryServiceType>('solar');
  const [testQuote, setTestQuote] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSheetsAccessToken(currentUser ? getGoogleAccessToken() : null);
      setIsAuthorizedAdmin(currentUser ? null : false);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    async function verifyAdminAccess() {
      if (!user) {
        if (active) setIsAuthorizedAdmin(false);
        return;
      }
      if (!user.emailVerified) {
        if (active) setIsAuthorizedAdmin(false);
        return;
      }
      if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        if (active) setIsAuthorizedAdmin(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        if (active) setIsAuthorizedAdmin(snap.exists());
      } catch {
        if (active) setIsAuthorizedAdmin(false);
      }
    }
    void verifyAdminAccess();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || isAuthorizedAdmin !== true) return;
    setDataError(null);

    const handleErr = (err: Error) => {
      if (err.message.includes('Missing or insufficient permissions')) {
        setDataError(
          `Signed in as ${user.email}, which does not have administrator permissions in Firestore.`
        );
      } else {
        setDataError('Unable to load records right now.');
      }
    };

    const unsubEnq = subscribeEnquiries(setEnquiries, handleErr);
    const unsubProj = subscribeAllProjects(setProjects, handleErr);
    const unsubIns = subscribeAllInsights(setInsights, handleErr);
    const unsubTest = subscribeAllTestimonials(setTestimonials, handleErr);

    return () => {
      unsubEnq();
      unsubProj();
      unsubIns();
      unsubTest();
    };
  }, [user, isAuthorizedAdmin]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogleAdmin();
      setSheetsAccessToken(getGoogleAccessToken());
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const host = window.location.hostname || 'this domain';

      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Domain not authorized (${host}): this Firebase project only allows Google Sign-In on authorized domains (such as the AI Studio Shared App URL). To sign in on Vercel or a custom domain, configure your own Firebase project and add "${host}" under Authentication → Settings → Authorized domains.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site (or open the link in Chrome/Safari instead of an in-app browser) and try again.'
        );
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(
          'The Google sign-in popup was closed before completing sign-in. Please try again and keep the window open until sign-in finishes.'
        );
      } else {
        setAuthError(
          `Google sign-in failed${code ? ` (${code})` : ''}. Please allow popups and try again.`
        );
      }
    }
  };

  const handleSignOut = async () => {
    clearGoogleAccessToken();
    setSheetsAccessToken(null);
    await signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center text-sm text-slate-600">
        Verifying administrator session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 bg-slate-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5 text-center">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Teracore Staff Portal
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in with the authorized administrator Google account to manage customer enquiries, connect Google Sheets, and publish projects or insights.
            </p>
            {authError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left">
                {authError}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              className="inline-flex items-center justify-center gap-3 w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorizedAdmin === null) {
    return (
      <div className="py-24 text-center text-sm text-slate-600">
        Verifying administrator permissions...
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="py-20 bg-slate-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-red-200 rounded-xl p-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Access Restricted
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Signed in as <span className="font-semibold text-slate-900">{user.email}</span>. Only the authorized Teracore administrator account can access the Staff Portal.
            </p>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out &amp; Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredEnquiries = enquiries.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.fullName.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.serviceType.toLowerCase().includes(term) ||
      item.phone.toLowerCase().includes(term) ||
      (item.email ?? '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const handleExportCsv = () => {
    const csv = buildEnquiriesCsv(filteredEnquiries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teracore-customer-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyForSheets = async () => {
    const tsv = buildEnquiriesTsv(filteredEnquiries);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    } catch {
      handleExportCsv();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projLocation.trim() || !projDesc.trim() || !projEquip.trim()) return;
    await createProject({
      title: projTitle,
      category: projCategory,
      location: projLocation,
      description: projDesc,
      equipmentUsed: projEquip,
      results: projResults || undefined,
      published: true,
    });
    setProjTitle('');
    setProjLocation('');
    setProjDesc('');
    setProjEquip('');
    setProjResults('');
  };

  const handleCreateInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insTitle.trim() || !insSummary.trim() || !insBody.trim()) return;
    await createInsight({
      title: insTitle,
      category: insCategory,
      summary: insSummary,
      body: insBody,
      readTime: insReadTime,
      published: true,
    });
    setInsTitle('');
    setInsSummary('');
    setInsBody('');
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testClient.trim() || !testOrg.trim() || !testQuote.trim()) return;
    await createTestimonial({
      clientName: testClient,
      organization: testOrg,
      serviceReceived: testService,
      quote: testQuote,
      approved: true,
    });
    setTestClient('');
    setTestOrg('');
    setTestQuote('');
  };

  return (
    <div className="bg-slate-50 min-h-[75vh] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Teracore Operations Console
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Signed in as {user.email}
              {user.email === BOOTSTRAPPED_ADMIN_EMAIL ? ' · Authorized Administrator' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {dataError && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{dataError}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          {(
            [
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'forms', label: 'Google Forms' },
              { id: 'projects', label: `Projects (${projects.length})` },
              { id: 'insights', label: `Insights (${insights.length})` },
              { id: 'testimonials', label: `Testimonials (${testimonials.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Google Forms Management Tab */}
        {activeTab === 'forms' && (
          <AdminFormsPanel
            initialAccessToken={sheetsAccessToken}
            onTokenUpdated={setSheetsAccessToken}
          />
        )}

        {/* Tab 1: Enquiries (Backend Spreadsheet View + Google Sheets Sync) */}
        {activeTab === 'enquiries' && (
          <div className="space-y-5">
            <AdminSheetsPanel enquiries={enquiries} initialAccessToken={sheetsAccessToken} />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, email, location, or service..."
                    className="w-full sm:w-80 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | EnquiryStatus)}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setEnquiriesView('spreadsheet')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                        enquiriesView === 'spreadsheet'
                          ? 'bg-navy-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      <span>Spreadsheet View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiriesView('cards')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                        enquiriesView === 'cards'
                          ? 'bg-navy-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>Cards View</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={filteredEnquiries.length === 0}
                    onClick={() => void handleCopyForSheets()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedTsv ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied! Paste into Google Sheets</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copy for Google Sheets</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={filteredEnquiries.length === 0}
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {filteredEnquiries.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  No enquiries match your current filter.
                </div>
              ) : enquiriesView === 'spreadsheet' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 w-10 text-center">
                          #
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Submitted
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Client Name
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Phone / WhatsApp
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Email
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Division
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Location
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Contact Via
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Target Date
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-3 py-2.5 font-semibold border-r border-slate-200 whitespace-nowrap">
                          Requirements
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredEnquiries.map((enq, index) => (
                        <tr key={enq.id} className="hover:bg-slate-50/90 align-top">
                          <td className="px-3 py-2.5 border-r border-slate-200 text-center font-mono tabular-nums text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap font-mono tabular-nums text-slate-600">
                            {enq.createdAt ? enq.createdAt.toLocaleDateString() : '—'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap font-semibold text-slate-900">
                            {enq.fullName}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap font-mono tabular-nums text-slate-700">
                            {enq.phone}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap text-slate-600">
                            {enq.email || '—'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap uppercase font-semibold text-navy-900">
                            {enq.serviceType}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 max-w-[180px] truncate text-slate-700" title={enq.location}>
                            {enq.location}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap capitalize text-slate-600">
                            {enq.preferredContact}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap font-mono tabular-nums text-slate-600">
                            {enq.preferredDate || '—'}
                          </td>
                          <td className="px-2.5 py-2 border-r border-slate-200 whitespace-nowrap">
                            <select
                              value={enq.status}
                              onChange={(e) =>
                                void updateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                              }
                              aria-label={`Status for ${enq.fullName}`}
                              className="px-2 py-1 text-xs font-semibold border border-slate-300 rounded bg-white"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="quoted">Quoted</option>
                              <option value="completed">Completed</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 max-w-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedEnquiry(enq)}
                              className="text-left text-slate-700 hover:text-emerald-700 line-clamp-2 cursor-pointer"
                              title="Click to read full project details"
                            >
                              {enq.projectDescription}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void deleteEnquiry(enq.id)}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              aria-label={`Delete enquiry from ${enq.fullName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredEnquiries.map((enq) => (
                    <div key={enq.id} className="p-5 space-y-3 hover:bg-slate-50/70">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-display font-bold text-slate-900">
                            {enq.fullName}
                          </span>
                          <span className="text-xs text-slate-500 ml-2 font-mono tabular-nums">
                            {enq.phone}
                            {enq.email ? ` · ${enq.email}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={enq.status}
                            onChange={(e) =>
                              void updateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md bg-white"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="quoted">Quoted</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => void deleteEnquiry(enq.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                            aria-label="Delete enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-800 uppercase">
                          {enq.serviceType}
                        </span>
                        <span> · {enq.location}</span>
                        <span> · Contact via {enq.preferredContact}</span>
                        {enq.preferredDate && <span> · Target date: {enq.preferredDate}</span>}
                        {enq.createdAt && (
                          <span className="font-mono tabular-nums">
                            {' '}
                            · {enq.createdAt.toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-700">{enq.projectDescription}</p>
                      {enq.technicalSummary && (
                        <div className="text-xs font-mono text-slate-600 bg-slate-100 rounded-lg p-2.5">
                          {enq.technicalSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Enquiry Detail Modal (from Spreadsheet Row Click) */}
        {selectedEnquiry && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Customer Enquiry Details"
          >
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">{selectedEnquiry.id}</div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                    {selectedEnquiry.fullName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <div>
                  <div className="text-slate-500">Phone / WhatsApp</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {selectedEnquiry.phone}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Division</div>
                  <div className="uppercase font-semibold text-slate-900 mt-0.5">
                    {selectedEnquiry.serviceType}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Site Location</div>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {selectedEnquiry.location}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Preferred Contact</div>
                  <div className="capitalize font-medium text-slate-900 mt-0.5">
                    {selectedEnquiry.preferredContact}
                    {selectedEnquiry.preferredDate ? ` · ${selectedEnquiry.preferredDate}` : ''}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">Project Description</div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedEnquiry.projectDescription}
                </p>
              </div>
              {selectedEnquiry.technicalSummary && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700">Technical Specs</div>
                  <div className="text-xs font-mono text-slate-700 bg-slate-100 rounded-lg p-3">
                    {selectedEnquiry.technicalSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Projects */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => void handleCreateProject(e)}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 self-start"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Add Portfolio Project
              </h2>
              <input
                type="text"
                required
                placeholder="Project title"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value as ServiceDivision)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="solar">Solar</option>
                  <option value="cctv">CCTV</option>
                  <option value="it">IT</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Location (e.g. Enugu, Nigeria)"
                  value={projLocation}
                  onChange={(e) => setProjLocation(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Project description"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="Equipment or solution used"
                value={projEquip}
                onChange={(e) => setProjEquip(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Documented result (optional)"
                value={projResults}
                onChange={(e) => setProjResults(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Project</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {projects.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No custom projects added in Firestore yet. Built-in reference architectures remain displayed on the public site.
                </div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 uppercase font-semibold">
                        {p.category} · {p.location} · {p.published ? 'Published' : 'Hidden'}
                      </div>
                      <div className="font-display font-bold text-slate-900">{p.title}</div>
                      <p className="text-xs text-slate-600">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void toggleProjectPublished(p.id, !p.published)}
                        className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        {p.published ? 'Hide' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProject(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Insights */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => void handleCreateInsight(e)}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 self-start"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Publish Insight Article
              </h2>
              <input
                type="text"
                required
                placeholder="Article title"
                value={insTitle}
                onChange={(e) => setInsTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={insCategory}
                  onChange={(e) => setInsCategory(e.target.value as ServiceDivision | 'general')}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="solar">Solar</option>
                  <option value="cctv">CCTV</option>
                  <option value="it">IT</option>
                  <option value="general">General</option>
                </select>
                <input
                  type="text"
                  placeholder="Read time (e.g. 5 min read)"
                  value={insReadTime}
                  onChange={(e) => setInsReadTime(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <textarea
                rows={2}
                required
                placeholder="Short summary"
                value={insSummary}
                onChange={(e) => setInsSummary(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <textarea
                rows={5}
                required
                placeholder="Full article content"
                value={insBody}
                onChange={(e) => setInsBody(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Article</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {insights.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No custom insight articles added in Firestore yet.
                </div>
              ) : (
                insights.map((art) => (
                  <div key={art.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 uppercase font-semibold">
                        {art.category} · {art.readTime} · {art.published ? 'Published' : 'Draft'}
                      </div>
                      <div className="font-display font-bold text-slate-900">{art.title}</div>
                      <p className="text-xs text-slate-600">{art.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void toggleInsightPublished(art.id, !art.published)}
                        className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        {art.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteInsight(art.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Testimonials */}
        {activeTab === 'testimonials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => void handleCreateTestimonial(e)}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 self-start"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Add Verified Client Testimonial
              </h2>
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Only publish authentic feedback received with client permission.</span>
              </div>
              <input
                type="text"
                required
                placeholder="Client or Representative Name"
                value={testClient}
                onChange={(e) => setTestClient(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Business / Organization"
                  value={testOrg}
                  onChange={(e) => setTestOrg(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <select
                  value={testService}
                  onChange={(e) => setTestService(e.target.value as EnquiryServiceType)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="solar">Solar</option>
                  <option value="cctv">CCTV</option>
                  <option value="it">IT</option>
                  <option value="multiple">Multiple</option>
                </select>
              </div>
              <textarea
                rows={4}
                required
                placeholder="Verified client quote"
                value={testQuote}
                onChange={(e) => setTestQuote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Approved Testimonial</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {testimonials.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No verified client testimonials published yet.
                </div>
              ) : (
                testimonials.map((t) => (
                  <div key={t.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 uppercase font-semibold">
                        {t.organization} · {t.serviceReceived} · {t.approved ? 'Approved' : 'Hidden'}
                      </div>
                      <div className="font-display font-bold text-slate-900">{t.clientName}</div>
                      <p className="text-xs text-slate-600">“{t.quote}”</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void toggleTestimonialApproved(t.id, !t.approved)}
                        className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        {t.approved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTestimonial(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label="Delete testimonial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
