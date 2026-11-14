'use client';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { browserCollectionDashboardClient } from './browser-collection-dashboard-client';
import { browserCollectionPreviewClient } from '../collection-preview/browser-collection-preview-client';
import type { CollectionDashboard as Dashboard } from './collection-dashboard-client';
import { DeleteCollectionButton } from './delete-collection-button';
import { dashboardModel, initials } from './collection-dashboard-model';
import { displayMoney, localDateInput } from '../create-collection/create-collection-draft';
import { daysUntilDate, shortDeadline } from '../create-collection/calendar-date';
import { DashboardShareDialog } from './dashboard-share-dialog';
import { DashboardRemindersPanel } from './dashboard-reminders-panel';
import { DashboardManageLinkPanel } from './dashboard-manage-link-panel';
import { DashboardPeoplePanel } from './dashboard-people-panel';
import { DashboardAnswersPanel } from './dashboard-answers-panel';
import { DashboardBalancePanel } from './dashboard-balance-panel';
import { CollectionCompletion } from './collection-completion';
import { downloadDashboardCsv } from './dashboard-export';
import styles from './collection-dashboard.module.css';

type Panel = 'share' | 'reminders' | 'manage' | 'people' | 'answers' | 'balance' | null;
export function CollectionDashboard({
  collectionId,
  className = '',
}: {
  collectionId: string;
  className?: string;
}) {
  const [collection, setCollection] = useState<Dashboard | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [peopleScope, setPeopleScope] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [notice, setNotice] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [personId, setPersonId] = useState<string | undefined>();
  const [manageStart, setManageStart] = useState<string | undefined>();
  const [finishPreview, setFinishPreview] = useState(false);
  const [url, setUrl] = useState('');
  const [clock, setClock] = useState(0);
  const [ringPct, setRingPct] = useState(0);
  const [peopleRef] = useAutoAnimate({ duration: 200 });
  useEffect(() => {
    if (!collection) return;
    const timer = setTimeout(() => setRingPct(dashboardModel(collection).percentage ?? 0), 60);
    return () => clearTimeout(timer);
  }, [collection]);
  useEffect(() => {
    const refresh = () => {
      setCollection(browserCollectionDashboardClient.get(collectionId));
      setLoaded(true);
      setClock(Date.now());
      setUrl(
        new URL(`/chip-in/pay/${encodeURIComponent(collectionId)}`, window.location.origin)
          .href,
      );
    };
    let mounted = true;
    const sync = () => {
      if (mounted) refresh();
    };
    void browserCollectionPreviewClient.get(collectionId).then(sync);
    const owner = browserCollectionDashboardClient.subscribe(sync);
    // Refresh the owner snapshot too, so payments in another tab update the roster.
    const payments = browserCollectionPreviewClient.subscribe(() => {
      void browserCollectionPreviewClient.get(collectionId).then(sync);
    });
    return () => {
      mounted = false;
      owner();
      payments();
    };
  }, [collectionId]);
  if (!loaded)
    return (
      <main className={`${styles.screen} ${className}`}>
        <p>Opening your dashboard…</p>
      </main>
    );
  if (!collection)
    return (
      <main className={`${styles.screen} ${className}`}>
        <h1>Collection not found</h1>
        <Link href="/">Back to account</Link>
      </main>
    );
  const today = localDateInput(new Date(clock));
  const model = dashboardModel(collection, today);
  const money = (value: number) => displayMoney(value, collection.currency);
  const deadline = collection.deadline
    ? shortDeadline(collection.deadline)
    : 'No closing date';
  const daysLeft = collection.deadline
    ? Math.max(0, daysUntilDate(collection.deadline, today))
    : null;
  const tokenAvailable = collection.status === 'active' && clock < collection.expiresAt;
  const active =
    collection.isOpen &&
    tokenAvailable &&
    (!collection.deadline || today <= collection.deadline);
  const paidPeople = model.people.filter((person) => person.paid);
  const answers = paidPeople.filter((person) => person.answer);
  const filtered = model.people.filter(
    (person) =>
      (!model.group || !person.paid) &&
      person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const visible = search ? filtered : filtered.slice(0, 8);
  function openReminders(id?: string) {
    setPersonId(id);
    setPanel('reminders');
  }
  function openManage(start?: string) {
    setManageStart(start);
    setPanel('manage');
  }
  function showPeople(scope: 'all' | 'paid' | 'unpaid') {
    setPeopleScope(scope);
    setPanel('people');
  }
  function keepCompletion() {
    setFinishPreview(false);
    if (collection!.status === 'complete') {
      try {
        browserCollectionDashboardClient.savePreferences(collectionId, {
          ...collection!.preferences,
          completionDismissed: true,
        });
      } catch (reason) {
        setNotice(
          reason instanceof Error ? reason.message : 'Could not save dashboard settings.',
        );
      }
    }
  }
  if (
    finishPreview ||
    (collection.status === 'complete' && !collection.preferences.completionDismissed)
  )
    return (
      <main className={`${styles.screen} ${className}`}>
        <CollectionCompletion
          collection={collection}
          preview={finishPreview && collection.status !== 'complete'}
          onKeep={keepCompletion}
        />
        <p role="status">{notice}</p>
      </main>
    );
  function downloadList() {
    downloadDashboardCsv(
      [
        ['Name', 'People', 'Status', `Amount (${collection!.currency})`],
        ...model.people.map((person) => [
          person.name,
          person.quantity,
          person.status,
          (
            (person.paid
              ? person.amountMinorUnits
              : collection!.priceMinorUnits * person.quantity) / 100
          ).toFixed(2),
        ]),
      ],
      'chip-in-people.csv',
    );
  }
  return (
    <main className={`${styles.screen} ${className}`}>
      <div className={styles.toolbar}>
        <Link href="/">← Back to account</Link>
        <span className={styles.badge}>Frontend demo</span>
      </div>
      <header className={styles.header}>
        <div>
          <h1>{collection.title}</h1>
          <p>
            {money(collection.priceMinorUnits)}{' '}
            {model.group
              ? `each, ${collection.expectedCount} people`
              : 'per person, anyone with the link'}
            {collection.deadline
              ? `, ${model.group ? 'due' : 'closes'} ${deadline}`
              : ', no closing date'}
          </p>
        </div>
        <div className={styles.actions}>
          <button onClick={downloadList}>Download list</button>
          <button onClick={() => setPanel('share')}>Share link</button>
          <button
            className={styles.primary}
            disabled={model.group && !model.missing}
            onClick={() => (model.group ? openReminders() : openManage())}
          >
            {model.group ? `Remind ${model.missing} people` : 'Manage link'}
          </button>
        </div>
      </header>
      {!active && (
        <p className={styles.closed}>
          {collection.status === 'complete'
            ? 'Collection complete.'
            : !tokenAvailable
              ? 'Payment link expired.'
              : 'This payment link is closed or paused.'}{' '}
          Your saved owner record remains available here.
        </p>
      )}
      <section className={styles.mobileSummary} aria-label="Mobile collection progress">
        <p>Collected so far</p>
        <div className={styles.mobileTotal}>
          <strong>{money(model.total)}</strong>
          {model.target !== null && (
            <span>
              of{' '}
              {money(
                collection.limitType === 'goal' && !model.group
                  ? collection.goalMinorUnits
                  : model.total + model.outstanding,
              )}
            </span>
          )}
        </div>
        {model.percentage !== null && (
          <div className={styles.mobileTrack}>
            <span style={{ width: `${model.percentage}%` }} />
          </div>
        )}
        <div className={styles.mobileSummaryFooter}>
          <strong>
            {model.group
              ? `${model.paid} of ${collection.expectedCount} have paid`
              : collection.limitType === 'spots'
                ? `${model.paid} of ${collection.spotLimit} spots taken`
                : `${model.paid} people chipped in`}
          </strong>
          <span>{daysLeft === null ? 'No closing date' : `${daysLeft} days left`}</span>
        </div>
      </section>
      <div className={styles.columns}>
        <div className={styles.stack}>
          <section
            className={`${styles.card} ${styles.progressCard}`}
            aria-label="Collection progress"
          >
            <div className={styles.ring}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#edf0e8" strokeWidth="9" />
                <circle
                  className={styles.progressArc}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#9fe870"
                  strokeWidth="9"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset={100 - ringPct}
                  style={{ opacity: ringPct > 0 ? 1 : 0 }}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div>
                <strong>{model.paid}</strong>
                <span>
                  {model.target
                    ? `of ${model.target} ${model.group ? 'have paid' : 'spots'}`
                    : 'people have paid'}
                </span>
              </div>
            </div>
            <dl>
              <div>
                <dt>Collected</dt>
                <dd>{money(model.total)}</dd>
              </div>
              {(model.target !== null || collection.limitType === 'goal') && (
                <div>
                  <dt>
                    {model.group
                      ? 'Still to come'
                      : collection.limitType === 'goal'
                        ? 'Goal'
                        : 'If it sells out'}
                  </dt>
                  <dd>
                    {money(
                      model.group
                        ? model.outstanding
                        : collection.limitType === 'goal'
                          ? collection.goalMinorUnits
                          : model.total + model.missing * collection.priceMinorUnits,
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt>{model.group ? 'Time left' : 'Link closes in'}</dt>
                <dd>{daysLeft === null ? 'No date set' : `${daysLeft} days`}</dd>
              </div>
            </dl>
          </section>
          <section className={`${styles.card} ${styles.balanceCard}`}>
            <p>Available balance</p>
            <h2 className={styles.collected}>{money(model.available)}</h2>
            <p>Kept apart for {collection.title}.</p>
            {model.spent > 0 && <p>{money(model.spent)} already used in this demo.</p>}
            <button
              className={styles.dark}
              disabled={!model.available}
              onClick={() => setPanel('balance')}
            >
              Pay a bill or move money
            </button>
          </section>
        </div>
        <div className={styles.stack}>
          <section className={`${styles.card} ${styles.peopleCard}`}>
            {model.group && (
              <div className={styles.missing}>
                <span className={styles.warning}>!</span>
                <div>
                  <h3>{model.missing ? 'Still missing' : 'Everyone’s in'}</h3>
                  <p>
                    {model.missing} people haven’t paid
                    {daysLeft !== null ? `, ${daysLeft} days left` : ''}
                  </p>
                </div>
                <strong>{money(model.outstanding)}</strong>
              </div>
            )}
            <div className={styles.listHeader}>
              <h3>{model.group ? 'Who still owes' : 'Who’s coming'}</h3>
              <label>
                <span className={styles.srOnly}>Find a name</span>
                <input
                  type="search"
                  placeholder="Find a name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
            <div
              ref={peopleRef}
              className={`${styles.people} ${model.group ? styles.groupPeople : ''}`}
            >
              {visible.map((person) => (
                <div key={person.id} className={styles.person}>
                  <span className={styles.avatar}>{initials(person.name)}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <p>
                      <span className={styles.mobileQuantity}>
                        {!model.group
                          ? `${person.quantity} ${person.quantity === 1 ? 'person' : 'people'} · `
                          : ''}
                      </span>
                      {model.group ? person.status : person.when || person.status}
                    </p>
                  </div>
                  {model.group ? (
                    <button disabled={!active} onClick={() => openReminders(person.id)}>
                      Remind
                    </button>
                  ) : (
                    <>
                      <b className={styles.desktopQuantity}>
                        {person.quantity} {person.quantity === 1 ? 'person' : 'people'}
                      </b>
                      <b className={styles.mobilePersonAmount}>
                        {person.paid ? money(person.amountMinorUnits) : 'Pending'}
                      </b>
                    </>
                  )}
                </div>
              ))}
            </div>
            {!visible.length && (
              <p className={styles.noResults}>
                {search
                  ? 'No names match your search.'
                  : model.group && model.paid === collection.expectedCount
                    ? 'Everyone has paid. Thank you!'
                    : model.group
                      ? 'No roster is available for this older demo record.'
                      : 'No contributions yet. Share your link to get started.'}
              </p>
            )}
            <div className={styles.listFooter}>
              <span>
                Showing {visible.length} of {filtered.length}{' '}
                {model.group ? 'people' : 'payments'}
              </span>
              <button onClick={() => showPeople(model.group ? 'unpaid' : 'all')}>
                See all
              </button>
            </div>
          </section>
          <section className={`${styles.card} ${styles.paidStrip}`}>
            <div className={styles.paidAvatars}>
              {paidPeople.slice(0, 5).map((person) => (
                <span key={person.id} className={styles.avatar}>
                  {initials(person.name)}
                </span>
              ))}
            </div>
            <strong>{model.paid} people have already paid</strong>
            <button onClick={() => showPeople('paid')}>See all</button>
          </section>
          <section className={`${styles.card} ${styles.activity}`}>
            <div>
              <h3>Chipped in per day</h3>
              <strong>{model.days[5]}</strong>
              <p>people chipped in today</p>
            </div>
            <div
              className={styles.bars}
              aria-label={`Daily contributions: ${model.days.join(', ')}`}
            >
              {model.days.map((value, index) => (
                <div key={model.dayDates[index]}>
                  <strong>{value}</strong>
                  <span style={{ height: `${(value / Math.max(1, ...model.days)) * 78}px` }} />
                  <small>{shortDeadline(model.dayDates[index])}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className={styles.stack}>
          {model.group ? (
            <section className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.avatar} aria-hidden="true">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4" />
                  </svg>
                </span>
                <div>
                  <h3>Reminders, ready to copy</h3>
                  <p>Paste a message into your chat.</p>
                </div>
              </div>
              <p className={styles.nextReminder}>
                Pick a message, edit it if needed, and send it in your own chat.
              </p>
              <button onClick={() => openReminders()}>Copy a reminder</button>
            </section>
          ) : (
            <section className={styles.card}>
              <h3>{active ? 'The link is open' : 'The link is closed'}</h3>
              <p>
                {collection.limitType === 'none'
                  ? 'No limit on people.'
                  : collection.limitType === 'goal'
                    ? `Stop at ${money(collection.goalMinorUnits)}.`
                    : `${model.paid} of ${collection.spotLimit} spots taken.`}
              </p>
              <button onClick={() => openManage()}>Manage link</button>
            </section>
          )}
          <section className={styles.card}>
            <div className={styles.qrTeaser}>
              <QRCode value={url || collection.id} size={74} fgColor="#163300" />
              <div>
                <h3>{model.group ? 'Share with your group' : 'Get more people in'}</h3>
                <p>Send the link or share the QR code.</p>
              </div>
            </div>
            <button
              className={styles.dark}
              disabled={!active}
              onClick={() => setPanel('share')}
            >
              Share link & QR
            </button>
          </section>
          {collection.customQuestion && (
            <section className={styles.card}>
              <p>You asked</p>
              <h3>{collection.customQuestion}</h3>
              <div className={styles.answerTrack}>
                <span
                  style={{
                    width: `${paidPeople.length ? (answers.length / paidPeople.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p>
                <strong>
                  {answers.length} of {paidPeople.length}
                </strong>{' '}
                payments included an answer
              </p>
              <button onClick={() => setPanel('answers')}>See answers ›</button>
            </section>
          )}
          {!model.group && (
            <section className={`${styles.card} ${styles.cardTitle}`}>
              <div>
                <h3>Co-hosts</h3>
                <p>
                  {collection.preferences.cohosts.length
                    ? collection.preferences.cohosts.join(', ')
                    : 'Only you so far'}
                </p>
              </div>
              <button onClick={() => openManage('cohosts')}>
                {collection.preferences.cohosts.length ? 'Manage' : 'Add'}
              </button>
            </section>
          )}
        </div>
      </div>
      {model.group && (
        <div className={styles.secondaryRow}>
          <button className={styles.textAction} onClick={() => setFinishPreview(true)}>
            Preview collection close
          </button>
        </div>
      )}
      <p className={styles.demoNote}>
        Saved in this browser · demo payments only. Delete removes this dashboard and its saved
        payment link.
      </p>
      <DeleteCollectionButton collectionId={collectionId} />
      <nav className={styles.mobileDock} aria-label="Collection actions">
        <button className={styles.primary} onClick={() => setPanel('share')}>
          Share link
        </button>
        <button onClick={() => (model.group ? openReminders() : openManage())}>
          {model.group ? 'Reminders' : 'Manage link'}
        </button>
      </nav>
      {panel === 'share' && (
        <DashboardShareDialog
          collection={collection}
          url={url}
          available={tokenAvailable}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'reminders' && (
        <DashboardRemindersPanel
          collection={collection}
          url={url}
          personId={personId}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'manage' && (
        <DashboardManageLinkPanel
          collection={collection}
          editable={tokenAvailable}
          startAt={manageStart}
          onClose={() => setPanel(null)}
          onShare={() => setPanel('share')}
        />
      )}
      {panel === 'people' && (
        <DashboardPeoplePanel
          collection={collection}
          initial={peopleScope}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'answers' && (
        <DashboardAnswersPanel collection={collection} onClose={() => setPanel(null)} />
      )}
      {panel === 'balance' && (
        <DashboardBalancePanel collection={collection} onClose={() => setPanel(null)} />
      )}
      <p className={styles.notice} role="status">
        {notice}
      </p>
    </main>
  );
}
