import { Filter } from '@/types';
import styles from './FilterBar.module.css';
import clsx from 'clsx';

type FilterBarProps = {
  filter: Filter;
  onFilterChange: (f: Filter) => void;
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export default function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      {FILTERS.map((f) => (
        <button
          key={f.value}
          className={clsx(styles.btn, filter === f.value && styles.active)}
          onClick={() => onFilterChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
