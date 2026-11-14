'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  angleDelta,
  dialPointerAngle,
  DIAL_GEOMETRY,
  clampPeople,
  peopleAfterRotation,
  wheelPeopleDelta,
  MIN_PEOPLE,
  MAX_PEOPLE,
  DEGREES_PER_PERSON,
} from './people-dial-geometry';
import styles from './people-dial.module.css';

interface DragSession {
  pointerId: number;
  lastAngle: number;
  rotation: number;
  start: number;
}

export function PeopleDial({
  value,
  onChange,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragSession | null>(null);
  const wheelRemainder = useRef(0);
  const frame = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);
  const lastCommitted = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const [visualValue, setVisualValue] = useState<number | null>(null);
  const selected = Math.round(clampPeople(value.trim() ? Number(value) : 12));
  const rotationValue = visualValue ?? selected;
  const firstTick = Math.max(MIN_PEOPLE, Math.floor(rotationValue) - 24);
  const lastTick = Math.min(MAX_PEOPLE, Math.ceil(rotationValue) + 24);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || drag.current) return;
      event.preventDefault();
      wheelRemainder.current += wheelPeopleDelta(
        event.deltaY || event.deltaX,
        event.deltaMode,
      );
      const steps = Math.trunc(wheelRemainder.current);
      if (steps) {
        wheelRemainder.current -= steps;
        setVisualValue(null);
        onChange(String(Math.round(clampPeople(selected + steps))));
      }
    }
    panel.addEventListener('wheel', onWheel, { passive: false });
    return () => panel.removeEventListener('wheel', onWheel);
  }, [selected, onChange]);

  function pointerAngle(event: PointerEvent<HTMLDivElement>) {
    return dialPointerAngle(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
  }
  function stopFrame() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }
  function release() {
    stopFrame();
    if (pendingValue.current !== null) {
      const rounded = Math.round(pendingValue.current);
      if (rounded !== lastCommitted.current) onChange(String(rounded));
    }
    pendingValue.current = null;
    drag.current = null;
    setVisualValue(null);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      lastAngle: pointerAngle(event),
      rotation: 0,
      start: selected,
    };
    lastCommitted.current = selected;
    pendingValue.current = selected;
    setVisualValue(selected);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const angle = pointerAngle(event);
    current.rotation += angleDelta(current.lastAngle, angle);
    current.lastAngle = angle;
    const next = peopleAfterRotation(current.start, current.rotation);
    // Clamp the drag origin too, so reversing direction at an end responds immediately.
    if (next === MIN_PEOPLE || next === MAX_PEOPLE) {
      current.start = next;
      current.rotation = 0;
    }
    pendingValue.current = next;
    if (frame.current === null)
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const value = pendingValue.current;
        if (value === null) return;
        setVisualValue(value);
        const rounded = Math.round(value);
        if (rounded !== lastCommitted.current) {
          lastCommitted.current = rounded;
          onChange(String(rounded));
        }
      });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    release();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const changes: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 10,
      PageDown: -10,
    };
    if (event.key === 'Home' || event.key === 'End' || event.key in changes) {
      event.preventDefault();
      setVisualValue(null);
      onChange(
        String(
          event.key === 'Home'
            ? MIN_PEOPLE
            : event.key === 'End'
              ? MAX_PEOPLE
              : clampPeople(selected + changes[event.key]),
        ),
      );
    }
  }

  return (
    <div ref={panelRef} className={styles.panel} data-dragging={visualValue !== null}>
      <div className={styles.valueArea}>
        <input
          id="people-count"
          name="peopleCount"
          className={styles.value}
          type="number"
          inputMode="numeric"
          min={MIN_PEOPLE}
          max={MAX_PEOPLE}
          step={1}
          value={value}
          placeholder="12"
          onChange={(event) => onChange(event.target.value)}
          aria-label="Number of people"
          aria-invalid={invalid}
          aria-describedby="people-dial-help"
        />
        <span className={styles.unit}>people</span>
      </div>
      <div
        className={styles.wheel}
        role="slider"
        tabIndex={0}
        aria-label="Turn the dial to choose the number of people"
        aria-valuemin={MIN_PEOPLE}
        aria-valuemax={MAX_PEOPLE}
        aria-valuenow={selected}
        aria-valuetext={`${selected} people`}
        aria-describedby="people-dial-help"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          if (drag.current) release();
        }}
        onKeyDown={keyDown}
      >
        <svg
          viewBox={`0 0 ${DIAL_GEOMETRY.width} ${DIAL_GEOMETRY.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <circle
            cx={DIAL_GEOMETRY.centerX}
            cy={DIAL_GEOMETRY.centerY}
            r={DIAL_GEOMETRY.radius}
            fill="#102b00"
          />
          <g
            className={styles.ticks}
            style={{
              transform: `rotate(${-rotationValue * DEGREES_PER_PERSON}deg)`,
              transformOrigin: `${DIAL_GEOMETRY.centerX}px ${DIAL_GEOMETRY.centerY}px`,
            }}
          >
            {Array.from({ length: lastTick - firstTick + 1 }, (_, i) => {
              const number = firstTick + i;
              return (
                <g
                  key={number}
                  transform={`rotate(${number * DEGREES_PER_PERSON} ${DIAL_GEOMETRY.centerX} ${DIAL_GEOMETRY.centerY})`}
                >
                  <line
                    x1="360"
                    x2="360"
                    y1="86"
                    y2={number % 5 === 0 ? '116' : '104'}
                    stroke={number === selected ? '#9fe870' : '#73965b'}
                    strokeWidth={number % 5 === 0 ? 5 : 4}
                    strokeLinecap="round"
                  />
                  {number % 5 === 0 && (
                    <text
                      x="360"
                      y="154"
                      fill="#fff"
                      textAnchor="middle"
                      fontSize="28"
                      fontWeight="700"
                      transform={`rotate(${-(number - rotationValue) * DEGREES_PER_PERSON} 360 154)`}
                    >
                      {number}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <path d="M360 44v24" stroke="#102b00" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>
      <button
        type="button"
        className={`${styles.adjust} ${styles.minus}`}
        aria-label="Remove one person"
        disabled={selected <= MIN_PEOPLE}
        onClick={() => onChange(String(clampPeople(selected - 1)))}
      >
        −
      </button>
      <button
        type="button"
        className={`${styles.adjust} ${styles.plus}`}
        aria-label="Add one person"
        disabled={selected >= MAX_PEOPLE}
        onClick={() => onChange(String(clampPeople(selected + 1)))}
      >
        +
      </button>
    </div>
  );
}
