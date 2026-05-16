"""Eventara database seeder.

Populates:
  - 150 users (with profiles, security, activity records)
  - 10 venues
  - 10 events (20 sessions total, 2 per event)
  - 15-30 participants per session
  - 30 volunteers, 20 volunteer custom roles
  - 22+ features, 5 roles, role permissions, user grants
  - event ratings, event feedback, venue ratings, app feedback, feedback reports

Does NOT touch: audit_logs

Usage (from server/ directory):
    uv run python -m seeds.seed
"""

import asyncio
import random
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt

from app.infrastructure.database.models import (
    AppFeedbackModel,
    Event,
    EventFeedback,
    EventParticipant,
    EventRating,
    EventSession,
    EventVolunteer,
    Feature,
    FeedbackReport,
    Role,
    RolePermission,
    User,
    UserActivity,
    UserGrant,
    UserLoginHistory,
    UserProfile,
    UserRole,
    UserSecurity,
    Venue,
    VenueRating,
    Volunteer,
    VolunteerApplication,
    VolunteerRole,
)
from app.infrastructure.database.session import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

NUM_USERS = 150
NUM_EVENTS = 10
NUM_VENUES = 10
NUM_VOLUNTEERS = 30
NUM_VOLUNTEER_ROLES = 20
SESSIONS_PER_EVENT = 2
PARTICIPANTS_PER_SESSION = (15, 30)

