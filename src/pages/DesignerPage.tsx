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

  const handleToolHandled = () => {
    setTool('select');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🛰️</span>
          <div>
            <div className={styles.title}>FTTH Designer</div>
            <div className={styles.subtitle}>Plan your fiber-to-the-home network</div>
          </div>
        </div>
        <WorkflowStepper step={design.workflowStep} />
      </header>

      <div className={styles.body}>
        <Toolbar tool={tool} onChange={setTool} />
        <main className={styles.canvas}>
          <MapCanvas
            design={design}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToolHandled={handleToolHandled}
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
