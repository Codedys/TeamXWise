'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Inter } from 'next/font/google';
import styles from './wise-homepage.module.css';
import Link from 'next/link';
import { CollectionCards } from './components/collection-dashboard/collection-cards';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const iconPaths = {
  home: 'M3 10 12 3l9 7v11H3Z',
  card: 'M3 4h18v6a3 3 0 0 0 0 6v4H3ZM6 8h3',
  list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
  payments: 'M4 12 16 1M8 1h8v8M20 12 8 23m8 0H8v-8',
  calendar: 'M7 2v6M17 2v6M3 5h18v16H3ZM15 15h2',
  repeat: 'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5',
  recurring: 'M20 8a8 8 0 1 0-1 11M20 3v5h-5',
  invoice: 'M4 3h16M12 22V7m-6 6 6-6 6 6',
  request: 'M3 4h18v12H3ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 8v4m12 3v7m-3-3 3 3 3-3',
  split: 'M12 22V12L4 4m0 6V4h6m2 8 8-8m-6 0h6v6',
  users:
    'M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM1 22v-3a8 8 0 0 1 16 0v3M15 3a4 4 0 0 1 3 7m1 12v-3a9 9 0 0 0-3-7',
  chart: 'M3 21h20M6 21V11m6 10V6m6 15V1',
  chevron: 'm9 5 7 7-7 7',
  up: 'm5 15 7-7 7 7',
  plus: 'M12 3v18M3 12h18',
  close: 'm4 4 16 16M20 4 4 20',
  bank: 'm2 7 10-5 10 5H2Zm2 2v11m5-11v11m6-11v11m5-11v11M2 22h20',
  bag: 'm9 6-2-4h10l-2 4m-6 0h6m-6 1C6 10 3 14 3 18c0 4 18 4 18 0 0-4-3-8-6-11M14.5 11h-3a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4h-3M12 9v12',
  jar: 'M5 2h14v4H5Zm2 4v3l-3 4v9h16v-9l-3-4V6',
  coin: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM15 7h-4a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5H9m3-12v14',
  chip: 'M18 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 14h4l4-3h5a2 2 0 0 1 0 4h-4m-5-1 4 6h5l7-7a2 2 0 0 0-3-2l-4 4M2 12v9h4v-9Z',
  arrows: 'M2 12h20M8 6l-6 6 6 6m8-12 6 6-6 6',
} as const;

