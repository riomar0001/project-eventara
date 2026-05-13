import { Event, EventCategory, LiveEvent } from '@/types/event';

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'all', name: 'All Events', slug: 'all' },
  { id: 'workshop', name: 'Workshops', slug: 'workshop' },
  { id: 'conference', name: 'Conferences', slug: 'conference' },
  { id: 'meetup', name: 'Meetups', slug: 'meetup' }
];

// TODO: replace with GET /api/events
export const MOCK_EVENTS: Event[] = [
  {
    id: 'evt-001',
    title: 'DeFi Fundamentals Workshop',
    date: 'May 18, 2026',
    time: '2:00 PM - 5:00 PM',
    location: 'Davao Convention Center',
    venue: 'Main Hall A',
    capacity: 150,
    registered: 142,
    category: 'workshop',
    description: 'Learn the basics of decentralized finance and how to get started with smart contracts.'
  },
  {
    id: 'evt-002',
    title: 'Web3 Security Best Practices',
    date: 'May 22, 2026',
    time: '6:00 PM - 8:00 PM',
    location: 'Tech Hub Davao',
    venue: 'Conference Room 1',
    capacity: 120,
    registered: 98,
    category: 'conference',
    description: 'Expert discussion on securing wallets, smart contracts, and protecting your digital assets.'
  },
  {
    id: 'evt-003',
    title: 'Community Networking Meetup',
    date: 'May 25, 2026',
    time: '4:00 PM - 6:00 PM',
    location: 'Coffee Lounge Davao',
    venue: 'Ground Floor',
    capacity: 80,
    registered: 65,
    category: 'meetup',
    description: 'Casual gathering for community members to connect, share ideas, and build relationships.'
  },
  {
    id: 'evt-004',
    title: 'Smart Contract Development Bootcamp',
    date: 'May 29, 2026',
    time: '1:00 PM - 5:00 PM',
    location: 'Davao Tech Park',
    venue: 'Lab 2',
    capacity: 60,
    registered: 58,
    category: 'workshop',
    description: 'Hands-on bootcamp for developers learning Solidity and blockchain programming.'
  },
  {
    id: 'evt-005',
    title: 'Crypto Trading Strategies',
    date: 'June 1, 2026',
    time: '3:00 PM - 4:30 PM',
    location: 'Business Center Davao',
    venue: 'Auditorium',
    capacity: 200,
    registered: 187,
    category: 'conference',
    description: 'Industry experts share proven trading strategies and market insights.'
  },
  {
    id: 'evt-006',
    title: 'NFT & Digital Art Showcase',
    date: 'June 5, 2026',
    time: '6:00 PM - 9:00 PM',
    location: 'Art Gallery Davao',
    venue: 'Main Exhibition',
    capacity: 100,
    registered: 92,
    category: 'meetup',
    description: 'Explore the intersection of art and blockchain with local digital artists and creators.'
  }
];

export const UPCOMING_EVENTS: Array<{
  id: number;
  date: string;
  title: string;
  desc: string;
  venue: string;
  chip: string;
  seats: string;
  orbColor: 'lime' | 'amber';
  angle: string;
}> = [
  {
    id: 1,
    date: 'MAY 04 · 6:00 PM',
    title: 'Liquidity Provision 101',
    desc: 'A hands-on workshop for first-time LPs — walk through adding, rebalancing, and exiting positions on native Davao pools.',
    venue: 'Matina Town Square',
    chip: 'Workshop',
    seats: '48 left',
    orbColor: 'lime',
    angle: '115deg'
  },
  {
    id: 2,
    date: 'MAY 17 · 2:00 PM',
    title: 'Cross-Chain Roundtable',
    desc: "Panel with founders from three L2 ecosystems discussing bridge safety, shared sequencers, and what's next for DeFi composability.",
    venue: 'Abreeza Ayala Mall',
    chip: 'Panel',
    seats: '22 left',
    orbColor: 'amber',
    angle: '95deg'
  },
  {
    id: 3,
    date: 'JUN 01 · 10:00 AM',
    title: "DeFi Builder's Weekend",
    desc: 'A two-day hackathon for Mindanao-based developers. Ship a prototype, win grants, and meet the VCs investing in SEA Web3.',
    venue: 'MAFBEX Grounds',
    chip: 'Hackathon',
    seats: 'Full — waitlist',
    orbColor: 'lime',
    angle: '135deg'
  }
];

// TODO: replace with GET /api/events/live
export const LIVE_EVENT: LiveEvent = {
  id: 'live-001',
  title: 'Building DApps in 2026',
  status: 'live',
  venue: 'Abreeza Ayala Mall · Main Theater',
  session: 'Session 3 · Advanced Track',
  attendees: '342 live attendees',
  speaker: {
    name: 'Alex Rivera',
    role: 'Smart Contract Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  topic: 'Advanced DApp Architecture and Best Practices',
  startTime: '2:00 PM',
  endTime: '3:00 PM',
  description: 'Join Alex for a deep dive into modern DApp development patterns and production-ready strategies.'
};
