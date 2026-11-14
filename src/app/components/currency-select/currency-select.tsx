import styles from './currency-select.module.css';

type Currency = 'EUR' | 'GBP' | 'USD';
/** Native picker and keyboard behavior with a consistent visible currency pill. */
export function CurrencySelect({
  id,
  value,
  onChange,
  label = 'Currency',
  disabled = false,
}: {
  id?: string;
  value: Currency;
  onChange: (value: Currency) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <span className={styles.control} data-disabled={disabled}>
      <span className={styles.code} aria-hidden="true">
        {value}
      </span>
      <svg
        className={styles.chevron}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
      <select
        id={id}
        value={value}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (next === 'EUR' || next === 'GBP' || next === 'USD') onChange(next);
        }}
      >
        <option value="EUR">EUR · Euro</option>
        <option value="GBP">GBP · British pound</option>
        <option value="USD">USD · US dollar</option>
      </select>
    </span>
  );
}
