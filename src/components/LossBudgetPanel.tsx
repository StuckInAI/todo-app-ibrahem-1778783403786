import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Gauge } from 'lucide-react';
import type { PathLossReport, Wavelength } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import { formatMeters } from '@/utils/geo';
import styles from './LossBudgetPanel.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
};

export default function LossBudgetPanel({ design }: Props) {
  const { project, lossReports, updateLossBudget } = design;
  const lb = project.lossBudget;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const totalBudget = lb.txPowerDbm - lb.rxSensitivityDbm;
  const worst = lossReports.reduce<PathLossReport | null>(
    (acc, r) => (acc == null || r.margin < acc.margin ? r : acc),
    null
  );

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <Gauge size={14} />
        <h4>Loss Budget</h4>
        <button className={styles.toggle} onClick={() => setShowSettings((s) => !s)}>
          {showSettings ? 'Hide settings' : 'Settings'}
        </button>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Tx power</div>
          <div className={styles.summaryValue}>{lb.txPowerDbm.toFixed(1)} dBm</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Rx sensitivity</div>
          <div className={styles.summaryValue}>{lb.rxSensitivityDbm.toFixed(1)} dBm</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Total budget</div>
          <div className={styles.summaryValue}>{totalBudget.toFixed(1)} dB</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Margin</div>
          <div className={styles.summaryValue}>{lb.safetyMarginDb.toFixed(1)} dB</div>
        </div>
      </div>

      {showSettings && (
        <div className={styles.settings}>
          <Field label="Tx power (dBm)" value={lb.txPowerDbm} step={0.5}
            onChange={(v) => updateLossBudget({ txPowerDbm: v })} />
          <Field label="Rx sensitivity (dBm)" value={lb.rxSensitivityDbm} step={0.5}
            onChange={(v) => updateLossBudget({ rxSensitivityDbm: v })} />
          <Field label="Safety margin (dB)" value={lb.safetyMarginDb} step={0.5} min={0}
            onChange={(v) => updateLossBudget({ safetyMarginDb: v })} />
          <Field label="Splice loss (dB)" value={lb.spliceLossDb} step={0.05} min={0}
            onChange={(v) => updateLossBudget({ spliceLossDb: v })} />
          <Field label="Connector loss (dB)" value={lb.connectorLossDb} step={0.05} min={0}
            onChange={(v) => updateLossBudget({ connectorLossDb: v })} />
          <label className={styles.field}>
            <span>Wavelength</span>
            <select
              className={styles.input}
              value={lb.wavelengthNm}
              onChange={(e) => updateLossBudget({ wavelengthNm: parseInt(e.target.value, 10) as Wavelength })}
            >
              <option value={1310}>1310 nm (upstream)</option>
              <option value={1490}>1490 nm (downstream)</option>
              <option value={1550}>1550 nm (RF / video)</option>
            </select>
          </label>
          <Field
            label="Feeder attenuation (dB/km)"
            value={lb.attenuationDbPerKm.feeder}
            step={0.05}
            min={0}
            onChange={(v) => updateLossBudget({ attenuationDbPerKm: { ...lb.attenuationDbPerKm, feeder: v } })}
          />
          <Field
            label="Distribution attenuation (dB/km)"
            value={lb.attenuationDbPerKm.distribution}
            step={0.05}
            min={0}
            onChange={(v) =>
              updateLossBudget({ attenuationDbPerKm: { ...lb.attenuationDbPerKm, distribution: v } })
            }
          />
          <Field
            label="Drop attenuation (dB/km)"
            value={lb.attenuationDbPerKm.drop}
            step={0.05}
            min={0}
            onChange={(v) => updateLossBudget({ attenuationDbPerKm: { ...lb.attenuationDbPerKm, drop: v } })}
          />
        </div>
      )}

      <div className={styles.reports}>
        {lossReports.length === 0 && (
          <div className={styles.empty}>
            Place an OLT and at least one ONT, then connect them with cables to see the loss budget.
          </div>
        )}
        {worst && lossReports.length > 0 && (
          <div className={`${styles.worst} ${worst.feasible ? styles.ok : styles.bad}`}>
            {worst.feasible ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>
              Worst link: <strong>{worst.ontName}</strong> · {worst.totalLossDb.toFixed(2)} dB ·{' '}
              margin {worst.margin.toFixed(2)} dB
            </span>
          </div>
        )}
        {lossReports.map((r) => {
          const expanded = expandedId === r.ontId;
          return (
            <div key={r.ontId} className={styles.report}>
              <button
                className={styles.reportHeader}
                onClick={() => setExpandedId(expanded ? null : r.ontId)}
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className={styles.reportName}>{r.ontName}</span>
                <span className={`${styles.badge} ${r.feasible ? styles.badgeOk : styles.badgeBad}`}>
                  {r.feasible ? 'OK' : 'FAIL'}
                </span>
                <span className={styles.reportLoss}>{r.totalLossDb.toFixed(2)} dB</span>
              </button>
              {expanded && (
                <div className={styles.reportBody}>
                  <div className={styles.kv}><span>Fiber length</span><span>{formatMeters(r.totalLengthM)}</span></div>
                  <div className={styles.kv}><span>Fiber loss</span><span>{r.fiberLossDb.toFixed(2)} dB</span></div>
                  <div className={styles.kv}><span>Splitter loss</span><span>{r.splitterLossDb.toFixed(2)} dB</span></div>
                  <div className={styles.kv}><span>Splices ({r.spliceCount})</span><span>{r.spliceLossDb.toFixed(2)} dB</span></div>
                  <div className={styles.kv}><span>Connectors ({r.connectorCount})</span><span>{r.connectorLossDb.toFixed(2)} dB</span></div>
                  <div className={styles.kv}><span>Safety margin</span><span>{lb.safetyMarginDb.toFixed(2)} dB</span></div>
                  <div className={styles.kvTotal}><span>Total loss</span><span>{r.totalLossDb.toFixed(2)} dB</span></div>
                  <div className={styles.kvTotal}><span>Rx power</span><span>{r.rxPowerDbm.toFixed(2)} dBm</span></div>
                  <div className={`${styles.kvTotal} ${r.feasible ? styles.okText : styles.badText}`}>
                    <span>Margin vs Rx sensitivity</span>
                    <span>{r.margin.toFixed(2)} dB</span>
                  </div>
                  <details className={styles.details}>
                    <summary>Per-component breakdown</summary>
                    <ul className={styles.breakdown}>
                      {r.breakdown.map((b, i) => (
                        <li key={i}>
                          <span>{b.label}{b.detail ? ` — ${b.detail}` : ''}</span>
                          <span>{b.lossDb.toFixed(2)} dB</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  step = 1,
  min,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        className={styles.input}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
      />
    </label>
  );
}
