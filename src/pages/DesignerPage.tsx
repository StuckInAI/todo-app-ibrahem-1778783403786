import { useState } from 'react';
import { useNetworkDesign } from '@/hooks/useNetworkDesign';
import type { Tool } from '@/types';
import MapCanvas from '@/components/MapCanvas';
import SidePanel from '@/components/SidePanel';
import Toolbar from '@/components/Toolbar';
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
      <div className={styles.topBar}>
        <WorkflowStepper currentStep={design.workflowStep} />
      </div>
      <div className={styles.body}>
        <div className={styles.toolbarWrap}>
          <Toolbar tool={tool} onChange={setTool} />
        </div>
        <div className={styles.mapWrap}>
          <MapCanvas
            design={design}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToolHandled={handleToolHandled}
          />
        </div>
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
