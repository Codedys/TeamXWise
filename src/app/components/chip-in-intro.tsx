'use client';
import Link from 'next/link';
import { motion, MotionConfig } from 'motion/react';
import styles from './chip-in-intro.module.css';

type FeatureIcon = 'link' | 'check' | 'people';

const features: { icon: FeatureIcon; text: string; bg: string; fg: string }[] = [
  { icon: 'link', text: 'Everyone pays from a link. No app needed.', bg: '#a0e1e1', fg: '#21231d' },
  { icon: 'check', text: 'See who has paid, as it happens.', bg: '#9fe870', fg: '#163300' },
  {
    icon: 'people',
    text: "Keep your group's collection organised in one place.",
    bg: '#ffc091',
    fg: '#320707',
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

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
    <MotionConfig reducedMotion="user">
      <main className={styles.screen}>
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
            <motion.p
              className={styles.eyebrow}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              Group payments, made simple
            </motion.p>

            <motion.h1
              id="chip-in-title"
              className={styles.title}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.07, ease }}
            >
              CHIP IN
            </motion.h1>

            <motion.h2
              className={styles.subtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease }}
            >
              Collect money from a group, without the chasing.
            </motion.h2>

            <motion.p
              className={styles.description}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease }}
            >
              Class trips, gifts, team fees, parties. Answer a few questions and share one link.
            </motion.p>
          </div>

          <div className={styles.bottom}>
            <ul className={styles.features}>
              {features.map((feature, i) => (
                <motion.li
                  key={feature.icon}
                  className={styles.feature}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.32 + i * 0.08, ease }}
                >
                  <span
                    className={styles.featureIcon}
                    style={{ background: feature.bg, color: feature.fg }}
                  >
                    <FeatureIcon name={feature.icon} />
                  </span>
                  <p>{feature.text}</p>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.56, ease }}
            >
              <Link href="/chip-in/create" className={styles.startButton}>
                Start an event
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}
