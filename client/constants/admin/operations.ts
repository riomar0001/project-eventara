export const ADMIN_OPERATIONS_PATHS = {
  venues: '/admin/venues',
  venueCreate: '/admin/venues/new',
  venueDetail: (venueId: string) => `/admin/venues/${venueId}`,
  venueEdit: (venueId: string) => `/admin/venues/${venueId}/edit`,
  events: '/admin/events',
  eventCreate: '/admin/events/new',
  eventDetail: (eventId: string) => `/admin/events/${eventId}`,
  eventEdit: (eventId: string) => `/admin/events/${eventId}/edit`,
  volunteers: '/admin/volunteers',
  volunteerCreate: '/admin/volunteers/new',
  volunteerDetail: (volunteerId: string) => `/admin/volunteers/${volunteerId}`,
  volunteerEdit: (volunteerId: string) => `/admin/volunteers/${volunteerId}/edit`,
  queues: '/admin/queues'
} as const;

export type VenueRecord = {
  address: string;
  amenities: string[];
  bookingWindow: string;
  capacity: number;
  city: string;
  description: string;
  id: string;
  leadContact: string;
  leadEmail: string;
  leadPhone: string;
  name: string;
  neighborhood: string;
  photo: string;
  setting: 'Indoor' | 'Outdoor' | 'Hybrid';
  status: 'Active' | 'Seasonal' | 'Private Hold';
  summary: string;
  tags: string[];
  venueType: string;
};

export type EventRecord = {
  audience: string;
  dateLabel: string;
  headline: string;
  hostTeam: string[];
  id: string;
  photo: string;
  priceLabel: string;
  registrationLabel: string;
  scheduleNote: string;
  stageCount: number;
  status: 'On Sale' | 'Draft' | 'Planning';
  summary: string;
  title: string;
  volunteerNeed: string;
  venueId: string;
};

export type VolunteerRecord = {
  assignedEventIds: string[];
  availability: 'Weeknights' | 'Weekends' | 'Flexible';
  bio: string;
  city: string;
  email: string;
  hoursContributed: number;
  id: string;
  joinedOn: string;
  name: string;
  phone: string;
  photo: string;
  primaryRole: string;
  shiftPreference: 'Front of House' | 'Production' | 'Community Desk' | 'Anywhere';
  skills: string[];
  status: 'Active' | 'Training' | 'Inactive';
};

