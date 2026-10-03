import { useState } from 'react';

export interface Point {
  label: string;
  /** Longer label shown in the tooltip. */
  detail?: string;
  value: number;
}

const W = 340;
const H = 170;
const PAD = { top: 10, right: 6, bottom: 22, left: 36 };

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
};

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k` : n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

function Frame({ max, children }: { max: number; children: React.ReactNode }) {
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / max);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
          <text className="axis-label" x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
            {compact(t)}
          </text>
        </g>
      ))}
      {children}
    </svg>
  );
}

function Tip({ point, format }: { point?: Point; format: (v: number) => string }) {
  return (
    <div className="chart-tip">
      {point ? (
        <>
          <strong>{format(point.value)}</strong> · {point.detail ?? point.label}
        </>
      ) : (
        ' '
      )}
    </div>
  );
}

export function BarChart({ data, format }: { data: Point[]; format: (v: number) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(24, slot * 0.6);
  const shown = active ?? data.length - 1;
  return (
    <div onMouseLeave={() => setActive(null)}>
      <Tip point={data[shown]} format={format} />
      <Frame max={max}>
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + innerH - h;
          const r = Math.min(4, h / 2, barW / 2);
          return (
            <g key={i}>
              {h > 0 && (
                <path
                  className={`bar${active != null && active !== i ? ' dim' : ''}`}
                  d={`M${x},${PAD.top + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${PAD.top + innerH} Z`}
                />
              )}
              {(data.length <= 6 || (data.length - 1 - i) % Math.ceil(data.length / 4) === 0) && (
                <text className="axis-label" x={x + barW / 2} y={H - 6} textAnchor="middle">
                  {d.label}
                </text>
              )}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
              />
            </g>
          );
        })}
      </Frame>
    </div>
  );
}

export function LineChart({ data, format }: { data: Point[]; format: (v: number) => string }) {
  const [active, setActive] = useState<number | null>(null);
  if (data.length === 0) return <div className="empty">Sin datos todavía</div>;
  const values = data.map((d) => d.value);
  const max = niceMax(Math.max(...values) * 1.05);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
  const y = (v: number) => PAD.top + innerH * (1 - v / max);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
  const shown = active ?? data.length - 1;
  const step = Math.ceil(data.length / 4);
  return (
    <div onMouseLeave={() => setActive(null)}>
      <Tip point={data[shown]} format={format} />
      <Frame max={max}>
        <path className="line" d={path} />
        {active != null && (
          <line className="grid" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} />
        )}
        {data.map((d, i) => (
          <g key={i}>
            <circle className="dot" cx={x(i)} cy={y(d.value)} r={i === shown ? 6 : 4} />
            {(data.length - 1 - i) % step === 0 && (
              <text className="axis-label" x={x(i)} y={H - 6} textAnchor="middle">
                {d.label}
              </text>
            )}
            <rect
              x={x(i) - innerW / Math.max(2, data.length) / 2}
              y={PAD.top}
              width={innerW / Math.max(2, data.length)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            />
          </g>
        ))}
      </Frame>
    </div>
  );
}
