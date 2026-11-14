import { useState, useMemo } from 'react';
import { Plus, Minus, RotateCcw, ArrowRight } from 'lucide-react';
import { SOLAR_APPLIANCE_PRESETS } from '../data/teracoreData';

interface SolarEstimatorProps {
  onApplyToQuote: (summary: string) => void;
}

interface ApplianceSelection {
  qty: number;
  hours: number;
}

export function SolarEstimator({ onApplyToQuote }: SolarEstimatorProps) {
  const [selections, setSelections] = useState<Record<string, ApplianceSelection>>({
    'led-lights': { qty: 2, hours: 8 },
    'ceiling-fan': { qty: 3, hours: 8 },
    fridge: { qty: 1, hours: 12 },
    laptop: { qty: 3, hours: 8 },
    'router-cctv': { qty: 1, hours: 24 },
  });

  const updateItem = (id: string, field: 'qty' | 'hours', delta: number) => {
    const preset = SOLAR_APPLIANCE_PRESETS.find((a) => a.id === id);
    if (!preset) return;
    setSelections((prev) => {
      const current = prev[id] ?? { qty: 0, hours: preset.defaultHours };
      const nextVal =
        field === 'qty'
          ? Math.max(0, Math.min(50, current.qty + delta))
          : Math.max(1, Math.min(24, current.hours + delta));
      return {
        ...prev,
        [id]: { ...current, [field]: nextVal },
      };
    });
  };

  const resetEstimator = () => {
    setSelections({});
  };

  const metrics = useMemo(() => {
    let peakWatts = 0;
    let dailyWh = 0;

    for (const item of SOLAR_APPLIANCE_PRESETS) {
      const sel = selections[item.id];
      if (sel && sel.qty > 0) {
        peakWatts += item.watts * sel.qty;
        dailyWh += item.watts * sel.qty * sel.hours;
      }
    }

    const dailyKwh = dailyWh / 1000;
    // Recommend inverter with 30% surge/headroom at 0.8 power factor, rounded to standard kVA tiers
    const rawKva = (peakWatts * 1.3) / 800;
    const standardKvaTiers = [1.5, 2.5, 3.5, 5, 8, 10, 15, 20, 30];
    const recommendedKva =
      peakWatts === 0
        ? 0
        : standardKvaTiers.find((tier) => tier >= rawKva) ?? Math.ceil(rawKva / 5) * 5;

    // Indicative battery bank (approx 65% evening autonomy with 85% usable DoD)
    const recommendedBatteryKwh =
      dailyKwh === 0 ? 0 : Math.ceil(((dailyKwh * 0.65) / 0.85) * 2) / 2;

    // Indicative PV array assuming 4.5 peak sun hours in Nigeria + 20% system loss
    const recommendedPvKw =
      dailyKwh === 0 ? 0 : Math.ceil(((dailyKwh * 1.2) / 4.5) * 2) / 2;

    return {
      peakWatts,
      dailyKwh,
      recommendedKva,
      recommendedBatteryKwh,
      recommendedPvKw,
    };
  }, [selections]);

  const handleUseEstimate = () => {
    const activeItems = SOLAR_APPLIANCE_PRESETS.filter((a) => (selections[a.id]?.qty ?? 0) > 0).map(
      (a) => `${selections[a.id].qty}x ${a.name} (${selections[a.id].hours}h/day)`
    );
    const summary = `Indicative Load: ${metrics.peakWatts}W peak, ${metrics.dailyKwh.toFixed(
      1
    )} kWh/day | Suggested Tier: ${metrics.recommendedKva} kVA Inverter, ${
      metrics.recommendedBatteryKwh
    } kWh Battery, ${metrics.recommendedPvKw} kWp Solar PV | Appliances: ${activeItems.join(', ')}`;
    onApplyToQuote(summary);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">
            Interactive Solar System Load Estimator
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Select your appliances and daily usage hours for an indicative system sizing estimate.
          </p>
        </div>
        <button
          type="button"
          onClick={resetEstimator}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Loads</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Appliance Selector Table */}
        <div className="lg:col-span-8 divide-y divide-slate-100">
          {SOLAR_APPLIANCE_PRESETS.map((item) => {
            const sel = selections[item.id] ?? { qty: 0, hours: item.defaultHours };
            return (
              <div
                key={item.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    {item.watts} W nominal · {item.category}
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Qty</span>
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'qty', -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-semibold tabular-nums">
                        {sel.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'qty', 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Hrs/day</span>
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'hours', -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                        aria-label={`Decrease ${item.name} hours`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-semibold tabular-nums">
                        {sel.hours}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'hours', 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                        aria-label={`Increase ${item.name} hours`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Indicative Sizing Output */}
        <div className="lg:col-span-4 bg-navy-900 text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="text-xs font-semibold text-emerald-400">
              Indicative System Sizing
            </div>

            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Connected Peak Load</div>
                <div className="font-mono text-2xl font-bold tabular-nums mt-1">
                  {metrics.peakWatts.toLocaleString()} <span className="text-sm font-normal text-slate-400">W</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Daily Energy Use</div>
                <div className="font-mono text-2xl font-bold tabular-nums mt-1">
                  {metrics.dailyKwh.toFixed(1)} <span className="text-sm font-normal text-slate-400">kWh</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Suggested Inverter</span>
                <span className="font-mono font-semibold tabular-nums text-white">
                  {metrics.recommendedKva > 0 ? `${metrics.recommendedKva} kVA Hybrid` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Lithium Storage Target</span>
                <span className="font-mono font-semibold tabular-nums text-white">
                  {metrics.recommendedBatteryKwh > 0 ? `${metrics.recommendedBatteryKwh} kWh` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Solar PV Array Target</span>
                <span className="font-mono font-semibold tabular-nums text-white">
                  {metrics.recommendedPvKw > 0 ? `${metrics.recommendedPvKw} kWp` : '—'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This calculation is an engineering estimate only. Final equipment specification is confirmed after an on-site Teracore load and roof audit.
            </p>
          </div>

          <button
            type="button"
            disabled={metrics.peakWatts === 0}
            onClick={handleUseEstimate}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
          >
            <span>Request Professional Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
