import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { EnquiryServiceType } from '../types/teracore';
import { SmartQuoteForm } from '../components/SmartQuoteForm';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap';

interface QuotePageProps {
  prefillService?: EnquiryServiceType;
  prefillSummary?: string;
  prefillLocation?: string;
}

export function QuotePage({
  prefillService = 'solar',
  prefillSummary = '',
  prefillLocation = '',
}: QuotePageProps) {
  const [selectedLocation, setSelectedLocation] = useState(prefillLocation);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (prefillLocation) {
      setSelectedLocation(prefillLocation);
    }
  }, [prefillLocation]);

  return (
    <div>
      <section className="bg-navy-900 text-white py-14 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="text-xs font-semibold text-emerald-400">Request a Quote</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Smart Project &amp; Consultation Request
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Tell us which Teracore division you require and our adaptive form will capture only the technical details relevant to your project.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
            <div className="text-xs sm:text-sm text-slate-700">
              Need to look up or verify your exact site address on a map before submitting?
            </div>
            <button
              type="button"
              onClick={() => setShowMapPicker((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showMapPicker ? 'Hide Site Map Picker' : 'Pick Site on Map'}</span>
            </button>
          </div>

          {showMapPicker && (
            <ServiceCoverageMap
              title="Pin or Search Your Project Address"
              subtitle="Search your property address or click a point on the map, then select 'Use This Address in Form' to fill your site location automatically."
              onSelectAddress={(address) => {
                setSelectedLocation(address);
              }}
            />
          )}

          <SmartQuoteForm
            initialService={prefillService}
            initialSummary={prefillSummary}
            initialLocation={selectedLocation}
          />
        </div>
      </section>
    </div>
  );
}