export const venueRecords: VenueRecord[] = [
  {
    id: 'riverfront-pavilion',
    name: 'Riverfront Pavilion',
    neighborhood: 'Quayside District',
    city: 'Singapore',
    address: '18 Basin Walk, Quayside District',
    capacity: 420,
    venueType: 'Waterfront Hall',
    setting: 'Hybrid',
    status: 'Active',
    bookingWindow: 'Open through November 2026',
    leadContact: 'Talia Morgan',
    leadEmail: 'talia@eventara.local',
    leadPhone: '+65 8812 4471',
    summary: 'A bright riverside venue used for community showcases, evening talks, and sponsor receptions.',
    description:
      'Riverfront Pavilion pairs a glass-wrapped hall with an open terrace, making it the most adaptable venue in the current admin preview. It is designed for sunset programming, sponsor moments, and high-traffic guest arrival flows.',
    amenities: ['Dockside terrace', 'LED wall package', 'Backstage prep lounge', 'Vendor power drops'],
    tags: ['Sunset-friendly', 'Sponsor-ready', 'Hybrid setup'],
    photo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'lantern-square',
    name: 'Lantern Square',
    neighborhood: 'Arts Quarter',
    city: 'Singapore',
    address: '105 Lantern Street, Arts Quarter',
    capacity: 260,
    venueType: 'Courtyard Campus',
    setting: 'Outdoor',
    status: 'Seasonal',
    bookingWindow: 'Peak bookings from June to September',
    leadContact: 'Nur Afiqah',
    leadEmail: 'afiqah@eventara.local',
    leadPhone: '+65 8133 5106',
    summary: 'An open courtyard built for night markets, ticketed food programs, and immersive installations.',
    description:
      'Lantern Square is strongest after dark. The venue’s circulation pattern supports stall layouts, queue management, and ambient lighting moments that reward community-focused event formats.',
    amenities: ['Pop-up stall bays', 'String lighting rig', 'Load-in lane', 'Portable stage points'],
    tags: ['Night market', 'Outdoor flow', 'High foot traffic'],
    photo: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'harbor-warehouse',
    name: 'Harbor Warehouse 9',
    neighborhood: 'Pier Exchange',
    city: 'Singapore',
    address: '9 Dock Crane Road, Pier Exchange',
    capacity: 680,
    venueType: 'Industrial Hall',
    setting: 'Indoor',
    status: 'Active',
    bookingWindow: 'Available with 6-week lead time',
    leadContact: 'Marcelo Reyes',
    leadEmail: 'marcelo@eventara.local',
    leadPhone: '+65 8779 6302',
    summary: 'A dramatic industrial shell used for high-volume launches, maker fairs, and staged live programs.',
    description:
      'Harbor Warehouse 9 is the heavy-lift option in the venue set. It supports larger scenic builds, dense audience layouts, and operational zones for volunteer teams, vendors, and production staff.',
    amenities: ['Rigging grid', 'Freight access', 'Control booth', 'Green room suites'],
    tags: ['Large format', 'Production-ready', 'Industrial mood'],
    photo: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'hillside-greenhouse',
    name: 'Hillside Greenhouse',
    neighborhood: 'Botanic Ridge',
    city: 'Singapore',
    address: '44 Canopy Rise, Botanic Ridge',
    capacity: 180,
    venueType: 'Garden Conservatory',
    setting: 'Indoor',
    status: 'Private Hold',
    bookingWindow: 'Reserved for curated partnerships',
    leadContact: 'Eunice Lim',
    leadEmail: 'eunice@eventara.local',
    leadPhone: '+65 8901 2254',
    summary: 'A plant-filled conservatory suited for donor dinners, press previews, and premium workshops.',
    description:
      'Hillside Greenhouse is a quieter premium venue used for intimate formats. Its natural light and compact circulation make it ideal for carefully staged hospitality programs rather than high-volume public events.',
    amenities: ['Dining kitchen', 'Skylight canopy', 'Private arrival gate', 'Workshop benches'],
    tags: ['Premium', 'Natural light', 'Smaller capacity'],
    photo: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'neon-loft',
    name: 'Neon Loft',
    neighborhood: 'Innovation District',
    city: 'Singapore',
    address: '88 Cyber Way, Innovation District',
    capacity: 150,
    venueType: 'Creative Studio',
    setting: 'Indoor',
    status: 'Active',
    bookingWindow: 'Open year-round',
    leadContact: 'Julian Brooks',
    leadEmail: 'julian@eventara.local',
    leadPhone: '+65 8221 9934',
    summary: 'A sleek, modern studio space perfect for hackathons, design sprints, and product demos.',
    description:
      'Neon Loft offers a highly modular layout with writable walls, breakout pods, and integrated presentation tech. It is optimized for focused, collaborative work and intimate tech gatherings.',
    amenities: ['Whiteboard walls', 'Breakout pods', 'Fiber internet', 'AV presentation suite'],
    tags: ['Tech-friendly', 'Modular', 'Workshops'],
    photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'skyline-terrace',
    name: 'Skyline Terrace',
    neighborhood: 'Central Business District',
    city: 'Singapore',
    address: 'Level 42, 1 Financial Tower, CBD',
    capacity: 300,
    venueType: 'Rooftop Lounge',
    setting: 'Hybrid',
    status: 'Active',
    bookingWindow: 'Requires 4-week notice',
    leadContact: 'Sarah Chen',
    leadEmail: 'sarah@eventara.local',
    leadPhone: '+65 8990 1122',
    summary: 'A premium rooftop destination offering panoramic city views for VIP mixers and cocktail receptions.',
    description:
      'Skyline Terrace combines a plush indoor lounge with a sprawling outdoor deck. It is the premier choice for evening networking events, investor dinners, and upscale social gatherings that demand a sophisticated backdrop.',
    amenities: ['Full service bar', 'Outdoor heaters/fans', 'Lounge seating', 'DJ booth'],
    tags: ['VIP', 'Scenic views', 'Evening reception'],
    photo: 'https://images.unsplash.com/photo-1572111504281-9df91fb4fb5d?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'heritage-hall',
    name: 'Heritage Hall',
    neighborhood: 'Civic District',
    city: 'Singapore',
    address: '12 Old Parliament Lane, Civic District',
    capacity: 500,
    venueType: 'Historic Auditorium',
    setting: 'Indoor',
    status: 'Active',
    bookingWindow: 'Reopening January 2027',
    leadContact: 'David Tan',
    leadEmail: 'david@eventara.local',
    leadPhone: '+65 8445 7710',
    summary: 'A beautifully restored colonial-era hall designed for keynote speeches, award ceremonies, and formal banquets.',
    description:
      'Heritage Hall features classical architecture, high arched ceilings, and modern acoustic treatments. It provides a grand, formal atmosphere while maintaining the technical infrastructure needed for complex stage productions.',
    amenities: ['Tiered seating options', 'Acoustic paneling', 'VIP holding rooms', 'Grand foyer'],
    tags: ['Formal', 'Historic', 'Keynote'],
    photo: 'https://images.unsplash.com/photo-1507676184212-d0330a15233c?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'the-vault',
    name: 'The Vault',
    neighborhood: 'Marina South',
    city: 'Singapore',
    address: 'Sub-level 2, Marina South Bunkers',
    capacity: 350,
    venueType: 'Underground Club',
    setting: 'Indoor',
    status: 'Active',
    bookingWindow: 'Open for weekend bookings',
    leadContact: 'Maya Patel',
    leadEmail: 'maya@eventara.local',
    leadPhone: '+65 8332 9005',
    summary: 'An edgy, subterranean space favored for secret shows, after-parties, and immersive brand activations.',
    description:
      'The Vault is a windowless, soundproofed bunker that gives event producers total control over lighting and atmosphere. It thrives during late-night programming and exclusive, high-energy entertainment formats.',
    amenities: ['Club sound system', 'Dynamic light grid', 'Coat check', 'Private booths'],
    tags: ['Late night', 'Immersive', 'High energy'],
    photo: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1400&q=80'
  }
];

