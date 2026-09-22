'use client';

import { useState } from 'react';
import {
  Settings,
  Sliders,
  Database,
  Cpu,
  Layers,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel, Switch } from '@/components/ui/Primitives';

export default function SettingsPage() {
  const [litigationWeight, setLitigationWeight] = useState(35);
  const [disputeSensitivity, setDisputeSensitivity] = useState(80);
  const [bufferDistanceMeters, setBufferDistanceMeters] = useState(45);
  const [autoOcr, setAutoOcr] = useState(true);
  const [autoAlerts, setAutoAlerts] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleSave() {
    setToastMessage('AI Hyperparameters & GIS Configuration updated successfully');
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">System Parameters & AI Calibration</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Platform governance, model hyperparameters, geospatial buffer tolerances, and decision thresholds
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handleSave} className="text-[12px]">
            <Save className="h-3.5 w-3.5" /> Save Configuration
          </Button>
          <DemoFlag />
        </div>
      </div>

      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* AI Delay Engine Tuning */}
        <div className="rounded-xl border border-hair bg-panel p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-hair pb-3">
            <Cpu className="h-4 w-4 text-cyan" />
            <h3 className="font-display text-[15px] font-bold text-txt-primary">AI Delay Engine Calibration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[12.5px] mb-1.5">
                <span className="text-txt-primary">Litigation Density Weight</span>
                <span className="font-mono text-cyan font-bold">{litigationWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={litigationWeight}
                onChange={(e) => setLitigationWeight(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <span className="text-[11px] text-txt-tertiary">Relative penalty assigned to court stay orders and disputed titles</span>
            </div>

            <div>
              <div className="flex justify-between text-[12.5px] mb-1.5">
                <span className="text-txt-primary">Dispute Sensitivity Threshold</span>
                <span className="font-mono text-cyan font-bold">{disputeSensitivity}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                value={disputeSensitivity}
                onChange={(e) => setDisputeSensitivity(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <span className="text-[11px] text-txt-tertiary">Probability trigger for escalating parcel to Critical Risk</span>
            </div>

            <div>
              <div className="flex justify-between text-[12.5px] mb-1.5">
                <span className="text-txt-primary">Corridor Spatial Buffer Envelope</span>
                <span className="font-mono text-cyan font-bold">{bufferDistanceMeters} meters</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={bufferDistanceMeters}
                onChange={(e) => setBufferDistanceMeters(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <span className="text-[11px] text-txt-tertiary">Right-of-Way (RoW) acquisition boundary buffer width</span>
            </div>
          </div>
        </div>

        {/* System & Automation */}
        <div className="rounded-xl border border-hair bg-panel p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-hair pb-3">
            <Sliders className="h-4 w-4 text-cyan" />
            <h3 className="font-display text-[15px] font-bold text-txt-primary">Automated Ingestion & Alerts</h3>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-3">
              <div>
                <div className="text-[13px] font-medium text-txt-primary">Automatic OCR Title Extraction</div>
                <div className="text-[11px] text-txt-tertiary">Run text extraction automatically on uploaded Patta/FMB documents</div>
              </div>
              <Switch on={autoOcr} onToggle={() => setAutoOcr(!autoOcr)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-3">
              <div>
                <div className="text-[13px] font-medium text-txt-primary">Real-time Schedule Slippage Alarms</div>
                <div className="text-[11px] text-txt-tertiary">Broadcast push notifications when delay probability crosses 75%</div>
              </div>
              <Switch on={autoAlerts} onToggle={() => setAutoAlerts(!autoAlerts)} />
            </div>

            <div className="rounded-lg border border-hair bg-panel2 p-3">
              <div className="font-mono text-[10px] uppercase text-txt-tertiary mb-1">Cadastral Baseline Coordinate System</div>
              <div className="font-mono text-[12px] text-txt-primary">EPSG:4326 (WGS 84) / Web Mercator EPSG:3857</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

