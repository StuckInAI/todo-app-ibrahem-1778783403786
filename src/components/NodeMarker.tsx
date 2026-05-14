import type { NetworkNode } from '@/types';
import { Antenna, Box, GitBranch, Home, Radio, Server } from 'lucide-react';
import styles from './NodeMarker.module.css';

type Props = {
  node: NetworkNode;
  x: number;
  y: number;
  selected: boolean;
  cableSource: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
};

const ICONS: Record<NetworkNode['type'], React.ComponentType<{ size?: number }>> = {
  olt: Server,
  splitter: GitBranch,
  cabinet: Box,
  closure: Radio,
  pole: Antenna,
  ont: Home,
};

const COLORS: Record<NetworkNode['type'], string> = {
  olt: '#dc2626',
  splitter: '#f59e0b',
  cabinet: '#0ea5e9',
  closure: '#8b5cf6',
  pole: '#64748b',
  ont: '#10b981',
};

export default function NodeMarker({ node, x, y, selected, cableSource, onClick, onMouseDown }: Props) {
  const Icon = ICONS[node.type];
  const color = COLORS[node.type];
  return (
    <div
      className={`${styles.marker} ${selected ? styles.selected : ''} ${cableSource ? styles.cableSource : ''}`}
      style={{ left: x, top: y, background: color }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={node.name}
    >
      <Icon size={16} />
      <span className={styles.label}>{node.name}</span>
    </div>
  );
}
