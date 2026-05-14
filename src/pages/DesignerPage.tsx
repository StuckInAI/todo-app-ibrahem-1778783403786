import { useState } from 'react';
import type { Tool } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import MapCanvas from '@/components/MapCanvas';
import SidePanel from '@/components/SidePanel';
import Toolbar from '@/components/Toolbar';
import WorkflowStepper from '@/components/WorkflowStepper';
import styles from './DesignerPage.module.css';

export default function DesignerPage() {
  const design = useNetworkDesign();
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🌐</span>
          <div>
            <h1 className={styles.title}>FTTH Network Designer</h1>
            <p className={styles.subtitle}>Plan fiber networks on a real map</p>
          </div>
        </div>
        <WorkflowStepper />
      </header>
      <div className={styles.body}>
        <Toolbar tool={tool} onSetTool={setTool} />
        <main className={styles.main}>
          <MapCanvas
            design={design}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToolHandled={() => setTool('select')}
          />
        </main>
        <SidePanel
          design={design}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSetTool={setTool}
        />
      </div>
    </div>
  );
}