SEED_PASSWORD = "Eventara@2025"
_PWD_HASH: str = bcrypt.hashpw(SEED_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()

random.seed(42)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def uid() -> uuid.UUID:
    return uuid.uuid4()


def now() -> datetime:
    return datetime.now(tz=UTC)


def past(days: int, hours: int = 0) -> datetime:
    return now() - timedelta(days=days, hours=hours)


def past_naive(days: int, hours: int = 0) -> datetime:
    return (now() - timedelta(days=days, hours=hours)).replace(tzinfo=None)


def future(days: int, hours: int = 0) -> datetime:
    return now() + timedelta(days=days, hours=hours)


# ---------------------------------------------------------------------------
# Static seed data
# ---------------------------------------------------------------------------

FIRST_NAMES_M = [
    "Jose",
    "Juan",
    "Miguel",
    "Carlos",
    "Antonio",
    "Rafael",
    "Andres",
    "Ramon",
    "Luis",
    "Marco",
    "Roberto",
    "Eduardo",
    "Fernando",
    "Gabriel",
    "Diego",
    "Alejandro",
    "Ricardo",
    "Manuel",
    "Pablo",
    "Joaquin",
    "Angelo",
    "Renzo",
    "Nico",
    "Marc",
    "Rey",
    "Dan",
    "Erick",
    "Jed",
    "Kyle",
    "Lance",
    "Ivan",
    "Kevin",
    "Ryan",
    "Bryan",
    "Jason",
    "Nathan",
    "Aaron",
    "Justin",
    "Christian",
    "Patrick",
    "Mark",
    "John",
    "David",
    "James",
    "Alex",
    "Peter",
    "Leo",
    "Felix",
    "Adrian",
    "Vincent",
]

FIRST_NAMES_F = [
    "Maria",
    "Ana",
    "Sofia",
    "Isabella",
    "Camila",
    "Valentina",
    "Gabriela",
    "Daniela",
    "Paula",
    "Andrea",
    "Lucia",
    "Elena",
    "Clara",
    "Patricia",
    "Cristina",
    "Monica",
    "Laura",
    "Sandra",
    "Rosa",
    "Carmen",
    "Angelica",
    "Marisol",
    "Joanna",
    "Kristine",
    "Lorna",
    "Grace",
    "Faith",
    "Hope",
    "Charity",
    "Joy",
    "Karen",
    "Melissa",
    "Rachel",
    "Christine",
    "Michelle",
    "Nicole",
    "Jessica",
    "Jennifer",
    "Amanda",
    "Stephanie",
    "Lea",
    "Iris",
    "Maya",
    "Rina",
    "Chloe",
    "Diana",
    "Eva",
    "Gina",
    "Hanna",
    "Isla",
]

LAST_NAMES = [
    "Santos",
    "Reyes",
    "Cruz",
    "Bautista",
    "Ocampo",
    "Garcia",
    "Mendoza",
    "Torres",
    "Castillo",
    "Flores",
    "Rivera",
    "Morales",
    "Aquino",
    "Villanueva",
    "Dela Cruz",
    "Ramos",
    "Gonzalez",
    "Lopez",
    "Hernandez",
    "Diaz",
    "Fernandez",
    "Perez",
    "Romero",
    "Vargas",
    "Castro",
    "Jimenez",
    "Rojas",
    "Ramirez",
    "Gutierrez",
    "Alvarez",
    "Domingo",
    "Manaloto",
    "Pascual",
    "Aguilar",
    "Magsaysay",
    "Paterno",
    "Lacson",
    "Abad",
    "Dela Torre",
    "Macapagal",
]

OCCUPATIONS = [
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "UX Designer",
    "Marketing Manager",
    "Business Analyst",
    "Financial Analyst",
    "HR Manager",
    "Operations Manager",
    "Sales Executive",
    "Teacher",
    "Nurse",
    "Doctor",
    "Lawyer",
    "Architect",
    "Accountant",
    "Civil Engineer",
    "Mechanical Engineer",
    "Graphic Designer",
    "Content Writer",
    "Photographer",
    "Event Planner",
    "Chef",
    "Entrepreneur",
    "Student",
    "Researcher",
    "Professor",
    "Consultant",
    "Project Manager",
    "IT Support Specialist",
]

EDUCATION_LEVELS = [
    "bachelors_degree",
    "masters_degree",
    "college_level_undergraduate",
    "senior_high_school_graduate",
    "vocational_trade_certificate",
    "associate_degree",
    "doctorate_degree",
    "senior_high_school_level",
    "junior_high_school_graduate",
]

AGE_GROUPS = ["adult", "adult", "adult", "adult", "senior", "teen"]
GENDERS = ["male", "female"]

PH_CITIES = [
    ("Manila", "Metro Manila", "NCR"),
    ("Quezon City", "Metro Manila", "NCR"),
    ("Makati", "Metro Manila", "NCR"),
    ("Pasig", "Metro Manila", "NCR"),
    ("Taguig", "Metro Manila", "NCR"),
    ("Cebu City", "Cebu", "Region VII"),
    ("Davao City", "Davao del Sur", "Region XI"),
    ("Baguio", "Benguet", "CAR"),
    ("Iloilo City", "Iloilo", "Region VI"),
    ("Cagayan de Oro", "Misamis Oriental", "Region X"),
]

BROWSERS = ["Chrome", "Firefox", "Safari", "Edge", "Opera"]
OS_LIST = ["Windows 11", "macOS Ventura", "Ubuntu 22.04", "iOS 17", "Android 14"]
DEVICE_TYPES = ["desktop", "mobile", "tablet"]

SAMPLE_IPS = [f"192.168.{r}.{c}" for r in range(1, 6) for c in range(1, 11)]

# ---------------------------------------------------------------------------
# Venues
# ---------------------------------------------------------------------------

VENUE_ROWS = [
    {
        "name": "Manila Grand Ballroom",
        "address_line": "1 Roxas Boulevard",
        "city": "Manila",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1000",
        "country": "Philippines",
        "capacity": 2000,
        "venue_type": "indoor",
        "amenities": ["WiFi", "Parking", "Stage", "Sound System", "Projector", "Air Conditioning", "Catering"],
        "contact_name": "Maria Santos",
        "contact_phone": "09171234501",
        "contact_email": "contact@manilagrandballroom.com",
    },
    {
        "name": "Quezon City Convention Center",
        "address_line": "Ynares Center, Mabuhay Rotunda",
        "city": "Quezon City",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1100",
        "country": "Philippines",
        "capacity": 3000,
        "venue_type": "indoor",
        "amenities": ["WiFi", "Parking", "Stage", "LED Walls", "Sound System", "Multiple Halls"],
        "contact_name": "Carlos Reyes",
        "contact_phone": "09171234502",
        "contact_email": "info@qcconvention.com",
    },
    {
        "name": "Makati Business Hub",
        "address_line": "6750 Ayala Avenue",
        "city": "Makati",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1200",
        "country": "Philippines",
        "capacity": 500,
        "venue_type": "indoor",
        "amenities": ["WiFi", "Parking", "Boardrooms", "Catering", "Business Center"],
        "contact_name": "Ana Cruz",
        "contact_phone": "09171234503",
        "contact_email": "hub@makatibusiness.com",
    },
    {
        "name": "Philippine International Convention Center",
        "address_line": "Vicente Sotto Ave, Pasay",
        "city": "Pasay",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1300",
        "country": "Philippines",
        "capacity": 5000,
        "venue_type": "indoor",
        "amenities": ["WiFi", "Parking", "Multiple Halls", "Exhibition Space", "Press Room", "VIP Lounge"],
        "contact_name": "Rafael Bautista",
        "contact_phone": "09171234504",
        "contact_email": "events@picc.gov.ph",
    },
    {
        "name": "SM Mall of Asia Arena",
        "address_line": "Seashell Lane, Mall of Asia Complex",
        "city": "Pasay",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1300",
        "country": "Philippines",
        "capacity": 20000,
        "venue_type": "indoor",
        "amenities": ["Parking", "Concession Stands", "VIP Boxes", "Media Center", "Loading Docks"],
        "contact_name": "Gabriel Ocampo",
        "contact_phone": "09171234505",
        "contact_email": "arena@smmoa.com",
    },
    {
        "name": "BGC Open Grounds",
        "address_line": "Bonifacio High Street, 9th Avenue",
        "city": "Taguig",
        "province": "Metro Manila",
        "region": "NCR",
        "postal_code": "1630",
        "country": "Philippines",
        "capacity": 8000,
        "venue_type": "outdoor",
        "amenities": ["Open Space", "Restrooms", "Food Stalls", "Stage Setup", "Security"],
        "contact_name": "Sofia Garcia",
        "contact_phone": "09171234506",
        "contact_email": "events@bgcgrounds.com",
    },
    {
        "name": "Cebu International Convention Center",
        "address_line": "South Road Properties",
        "city": "Cebu City",
        "province": "Cebu",
        "region": "Region VII",
        "postal_code": "6000",
        "country": "Philippines",
        "capacity": 3500,
        "venue_type": "hybrid",
        "amenities": ["WiFi", "Parking", "Indoor Hall", "Outdoor Terrace", "Catering", "AV Equipment"],
        "contact_name": "Miguel Torres",
        "contact_phone": "09171234507",
        "contact_email": "info@cicc.com",
    },
    {
        "name": "Davao City Recreational Center",
        "address_line": "Magsaysay Park, JP Laurel Avenue",
        "city": "Davao City",
        "province": "Davao del Sur",
        "region": "Region XI",
        "postal_code": "8000",
        "country": "Philippines",
        "capacity": 4000,
        "venue_type": "outdoor",
        "amenities": ["Open Grounds", "Pavilion", "Restrooms", "Food Court", "Ample Parking"],
        "contact_name": "Isabella Mendoza",
        "contact_phone": "09171234508",
        "contact_email": "davaorc@events.com",
    },
    {
        "name": "Baguio Convention Center",
        "address_line": "Burnham Park, Gov Pack Road",
        "city": "Baguio",
        "province": "Benguet",
        "region": "CAR",
        "postal_code": "2600",
        "country": "Philippines",
        "capacity": 1200,
        "venue_type": "indoor",
        "amenities": ["WiFi", "Parking", "Stage", "Sound System", "Mountain View", "Catering"],
        "contact_name": "Antonio Castillo",
        "contact_phone": "09171234509",
        "contact_email": "baguioconv@events.com",
    },
    {
        "name": "Iloilo Business Park Grounds",
        "address_line": "Mandurriao, Iloilo Business Park",
        "city": "Iloilo City",
        "province": "Iloilo",
        "region": "Region VI",
        "postal_code": "5000",
        "country": "Philippines",
        "capacity": 6000,
        "venue_type": "hybrid",
        "amenities": ["WiFi", "Indoor Area", "Outdoor Space", "Parking", "Food Court", "Security"],
        "contact_name": "Lucia Flores",
        "contact_phone": "09171234510",
        "contact_email": "events@ilobp.com",
    },
]

# ---------------------------------------------------------------------------
# Events  (days_offset from today → start_date; duration_days → end_date)
# ---------------------------------------------------------------------------

EVENT_ROWS = [
    {
        "title": "TechSummit PH 2025",
        "description": "The premier technology conference in the Philippines bringing together innovators, developers, and tech enthusiasts from across the archipelago. Featuring keynote speakers, hands-on workshops, and valuable networking sessions that shape the future of Philippine tech.",
        "status": "ended",
        "days_offset": -60,
        "duration_days": 2,
        "sessions": ["Opening Keynote & Welcome Ceremony", "Workshop Sessions & Closing Networking"],
    },
    {
        "title": "Manila Music Festival",
        "description": "A multi-stage outdoor music extravaganza featuring premier local and international artists. From OPM classics to contemporary beats, this festival celebrates the vibrant and diverse music culture of the Philippines across multiple performance stages.",
        "status": "ended",
        "days_offset": -45,
        "duration_days": 3,
        "sessions": ["Main Stage: Evening Performances Day 1", "Main Stage: Evening Performances Day 2"],
    },
    {
        "title": "StartUp Expo Philippines 2025",
        "description": "The country's biggest startup showcase where entrepreneurs pitch their groundbreaking ideas, investors discover high-potential opportunities, and the ecosystem connects. Featuring panel discussions, pitch competitions, and exhibition booths from across Southeast Asia.",
        "status": "ended",
        "days_offset": -30,
        "duration_days": 2,
        "sessions": ["Startup Pitch Competition", "Investor Networking & Demo Day"],
    },
    {
        "title": "National Health & Wellness Fair",
        "description": "A comprehensive health fair featuring free medical consultations, wellness workshops, fitness demonstrations, and mental health awareness programs. Free health screenings are available for all attendees, supported by leading hospitals and wellness brands.",
        "status": "posted",
        "days_offset": -10,
        "duration_days": 1,
        "sessions": ["Morning Health Screenings & Consultations", "Afternoon Wellness Workshops"],
    },
    {
        "title": "Philippine Art & Culture Festival",
        "description": "Celebrating the rich artistic heritage of the Philippines through visual arts exhibitions, cultural performances, hands-on craft workshops, and culinary showcases representing the distinct flavors and traditions from different Philippine regions.",
        "status": "started",
        "days_offset": -2,
        "duration_days": 5,
        "sessions": ["Cultural Performances & Visual Arts Exhibition", "Craft Workshops & Regional Culinary Showcase"],
    },
    {
        "title": "Business Leadership Conference 2025",
        "description": "Connecting C-suite executives, entrepreneurs, and business leaders for a full day of insightful discussions on economic trends, leadership strategies, and corporate innovation in the Philippine and Southeast Asian business context.",
        "status": "posted",
        "days_offset": 7,
        "duration_days": 1,
        "sessions": ["Morning Plenary: Economic Outlook & Leadership", "Afternoon Breakout & Panel Discussions"],
    },
    {
        "title": "Food & Beverage Innovation Expo",
        "description": "Showcasing the latest trends in food technology, sustainable agriculture, and culinary arts. Featuring taste-testing sessions, live cooking demonstrations by celebrity chefs, and premier industry networking opportunities for F&B professionals.",
        "status": "posted",
        "days_offset": 14,
        "duration_days": 2,
        "sessions": ["Industry Showcase & Product Taste Testing", "Live Culinary Demonstrations & Chef Panel"],
    },
    {
        "title": "Environmental Summit 2025",
        "description": "Addressing climate change, sustainability, and environmental conservation in the Philippine context. Scientific presentations, policy roundtable discussions, and community action planning sessions led by leading environmentalists and government representatives.",
        "status": "posted",
        "days_offset": 21,
        "duration_days": 2,
        "sessions": ["Scientific Presentations & Research Showcase", "Policy Workshop & Community Action Planning"],
    },
    {
        "title": "Education Innovation Forum",
        "description": "Bringing together educators, policymakers, and education technology companies to discuss the future of learning in the Philippines. Featuring workshops on digital literacy, inclusive education, and the role of AI in transforming Philippine classrooms.",
        "status": "draft",
        "days_offset": 45,
        "duration_days": 1,
        "sessions": ["Digital Literacy & EdTech Workshop", "Inclusive Education Forum & Policy Dialogue"],
    },
    {
        "title": "Sports & Recreation Day 2025",
        "description": "A community-wide sports festival featuring competitions in basketball, volleyball, badminton, and track events. Open to all ages with separate categories for youth, adults, and seniors, culminating in an awards ceremony and community celebration.",
        "status": "draft",
        "days_offset": 60,
        "duration_days": 2,
        "sessions": ["Morning Sports Competitions & Heats", "Afternoon Finals, Awarding & Closing Ceremony"],
    },
]

# ---------------------------------------------------------------------------
# Features & roles
# ---------------------------------------------------------------------------

FEATURE_ROWS = [
    ("events", "Events Management", "Create and manage events on the platform"),
    ("venues", "Venue Management", "Manage event venues and facilities"),
    ("users", "User Management", "Manage platform user accounts"),
    ("volunteers", "Volunteer Management", "Manage volunteers and their assignments"),
    ("feedback", "Feedback System", "Collect and manage participant feedback"),
    ("reports", "Reports & Analytics", "Generate and view platform reports"),
    ("ratings", "Rating System", "Event and venue rating functionality"),
    ("sessions", "Session Management", "Manage sessions within events"),
    ("participants", "Participant Management", "Manage event participants and check-ins"),
    ("roles", "Role Management", "Manage user roles and permissions"),
    ("notifications", "Notification System", "Send and manage platform notifications"),
    ("app-feedback", "App Feedback", "Collect anonymous app feedback"),
    ("audit-logs", "Audit Logs", "View system audit logs"),
    ("profile", "User Profile", "View and edit user profiles"),
    ("onboarding", "Onboarding", "User onboarding flow management"),
    ("dashboard", "Dashboard", "Access the platform dashboard"),
    ("analytics", "Analytics", "View detailed platform analytics"),
    ("exports", "Data Export", "Export data from the platform"),
    ("content", "Content Management", "Manage platform content and media"),
    ("security", "Security Settings", "Manage account and platform security settings"),
    ("volunteer-applications", "Volunteer Applications", "Manage volunteer application submissions"),
    ("event-ratings", "Event Ratings", "Manage and moderate event ratings"),
]

ROLE_ROWS = [
    # (name, description, is_default, is_system)
    ("admin", "System Administrator with full platform access", False, True),
    ("organizer", "Event Organizer who creates and manages events", False, False),
    ("volunteer", "Event Volunteer assigned to assist in events", False, False),
    ("participant", "General Participant and default platform user role", True, False),
    ("moderator", "Content Moderator who reviews and manages platform content", False, False),
]

VOLUNTEER_ROLE_ROWS = [
    ("Registration Desk", "Handles participant registration and check-in procedures"),
    ("Security Personnel", "Maintains venue security and manages crowd control"),
    ("Logistics Coordinator", "Manages equipment, supplies, and logistical operations"),
    ("Technical Support", "Provides AV and IT technical support during events"),
    ("Marketing Assistant", "Assists with event promotions and social media coverage"),
    ("Event Photographer", "Documents events through photography and video recording"),
    ("First Aid Responder", "Provides basic first aid and coordinates emergency response"),
    ("Event Coordinator", "Oversees overall event flow and manages volunteer teams"),
    ("Guest Services", "Assists attendees with information, directions, and queries"),
    ("Setup & Cleanup Crew", "Prepares the venue before events and cleans up after"),
    ("Transportation Liaison", "Coordinates attendee transportation and shuttle services"),
    ("Catering Assistant", "Assists with food and beverage service during events"),
    ("AV Technician", "Operates audio-visual equipment throughout the event"),
    ("Social Media Manager", "Provides live coverage of events on social media platforms"),
    ("Parking Marshal", "Directs traffic flow and manages parking area operations"),
    ("Information Booth Staff", "Staffs the event information and inquiry desk"),
    ("Translation Services", "Provides real-time language translation and interpretation"),
    ("VIP Escort", "Accompanies and provides dedicated assistance to VIP guests"),
    ("Stage Manager", "Manages stage transitions and coordinates performer schedules"),
    ("Merchandise Handler", "Manages event merchandise inventory and point-of-sale"),
]

# ---------------------------------------------------------------------------
# Review / feedback copy
# ---------------------------------------------------------------------------

REVIEW_TITLES = [
    "Absolutely fantastic experience!",
    "Well-organized and highly informative",
    "Great event with excellent execution",
    "Far exceeded my expectations",
    "Good event overall, would attend again",
    "Truly a wonderful and memorable experience",
    "Impressive scale and organization",
    "Loved every single moment of it",
    "Highly recommend to everyone",
    "Very educational and genuinely fun",
    "Outstanding event management team",
    "Will definitely attend next year",
    "Above average with room to grow",
    "A must-attend event for the community",
    "Incredible networking opportunities",
    "The speakers were absolutely incredible",
    "Venue was perfect for this event",
    "Amazing performances throughout the day",
    "Highly informative and engaging sessions",
    "Best event I attended this year",
]

REVIEW_TEXTS = [
    "The event was extremely well-organized and the speakers were incredibly knowledgeable. I learned a great deal and made valuable professional connections. The venue facilities were excellent and the logistics ran without a hitch.",
    "I had an absolutely amazing time. The program was thoughtfully structured, the content was highly relevant to the industry, and the networking opportunities were invaluable. Will definitely attend again next year.",
    "Overall a great event with strong content. There were some minor hiccups with registration at the beginning but once inside, everything ran smoothly. The presentations were top-notch and the venue had excellent facilities.",
    "This event exceeded all my expectations by a wide margin. The quality of speakers, the breadth of topics covered, and the interactive session formats made this one of the best professional events I have attended.",
    "A solid event with interesting and practical content. The organizing team did a wonderful job managing such a large crowd. There were a few schedule delays but nothing too disruptive overall. Would definitely recommend.",
    "Wonderfully executed from start to finish. Every detail was thoughtfully planned and the team's dedication was evident throughout. The catering was excellent, the sessions were highly engaging, and I left feeling truly inspired.",
    "While the event offered great content and high-quality speakers, the operational side could use some improvement. Registration lines were long and a few sessions started late. Despite this, the overall experience was worthwhile.",
    "I absolutely loved attending this event. The energy in the venue, the quality of performances, the food options, and the overall production were all top tier. The organizing team deserves major recognition.",
    "Highly recommend this event to anyone working in this field. The level of expertise represented by the speakers was genuinely impressive. The connections I made here have already led to meaningful collaborations.",
    "Very educational and genuinely enjoyable at the same time. It is rare for events to strike that balance so well. The workshops were hands-on and practical, and the facilitators were exceptional communicators.",
]

FEEDBACK_COMMENTS = [
    "The event was very well organized and I enjoyed every session I attended.",
    "Great learning experience overall. The speakers were engaging and highly knowledgeable.",
    "Good event but the registration process could have been smoother and faster.",
    "Very informative sessions throughout the day. Will definitely attend the next edition.",
    "Loved the networking opportunities and the quality of the venue facilities.",
    "Some sessions ran a little over the allocated time but the content was genuinely valuable.",
    "Excellent speaker lineup and very relevant and timely topics for the industry.",
    "The venue was perfect for this scale of event and the catering was top quality.",
    "Overall a wonderful experience from start to finish. Highly recommended for all.",
    "Great community-oriented event. Looking forward to the next one already.",
    "The presentations were of very high quality. I was genuinely impressed by the depth.",
    "Smooth event management throughout. Almost everything ran exactly on schedule.",
    "Interesting topics and very engaging discussions in all the sessions I attended.",
    "Great community event overall. Met lots of like-minded and motivated people.",
    "Well worth attending. I will definitely bring my colleagues to the next edition.",
]

FEEDBACK_SUGGESTIONS = [
    "Consider adding more dedicated networking breaks between the main sessions.",
    "A mobile app for personal agenda scheduling would be very helpful for attendees.",
    "More parking spaces close to the venue entrance would be greatly appreciated.",
    "Offering live streaming for those who cannot attend in person would increase reach.",
    "Providing printed or digital copies of all presentations would add lasting value.",
    "Add more diverse food options especially vegetarian and vegan-friendly choices.",
    "Earlier communication of the final detailed program schedule would help with planning.",
    "A dedicated area for one-on-one meetings with speakers would be a great addition.",
    "Better directional signage within the venue would help guide attendees more efficiently.",
    "Starting the registration process earlier would help avoid the long queues at entry.",
]

REPORT_TITLES = [
    "Technical issues with event registration system during peak hours",
    "Request for additional venue amenities and accessibility features",
    "Complaint about overlapping session scheduling creating conflicts",
    "Suggestion for improved attendee communication and notification system",
    "Bug report: feedback submission form fails with special characters",
    "Feature request for dedicated mobile event management application",
    "Venue accessibility concerns for PWD and senior attendees",
    "Audio quality issues experienced during keynote presentations",
    "Request for live streaming capability for remote participants",
    "Catering quality and variety fell below expected standards",
    "Registration system performance was very slow during peak check-in hours",
    "Suggestion for implementing a cashless payment system for vendors",
    "Parking area management and traffic flow needs significant improvement",
    "Request for a dedicated in-app networking and connection platform",
    "Inconsistent and unreliable WiFi connectivity throughout the venue",
    "Session room temperature control was uncomfortable in several rooms",
    "Request for real-time event schedule updates via SMS or push notification",
    "Photo ID requirement for check-in was not communicated in advance to attendees",
    "Longer break times between consecutive sessions are needed for attendees",
    "Suggestion for a structured post-event resource and materials sharing system",
    "Need for significantly better crowd management at the main entrance and exits",
    "Strong interest in a hybrid attendance option for future events",
]

REPORT_DESCRIPTIONS = [
    "Multiple users experienced significant delays and timeouts when attempting to register for events during peak demand hours. The system repeatedly failed causing attendee frustration and potential participation loss.",
    "The venue lacks adequate power outlets for attendees who bring their own devices. This is critical for a technology-focused event where participants need continuous access to power for laptops and phones.",
    "Several sessions of high interest were scheduled concurrently in the same time slot, making it impossible for many attendees to attend all the sessions they wanted without missing important content.",
    "Attendees were not notified about last-minute schedule changes in a timely manner. A more robust real-time notification system would greatly improve the overall event experience for all participants.",
    "The feedback submission form consistently fails when the comment or suggestion fields contain special characters such as apostrophes, quotation marks, or em-dashes. This needs urgent fixing.",
    "A dedicated mobile application for event navigation, personalized schedule management, session bookmarking, and attendee networking would significantly enhance the overall attendee experience.",
    "Several areas of the venue do not have adequate ramps, lifts, and accessible pathways for attendees with physical disabilities. This is a critical issue that must be addressed to ensure full inclusivity.",
    "During the main keynote presentations, audio quality in the rear sections of the hall was noticeably poor with echo and distortion. Additional speaker placements or a different audio configuration would resolve this.",
    "A significant number of registered participants from outside Metro Manila could not attend physically due to travel constraints. A live streaming option would dramatically increase event reach and participation.",
    "The catering provided during the lunch and coffee breaks did not meet the expected quality standards. The menu options were very limited and several dishes were served at incorrect temperatures.",
]

APP_FEEDBACK_COMMENTS = [
    "Love the platform! Event discovery is seamlessly integrated and very intuitive.",
    "Very clean and intuitive interface. The event registration process was quick and easy.",
    "The platform could use a more powerful search feature for finding specific sessions.",
    "Great platform overall. The participant management features are comprehensive and efficient.",
    "Minor UI inconsistencies on mobile but the platform generally works very well.",
    "The feedback submission feature is straightforward and well-designed for users.",
    "Would love a calendar integration feature for automatic event reminders and scheduling.",
    "Excellent platform for community-scale event management and coordination.",
    "The venue suggestion feature is innovative and adds great value for organizers.",
    "Page loading times could be improved for the events directory especially on mobile.",
    "Clean and modern visual design throughout. Very professional look and feel.",
    "The notification system works perfectly and keeps me updated on relevant events.",
    "The event rating and review feature is very helpful for discovering quality events.",
    "The profile onboarding setup was smooth, clear, and required minimal effort.",
    "Would greatly appreciate a dark mode option for evening and low-light use.",
    "Great way to connect directly with event organizers and get event updates.",
    "Very useful for keeping track of all my attended events in one organized place.",
    "The volunteer management features are among the most comprehensive I have seen.",
    "Excellent platform experience for both event organizers and participants alike.",
    "The participant check-in process via the platform is extremely efficient in practice.",
    "Could add social sharing features so attendees can share events they are attending.",
    "The analytics tools available to event organizers are genuinely very helpful.",
    "Bug report: Profile avatar upload occasionally fails on slower internet connections.",
    "Feature request: The ability to export my full event attendance history as a PDF.",
    "One of the best and most complete event management platforms I have used to date.",
]


# ---------------------------------------------------------------------------
# Main seeder
# ---------------------------------------------------------------------------


async def seed() -> None:  # noqa: C901
    print("=" * 60)
    print("  Eventara Database Seeder")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # ── 0. Truncate existing data ───────────────────────────────────────
        print("\n[0/21] Truncating existing data...")
        from sqlalchemy import text

        tables = [
            "audit_logs",
            "event_feedback",
            "event_ratings",
            "venue_ratings",
            "app_feedback",
            "feedback_reports",
            "event_participants",
            "event_sessions",
            "event_volunteers",
            "events",
            "venues",
            "volunteer_applications",
            "volunteers",
            "volunteer_custom_roles",
            "user_roles",
            "user_grants",
            "role_permissions",
            "roles",
            "features",
            "user_activity",
            "user_security",
            "user_profiles",
            "login_history",
            "refresh_tokens",
            "users",
        ]
        for table in tables:
            await db.execute(text(f"DELETE FROM {table}"))
        await db.flush()
        print("       → All tables cleared")

        # ── 1. Features ──────────────────────────────────────────────────
        print("\n[1/21] Seeding features...")
        features: list[Feature] = []
        for slug, name, desc in FEATURE_ROWS:
            f = Feature(id=uid(), slug=slug, name=name, description=desc, is_enabled=True)
            db.add(f)
            features.append(f)
        await db.flush()
        feature_by_slug = {f.slug: f for f in features}
        print(f"       → {len(features)} features")

        # ── 2. Roles ─────────────────────────────────────────────────────
        print("[2/21] Seeding roles...")
        roles: list[Role] = []
        for name, desc, is_default, is_system in ROLE_ROWS:
            r = Role(id=uid(), name=name, description=desc, is_default=is_default, is_system=is_system)
            db.add(r)
            roles.append(r)
        await db.flush()
        role_by_name = {r.name: r for r in roles}
        print(f"       → {len(roles)} roles")

        # ── 3. Role Permissions ──────────────────────────────────────────
        print("[3/21] Seeding role permissions...")
        rp_count = 0
        role_permissions_matrix = {
            "admin": (features, ["create", "read", "update", "delete"]),
            "organizer": (
                [feature_by_slug[s] for s in ("events", "sessions", "participants", "feedback", "event-ratings", "volunteers", "venues", "ratings")],
                ["create", "read", "update", "delete"],
            ),
            "moderator": (
                [feature_by_slug[s] for s in ("events", "venues", "users", "feedback", "reports", "ratings", "event-ratings", "content")],
                ["read", "update", "delete"],
            ),
            "participant": (
                [feature_by_slug[s] for s in ("events", "sessions", "ratings", "feedback", "profile", "app-feedback", "participants")],
                ["read", "create"],
            ),
            "volunteer": (
                [feature_by_slug[s] for s in ("events", "sessions", "participants")],
                ["read"],
            ),
        }
        for role_name, (feat_list, actions) in role_permissions_matrix.items():
            role = role_by_name[role_name]
            for feat in feat_list:
                for action in actions:
                    db.add(RolePermission(id=uid(), role_id=role.id, feature_id=feat.id, action=action, effect="allow"))
                    rp_count += 1
        await db.flush()
        print(f"       → {rp_count} role permissions")

        # ── 4. Users ─────────────────────────────────────────────────────
        print("[4/21] Seeding users...")
        users: list[User] = []
        for i in range(NUM_USERS):
            u = User(
                id=uid(),
                email=f"user{i + 1:03d}@eventara.dev",
                password=_PWD_HASH,
                onboarding_completed=True,
                onboarding_completed_at=past_naive(random.randint(30, 365)),
                accepted_terms=True,
                accepted_terms_at=past_naive(random.randint(30, 365)),
                accepted_privacy_policy=True,
                accepted_privacy_policy_at=past_naive(random.randint(30, 365)),
                status="active",
            )
            db.add(u)
            users.append(u)
        await db.flush()
        print(f"       → {len(users)} users  (password: {SEED_PASSWORD})")

        # ── 5. User Profiles ─────────────────────────────────────────────
        print("[5/21] Seeding user profiles...")
        for i, user in enumerate(users):
            gender = random.choice(GENDERS)
            first_name = random.choice(FIRST_NAMES_M if gender == "male" else FIRST_NAMES_F)
            last_name = random.choice(LAST_NAMES)
            city, province, region = random.choice(PH_CITIES)
            db.add(
                UserProfile(
                    id=uid(),
                    user_id=user.id,
                    alias=f"user_{i + 1:03d}",
                    first_name=first_name,
                    last_name=last_name,
                    age_group=random.choice(AGE_GROUPS),
                    gender=gender,
                    occupation=random.choice(OCCUPATIONS),
                    education_level=random.choice(EDUCATION_LEVELS),
                    bio=f"Hi, I am {first_name} from {city}. Passionate about events and community building.",
                    preferences={"newsletter": random.choice([True, False]), "notifications": True, "language": "en"},
                )
            )
        await db.flush()
        print(f"       → {NUM_USERS} user profiles")

        # ── 6. User Security ─────────────────────────────────────────────
        print("[6/21] Seeding user security...")
        for user in users:
            db.add(
                UserSecurity(
                    id=uid(),
                    user_id=user.id,
                    email_verified=True,
                    email_verified_at=past_naive(random.randint(30, 300)),
                    failed_login_attempts=0,
                )
            )
        await db.flush()
        print(f"       → {NUM_USERS} security records")

        # ── 7. User Activity ─────────────────────────────────────────────
        print("[7/21] Seeding user activity...")
        for user in users:
            last_login = past_naive(random.randint(1, 30))
            db.add(
                UserActivity(
                    id=uid(),
                    user_id=user.id,
                    last_login_at=last_login,
                    last_activity_at=last_login + timedelta(hours=random.randint(1, 5)),
                    login_count=random.randint(5, 120),
                )
            )
        await db.flush()
        print(f"       → {NUM_USERS} activity records")

        # ── 8. User Roles ─────────────────────────────────────────────────
        print("[8/21] Seeding user roles...")
        admin_user = users[0]
        ur_count = 0

        role_assignments = [
            (users[:3], "admin"),
            (users[3:10], "organizer"),
            (users[10:15], "moderator"),
            (users[15:45], "volunteer"),
            (users[45:], "participant"),
        ]
        for user_slice, role_name in role_assignments:
            for u in user_slice:
                db.add(
                    UserRole(
                        id=uid(),
                        user_id=u.id,
                        role_id=role_by_name[role_name].id,
                        assigned_by=admin_user.id,
                        assigned_at=past_naive(random.randint(10, 300)),
                    )
                )
                ur_count += 1
        await db.flush()
        print(f"       → {ur_count} user role assignments")

        # ── 9. User Login History ─────────────────────────────────────────
        print("[9/21] Seeding login history...")
        lh_count = 0
        for user in users[:60]:
            for _ in range(random.randint(2, 5)):
                db.add(
                    UserLoginHistory(
                        id=uid(),
                        user_id=user.id,
                        ip_address=random.choice(SAMPLE_IPS),
                        browser=random.choice(BROWSERS),
                        os=random.choice(OS_LIST),
                        device_type=random.choice(DEVICE_TYPES),
                        city=random.choice(PH_CITIES)[0],
                        region="NCR",
                        country="Philippines",
                        successful=random.choices([True, False], weights=[92, 8])[0],
                    )
                )
                lh_count += 1
        await db.flush()
        print(f"       → {lh_count} login history records")

        # ── 10. User Grants ───────────────────────────────────────────────
        print("[10/21] Seeding user grants...")
        grant_count = 0
        grant_feature_pool = random.sample(features, 8)
        for user in users[:25]:
            feat = random.choice(grant_feature_pool)
            db.add(
                UserGrant(
                    id=uid(),
                    user_id=user.id,
                    role_id=random.choice(roles).id,
                    feature_id=feat.id,
                    action="read",
                    effect="allow",
                    reason="Seeded grant for platform testing",
                    granted_by=admin_user.id,
                )
            )
            grant_count += 1
        await db.flush()
        print(f"       → {grant_count} user grants")

        # ── 11. Venues ────────────────────────────────────────────────────
        print("[11/21] Seeding venues...")
        venues: list[Venue] = []
        organizers = users[3:10]
        for i, vd in enumerate(VENUE_ROWS):
            db.add(
                v := Venue(
                    id=uid(),
                    creator_id=organizers[i % len(organizers)].id,
                    name=vd["name"],
                    description=f"A premier event venue in {vd['city']}. Suitable for conferences, exhibitions, concerts, and large community gatherings.",
                    address_line=vd["address_line"],
                    city=vd["city"],
                    province=vd["province"],
                    region=vd["region"],
                    postal_code=vd["postal_code"],
                    country=vd["country"],
                    capacity=vd["capacity"],
                    venue_type=vd["venue_type"],
                    amenities=vd["amenities"],
                    contact_name=vd["contact_name"],
                    contact_phone=vd["contact_phone"],
                    contact_email=vd["contact_email"],
                    is_partner=random.choice([True, False]),
                    popularity_count=random.randint(20, 600),
                    usage_count=random.randint(2, 80),
                )
            )
            venues.append(v)
        await db.flush()
        print(f"       → {len(venues)} venues")

        # ── 12. Venue Ratings ─────────────────────────────────────────────
        print("[12/21] Seeding venue ratings...")
        vr_count = 0
        vr_pairs: set[tuple] = set()
        venue_rating_comments = [
            "Great venue with excellent modern facilities!",
            "Well-maintained and very easily accessible by public transport.",
            "Good parking availability and contemporary amenities.",
            "Professional and courteous staff throughout.",
            "Perfect for large-scale corporate events and exhibitions.",
            "Wonderful ambiance and well-designed spaces.",
            "Highly recommended for any professional or community event.",
            "Clean, spacious, and very well organized.",
        ]
        rater_pool = users[10:]
        for venue in venues:
            for user in random.sample(rater_pool, random.randint(3, 6)):
                pair = (str(user.id), str(venue.id))
                if pair in vr_pairs:
                    continue
                vr_pairs.add(pair)
                db.add(
                    VenueRating(
                        id=uid(),
                        user_id=user.id,
                        venue_id=venue.id,
                        rating=random.randint(3, 5),
                        comment=random.choice(venue_rating_comments),
                        created_at=now(),
                        updated_at=now(),
                    )
                )
                vr_count += 1
        await db.flush()
        print(f"       → {vr_count} venue ratings")

        # ── 13. Volunteer Roles ───────────────────────────────────────────
        print("[13/21] Seeding volunteer roles...")
        vol_roles: list[VolunteerRole] = []
        for name, desc in VOLUNTEER_ROLE_ROWS:
            db.add(vr := VolunteerRole(id=uid(), name=name, description=desc, created_by=admin_user.id, is_active=True))
            vol_roles.append(vr)
        await db.flush()
        print(f"       → {len(vol_roles)} volunteer custom roles")

        # ── 14. Volunteer Applications ────────────────────────────────────
        print("[14/21] Seeding volunteer applications...")
        applicant_users = users[15:60]  # 45 applicants
        va_count = 0
        for user in applicant_users:
            status = random.choices(["pending", "approved", "rejected", "withdrawn"], weights=[15, 65, 15, 5])[0]
            db.add(
                VolunteerApplication(
                    id=uid(),
                    user_id=user.id,
                    status=status,
                    application_data={
                        "motivation": "I am passionate about community events and want to contribute meaningfully.",
                        "experience": f"{random.randint(1, 8)} years of event volunteering experience",
                        "availability": random.choice(["Weekends only", "Weekdays and weekends", "Flexible schedule"]),
                        "skills": random.sample(
                            ["communication", "leadership", "technical", "logistics", "first aid", "photography", "social media"], 3
                        ),
                    },
                )
            )
            va_count += 1
        await db.flush()
        print(f"       → {va_count} volunteer applications")

        # ── 15. Volunteers ────────────────────────────────────────────────
        print("[15/21] Seeding volunteers...")
        volunteers: list[Volunteer] = []
        volunteer_user_pool = applicant_users[:NUM_VOLUNTEERS]
        for i, user in enumerate(volunteer_user_pool):
            phone = f"0917{random.randint(1000000, 9999999)}"
            db.add(
                v := Volunteer(
                    id=uid(),
                    user_id=user.id,
                    contact_phone=phone,
                    volunteer_role_id=vol_roles[i % len(vol_roles)].id,
                    status="active",
                )
            )
            volunteers.append(v)
        await db.flush()
        print(f"       → {len(volunteers)} volunteers")

        # ── 16. Events ────────────────────────────────────────────────────
        print("[16/21] Seeding events...")
        events: list[Event] = []
        event_creators = users[:10]
        for i, ed in enumerate(EVENT_ROWS):
            start = future(ed["days_offset"]) if ed["days_offset"] >= 0 else past(-ed["days_offset"])
            end = start + timedelta(days=ed["duration_days"])
            db.add(
                e := Event(
                    id=uid(),
                    title=ed["title"],
                    description=ed["description"],
                    start_date=start,
                    end_date=end,
                    status=ed["status"],
                    created_by=event_creators[i % len(event_creators)].id,
                )
            )
            events.append(e)
        await db.flush()
        print(f"       → {len(events)} events")

        # ── 17. Event Sessions ────────────────────────────────────────────
        print("[17/21] Seeding event sessions...")
        event_sessions: list[EventSession] = []
        # Map event status → valid session status
        session_status_map = {
            "ended": "ended",
            "started": "started",
            "posted": "posted",
            "draft": "draft",
            "cancelled": "cancelled",
            "postponed": "postponed",
        }
        for event, ed in zip(events, EVENT_ROWS):
            start = future(ed["days_offset"]) if ed["days_offset"] >= 0 else past(-ed["days_offset"])
            sess_status = session_status_map[ed["status"]]
            venue_pair = random.sample(venues, 2)
            for j, title in enumerate(ed["sessions"]):
                s_start = start + timedelta(hours=j * 6)
                s_end = s_start + timedelta(hours=5, minutes=30)
                db.add(
                    es := EventSession(
                        id=uid(),
                        event_id=event.id,
                        venue_id=venue_pair[j % 2].id,
                        title=title,
                        description=f"Part of {event.title}. Join us for an engaging and informative {title.lower()}.",
                        start_datetime=s_start,
                        end_datetime=s_end,
                        status=sess_status,
                        max_slots=random.randint(60, 250),
                    )
                )
                event_sessions.append(es)
        await db.flush()
        print(f"       → {len(event_sessions)} event sessions (2 per event)")

        # ── 18. Event Participants ────────────────────────────────────────
        print("[18/21] Seeding event participants (15-30 per session)...")
        participant_pool = users[10:]  # exclude admins/organizers as participants
        ep_count = 0
        ep_pairs: set[tuple] = set()
        # Map event_id → list of EventParticipant objects (for ratings/feedback later)
        participants_by_event: dict[str, list[EventParticipant]] = {str(e.id): [] for e in events}

        for es in event_sessions:
            n = random.randint(*PARTICIPANTS_PER_SESSION)
            session_users = random.sample(participant_pool, n)
            event_status = next(e.status for e in events if str(e.id) == str(es.event_id))

            for user in session_users:
                pair = (str(user.id), str(es.id))
                if pair in ep_pairs:
                    continue
                ep_pairs.add(pair)

                if event_status == "ended":
                    status = random.choices(["attended", "no_show", "cancelled"], weights=[75, 15, 10])[0]
                    is_checked_in = status == "attended"
                    checked_in_time = past(random.randint(1, 60)) if is_checked_in else None
                elif event_status == "started":
                    status = random.choices(["attended", "registered"], weights=[60, 40])[0]
                    is_checked_in = status == "attended"
                    checked_in_time = past(0, hours=random.randint(1, 5)) if is_checked_in else None
                else:
                    status, is_checked_in, checked_in_time = "registered", False, None

                db.add(
                    ep := EventParticipant(
                        id=uid(),
                        user_id=user.id,
                        event_session_id=es.id,
                        status=status,
                        is_checked_in=is_checked_in,
                        checked_in_time=checked_in_time,
                    )
                )
                participants_by_event[str(es.event_id)].append(ep)
                ep_count += 1

        await db.flush()
        print(f"       → {ep_count} event participants")

        # ── 19. Event Volunteers ──────────────────────────────────────────
        print("[19/21] Seeding event volunteers...")
        ev_count = 0
        ev_pairs: set[tuple] = set()
        for event in events:
            for vol in random.sample(volunteers, random.randint(3, 6)):
                pair = (str(vol.id), str(event.id))
                if pair in ev_pairs:
                    continue
                ev_pairs.add(pair)
                ev_status = random.choices(["joined", "pending", "left", "rejected"], weights=[70, 15, 10, 5])[0]
                db.add(EventVolunteer(id=uid(), volunteer_id=vol.id, event_id=event.id, status=ev_status))
                ev_count += 1
        await db.flush()
        print(f"       → {ev_count} event volunteers")

        # ── 20. Event Ratings ─────────────────────────────────────────────
        print("[20/21] Seeding event ratings...")
        er_count = 0
        er_pairs: set[tuple] = set()
        for event in events:
            if event.status not in ("ended", "started"):
                continue
            ep_list = participants_by_event[str(event.id)]
            if not ep_list:
                continue
            raters = random.sample(ep_list, min(random.randint(8, 15), len(ep_list)))
            for ep in raters:
                pair = (str(ep.user_id), str(event.id))
                if pair in er_pairs:
                    continue
                er_pairs.add(pair)
                db.add(
                    EventRating(
                        id=uid(),
                        user_id=ep.user_id,
                        event_id=event.id,
                        overall_rating=random.randint(3, 5),
                        organization_rating=random.randint(3, 5),
                        venue_rating=random.randint(3, 5),
                        activities_rating=random.randint(3, 5),
                        title=random.choice(REVIEW_TITLES),
                        review=random.choice(REVIEW_TEXTS),
                        would_recommend=random.choices([True, False], weights=[88, 12])[0],
                        helpful_count=random.randint(0, 60),
                    )
                )
                er_count += 1
        await db.flush()
        print(f"       → {er_count} event ratings")

        # ── 21. Event Feedback ────────────────────────────────────────────
        print("[21/21] Seeding event feedback...")
        ef_count = 0
        ef_pairs: set[tuple] = set()
        for event in events:
            if event.status not in ("ended", "started"):
                continue
            ep_list = participants_by_event[str(event.id)]
            if not ep_list:
                continue
            feedback_eps = random.sample(ep_list, min(random.randint(6, 12), len(ep_list)))
            for ep in feedback_eps:
                pair = (str(ep.user_id), str(event.id))
                if pair in ef_pairs:
                    continue
                ef_pairs.add(pair)
                db.add(
                    EventFeedback(
                        id=uid(),
                        user_id=ep.user_id,
                        event_id=event.id,
                        participant_id=ep.id,
                        rating=random.randint(3, 5),
                        comment=random.choice(FEEDBACK_COMMENTS),
                        suggestion=random.choice([None, None, random.choice(FEEDBACK_SUGGESTIONS)]),
                    )
                )
                ef_count += 1
        await db.flush()
        print(f"       → {ef_count} event feedback records")

        # ── Feedback Reports ──────────────────────────────────────────────
        print("[ + ] Seeding feedback reports...")
        fr_count = 0
        report_users = random.sample(users[10:], 22)
        entity_choices = ["event", "venue", "user", "volunteer", "other"]
        for i, user in enumerate(report_users):
            etype = random.choice(entity_choices)
            if etype == "event":
                eid = random.choice(events).id
            elif etype == "venue":
                eid = random.choice(venues).id
            else:
                eid = None
            db.add(
                FeedbackReport(
                    id=uid(),
                    created_by=user.id,
                    feedback_type=random.choice(["bug_report", "feature_request", "complaint", "suggestion", "other"]),
                    title=REPORT_TITLES[i % len(REPORT_TITLES)],
                    description=REPORT_DESCRIPTIONS[i % len(REPORT_DESCRIPTIONS)],
                    entity_type=etype,
                    entity_id=eid,
                    status=random.choice(["open", "in_review", "in_progress", "resolved", "closed"]),
                    severity=random.choice(["low", "medium", "high", "critical"]),
                )
            )
            fr_count += 1
        await db.flush()
        print(f"       → {fr_count} feedback reports")

        # ── App Feedback ──────────────────────────────────────────────────
        print("[ + ] Seeding app feedback...")
        af_count = 0
        af_ips = [f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}" for _ in range(25)]
        for comment in APP_FEEDBACK_COMMENTS:
            db.add(
                AppFeedbackModel(
                    id=uid(),
                    rating=random.randint(3, 5),
                    comment=comment,
                    ip_address=random.choice(af_ips),
                )
            )
            af_count += 1
        await db.flush()
        print(f"       → {af_count} app feedback records")

        # ── Commit ────────────────────────────────────────────────────────
        await db.commit()

    print("\n" + "=" * 60)
    print("  Seed complete!")
    print("=" * 60)
    print(f"  Users:                {NUM_USERS:>4}  (password: {SEED_PASSWORD})")
    print(f"  Venues:               {NUM_VENUES:>4}")
    print(f"  Events:               {NUM_EVENTS:>4}  (2 sessions each)")
    print(f"  Event participants:   {ep_count:>4}  (15-30 per session)")
    print(f"  Volunteers:           {len(volunteers):>4}")
    print(f"  Event volunteers:     {ev_count:>4}")
    print(f"  Event ratings:        {er_count:>4}")
    print(f"  Event feedback:       {ef_count:>4}")
    print(f"  Venue ratings:        {vr_count:>4}")
    print(f"  Feedback reports:     {fr_count:>4}")
    print(f"  App feedback:         {af_count:>4}")
    print(f"  Login history:        {lh_count:>4}")
    print(f"  Role permissions:     {rp_count:>4}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())
