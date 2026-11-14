import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { submitEnquiry } from '../services/firestoreService';
import { buildWhatsAppUrl } from '../data/teracoreData';
import type { EnquiryServiceType, PreferredContactMethod } from '../types/teracore';

interface SmartQuoteFormProps {
  initialService?: EnquiryServiceType;
  initialSummary?: string;
  initialLocation?: string;
  lockService?: boolean;
  heading?: string;
  subheading?: string;
}

export function SmartQuoteForm({
  initialService = 'solar',
  initialSummary = '',
  initialLocation = '',
  lockService = false,
  heading = 'Request a Tailored Engineering Quote',
  subheading = 'Select the service division you need and our team will prepare a structured assessment.',
}: SmartQuoteFormProps) {
  const [serviceType, setServiceType] = useState<EnquiryServiceType>(initialService);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(initialLocation);
  const [preferredContact, setPreferredContact] = useState<PreferredContactMethod>('whatsapp');
  const [preferredDate, setPreferredDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Solar-specific fields
  const [solarPropertyType, setSolarPropertyType] = useState('Residential Home');
  const [solarPowerSituation, setSolarPowerSituation] = useState('Unstable Grid + Generator');
  const [solarLoadScale, setSolarLoadScale] = useState('Medium (3-5 Bedroom / Small Office)');

  // CCTV-specific fields
  const [cctvPropertyType, setCctvPropertyType] = useState('Commercial / Office');
  const [cctvLocationsCount, setCctvLocationsCount] = useState('Single Premises');
  const [cctvCameraCount, setCctvCameraCount] = useState('5–8 Cameras');

  // IT-specific fields
  const [itServiceNeeded, setItServiceNeeded] = useState('Structured Cabling & Office Wi-Fi');
  const [itCompanySize, setItCompanySize] = useState('10–30 Staff');
  const [itDeviceCount, setItDeviceCount] = useState('11–30 Devices');

  // Multiple-service checkboxes
  const [multiDivisions, setMultiDivisions] = useState<string[]>(['Solar Energy', 'CCTV Security']);

  const [estimatorNotes, setEstimatorNotes] = useState(initialSummary);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSummary) {
      setEstimatorNotes(initialSummary);
    }
  }, [initialSummary]);

  useEffect(() => {
    setServiceType(initialService);
  }, [initialService]);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const toggleMultiDivision = (label: string) => {
    setMultiDivisions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const buildTechnicalSummary = (): string => {
    const parts: string[] = [];
    if (serviceType === 'solar') {
      parts.push(`Property: ${solarPropertyType}`, `Power Challenge: ${solarPowerSituation}`, `Scale: ${solarLoadScale}`);
    } else if (serviceType === 'cctv') {
      parts.push(`Property: ${cctvPropertyType}`, `Sites: ${cctvLocationsCount}`, `Coverage: ${cctvCameraCount}`);
    } else if (serviceType === 'it') {
      parts.push(`Scope: ${itServiceNeeded}`, `Team: ${itCompanySize}`, `Devices: ${itDeviceCount}`);
    } else if (serviceType === 'multiple') {
      parts.push(`Divisions: ${multiDivisions.join(', ') || 'Multiple'}`);
    }
    if (estimatorNotes.trim()) {
      parts.push(`Estimator Notes: ${estimatorNotes.trim()}`);
    }
    return parts.join(' | ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (phone.trim().length < 6) {
      setErrorMsg('Please enter a valid phone or WhatsApp number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address or leave it blank.');
      return;
    }
    if (location.trim().length < 2) {
      setErrorMsg('Please enter your city or site location.');
      return;
    }
    if (projectDescription.trim().length < 5) {
      setErrorMsg('Please provide a brief description of your requirements.');
      return;
    }

    setSubmitting(true);
    try {
      const refId = await submitEnquiry({
        fullName,
        phone,
        email: email.trim() || undefined,
        serviceType,
        location,
        preferredContact,
        preferredDate: preferredDate || undefined,
        projectDescription,
        technicalSummary: buildTechnicalSummary(),
      });
      setSubmittedId(refId);
    } catch {
      setErrorMsg(
        'We could not save your enquiry right now. Please try again or reach us directly on WhatsApp.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    const waText = `Hello Teracore, I just submitted an enquiry (Ref: ${submittedId}) for ${serviceType.toUpperCase()} in ${location}. Name: ${fullName}.`;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-slate-900">
              Enquiry Received Successfully
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{fullName}</span>. Your consultation request has been logged securely with our engineering desk.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-700 font-mono tabular-nums">
              Reference ID: {submittedId}
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={buildWhatsAppUrl(waText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Follow Up on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  setProjectDescription('');
                  setEstimatorNotes('');
                }}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
              >
                Submit Another Enquiry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">{heading}</h3>
        <p className="text-sm text-slate-600 mt-1">{subheading}</p>
      </div>

      {/* Step 1: Service Division Selector */}
      {!lockService && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            1. What service division do you need?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(
              [
                { value: 'solar', label: 'Solar Energy' },
                { value: 'cctv', label: 'CCTV Security' },
                { value: 'it', label: 'IT Solutions' },
                { value: 'multiple', label: 'Multiple' },
                { value: 'general', label: 'General' },
              ] as { value: EnquiryServiceType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setServiceType(opt.value)}
                className={`px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  serviceType === opt.value
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Service-Specific Technical Fields */}
      {serviceType === 'solar' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Type</label>
            <select
              value={solarPropertyType}
              onChange={(e) => setSolarPropertyType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Residential Home</option>
              <option>Commercial Office</option>
              <option>Retail / Clinic / Hospitality</option>
              <option>Warehouse / Industrial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Power Situation</label>
            <select
              value={solarPowerSituation}
              onChange={(e) => setSolarPowerSituation(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Unstable Grid + Generator</option>
              <option>High Diesel / Fuel Costs</option>
              <option>New Construction / Off-Grid</option>
              <option>Upgrading Existing Inverter</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimated Requirement</label>
            <select
              value={solarLoadScale}
              onChange={(e) => setSolarLoadScale(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Compact (1-2 Bed / Essential Loads)</option>
              <option>Medium (3-5 Bedroom / Small Office)</option>
              <option>Large (Inverter ACs + Full Office)</option>
              <option>Commercial 3-Phase Microgrid</option>
            </select>
          </div>
        </div>
      )}

      {serviceType === 'cctv' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Type</label>
            <select
              value={cctvPropertyType}
              onChange={(e) => setCctvPropertyType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Commercial / Office</option>
              <option>Residential Home / Estate</option>
              <option>Warehouse / Factory</option>
              <option>Retail Store / Showroom</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Number of Locations</label>
            <select
              value={cctvLocationsCount}
              onChange={(e) => setCctvLocationsCount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Single Premises</option>
              <option>2–3 Branch Locations</option>
              <option>4+ Multi-Site Rollout</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimated Camera Coverage</label>
            <select
              value={cctvCameraCount}
              onChange={(e) => setCctvCameraCount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>1–4 Cameras</option>
              <option>5–8 Cameras</option>
              <option>9–16 Cameras</option>
              <option>17+ Cameras / Perimeter</option>
            </select>
          </div>
        </div>
      )}

      {serviceType === 'it' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">IT Service Required</label>
            <select
              value={itServiceNeeded}
              onChange={(e) => setItServiceNeeded(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>Structured Cabling &amp; Office Wi-Fi</option>
              <option>Server Rack &amp; Network Setup</option>
              <option>Workstations &amp; Hardware Supply</option>
              <option>Ongoing Business IT Support</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Size</label>
            <select
              value={itCompanySize}
              onChange={(e) => setItCompanySize(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>1–9 Staff</option>
              <option>10–30 Staff</option>
              <option>31–100 Staff</option>
              <option>100+ Staff / Multi-Floor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Devices / Endpoints</label>
            <select
              value={itDeviceCount}
              onChange={(e) => setItDeviceCount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            >
              <option>1–10 Devices</option>
              <option>11–30 Devices</option>
              <option>31–75 Devices</option>
              <option>75+ Devices</option>
            </select>
          </div>
        </div>
      )}

      {serviceType === 'multiple' && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Select All Required Divisions
          </label>
          <div className="flex flex-wrap gap-2">
            {['Solar Energy', 'CCTV Security', 'IT & Networking'].map((label) => {
              const active = multiDivisions.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleMultiDivision(label)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {estimatorNotes && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700">
          <div className="font-semibold text-slate-900 mb-1">Attached Estimator Summary</div>
          <div className="font-mono">{estimatorNotes}</div>
        </div>
      )}

      {/* Standard Contact Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div>
          <label htmlFor="quote-fullname" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Name *
          </label>
          <input
            id="quote-fullname"
            type="text"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Chinedu Okafor"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label htmlFor="quote-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Phone / WhatsApp Number *
          </label>
          <input
            id="quote-phone"
            type="tel"
            required
            maxLength={32}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +234 803 000 0000"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label htmlFor="quote-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address (Optional)
          </label>
          <input
            id="quote-email"
            type="email"
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label htmlFor="quote-location" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Site Location / City *
          </label>
          <input
            id="quote-location"
            type="text"
            required
            maxLength={160}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lekki Phase 1, Lagos"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Contact Method</label>
          <select
            value={preferredContact}
            onChange={(e) => setPreferredContact(e.target.value as PreferredContactMethod)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Direct Phone Call</option>
            <option value="email">Email Proposal</option>
          </select>
        </div>
        <div>
          <label htmlFor="quote-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Preferred Consultation Date (Optional)
          </label>
          <input
            id="quote-date"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="quote-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Project Description &amp; Requirements *
        </label>
        <textarea
          id="quote-description"
          rows={4}
          required
          maxLength={2000}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe your property, appliances/load, camera blind spots, or office network scope..."
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
        />
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{submitting ? 'Submitting Request...' : 'Submit Consultation Request'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500">
          Your details are handled privately per our data protection policy.
        </span>
      </div>
    </form>
  );
}