type IconName = keyof typeof iconPaths;

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`${styles.icon} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

// Official Wise logo paths from Wise's public homepage.
function WiseLogo() {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 88 20"
      fill="#163300"
      role="img"
      aria-label="Wise"
    >
      <path d="M48.9285.2989h5.413L51.6183 19.7263h-5.4131L48.9285.2989Zm-6.8241 0L38.4514 11.4904 36.8573.2989h-3.7858L28.2893 11.4572 27.6917.2989h-5.2472L24.271 19.7263h4.3504L34.0014 7.4389 35.8943 19.7263h4.284L47.2518.2989h-5.1474ZM87.5508 11.59H74.6988c.0665 2.5239 1.5775 4.1844 3.8025 4.1844 1.6771 0 3.0055-.8967 4.035-2.607l4.3382 1.972C85.3833 18.0775 82.2413 19.992 78.3685 19.992 73.0883 19.992 69.5847 16.4386 69.5847 10.7266 69.5847 4.4501 73.7025 0 79.5142 0c5.1145 0 8.3357 3.4538 8.3357 8.8336 0 .8967-.1 1.7933-.299 2.7564Zm-4.8153-3.7194c0-2.2582-1.262-3.6862-3.2877-3.6862-2.0922 0-3.8191 1.4944-4.2841 3.6862h7.5718ZM5.5255 6.1532 0 12.6107h9.8661l1.1086-3.0449H6.747l2.5832-2.9868.0083-.0792L7.6588 3.6085h7.5569l-5.8579 16.1179h4.0087L20.4402.2989H2.166L5.5255 6.1532Zm57.6165-1.9689c1.9095 0 3.5827 1.0269 5.0439 2.7869l.7677-5.4769C67.592.5729 65.7489 0 63.308 0c-4.8485 0-7.5716 2.8394-7.5716 6.4426 0 2.499 1.3948 4.0266 3.6862 5.0146l1.0959.4981c2.0423.8718 2.5904 1.3036 2.5904 2.2251 0 .9547-.9216 1.5608-2.3247 1.5608-2.3164.0083-4.1927-1.1789-5.6041-3.2047l-.7822 5.5803C56.0053 19.3423 58.0657 19.992 60.7842 19.992c4.6077 0 7.4389-2.6568 7.4389-6.343 0-2.5072-1.1125-4.1179-3.9188-5.3798l-1.1954-.5645c-1.6605-.7389-2.225-1.1457-2.225-1.9593 0-.88.7721-1.5609 2.2582-1.5609Z" />
    </svg>
  );
}

function EuroFlag() {
  return (
    <svg className={styles.currencyFlag} viewBox="0 0 48 48" role="img" aria-label="Euro">
      <circle cx="24" cy="24" r="24" fill="#17118b" />
      {Array.from({ length: 12 }, (_, index) => (
        <path
          key={index}
          d="m24 5 .9 2.7h2.8l-2.3 1.7.9 2.7-2.3-1.7-2.3 1.7.9-2.7-2.3-1.7h2.8Z"
          fill="#ffdf00"
          transform={`rotate(${index * 30} 24 24)`}
        />
      ))}
    </svg>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  sub = false,
  expanded = false,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  sub?: boolean;
  expanded?: boolean;
}) {
  return (
    <div
      className={[
        styles.navItem,
        active ? styles.selected : '',
        sub ? styles.subItem : '',
        label.includes('\n') ? styles.recurring : '',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} />
      <span>{label}</span>
      {expanded && <Icon name="up" className={styles.disclosure} />}
    </div>
  );
}

function AccountCover() {
  return (
    <svg
      className={styles.accountCover}
      viewBox="0 0 346 84"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 0H346V70H213C197 70 190 84 173 84S149 70 133 70H0Z" fill="#e8ebe6" />
    </svg>
  );
}

function AccountCard({ savings = false }: { savings?: boolean }) {
  return (
    <article className={styles.accountCard}>
      {savings ? (
        <div className={styles.savingsCover}>
          <span>Jar</span>
          <Icon name="bag" />
        </div>
      ) : (
        <AccountCover />
      )}

      <div className={styles.accountContent}>
        <div className={styles.accountTitle}>
          <h2>{savings ? 'Savings' : 'Main account'}</h2>
          <Icon name="chevron" />
        </div>

        <div className={styles.currencyRow}>
          <EuroFlag />
          <span>€0.00</span>
          <Icon name="chevron" />
        </div>
      </div>

      {!savings && (
        <span className={styles.accountDetails}>
          <Icon name="bank" />
          Account details
        </span>
      )}
    </article>
  );
}

function MenuOption({
  icon,
  title,
  description,
  tone = 'forest',
  isNew = false,
  href,
}: {
  icon: IconName;
  title: string;
  description: string;
  tone?: 'forest' | 'gold' | 'purple';
  isNew?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <span className={`${styles.optionIcon} ${styles[tone]}`}>
        <Icon name={icon} />
      </span>

      <div className={styles.optionCopy}>
        <h4>
          {title}
          {isNew && <span className={styles.newBadge}>New</span>}
        </h4>
        <p>{description}</p>
      </div>

      <Icon name="chevron" className={styles.optionChevron} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${styles.menuOption} ${styles.menuOptionLink}`}>
        {content}
      </Link>
    );
  }

  return <div className={styles.menuOption}>{content}</div>;
}

