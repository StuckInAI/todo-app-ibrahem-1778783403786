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
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className={styles.brandTitle}>FTTH Network Designer</div>
            <div className={styles.brandSub}>Passive Optical Network Planner</div>
          </div>
        </div>
        <WorkflowStepper currentStep={design.workflowStep} />
        <div className={styles.topBarRight}>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: '#ef4444' }} />
              Feeder
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: '#f59e0b' }} />
              Distribution
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: '#10b981' }} />
              Drop
            </span>
          </div>
        </div>
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
