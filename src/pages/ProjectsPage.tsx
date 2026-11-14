import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ProjectItem, ServiceDivision } from '../types/teracore';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface ProjectsPageProps {
  projects: ProjectItem[];
  onNavigate: (path: string, state?: { prefillService?: ServiceDivision; prefillSummary?: string }) => void;
}

export function ProjectsPage({ projects, onNavigate }: ProjectsPageProps) {
  const [filter, setFilter] = useState<'all' | ServiceDivision>('all');

  const visibleProjects =
    filter === 'all' ? projects : projects.filter((project) => project.category === filter);

  return (
    <div>
      <section className="bg-navy-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-xs font-semibold text-emerald-400">Projects &amp; Case Studies</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl">
            Engineering Capabilities in Action
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            Explore completed deployments and technical reference architectures across Solar Energy, CCTV Surveillance, and Business IT Infrastructure.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start">
              {(
                [
                  { id: 'all', label: 'All Projects' },
                  { id: 'solar', label: 'Solar Energy' },
                  { id: 'cctv', label: 'CCTV Security' },
                  { id: 'it', label: 'IT Solutions' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Showing {visibleProjects.length} {visibleProjects.length === 1 ? 'deployment' : 'deployments'}
            </div>
          </div>

          {visibleProjects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">No projects published in this category yet.</p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Show all divisions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProjects.map((project) => (
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
                      <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
                        {project.title}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                        <div>
                          <span className="font-semibold text-slate-700">Equipment: </span>
                          {project.equipmentUsed}
                        </div>
                        {project.results && (
                          <div>
                            <span className="font-semibold text-slate-700">Outcome: </span>
                            {project.results}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('/request-a-quote', {
                          prefillService: project.category,
                          prefillSummary: `Requesting quote similar to: ${project.title}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      <span>Enquire About Similar Setup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
