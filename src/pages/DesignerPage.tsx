import { useState } from 'react';
import { Cable as CableIcon } from 'lucide-react';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import MapCanvas from '@/components/MapCanvas';
import Toolbar from '@/components/Toolbar';
import SidePanel from '@/components/SidePanel';
import type { Tool } from '@/types';
import styles from './DesignerPage.module.css';

export default function DesignerPage() {
  const design = useNetworkDesign();
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}><CableIcon size={18} /></span>
          <div>
            <h1 className={styles.title}>FTTH Network Designer</h1>
            <p className={styles.subtitle}>Plan passive fiber networks on a real map</p>
          </div>
        </div>
        <div className={styles.legend}>
          <LegendDot color="#ef4444" label="Feeder" />
          <LegendDot color="#f59e0b" label="Distribution" />
          <LegendDot color="#10b981" label="Drop" />
        </div>
      </header>
      <div className={styles.workspace}>
        <Toolbar tool={tool} onChange={setTool} />
        <div className={styles.mapWrap}>
          <MapCanvas
            design={design}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToolHandled={() => setTool('select')}
          />
        </div>
        <SidePanel design={design} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
