import { useState } from 'react';
import MapCanvas from '@/components/MapCanvas';
import SidePanel from '@/components/SidePanel';
import Toolbar from '@/components/Toolbar';
import WorkflowStepper from '@/components/WorkflowStepper';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
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
          <span className={styles.logo}>🛰️</span>
          <div>
            <h1 className={styles.title}>FTTH Designer</h1>
            <p className={styles.subtitle}>Plan fiber-to-the-home networks on a real map</p>
          </div>
        </div>
        <WorkflowStepper current={design.workflowStep} />
      </header>
      <div className={styles.body}>
        <Toolbar tool={tool} setTool={setTool} />
        <main className={styles.canvasArea}>
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