export default function HomePage() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      // Cached pages stay in the DOM. Release the modal before this page is hidden.
      dialog?.close();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
      setMenuOpen(false);
    };
  }, []);

  function openMenu() {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) return;

    dialog.showModal();
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setMenuOpen(true);
    closeRef.current?.focus();
  }

  function restorePage() {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }

    setMenuOpen(false);
    // A queued close event must not move focus back to a hidden cached page.
    const trigger = triggerRef.current;
    if (trigger?.getClientRects().length) trigger.focus();
  }

  return (
    <div className={`${inter.className} ${styles.root}`}>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <div className={styles.sidebarLogo}>
          <WiseLogo />
        </div>

        <nav className={styles.navigation}>
          <NavItem icon="home" label="Home" active />
          <NavItem icon="card" label="Cards" />
          <NavItem icon="list" label="Transactions" />
          <NavItem icon="payments" label="Payments" expanded />
          <NavItem icon="calendar" label="Scheduled transfers" sub />
          <NavItem icon="repeat" label="Direct Debits" sub />
          <NavItem icon="recurring" label={'Recurring card\npayments'} sub />
          <NavItem icon="invoice" label="Pay invoices" sub />
          <NavItem icon="request" label="Payment requests" sub />
          <NavItem icon="split" label="Bill splits" sub />
          <NavItem icon="users" label="Recipients" />
          <NavItem icon="chart" label="Insights" />
        </nav>
      </aside>

      <div className={styles.accountPage}>
        <header className={styles.accountHeader}>
          <div className={styles.mobileLogo}>
            <WiseLogo />
          </div>

          <span className={`${styles.pill} ${styles.earn}`}>Earn €150</span>

          <button
            ref={triggerRef}
            className={`${styles.pill} ${styles.moreButton}`}
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-controls="wise-more-dialog"
            aria-expanded={menuOpen}
            type="button"
          >
            Do more
            <Icon name="plus" />
          </button>

          <div className={styles.profile}>
            <span className={styles.avatar}>
              JD
              <span className={styles.notificationDot} />
            </span>
            <span className={styles.profileName}>John Doe</span>
            <Icon name="chevron" className={styles.profileChevron} />
          </div>
        </header>

        <main className={styles.mainContent}>
          <section aria-label="Total balance">
            <p className={styles.balanceLabel}>Total balance</p>

            <div className={styles.balanceLine}>
              <h1>0.00 EUR</h1>
              <span className={styles.balanceChart}>
                <Icon name="chart" />
              </span>
            </div>

            <div className={styles.accountActions}>
              <span className={`${styles.pill} ${styles.primary}`}>Send</span>
              <span className={`${styles.pill} ${styles.secondary}`}>Add money</span>
              <span className={`${styles.pill} ${styles.secondary}`}>Request</span>
              <span className={`${styles.pill} ${styles.secondary}`}>Upload</span>
            </div>
          </section>

          <section className={styles.accountsCarousel} aria-label="Your accounts">
            <AccountCard />
            <AccountCard savings />

            <article
              className={`${styles.accountCard} ${styles.discoverCard}`}
              aria-hidden="true"
            >
              <AccountCover />

              <div className={styles.discoverCopy}>
                <h2>Do more with Wise</h2>
                <p>
                  Manage it, share it, grow it.
                  <br />
                  Make more of your money.
                </p>
                <span className={`${styles.pill} ${styles.primary}`}>Do more</span>
              </div>
            </article>
          </section>

          <CollectionCards />

          <section className={styles.cardPromotion} aria-label="Get a Wise card">
            <span className={styles.promotionIcon}>
              <Icon name="card" />
            </span>

            <div className={styles.promotionContent}>
              <h2>Get a Wise card</h2>
              <p>Spend straight from your Wise account, at home and abroad.</p>
              <span className={`${styles.pill} ${styles.orderCard}`}>Order card</span>
            </div>

            <span className={styles.promotionClose} aria-hidden="true">
              <Icon name="close" />
            </span>
          </section>

          <section className={styles.transactions} aria-labelledby="transactions-heading">
            <div className={styles.transactionsHeader}>
              <h2 id="transactions-heading">Transactions</h2>
              <span className={styles.seeAll}>See all</span>
            </div>

            <div className={styles.transactionsPlaceholder} aria-hidden="true">
              <span className={styles.placeholderIcon}>
                <Icon name="arrows" />
              </span>
            </div>
          </section>

          <p className={styles.conceptNote}>Team X · Wise Hackathon 2026 concept</p>
        </main>
      </div>

      <dialog
        ref={dialogRef}
        id="wise-more-dialog"
        className={styles.dialog}
        aria-labelledby="more-heading"
        onClose={restorePage}
      >
        <header className={styles.moreHeader}>
          <WiseLogo />

          <div className={styles.moreHeaderActions}>
            <span className={styles.avatar}>JD</span>
            <button
              ref={closeRef}
              className={styles.closeButton}
              onClick={() => dialogRef.current?.close()}
              type="button"
              aria-label="Close Do more"
            >
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div className={styles.moreContent}>
          <h2 id="more-heading">Do more with Wise</h2>

          <section className={styles.menuGroup}>
            <h3>Open an account</h3>

            <MenuOption
              icon="jar"
              title="Jar"
              description="Set money aside for your goals, with options to grow your money."
            />
            <MenuOption
              icon="users"
              title="Spend with others"
              description="One pot to spend from, shared by everyone you invite."
            />
            <MenuOption
              icon="chip"
              title="Chip in"
              description="Collect money from a group. One link, no chasing."
              href="/chip-in"
              isNew
            />
          </section>

          <section className={styles.menuGroup}>
            <h3>Organise</h3>
            <MenuOption
              icon="coin"
              title="Add a currency"
              description="Keep money in the currencies you need, ready to use."
              tone="gold"
            />
          </section>

          <section className={styles.menuGroup}>
            <h3>Automate</h3>
            <MenuOption
              icon="payments"
              title="Scheduled transfers"
              description="Send money at a later date."
              tone="purple"
            />
            <MenuOption
              icon="arrows"
              title="Auto conversions"
              description="Pick a target rate and convert money automatically when it’s reached."
              tone="purple"
            />
            <MenuOption
              icon="repeat"
              title="Direct debits"
              description="Pay regular bills from your Wise account."
              tone="purple"
            />
          </section>
        </div>
      </dialog>
    </div>
  );
}
