'use client';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';
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
import { CollectionCompletion } from './collection-completion';
import { nextReminderDate } from './dashboard-settings';
import { downloadDashboardCsv } from './dashboard-export';
import styles from './collection-dashboard.module.css';

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
  const [panel, setPanel] = useState<
    'share' | 'reminders' | 'manage' | 'people' | 'answers' | null
  >(null);
  const [personId, setPersonId] = useState<string | undefined>();
  const [manageStart, setManageStart] = useState<string | undefined>();
  const [finishPreview, setFinishPreview] = useState(false);
  const [url, setUrl] = useState('');
  const [clock, setClock] = useState(0);
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
    // Reading prunes expired payment tokens; aggregate mock summaries remain.
    void browserCollectionPreviewClient.get(collectionId).then(refresh);
    const owner = browserCollectionDashboardClient.subscribe(refresh);
    const payments = browserCollectionPreviewClient.subscribe(refresh);
    return () => {
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
  const model = dashboardModel(collection);
  const money = (amount: number) => displayMoney(amount, collection.currency);
  const deadline = collection.deadline
    ? shortDeadline(collection.deadline)
    : 'No closing date';
  const daysLeft = collection.deadline
    ? Math.max(0, daysUntilDate(collection.deadline, localDateInput(new Date(clock))))
    : null;
  const active =
    collection.isOpen &&
    collection.status === 'active' &&
    clock < collection.expiresAt &&
    (!collection.deadline || localDateInput() <= collection.deadline);
  const filtered = model.people.filter(
    (person) =>
      (!model.group || !person.paid) &&
      person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const visible = search ? filtered : filtered.slice(0, 8);
  const tokenAvailable = collection.status === 'active' && clock < collection.expiresAt;
  const nextReminder = nextReminderDate(
    collection.preferences,
    collection.deadline,
    localDateInput(new Date(clock)),
  );
  const answers = model.people.filter((person) => person.paid && person.answer);
  function openReminders(id?: string) {
    setPersonId(id);
    setPanel('reminders');
  }
  function openManage(start?: string) {
    setManageStart(start);
    setPanel('manage');
  }
  function saveException() {
    try {
      browserCollectionDashboardClient.savePreferences(collectionId, {
        ...collection!.preferences,
        exceptionResolved: true,
      });
      setNotice('Sample payment reviewed. No real payment was changed.');
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Could not save the change.');
    }
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
  const noticeAction = (message: string) =>
    setNotice(`${message} Demo only; no messages or money were sent.`);
  const { currency, priceMinorUnits: currentPrice } = collection;
  function downloadList() {
    downloadDashboardCsv(
      [
        ['Name', 'People', 'Status', `Amount (${currency})`],
        ...model.people.map((person) => [
          person.name,
          person.quantity,
          person.paid ? 'Paid' : 'Unpaid',
          ((person.paid ? person.amountMinorUnits : currentPrice) / 100).toFixed(2),
        ]),
      ],
      'chip-in-demo-list.csv',
    );
  }
  return (
    <main className={`${styles.screen} ${className}`}>
      <div className={styles.toolbar}>
        <Link href="/">← Back to account</Link>
        <span className={styles.badge}>MOCK DASHBOARD</span>
      </div>
      <header className={styles.header}>
        <div>
          <h1>{collection.title}</h1>
          <p>
            {money(collection.priceMinorUnits)}{' '}
            {model.group
              ? `each, ${collection.expectedCount} people`
              : 'per person, anyone with the link'}{' '}
            · {model.group ? 'due' : 'closes'} {deadline}
          </p>
        </div>
        <div className={styles.actions}>
          <button onClick={downloadList}>Download list</button>
          <button onClick={() => setPanel('share')}>Share link</button>
          <button
            className={styles.primary}
            onClick={() => (model.group ? openReminders() : openManage())}
          >
            {model.group ? `Remind ${model.missing} people` : 'Manage link'}
          </button>
          {model.group && (
            <button type="button" onClick={() => setFinishPreview(true)}>
              Preview finish
            </button>
          )}
        </div>
      </header>
      <p className={styles.demoNote}>
        Sample statistics and fictional activity. Demo payments update the totals locally; the
        backend will supply live data.
      </p>
      {!active && (
        <p className={styles.closed}>
          {collection.status === 'complete'
            ? 'Collection complete. Temporary payment data has been deleted.'
            : !tokenAvailable
              ? 'Demo link expired. Temporary payment data has been deleted.'
              : 'The organiser has paused this payment link.'}{' '}
          This mock dashboard summary is retained.
        </p>
      )}
      <div className={styles.columns}>
        <div className={styles.stack}>
          <section
            className={`${styles.card} ${styles.progressCard}`}
            aria-label="Collection progress"
          >
            <div
              className={styles.ring}
              style={{
                background:
                  model.percentage === null
                    ? '#9fe870'
                    : `conic-gradient(#9fe870 ${model.percentage}%, #edf0e8 0)`,
              }}
            >
              <div>
                <strong>{model.paid}</strong>
                <span>
                  {model.target
                    ? `of ${model.target} ${model.group ? 'have paid' : 'spots'}`
                    : 'people joined'}
                </span>
              </div>
            </div>
            <dl>
              <div>
                <dt>Collected</dt>
                <dd>{money(model.total)}</dd>
              </div>
              {model.target !== null && (
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
          {model.group ? (
            <section className={styles.card}>
              <p>Collected for this trip</p>
              <h2 className={styles.collected}>{money(model.total)}</h2>
              <p>Keep the group’s payments organised in one place.</p>
              <button
                className={styles.dark}
                onClick={() => noticeAction('Trip bill payment preview.')}
              >
                Pay the trip bill
              </button>
            </section>
          ) : (
            <section className={styles.card}>
              <div className={styles.qrTeaser}>
                <QRCode value={url || collection.id} size={74} fgColor="#163300" />
                <div>
                  <h3>Get more people in</h3>
                  <p>Share the code on a poster or send the link again.</p>
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
          )}
        </div>
        <div className={styles.stack}>
          {!model.group && (
            <section className={`${styles.card} ${styles.activity}`}>
              <div>
                <h3>Chipped in per day</h3>
                <strong>{model.days[5]}</strong>
                <p>
                  chipped in today,
                  <br />
                  your best day so far.
                </p>
              </div>
              <div
                className={styles.bars}
                aria-label={`Sample daily contributions: ${model.days.join(', ')}`}
              >
                {model.days.map((value, index) => (
                  <div key={index}>
                    <strong>{value}</strong>
                    <span
                      style={{ height: `${(value / Math.max(1, ...model.days)) * 72}px` }}
                    />
                    <small>
                      {9 + index}
                      <br />
                      Nov
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className={styles.card}>
            {model.group && (
              <div className={styles.missing}>
                <span className={styles.warning}>!</span>
                <div>
                  <h3>Still missing</h3>
                  <p>{model.missing} people haven’t paid</p>
                </div>
                <strong>{money(model.outstanding)}</strong>
              </div>
            )}
            <div className={styles.listHeader}>
              <h3>{model.group ? 'Who still owes' : 'Who’s coming'}</h3>
              <label>
                <span className={styles.srOnly}>Find a name</span>
                <input
                  placeholder="Find a name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
            <div className={`${styles.people} ${model.group ? styles.groupPeople : ''}`}>
              {visible.map((person) => (
                <div key={person.id} className={styles.person}>
                  <span className={styles.avatar}>{initials(person.name)}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <p>
                      {model.group
                        ? person.paid
                          ? 'Paid · thank you!'
                          : person.status
                        : person.when}
                    </p>
                  </div>
                  {model.group && !person.paid ? (
                    <button onClick={() => openReminders(person.id)}>Remind</button>
                  ) : (
                    !model.group && (
                      <b>
                        {person.quantity} {person.quantity === 1 ? 'person' : 'people'}
                      </b>
                    )
                  )}
                </div>
              ))}
            </div>
            {!visible.length && (
              <p className={styles.noResults}>No names match your search.</p>
            )}
            <div className={styles.listFooter}>
              <span>
                Showing {visible.length} of {filtered.length}{' '}
                {model.group ? 'people' : 'payments'}
              </span>
              <button
                onClick={() => {
                  setPeopleScope(model.group ? 'unpaid' : 'all');
                  setPanel('people');
                }}
              >
                See all
              </button>
            </div>
          </section>
          {model.group && (
            <section className={`${styles.card} ${styles.paidStrip}`}>
              <div className={styles.paidAvatars}>
                {model.people
                  .filter((person) => person.paid)
                  .slice(0, 5)
                  .map((person) => (
                    <span key={person.id} className={styles.avatar}>
                      {initials(person.name)}
                    </span>
                  ))}
              </div>
              <strong>{model.paid} people have already paid</strong>
              <button
                onClick={() => {
                  setPeopleScope('paid');
                  setSearch('');
                  setPanel('people');
                }}
              >
                {' '}
                See paid
              </button>
            </section>
          )}
        </div>
        <div className={styles.stack}>
          {model.group && (
            <section className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.avatar}>
                  <svg
                    className={styles.bellIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4" />
                  </svg>
                </span>
                <div>
                  <h3>
                    Reminders are {collection.preferences.remindersEnabled ? 'on' : 'off'}
                  </h3>
                  <p>
                    {collection.preferences.remindersEnabled
                      ? 'Your automatic schedule is saved.'
                      : 'Reminders are paused.'}
                  </p>
                </div>
              </div>
              <p className={styles.nextReminder}>
                Next one
                <br />
                <strong>
                  {nextReminder && active && model.missing
                    ? `${shortDeadline(nextReminder)}, to ${model.missing} people`
                    : 'No upcoming reminder'}
                </strong>
              </p>
              <button onClick={() => openReminders()}>Manage reminders</button>
            </section>
          )}
          {!collection.preferences.exceptionResolved && (
            <section className={styles.card}>
              <h3>
                Needs a look <small>1</small>
              </h3>
              <div className={styles.exception}>
                <strong>Related to this event?</strong>
                <div>
                  <b>{model.group ? 'Märt Hein' : 'Helen Lepp'}</b>
                  <b>+ {money(collection.priceMinorUnits)}</b>
                </div>
                <p>13 Nov, “{model.group ? 'Rome for Laura Kuusk' : 'party xx'}”</p>
              </div>
              {model.group && (
                <div className={styles.suggestedMatch}>
                  <span className={styles.avatar}>LK</span>
                  <div>
                    <strong>Probably Laura Kuusk</strong>
                    <p>Named in the reference, same amount</p>
                  </div>
                </div>
              )}
              <div className={styles.smallActions}>
                <button
                  className={styles.dark}
                  onClick={() => {
                    saveException();
                  }}
                >
                  {model.group ? 'It’s Laura' : 'Yes, add Helen'}
                </button>
                <button
                  onClick={() => {
                    saveException();
                  }}
                >
                  Not related
                </button>
              </div>
            </section>
          )}
          {!model.group && collection.customQuestion && (
            <section className={styles.card}>
              <p>You asked</p>
              <h3>{collection.customQuestion}</h3>
              <div className={styles.answerTrack}>
                <span
                  style={{
                    width: `${model.people.length ? (answers.length / model.people.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p>
                <strong>
                  {answers.length} of {model.people.length}
                </strong>{' '}
                wrote something, {model.people.length - answers.length} skipped it
              </p>
              <button onClick={() => setPanel('answers')}>See answers ›</button>
            </section>
          )}
          {!model.group && (
            <section className={`${styles.card} ${styles.cardTitle}`}>
              <span className={styles.avatar}>JD</span>
              <div>
                <h3>Co-hosts</h3>
                <p>
                  {collection.preferences.cohosts.length
                    ? collection.preferences.cohosts.join(', ')
                    : 'Only you so far'}
                </p>
              </div>
              <button className={styles.dark} onClick={() => openManage('cohosts')}>
                {collection.preferences.cohosts.length ? 'Manage' : 'Add'}
              </button>
            </section>
          )}
        </div>
      </div>
      <DeleteCollectionButton collectionId={collectionId} />
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
      <p className={styles.notice} role="status">
        {notice}
      </p>
    </main>
  );
}
