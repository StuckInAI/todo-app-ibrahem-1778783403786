import { useMemo, useRef, useState } from 'react';
import { Download, Search, Trash2, Upload } from 'lucide-react';
import type { SplitterRatio } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import { formatMeters } from '@/utils/geo';
import styles from './SidePanel.module.css';

type Props = {
  design: ReturnType<typeof useNetworkDesign>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function SidePanel({ design, selectedId, onSelect }: Props) {
  const {
    project,
    stats,
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
  const [geoQuery, setGeoQuery] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
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

  const doSearchLocation = async () => {
    if (!geoQuery.trim()) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(geoQuery)}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapView({ lat, lng }, 16);
      } else {
        setGeoError('No results found');
      }
    } catch {
      setGeoError('Search failed');
    } finally {
      setGeoLoading(false);
    }
  };

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

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Find Location</h4>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            placeholder="Address, city, postcode…"
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearchLocation()}
          />
          <button className={styles.searchBtn} onClick={doSearchLocation} disabled={geoLoading}>
            <Search size={14} />
          </button>
        </div>
        {geoError && <div className={styles.error}>{geoError}</div>}
      </section>

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
            if (confirm('Clear all nodes, cables and areas?')) clearAll();
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