export const eventRecords: EventRecord[] = [
  {
    id: 'summer-signal-festival',
    title: 'Summer Signal Festival',
    headline: 'A waterfront weekend of music, talks, and food experiences.',
    venueId: 'riverfront-pavilion',
    dateLabel: 'July 18, 2026',
    status: 'On Sale',
    audience: 'Public festival',
    priceLabel: 'From $28',
    registrationLabel: '312 / 420 registered',
    scheduleNote: 'Gates 4:30 PM, headline set 8:15 PM',
    stageCount: 3,
    volunteerNeed: '28 volunteer positions still open',
    hostTeam: ['Programming', 'Partnerships', 'Guest Experience'],
    summary:
      'Summer Signal Festival is the flagship outdoor-heavy program in this preview set, combining headline performances with sponsor activations and volunteer-managed guest flow.',
    photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'midnight-makers-market',
    title: 'Midnight Makers Market',
    headline: 'A night market mixing local makers, food stalls, and after-hours workshops.',
    venueId: 'lantern-square',
    dateLabel: 'August 02, 2026',
    status: 'Planning',
    audience: 'Community market',
    priceLabel: 'Free RSVP',
    registrationLabel: '188 / 260 RSVPs',
    scheduleNote: 'Vendor arrival 2:00 PM, public opening 6:00 PM',
    stageCount: 1,
    volunteerNeed: '12 hosts needed for wayfinding and vendor support',
    hostTeam: ['Community Partnerships', 'Vendor Ops'],
    summary:
      'Midnight Makers Market focuses on warmth and flow. The current concept emphasizes clear zoning, strong volunteer wayfinding, and a polished late-evening retail atmosphere.',
    photo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'launchpad-live',
    title: 'Launchpad Live Expo',
    headline: 'A product launch and demo floor built for bigger production moments.',
    venueId: 'harbor-warehouse',
    dateLabel: 'September 14, 2026',
    status: 'Draft',
    audience: 'Industry invite',
    priceLabel: 'Invite only',
    registrationLabel: 'Preview capacity 480 seats',
    scheduleNote: 'Rehearsals held the evening before opening day',
    stageCount: 4,
    volunteerNeed: '20 production and registration crew slots',
    hostTeam: ['Production', 'Registration', 'Brand Studio'],
    summary:
      'Launchpad Live Expo is positioned as a production-forward event concept with multiple demo pockets, sponsor builds, and a fast-moving front-of-house operation.',
    photo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'greenhouse-donor-supper',
    title: 'Greenhouse Donor Supper',
    headline: 'An intimate fundraising dinner with guided storytelling and table service.',
    venueId: 'hillside-greenhouse',
    dateLabel: 'October 09, 2026',
    status: 'Planning',
    audience: 'Donor and partner guests',
    priceLabel: 'Private invitation',
    registrationLabel: '84 / 180 seats reserved',
    scheduleNote: 'Reception begins at 6:30 PM',
    stageCount: 1,
    volunteerNeed: '6 hospitality volunteers requested',
    hostTeam: ['Leadership', 'Donor Relations'],
    summary:
      'Greenhouse Donor Supper is a quieter hospitality format centered on service detail, premium staging, and a calm volunteer presence that supports guest transitions.',
    photo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'blueprint-design-summit',
    title: 'Blueprint Design Summit',
    headline: 'A full-day conference for designers, builders, and creative leads.',
    venueId: 'central-conference-hall',
    dateLabel: 'November 06, 2026',
    status: 'On Sale',
    audience: 'Industry professionals',
    priceLabel: 'From $65',
    registrationLabel: '540 / 700 registered',
    scheduleNote: 'Doors open 8:00 AM, keynote at 9:30 AM',
    stageCount: 2,
    volunteerNeed: '16 session moderators and floor crew needed',
    hostTeam: ['Programming', 'Brand Studio', 'A/V Production'],
    summary:
      'Blueprint Design Summit brings together practitioners across disciplines for a structured day of talks, critiques, and portfolio sessions with a strong emphasis on speaker production quality.',
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'ember-film-night',
    title: 'Ember Film Night',
    headline: 'An outdoor cinema evening with curated short films and live score.',
    venueId: 'rooftop-terrace-east',
    dateLabel: 'November 21, 2026',
    status: 'On Sale',
    audience: 'General public',
    priceLabel: 'From $18',
    registrationLabel: '203 / 280 registered',
    scheduleNote: 'Arrivals from 6:30 PM, screening begins at dusk',
    stageCount: 1,
    volunteerNeed: '10 ushers and equipment handlers needed',
    hostTeam: ['Programming', 'Guest Experience'],
    summary:
      'Ember Film Night is a single-screen, weather-dependent format that pairs curated short cinema with a live ambient score, requiring tight coordination between A/V crew and volunteer ushers.',
    photo: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'founders-roundtable',
    title: 'Founders Roundtable',
    headline: 'A closed-door breakfast session for early-stage founders and investors.',
    venueId: 'private-dining-suite',
    dateLabel: 'December 03, 2026',
    status: 'Planning',
    audience: 'Invitation only',
    priceLabel: 'Complimentary',
    registrationLabel: '31 / 48 seats confirmed',
    scheduleNote: 'Breakfast service at 7:30 AM, discussion opens 8:00 AM',
    stageCount: 1,
    volunteerNeed: '4 hospitality staff for service and check-in',
    hostTeam: ['Leadership', 'Partnerships'],
    summary:
      'Founders Roundtable is a high-trust, low-profile format designed around candid conversation. The priority is a seamless service environment with minimal interruption to the discussion flow.',
    photo: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'winter-welcome-gala',
    title: 'Winter Welcome Gala',
    headline: 'A year-end celebration bringing together staff, partners, and community guests.',
    venueId: 'grand-ballroom-west',
    dateLabel: 'December 19, 2026',
    status: 'Draft',
    audience: 'Staff and partners',
    priceLabel: 'Internal event',
    registrationLabel: '172 / 350 seats planned',
    scheduleNote: 'Arrival from 7:00 PM, program begins 8:00 PM',
    stageCount: 2,
    volunteerNeed: '22 event crew across registration, floor, and wrap-up',
    hostTeam: ['Leadership', 'Guest Experience', 'Programming'],
    summary:
      'Winter Welcome Gala closes the calendar year with a mixed program of recognition, live entertainment, and open mingling. Volunteer coordination spans across multiple zones and a two-stage timeline.',
    photo: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=80'
  }
];

