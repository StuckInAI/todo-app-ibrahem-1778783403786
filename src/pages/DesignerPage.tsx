import { useState } from 'react';
import type { Tool } from '@/types';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import MapCanvas from '@/components/MapCanvas';
import Toolbar from '@/components/Toolbar';
import SidePanel from '@/components/SidePanel';
import WorkflowStepper from '@/components/WorkflowStepper';
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
        <h1 className={styles.title}>FTTH Network Designer</h1>
        <WorkflowStepper step={design.workflowStep} />
      </header>
      <div className={styles.body}>
        <Toolbar tool={tool} onToolChange={setTool} />
        <main className={styles.main}>
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
