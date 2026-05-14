import styles from './StatsBar.module.css';

type StatsBarProps = {
  activeCount: number;
  completedCount: number;
};

export default function StatsBar({ activeCount, completedCount }: StatsBarProps) {
  const total = activeCount + completedCount;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div className={styles.stats}>
      <div className={styles.numbers}>
        <span className={styles.stat}>
          <strong>{activeCount}</strong> remaining
        </span>
        <span className={styles.dot}>·</span>
        <span className={styles.stat}>
          <strong>{completedCount}</strong> done
        </span>
        <span className={styles.dot}>·</span>
        <span className={styles.stat}>
          <strong>{percent}%</strong> complete
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
