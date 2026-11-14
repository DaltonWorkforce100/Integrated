import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

interface CctvAssistantProps {
  onApplyToQuote: (summary: string) => void;
}

export function CctvAssistant({ onApplyToQuote }: CctvAssistantProps) {
  const [propertyType, setPropertyType] = useState<'Residential' | 'Commercial Office' | 'Warehouse / Retail'>('Commercial Office');
  const [entryPoints, setEntryPoints] = useState(2);
  const [perimeterZones, setPerimeterZones] = useState(3);
  const [indoorZones, setIndoorZones] = useState(3);
  const [retentionDays, setRetentionDays] = useState<14 | 30 | 60>(30);
  const [includeBackup, setIncludeBackup] = useState(true);

  const plan = useMemo(() => {
    const outdoorCameras = entryPoints + perimeterZones;
    const totalCameras = outdoorCameras + indoorZones;
    const nvrChannels = totalCameras <= 4 ? 4 : totalCameras <= 8 ? 8 : totalCameras <= 16 ? 16 : 32;
    // Approx 25 GB/day per 4MP H.265 camera continuous recording
    const estimatedTb = Math.max(1, Math.ceil((totalCameras * 25 * retentionDays) / 1000));

    return {
      outdoorCameras,
      indoorCameras: indoorZones,
      totalCameras,
      nvrChannels,
      estimatedTb,
    };
  }, [entryPoints, perimeterZones, indoorZones, retentionDays]);

  const handleApply = () => {
    const summary = `CCTV Preliminary Scope: ${propertyType} | ${plan.totalCameras} Cameras (${plan.outdoorCameras} Outdoor IP/HD, ${plan.indoorCameras} Indoor) | ${plan.nvrChannels}-Channel NVR | ~${plan.estimatedTb} TB Storage (${retentionDays}-day retention) | Dedicated Backup Power: ${includeBackup ? 'Yes' : 'No'}`;
    onApplyToQuote(summary);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-200">
        <h3 className="font-display text-xl font-bold text-slate-900">
          CCTV Coverage &amp; Storage Assistant
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Configure your property entry points and retention window to estimate camera topology and NVR sizing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Property Environment</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['Residential', 'Commercial Office', 'Warehouse / Retail'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPropertyType(type)}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                    propertyType === type
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cctv-entries" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gates &amp; Main Entrances
              </label>
              <input
                id="cctv-entries"
                type="number"
                min={1}
                max={20}
                value={entryPoints}
                onChange={(e) => setEntryPoints(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label htmlFor="cctv-perimeter" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Perimeter / Parking Sides
              </label>
              <input
                id="cctv-perimeter"
                type="number"
                min={0}
                max={24}
                value={perimeterZones}
                onChange={(e) => setPerimeterZones(Math.max(0, Math.min(24, Number(e.target.value) || 0)))}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label htmlFor="cctv-indoor" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Indoor Lobbies / Rooms
              </label>
              <input
                id="cctv-indoor"
                type="number"
                min={0}
                max={30}
                value={indoorZones}
                onChange={(e) => setIndoorZones(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Video Retention Period
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([14, 30, 60] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRetentionDays(days)}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border cursor-pointer ${
                      retentionDays === days
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={includeBackup}
                  onChange={(e) => setIncludeBackup(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>Include Dedicated Outage Backup Power</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-navy-900 text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-blue-400">Recommended Topology</div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Total Cameras</div>
                <div className="font-mono text-2xl font-bold tabular-nums mt-1">{plan.totalCameras}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Recorder Tier</div>
                <div className="font-mono text-2xl font-bold tabular-nums mt-1">{plan.nvrChannels}-Ch NVR</div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Weatherproof Outdoor Units</span>
                <span className="font-mono font-semibold tabular-nums">{plan.outdoorCameras}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Indoor Dome / Turret Units</span>
                <span className="font-mono font-semibold tabular-nums">{plan.indoorCameras}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Surveillance Storage ({retentionDays}d)</span>
                <span className="font-mono font-semibold tabular-nums">~{plan.estimatedTb} TB HDD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Remote Viewing</span>
                <span className="font-medium text-emerald-400">Mobile &amp; Desktop Ready</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            <span>Request Security Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
