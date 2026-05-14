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

type ToolDef = { id: Tool; label: string; icon: React.ComponentType<{ size?: number }>; group: string };

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select / Pan', icon: MousePointer2, group: 'general' },
  { id: 'place-olt', label: 'OLT', icon: Server, group: 'equipment' },
  { id: 'place-splitter', label: 'Splitter', icon: GitBranch, group: 'equipment' },
  { id: 'place-cabinet', label: 'Cabinet', icon: Box, group: 'equipment' },
  { id: 'place-closure', label: 'Closure', icon: Radio, group: 'equipment' },
  { id: 'place-pole', label: 'Pole', icon: Antenna, group: 'equipment' },
  { id: 'place-ont', label: 'ONT (Customer)', icon: Home, group: 'equipment' },
  { id: 'draw-cable', label: 'Draw Fiber Cable', icon: Cable, group: 'draw' },
  { id: 'draw-area', label: 'Draw Service Area', icon: Hexagon, group: 'draw' },
];

export default function Toolbar({ tool, onChange }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Tools</h4>
        {TOOLS.filter((t) => t.group === 'general').map((t) => (
          <ToolButton key={t.id} def={t} active={tool === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Equipment</h4>
        {TOOLS.filter((t) => t.group === 'equipment').map((t) => (
          <ToolButton key={t.id} def={t} active={tool === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Drawing</h4>
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
      title={def.label}
    >
      <Icon size={18} />
      <span>{def.label}</span>
    </button>
  );
}
