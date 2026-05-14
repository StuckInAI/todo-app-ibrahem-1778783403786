import type { NetworkNode } from '@/types';
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

const NODE_ICONS: Record<string, string> = {
  olt: '🏭',
  splitter: '🔀',
  cabinet: '🗄️',
  closure: '🔵',
  pole: '🪵',
  ont: '🏠',
};

const NODE_COLORS: Record<string, string> = {
  olt: '#7c3aed',
  splitter: '#d97706',
  cabinet: '#db2777',
  closure: '#2563eb',
  pole: '#6b7280',
  ont: '#059669',
};

export default function NodeMarker({ node, x, y, selected, cableSource, onClick, onMouseDown }: Props) {
  const color = NODE_COLORS[node.type] ?? '#6366f1';
  const icon = NODE_ICONS[node.type] ?? '📍';

  return (
    <div
      className={`${styles.marker} ${selected ? styles.selected : ''} ${cableSource ? styles.cableSource : ''}`}
      style={{
        left: x,
        top: y,
        '--node-color': color,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={`${node.name} (${node.type})`}
    >
      <div className={styles.pin}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.label}>{node.name}</div>
    </div>
  );
}
