import Link from 'next/link';
import { Inter } from 'next/font/google';
import styles from './chip-in-intro.module.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

type FeatureIcon = 'link' | 'check' | 'people';

const features: { icon: FeatureIcon; text: string }[] = [
  {
    icon: 'link',
    text: 'Everyone pays from a link. No app needed.',
  },
  {
    icon: 'check',
    text: 'See who has paid, as it happens.',
  },
  {
    icon: 'people',
    text: 'Keep your group’s collection organised in one place.',
  },
];

function FeatureIcon({ name }: { name: FeatureIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'link' && (
        <>
          <path d="m10 13 4-4" />
          <path d="m8 16-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0" />
          <path d="m16 8 1-1a4.2 4.2 0 0 1 6 6l-4 4a4.2 4.2 0 0 1-6 0" transform="translate(-1 -2)" />
        </>
      )}

      {name === 'check' && <path d="m5 12 4 4L19 6" />}

      {name === 'people' && (
        <>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" />
        </>
      )}
    </svg>
  );
}

export function ChipInIntro() {
  return (
    <main className={`${inter.className} ${styles.screen}`}>
      <section className={styles.hero} aria-labelledby="chip-in-title">
        <Link href="/" className={styles.back}>
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M20 12H4m7-7-7 7 7 7" />
          </svg>
          Back to account
        </Link>

        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Group payments, made simple</p>

          <h1 id="chip-in-title" className={styles.title}>
            CHIP IN
          </h1>

          <h2 className={styles.subtitle}>
            Collect money from a group, without the chasing.
          </h2>

          <p className={styles.description}>
            Class trips, gifts, team fees, parties. Answer a few questions
            and share one link.
          </p>
        </div>

        <div className={styles.bottom}>
          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature.icon} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <FeatureIcon name={feature.icon} />
                </span>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>

          <Link href="/chip-in/create" className={styles.startButton}>
            Start an event
          </Link>
        </div>
      </section>
    </main>
  );
}