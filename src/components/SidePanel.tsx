import { useMemo, useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import type { SplitterRatio, Tool, WorkflowStep } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import { formatMeters } from '@/utils/geo';
import WorkflowPanel from '@/components/WorkflowPanel';
import LossBudgetPanel from '@/components/LossBudgetPanel';
import styles from './SidePanel.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSetTool: (tool: Tool) => void;
};

export default function SidePanel({ design, selectedId, onSelect, onSetTool }: Props) {
  const {
    project,
    stats,
    workflowStep,
    renameProject,
    updateNode,
    deleteNode,
    updateCable,
    deleteCable,
    deleteArea,
    setMapView,
    clearAll,
    exportJSON,
    importJSON,
  } = design;

  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = useMemo(
    () => project.nodes.find((n) => n.id === selectedId) || null,
    [project.nodes, selectedId]
  );
  const selectedCable = useMemo(
    () => project.cables.find((c) => c.id === selectedId) || null,
    [project.cables, selectedId]
  );
  const selectedArea = useMemo(
    () => project.areas.find((a) => a.id === selectedId) || null,
    [project.areas, selectedId]
  );

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase();
    return project.nodes.filter(
      (n) => !q || n.name.toLowerCase().includes(q) || n.type.includes(q)
    );
  }, [project.nodes, search]);

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result));
      if (!ok) alert('Invalid project file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleWorkflowTool = (t: 'place-telecom-center' | 'draw-area' | 'select') => {
    onSetTool(t as Tool);
  };

  // Show workflow until the user has reached the design step (or always show it collapsed)
  const showWorkflow: WorkflowStep[] = ['address', 'telecom-center', 'service-area'];

  return (
    <aside className={styles.panel}>
      <section className={styles.section}>
        <input
          className={styles.projectName}
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          placeholder="Project name"
        />
        <div className={styles.actionsRow}>
          <button className={styles.iconBtn} onClick={handleExport} title="Export project as JSON">
            <Download size={14} /> Export
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Import project JSON"
          >
            <Upload size={14} /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </section>

      {showWorkflow.includes(workflowStep) ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Setup Workflow</h4>
          <WorkflowPanel design={design} step={workflowStep} onSetTool={handleWorkflowTool} />
        </section>
      ) : (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Project Location</h4>
          {project.address && <div className={styles.coords}>📍 {project.address}</div>}
          {project.telecomCenter && (
            <div className={styles.coords}>🏢 {project.telecomCenter.name}</div>
          )}
          <div className={styles.coords}>📐 {project.areas.length} service area(s)</div>
        </section>
      )}

      <LossBudgetPanel design={design} />

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Network Statistics</h4>
        <div className={styles.stats}>
          <Stat label="OLTs" value={stats.byType.olt} />
          <Stat label="Splitters" value={stats.byType.splitter} />
          <Stat label="Cabinets" value={stats.byType.cabinet} />
          <Stat label="Closures" value={stats.byType.closure} />
          <Stat label="Poles" value={stats.byType.pole} />
          <Stat label="ONTs" value={stats.byType.ont} />
          <Stat label="Cables" value={stats.cableCount} />
          <Stat label="Total length" value={formatMeters(stats.totalLength)} />
        </div>
      </section>

      {selectedNode && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Selected · {selectedNode.type.toUpperCase()}</h4>
          <label className={styles.field}>
            <span>Name</span>
            <input
              className={styles.input}
              value={selectedNode.name}
              onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
            />
          </label>
          {selectedNode.type === 'splitter' && (
            <label className={styles.field}>
              <span>Split ratio</span>
              <select
                className={styles.input}
                value={selectedNode.splitRatio ?? '1:8'}
                onChange={(e) =>
                  updateNode(selectedNode.id, { splitRatio: e.target.value as SplitterRatio })
                }
              >
                {(['1:2', '1:4', '1:8', '1:16', '1:32', '1:64'] as SplitterRatio[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          )}
          <label className={styles.field}>
            <span>Insertion loss override (dB)</span>
            <input
              className={styles.input}
              type="number"
              step={0.1}
              placeholder="auto"
              value={selectedNode.lossDb ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                updateNode(selectedNode.id, { lossDb: Number.isNaN(v as number) ? undefined : v });
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Notes</span>
            <textarea
              className={styles.textarea}
              value={selectedNode.notes ?? ''}
              onChange={(e) => updateNode(selectedNode.id, { notes: e.target.value })}
              rows={2}
            />
          </label>
          <div className={styles.coords}>
            {selectedNode.position.lat.toFixed(5)}, {selectedNode.position.lng.toFixed(5)}
          </div>
          <button
            className={styles.dangerBtn}
            onClick={() => {
              deleteNode(selectedNode.id);
              onSelect(null);
            }}
          >
            <Trash2 size={14} /> Delete node
          </button>
        </section>
      )}

      {selectedCable && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Selected · CABLE</h4>
          <label className={styles.field}>
            <span>Type</span>
            <select
              className={styles.input}
              value={selectedCable.cableType}
              onChange={(e) =>
                updateCable(selectedCable.id, { cableType: e.target.value as typeof selectedCable.cableType })
              }
            >
              <option value="feeder">Feeder</option>
              <option value="distribution">Distribution</option>
              <option value="drop">Drop</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Cores</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={288}
              value={selectedCable.cores}
              onChange={(e) =>
                updateCable(selectedCable.id, { cores: parseInt(e.target.value || '0', 10) })
              }
            />
          </label>
          <label className={styles.field}>
            <span>Attenuation override (dB/km)</span>
            <input
              className={styles.input}
              type="number"
              step={0.05}
              placeholder="auto"
              value={selectedCable.attenuationDbPerKm ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                updateCable(selectedCable.id, {
                  attenuationDbPerKm: Number.isNaN(v as number) ? undefined : v,
                });
              }}
            />
          </label>
          <div className={styles.coords}>Length: {formatMeters(selectedCable.length)}</div>
          <button
            className={styles.dangerBtn}
            onClick={() => {
              deleteCable(selectedCable.id);
              onSelect(null);
            }}
          >
            <Trash2 size={14} /> Delete cable
          </button>
        </section>
      )}

      {selectedArea && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Selected · SERVICE AREA</h4>
          <div className={styles.coords}>{selectedArea.name}</div>
          <div className={styles.coords}>{selectedArea.path.length} vertices</div>
          <button
            className={styles.dangerBtn}
            onClick={() => {
              deleteArea(selectedArea.id);
              onSelect(null);
            }}
          >
            <Trash2 size={14} /> Delete area
          </button>
        </section>
      )}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Nodes ({project.nodes.length})</h4>
        <input
          className={styles.input}
          placeholder="Search nodes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className={styles.list}>
          {filteredNodes.map((n) => (
            <li
              key={n.id}
              className={`${styles.listItem} ${selectedId === n.id ? styles.listItemActive : ''}`}
              onClick={() => {
                onSelect(n.id);
                setMapView(n.position, Math.max(project.mapZoom, 17));
              }}
            >
              <span className={styles.nodeBadge} data-type={n.type}>{n.type.slice(0, 3).toUpperCase()}</span>
              <span>{n.name}</span>
            </li>
          ))}
          {filteredNodes.length === 0 && <li className={styles.empty}>No nodes</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <button
          className={styles.dangerBtn}
          onClick={() => {
            if (confirm('Clear all nodes, cables, areas, address and telecom center?')) clearAll();
          }}
        >
          <Trash2 size={14} /> Clear entire design
        </button>
      </section>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.statCell}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