export const volunteerRecords: VolunteerRecord[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    email: 'maya.chen@eventara.local',
    phone: '+65 8820 1140',
    city: 'Tiong Bahru',
    primaryRole: 'Guest Experience Lead',
    status: 'Active',
    availability: 'Weekends',
    shiftPreference: 'Front of House',
    hoursContributed: 124,
    joinedOn: 'February 2024',
    skills: ['Wayfinding', 'Registration', 'VIP desk'],
    assignedEventIds: ['summer-signal-festival', 'greenhouse-donor-supper'],
    bio: 'Maya is strongest at guest-facing operations and thrives in check-in, premium hospitality, and fast-moving front-of-house environments.',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'diego-santos',
    name: 'Diego Santos',
    email: 'diego.santos@eventara.local',
    phone: '+65 8911 4052',
    city: 'Kallang',
    primaryRole: 'Production Runner',
    status: 'Active',
    availability: 'Flexible',
    shiftPreference: 'Production',
    hoursContributed: 96,
    joinedOn: 'May 2024',
    skills: ['Backstage', 'Crew coordination', 'Load-in'],
    assignedEventIds: ['launchpad-live', 'summer-signal-festival'],
    bio: 'Diego covers load-in support, comms relay, and backstage logistics, making him a strong fit for higher-volume productions.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'anika-rahman',
    name: 'Anika Rahman',
    email: 'anika.rahman@eventara.local',
    phone: '+65 8763 2551',
    city: 'Queenstown',
    primaryRole: 'Community Desk Host',
    status: 'Training',
    availability: 'Weeknights',
    shiftPreference: 'Community Desk',
    hoursContributed: 38,
    joinedOn: 'January 2026',
    skills: ['Guest support', 'Info desk', 'Accessibility escort'],
    assignedEventIds: ['midnight-makers-market'],
    bio: 'Anika is in training for community-facing shifts and has already become a reliable presence for support desks and queue reassurance.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'oliver-ng',
    name: 'Oliver Ng',
    email: 'oliver.ng@eventara.local',
    phone: '+65 8140 7732',
    city: 'Marine Parade',
    primaryRole: 'Stage Support',
    status: 'Active',
    availability: 'Weekends',
    shiftPreference: 'Production',
    hoursContributed: 72,
    joinedOn: 'August 2025',
    skills: ['Stage reset', 'Artist escort', 'Radio comms'],
    assignedEventIds: ['summer-signal-festival'],
    bio: 'Oliver is steady during performance changeovers and is often assigned to support stage traffic and artist movement.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'sara-yusuf',
    name: 'Sara Yusuf',
    email: 'sara.yusuf@eventara.local',
    phone: '+65 8991 4428',
    city: 'Bukit Timah',
    primaryRole: 'Hospitality Steward',
    status: 'Active',
    availability: 'Flexible',
    shiftPreference: 'Anywhere',
    hoursContributed: 88,
    joinedOn: 'November 2024',
    skills: ['Hospitality', 'Back-of-house service', 'Donor care'],
    assignedEventIds: ['greenhouse-donor-supper'],
    bio: 'Sara is most often assigned to premium guest flows, partner hosting, and donor-facing programs that need calm service energy.',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'jun-park',
    name: 'Jun Park',
    email: 'jun.park@eventara.local',
    phone: '+65 8035 2270',
    city: 'Hougang',
    primaryRole: 'Vendor Support',
    status: 'Training',
    availability: 'Weekends',
    shiftPreference: 'Community Desk',
    hoursContributed: 26,
    joinedOn: 'March 2026',
    skills: ['Vendor check-in', 'Queue support', 'Runner'],
    assignedEventIds: ['midnight-makers-market'],
    bio: 'Jun is a newer volunteer focused on market-style events where vendor needs and public wayfinding overlap.',
    photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'leah-tan',
    name: 'Leah Tan',
    email: 'leah.tan@eventara.local',
    phone: '+65 8625 0991',
    city: 'Bedok',
    primaryRole: 'Registration Captain',
    status: 'Active',
    availability: 'Weeknights',
    shiftPreference: 'Front of House',
    hoursContributed: 110,
    joinedOn: 'July 2024',
    skills: ['Credentialing', 'Check-in systems', 'Queue design'],
    assignedEventIds: ['launchpad-live', 'summer-signal-festival'],
    bio: 'Leah specializes in pre-event check-in planning and on-the-ground credentialing systems for busier programs.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'isaac-ong',
    name: 'Isaac Ong',
    email: 'isaac.ong@eventara.local',
    phone: '+65 8157 6622',
    city: 'Pasir Ris',
    primaryRole: 'Logistics Support',
    status: 'Inactive',
    availability: 'Flexible',
    shiftPreference: 'Anywhere',
    hoursContributed: 54,
    joinedOn: 'October 2024',
    skills: ['Transport coordination', 'Inventory', 'Load-out'],
    assignedEventIds: [],
    bio: 'Isaac previously handled logistics-heavy shifts and remains in the roster as a reserve volunteer for larger event days.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  }
];

export function getVenueById(venueId: string) {
  return venueRecords.find((venue) => venue.id === venueId) ?? null;
}

export function getEventById(eventId: string) {
  return eventRecords.find((event) => event.id === eventId) ?? null;
}

export function getVolunteerById(volunteerId: string) {
  return volunteerRecords.find((volunteer) => volunteer.id === volunteerId) ?? null;
}

export function getEventsByVenueId(venueId: string) {
  return eventRecords.filter((event) => event.venueId === venueId);
}

export function getVolunteersByEventId(eventId: string) {
  return volunteerRecords.filter((volunteer) => volunteer.assignedEventIds.includes(eventId));
}

export function getVolunteerInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
