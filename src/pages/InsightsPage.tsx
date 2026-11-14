import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { InsightArticle, ServiceDivision } from '../types/teracore';

interface InsightsPageProps {
  insights: InsightArticle[];
  onNavigate: (path: string, state?: { prefillService?: ServiceDivision; prefillSummary?: string }) => void;
}

export function InsightsPage({ insights, onNavigate }: InsightsPageProps) {
  const [filter, setFilter] = useState<'all' | ServiceDivision | 'general'>('all');
  const [selectedArticle, setSelectedArticle] = useState<InsightArticle | null>(null);

  const visible =
    filter === 'all' ? insights : insights.filter((article) => article.category === filter);

  if (selectedArticle) {
    const serviceToPrefill: ServiceDivision | undefined =
      selectedArticle.category === 'solar' ||
      selectedArticle.category === 'cctv' ||
      selectedArticle.category === 'it'
        ? selectedArticle.category
        : undefined;

    return (
      <div className="py-12 lg:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Insights</span>
          </button>

          <article className="space-y-6">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800 uppercase">{selectedArticle.category}</span>
              <span aria-hidden="true"> · </span>
              <span>{selectedArticle.readTime}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {selectedArticle.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-b border-slate-200 pb-6">
              {selectedArticle.summary}
            </p>
            <div className="text-base text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
              {selectedArticle.body}
            </div>
          </article>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Need Technical Advice?</h2>
              <p className="text-sm text-slate-600 mt-1">
                Speak with a Teracore engineer about your property or business requirements.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onNavigate('/request-a-quote', {
                  prefillService: serviceToPrefill,
                  prefillSummary: `Enquiry from article: ${selectedArticle.title}`,
                })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Request Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-navy-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-semibold text-emerald-400">Teracore Insights</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl">
            Technical Guides &amp; Practical Infrastructure Insights
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Clear guidance on solar system sizing, CCTV surveillance planning, and resilient business IT networks in Nigeria.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            {(
              [
                { id: 'all', label: 'All Guides' },
                { id: 'solar', label: 'Solar' },
                { id: 'cctv', label: 'CCTV' },
                { id: 'it', label: 'IT' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-800 uppercase">{article.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{article.readTime}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{article.summary}</p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
