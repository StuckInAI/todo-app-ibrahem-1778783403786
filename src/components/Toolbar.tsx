import {
  Antenna,
  Box,
  Cable,
  GitBranch,
  Hexagon,
  Home,
  MousePointer2,
  Radio,
  Server,
} from 'lucide-react';
import type { Tool } from '@/types';
import styles from './Toolbar.module.css';

type Props = {
  tool: Tool;
  onChange: (t: Tool) => void;
};

type ToolDef = { id: Tool; label: string; icon: React.ComponentType<{ size?: number }>; group: string; description?: string };

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select / Pan', icon: MousePointer2, group: 'general', description: 'Select & move nodes, pan the map' },
  { id: 'place-olt', label: 'OLT', icon: Server, group: 'equipment', description: 'Optical Line Terminal — head-end device' },
  { id: 'place-splitter', label: 'Splitter', icon: GitBranch, group: 'equipment', description: 'PLC passive splitter (1:2–1:64)' },
  { id: 'place-cabinet', label: 'Cabinet', icon: Box, group: 'equipment', description: 'Street cabinet / FDH' },
  { id: 'place-closure', label: 'Closure', icon: Radio, group: 'equipment', description: 'Fiber splice closure' },
  { id: 'place-pole', label: 'Pole', icon: Antenna, group: 'equipment', description: 'Utility / telegraph pole' },
  { id: 'place-ont', label: 'ONT', icon: Home, group: 'equipment', description: 'Optical Network Terminal — customer end' },
  { id: 'draw-cable', label: 'Draw Fiber', icon: Cable, group: 'draw', description: 'Click nodes to trace a fiber cable' },
  { id: 'draw-area', label: 'Service Area', icon: Hexagon, group: 'draw', description: 'Draw a polygon service area boundary' },
];

export default function Toolbar({ tool, onChange }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarHeader}>
        <span className={styles.toolbarTitle}>Tools</span>
      </div>
      <div className={styles.section}>
        {TOOLS.filter((t) => t.group === 'general').map((t) => (
          <ToolButton key={t.id} def={t} active={tool === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
      <div className={styles.sectionLabel}>Equipment</div>
      <div className={styles.section}>
        {TOOLS.filter((t) => t.group === 'equipment').map((t) => (
          <ToolButton key={t.id} def={t} active={tool === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
      <div className={styles.sectionLabel}>Drawing</div>
      <div className={styles.section}>
        {TOOLS.filter((t) => t.group === 'draw').map((t) => (
          <ToolButton key={t.id} def={t} active={tool === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
    </div>
  );
}

function ToolButton({ def, active, onClick }: { def: ToolDef; active: boolean; onClick: () => void }) {
  const Icon = def.icon;
  return (
    <button
      className={`${styles.toolBtn} ${active ? styles.active : ''}`}
      onClick={onClick}
      title={def.description ?? def.label}
    >
      <Icon size={16} />
      <span>{def.label}</span>
    </button>
  );
}
