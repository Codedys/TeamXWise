import type { CSSProperties } from 'react';
import styles from './collection-confetti.module.css';

/** Deterministic two-sided burst shared by payer and owner celebrations. */
export function CollectionConfetti() {
  return (
    <div className={styles.confetti} aria-hidden="true" data-celebration-confetti="true">
      {Array.from({ length: 64 }, (_, index) => {
        const fromLeft = index % 2 === 0;
        const travel = 12 + ((index * 37) % 70);
        return (
          <span
            key={index}
            style={
              {
                left: fromLeft ? '8%' : '92%',
                background: ['#fff', '#ffce32', '#ff643a', '#163300'][index % 4],
                '--travel': `${fromLeft ? travel : -travel}vw`,
                '--rise': `${-(38 + ((index * 23) % 48))}vh`,
                '--rotation': `${(index % 2 ? -1 : 1) * (300 + index * 47)}deg`,
                '--duration': `${2.6 + (index % 7) * 0.12}s`,
                '--delay': `${0.4 + (index % 8) * 0.025}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
