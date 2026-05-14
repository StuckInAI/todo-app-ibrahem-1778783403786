import { Check, MapPin, Building2, Hexagon, Network } from 'lucide-react';
import type { WorkflowStep } from '@/types';
import styles from './WorkflowStepper.module.css';

type Props = {
  currentStep: WorkflowStep;
  onJump?: (step: WorkflowStep) => void;
};

const STEPS: { id: WorkflowStep; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'address', label: '1. Address', icon: MapPin },
  { id: 'telecom-center', label: '2. Telecom Center', icon: Building2 },
  { id: 'service-area', label: '3. Service Area', icon: Hexagon },
  { id: 'design', label: '4. Design Network', icon: Network },
];

export default function WorkflowStepper({ currentStep, onJump }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className={styles.stepper}>
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.id} className={styles.stepWrap}>
            <button
              type="button"
              className={`${styles.step} ${active ? styles.active : ''} ${done ? styles.done : ''}`}
              onClick={() => onJump?.(s.id)}
            >
              <span className={styles.circle}>
                {done ? <Check size={14} /> : <Icon size={14} />}
              </span>
              <span className={styles.label}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`${styles.connector} ${done ? styles.connectorDone : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}
