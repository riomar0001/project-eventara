export type SessionType = 'talk' | 'workshop' | 'panel' | 'break';

export type EventSession = {
  id: string;
  time: string;
  title: string;
  speaker: string;
  role: string;
  duration: string;
  type: SessionType;
};

export const SESSION_TYPE_META: Record<SessionType, { bg: string; color: string; label: string }> = {
  talk: { bg: 'bg-lime/10', color: 'text-lime', label: 'Talk' },
  workshop: { bg: 'bg-amber/10', color: 'text-amber', label: 'Workshop' },
  panel: { bg: 'bg-[oklch(0.65_0.15_290_/_0.08)]', color: 'text-[oklch(0.65_0.15_290)]', label: 'Panel' },
  break: { bg: 'bg-black/5', color: 'text-text-mute', label: 'Break' }
};

const DEFAULT_SESSIONS: EventSession[] = [
  { id: 's1', time: '6:00 PM', title: 'Opening Keynote', speaker: 'Event Host', role: 'Community Lead', duration: '20 min', type: 'talk' },
  { id: 's2', time: '6:25 PM', title: 'Main Session', speaker: 'Guest Speaker', role: 'DeFi Researcher', duration: '45 min', type: 'talk' },
  { id: 's3', time: '7:10 PM', title: 'Networking Break', speaker: '', role: '', duration: '15 min', type: 'break' },
  { id: 's4', time: '7:25 PM', title: 'Q&A Panel', speaker: 'All Speakers', role: 'Panel', duration: '35 min', type: 'panel' },
  { id: 's5', time: '8:00 PM', title: 'Hands-on Workshop', speaker: 'Workshop Lead', role: 'Technical Lead', duration: '60 min', type: 'workshop' }
];

export const MOCK_SESSIONS: Record<string, EventSession[]> = {
  '1': [
    { id: 's1', time: '6:00 PM', title: 'Intro: What is Liquidity Provision?', speaker: 'Mia Santos', role: 'DeFi Lead', duration: '20 min', type: 'talk' },
    { id: 's2', time: '6:25 PM', title: 'Workshop: Adding Liquidity on Uniswap V3', speaker: 'Kevin Lim', role: 'Protocol Dev', duration: '50 min', type: 'workshop' },
    { id: 's3', time: '7:15 PM', title: 'Break', speaker: '', role: '', duration: '10 min', type: 'break' },
    { id: 's4', time: '7:25 PM', title: 'Live Demo: Rebalancing & Exit Strategies', speaker: 'Mia Santos', role: 'DeFi Lead', duration: '35 min', type: 'workshop' },
    { id: 's5', time: '8:00 PM', title: 'Open Q&A', speaker: 'All Speakers', role: 'Panel', duration: '30 min', type: 'panel' }
  ],
  '2': [
    { id: 's1', time: '2:00 PM', title: 'Welcome & Introductions', speaker: 'Event Host', role: 'Community Manager', duration: '10 min', type: 'talk' },
    { id: 's2', time: '2:15 PM', title: 'Cross-Chain Bridging: Security Trade-offs', speaker: 'Ana Reyes', role: 'Security Researcher', duration: '30 min', type: 'talk' },
    { id: 's3', time: '2:50 PM', title: 'Shared Sequencers & Composability', speaker: 'Mark Chen', role: 'L2 Founder', duration: '30 min', type: 'talk' },
    { id: 's4', time: '3:25 PM', title: 'Panel: State of Interoperability 2026', speaker: 'All Panelists', role: 'Panel', duration: '45 min', type: 'panel' },
    { id: 's5', time: '4:15 PM', title: 'Networking', speaker: '', role: '', duration: '45 min', type: 'break' }
  ],
  default: DEFAULT_SESSIONS
};

export function getSessionsForEvent(eventId: number): EventSession[] {
  return MOCK_SESSIONS[String(eventId)] ?? MOCK_SESSIONS.default;
}
