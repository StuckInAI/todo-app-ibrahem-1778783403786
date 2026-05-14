import { useRef } from 'react';
import { X, Download, Printer, CheckCircle, AlertTriangle, Wifi } from 'lucide-react';
import type { PathLossReport } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import { formatMeters } from '@/utils/geo';
import styles from './PreviewModal.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  onClose: () => void;
};

export default function PreviewModal({ design, onClose }: Props) {
  const { project, stats, lossReports } = design;
  const printRef = useRef<HTMLDivElement>(null);

  const feasible = lossReports.filter((r) => r.feasible).length;
  const total = lossReports.length;

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.name} – FTTH Network Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #111; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            h3 { font-size: 12px; margin: 12px 0 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; }
            th { background: #f3f4f6; font-weight: 600; }
            .ok { color: #16a34a; }
            .warn { color: #dc2626; }
            .badge { display:inline-block; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; }
            .badge-ok { background:#dcfce7; color:#166534; }
            .badge-warn { background:#fee2e2; color:#991b1b; }
            .meta { color:#555; font-size:11px; margin-bottom:16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleExportJSON = () => {
    const json = design.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_ftth.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const now = new Date().toLocaleString();

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Wifi size={18} />
            <span>Network Design Report</span>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.actionBtn} onClick={handlePrint} title="Print report">
              <Printer size={15} /> Print
            </button>
            <button className={styles.actionBtn} onClick={handleExportJSON} title="Export JSON">
              <Download size={15} /> Export JSON
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div className={styles.body}>
          <div ref={printRef}>
            {/* Project header */}
            <h1>{project.name}</h1>
            <p className={styles.meta}>
              Generated: {now}
              {project.address && <> · Address: {project.address}</>}
              {project.telecomCenter && <> · OLT: {project.telecomCenter.name}</>}
            </p>

            {/* Summary */}
            <h2>Summary</h2>
            <div className={styles.summaryGrid}>
              <SummaryCard label="Total Nodes" value={stats.nodeCount} />
              <SummaryCard label="OLTs" value={stats.byType.olt} />
              <SummaryCard label="Splitters" value={stats.byType.splitter} />
              <SummaryCard label="Cabinets" value={stats.byType.cabinet} />
              <SummaryCard label="Closures" value={stats.byType.closure} />
              <SummaryCard label="Poles" value={stats.byType.pole} />
              <SummaryCard label="ONTs" value={stats.byType.ont} />
              <SummaryCard label="Cables" value={stats.cableCount} />
              <SummaryCard label="Total Fiber" value={formatMeters(stats.totalLength)} />
              <SummaryCard label="Service Areas" value={stats.areaCount} />
            </div>

            {/* Loss Budget Settings */}
            <h2>Loss Budget Settings</h2>
            <table className={styles.table}>
              <tbody>
                <tr><td>OLT Tx Power</td><td>{project.lossBudget.txPowerDbm} dBm</td></tr>
                <tr><td>ONT Rx Sensitivity</td><td>{project.lossBudget.rxSensitivityDbm} dBm</td></tr>
                <tr><td>Safety Margin</td><td>{project.lossBudget.safetyMarginDb} dB</td></tr>
                <tr><td>Wavelength</td><td>{project.lossBudget.wavelengthNm} nm</td></tr>
                <tr><td>Splice Loss</td><td>{project.lossBudget.spliceLossDb} dB/splice</td></tr>
                <tr><td>Connector Loss</td><td>{project.lossBudget.connectorLossDb} dB/pair</td></tr>
                <tr><td>Feeder Attenuation</td><td>{project.lossBudget.attenuationDbPerKm.feeder} dB/km</td></tr>
                <tr><td>Distribution Attenuation</td><td>{project.lossBudget.attenuationDbPerKm.distribution} dB/km</td></tr>
                <tr><td>Drop Attenuation</td><td>{project.lossBudget.attenuationDbPerKm.drop} dB/km</td></tr>
              </tbody>
            </table>

            {/* ONT Loss Reports */}
            {lossReports.length > 0 && (
              <>
                <h2>
                  ONT Path Loss Reports
                  <span className={styles.feasibilityBadge}>
                    {feasible === total ? (
                      <><CheckCircle size={13} className={styles.ok} /> All {total} feasible</>
                    ) : (
                      <><AlertTriangle size={13} className={styles.warn} /> {total - feasible}/{total} over budget</>
                    )}
                  </span>
                </h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ONT</th>
                      <th>Hops</th>
                      <th>Fiber Length</th>
                      <th>Splices</th>
                      <th>Connectors</th>
                      <th>Splitter Loss</th>
                      <th>Fiber Loss</th>
                      <th>Total Loss</th>
                      <th>Rx Power</th>
                      <th>Margin</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lossReports.map((r: PathLossReport) => (
                      <tr key={r.ontId}>
                        <td>{r.ontName}</td>
                        <td>{r.hops}</td>
                        <td>{formatMeters(r.totalLengthM)}</td>
                        <td>{r.spliceCount}</td>
                        <td>{r.connectorCount}</td>
                        <td>{r.splitterLossDb.toFixed(2)} dB</td>
                        <td>{r.fiberLossDb.toFixed(2)} dB</td>
                        <td>{r.totalLossDb.toFixed(2)} dB</td>
                        <td>{r.rxPowerDbm.toFixed(2)} dBm</td>
                        <td className={r.margin >= 0 ? styles.ok : styles.warn}>
                          {r.margin >= 0 ? '+' : ''}{r.margin.toFixed(2)} dB
                        </td>
                        <td>
                          <span className={`${styles.badge} ${r.feasible ? styles.badgeOk : styles.badgeWarn}`}>
                            {r.feasible ? '✓ OK' : '✗ FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Detailed breakdown per ONT */}
                <h2>Detailed Path Breakdowns</h2>
                {lossReports.map((r: PathLossReport) => (
                  <div key={r.ontId} className={styles.breakdown}>
                    <h3>
                      {r.ontName}
                      <span className={`${styles.badge} ${r.feasible ? styles.badgeOk : styles.badgeWarn}`}>
                        {r.feasible ? '✓ Feasible' : '✗ Over Budget'}
                      </span>
                    </h3>
                    <table className={styles.table}>
                      <thead>
                        <tr><th>Component</th><th>Detail</th><th>Loss (dB)</th></tr>
                      </thead>
                      <tbody>
                        {r.breakdown.map((b, i) => (
                          <tr key={i}>
                            <td>{b.label}</td>
                            <td>{b.detail ?? '—'}</td>
                            <td>{b.lossDb.toFixed(3)}</td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}>
                          <td colSpan={2}><strong>Total Path Loss</strong></td>
                          <td><strong>{r.totalLossDb.toFixed(2)} dB</strong></td>
                        </tr>
                        <tr>
                          <td colSpan={2}>Rx Power at ONT</td>
                          <td className={r.feasible ? styles.ok : styles.warn}>
                            {r.rxPowerDbm.toFixed(2)} dBm
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2}>Link Margin</td>
                          <td className={r.margin >= 0 ? styles.ok : styles.warn}>
                            {r.margin >= 0 ? '+' : ''}{r.margin.toFixed(2)} dB
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}

            {lossReports.length === 0 && (
              <div className={styles.empty}>
                No ONT nodes found. Add ONT nodes and connect them with cables to generate loss reports.
              </div>
            )}

            {/* Node inventory */}
            {project.nodes.length > 0 && (
              <>
                <h2>Node Inventory</h2>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Name</th><th>Type</th><th>Split Ratio</th><th>Latitude</th><th>Longitude</th></tr>
                  </thead>
                  <tbody>
                    {project.nodes.map((n) => (
                      <tr key={n.id}>
                        <td>{n.name}</td>
                        <td>{n.type.toUpperCase()}</td>
                        <td>{n.splitRatio ?? '—'}</td>
                        <td>{n.position.lat.toFixed(6)}</td>
                        <td>{n.position.lng.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Cable inventory */}
            {project.cables.length > 0 && (
              <>
                <h2>Cable Inventory</h2>
                <table className={styles.table}>
                  <thead>
                    <tr><th>From</th><th>To</th><th>Type</th><th>Cores</th><th>Length</th></tr>
                  </thead>
                  <tbody>
                    {project.cables.map((c) => {
                      const from = project.nodes.find((n) => n.id === c.fromNodeId);
                      const to = project.nodes.find((n) => n.id === c.toNodeId);
                      return (
                        <tr key={c.id}>
                          <td>{from?.name ?? c.fromNodeId}</td>
                          <td>{to?.name ?? c.toNodeId}</td>
                          <td>{c.cableType}</td>
                          <td>{c.cores}F</td>
                          <td>{formatMeters(c.length)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}
