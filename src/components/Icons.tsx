import type { ReactNode } from 'react';

const Svg = ({ children, size = 22 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

type P = { size?: number };

export const IconHome = (p: P) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>
);
export const IconDumbbell = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />
  </Svg>
);
export const IconUser = (p: P) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);
export const IconList = (p: P) => (
  <Svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Svg>
);
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconCheck = (p: P) => <Svg {...p}><path d="m5 12 5 5L20 7" /></Svg>;
export const IconX = (p: P) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const IconBack = (p: P) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const IconMore = (p: P) => (
  <Svg {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg>
);
export const IconClock = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></Svg>
);
export const IconEdit = (p: P) => (
  <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" /></Svg>
);
export const IconCopy = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>
);
export const IconTrophy = (p: P) => (
  <Svg {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  </Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const IconChevron = (p: P) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const IconSwap = (p: P) => (
  <Svg {...p}><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></Svg>
);
export const IconUp = (p: P) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>;
export const IconDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const IconPlay = (p: P) => <Svg {...p}><path d="M7 4v16l13-8z" /></Svg>;
