require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Models
const User = require('../models/user');
const Team = require('../models/teams');
const Event = require('../models/events');
const Classified = require('../models/classified');
const Field = require('../models/field');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

// Import field data
const { gtaFields } = require('./fields');

// Helper to hash passwords
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Sample users data - soroush is intentionally kept clean (no team, no events)
const createUsers = async () => {
  const hashedPassword = await hashPassword('password123');
  const soroushPassword = await hashPassword('mYTR6RHmXd@WNmz');

  const users = [
    // SOROUSH - Your test user with NOTHING assigned
    {
      first_name: 'Soroush',
      last_name: 'Salari',
      email: 'soroush.salari2023@gmail.com',
      username: 'soroush',
      password: soroushPassword,
      date_of_birth: new Date('1995-06-15'),
      skill_level: 'intermediate',
      position: 'midfielder',
      bio: 'Soccer enthusiast looking to join a team!',
      location: 'Toronto, Ontario',
      stats: {
        games_played: 0, goals: 0, assists: 0, clean_sheets: 0,
        pace: 75, shooting: 70, passing: 80, dribbling: 78, defending: 65, physical: 72
      },
      email_verified: true,
      user_type: 'player'
    },
    // Admin user
    {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@soccerconnect.com',
      username: 'admin',
      password: hashedPassword,
      date_of_birth: new Date('1990-01-01'),
      skill_level: 'competitive',
      position: 'midfielder',
      bio: 'Platform administrator',
      location: 'Toronto, Ontario',
      email_verified: true,
      user_type: 'admin'
    },
    // Other test users who WILL have teams and events
    {
      first_name: 'Marcus',
      last_name: 'Johnson',
      email: 'marcus@test.com',
      username: 'marcusj',
      password: hashedPassword,
      date_of_birth: new Date('1992-03-20'),
      skill_level: 'competitive',
      position: 'forward',
      bio: 'Former college player, now playing recreational leagues. Love the beautiful game!',
      location: 'Toronto, Ontario',
      stats: {
        games_played: 45, goals: 32, assists: 15, clean_sheets: 0,
        pace: 88, shooting: 85, passing: 72, dribbling: 80, defending: 45, physical: 78
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'Sofia',
      last_name: 'Martinez',
      email: 'sofia@test.com',
      username: 'sofiam',
      password: hashedPassword,
      date_of_birth: new Date('1994-07-12'),
      skill_level: 'intermediate',
      position: 'midfielder',
      bio: 'Creative midfielder with an eye for the perfect pass.',
      location: 'Mississauga, Ontario',
      stats: {
        games_played: 28, goals: 8, assists: 22, clean_sheets: 0,
        pace: 75, shooting: 70, passing: 88, dribbling: 82, defending: 60, physical: 65
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'David',
      last_name: 'Chen',
      email: 'david@test.com',
      username: 'davidc',
      password: hashedPassword,
      date_of_birth: new Date('1991-11-05'),
      skill_level: 'competitive',
      position: 'goalkeeper',
      bio: 'Shot stopper with quick reflexes. 5 years of competitive experience.',
      location: 'Markham, Ontario',
      stats: {
        games_played: 52, goals: 0, assists: 2, clean_sheets: 18,
        pace: 55, shooting: 30, passing: 65, dribbling: 40, defending: 85, physical: 80
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'Emma',
      last_name: 'Wilson',
      email: 'emma@test.com',
      username: 'emmaw',
      password: hashedPassword,
      date_of_birth: new Date('1998-02-28'),
      skill_level: 'recreational',
      position: 'defender',
      bio: 'New to soccer but loving every minute of it!',
      location: 'Brampton, Ontario',
      stats: {
        games_played: 12, goals: 1, assists: 3, clean_sheets: 4,
        pace: 70, shooting: 50, passing: 65, dribbling: 55, defending: 75, physical: 72
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'James',
      last_name: 'Williams',
      email: 'james@test.com',
      username: 'jamesw',
      password: hashedPassword,
      date_of_birth: new Date('1993-09-14'),
      skill_level: 'intermediate',
      position: 'defender',
      bio: 'Solid center-back. Good in the air and strong in the tackle.',
      location: 'Vaughan, Ontario',
      stats: {
        games_played: 38, goals: 5, assists: 4, clean_sheets: 12,
        pace: 68, shooting: 45, passing: 70, dribbling: 55, defending: 85, physical: 88
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'Aisha',
      last_name: 'Patel',
      email: 'aisha@test.com',
      username: 'aishap',
      password: hashedPassword,
      date_of_birth: new Date('1996-04-22'),
      skill_level: 'competitive',
      position: 'midfielder',
      bio: 'Box-to-box midfielder with endless energy.',
      location: 'Scarborough, Ontario',
      stats: {
        games_played: 41, goals: 12, assists: 18, clean_sheets: 0,
        pace: 82, shooting: 72, passing: 78, dribbling: 75, defending: 70, physical: 80
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael@test.com',
      username: 'michaelb',
      password: hashedPassword,
      date_of_birth: new Date('1988-12-03'),
      skill_level: 'recreational',
      position: 'forward',
      bio: 'Weekend warrior who loves scoring goals!',
      location: 'North York, Ontario',
      stats: {
        games_played: 22, goals: 15, assists: 6, clean_sheets: 0,
        pace: 72, shooting: 78, passing: 60, dribbling: 68, defending: 35, physical: 70
      },
      email_verified: true,
      user_type: 'player'
    },
    {
      first_name: 'Lisa',
      last_name: 'Kim',
      email: 'lisa@test.com',
      username: 'lisak',
      password: hashedPassword,
      date_of_birth: new Date('1997-08-17'),
      skill_level: 'intermediate',
      position: 'midfielder',
      bio: 'Technical player who loves keeping possession.',
      location: 'Etobicoke, Ontario',
      stats: {
        games_played: 30, goals: 7, assists: 14, clean_sheets: 0,
        pace: 70, shooting: 65, passing: 85, dribbling: 88, defending: 55, physical: 60
      },
      email_verified: true,
      user_type: 'player'
    }
  ];

  return User.insertMany(users);
};

// Create teams - soroush is NOT a member of any team
const createTeams = async (users) => {
  const marcus = users.find(u => u.username === 'marcusj');
  const sofia = users.find(u => u.username === 'sofiam');
  const david = users.find(u => u.username === 'davidc');
  const emma = users.find(u => u.username === 'emmaw');
  const james = users.find(u => u.username === 'jamesw');
  const aisha = users.find(u => u.username === 'aishap');
  const michael = users.find(u => u.username === 'michaelb');
  const lisa = users.find(u => u.username === 'lisak');

  const teams = [
    {
      team_name: 'Toronto FC Legends',
      description: 'Competitive team looking for skilled players. We play in the GTA Premier League and train twice a week.',
      skill_level: 'competitive',
      owner: marcus._id,
      members: [
        { user: marcus._id, role: 'owner' },
        { user: david._id, role: 'member' },
        { user: aisha._id, role: 'captain' },
        { user: james._id, role: 'member' }
      ],
      location: 'Toronto, Ontario',
      stats: { games_played: 17, wins: 12, losses: 3, draws: 2, goals_for: 38, goals_against: 15 },
      is_recruiting: true,
      approval_status: 'approved'
    },
    {
      team_name: 'Mississauga United',
      description: 'Friendly intermediate team focused on having fun while staying competitive. All skill levels welcome!',
      skill_level: 'intermediate',
      owner: sofia._id,
      members: [
        { user: sofia._id, role: 'owner' },
        { user: lisa._id, role: 'member' },
        { user: emma._id, role: 'member' }
      ],
      location: 'Mississauga, Ontario',
      stats: { games_played: 17, wins: 8, losses: 5, draws: 4, goals_for: 25, goals_against: 22 },
      is_recruiting: true,
      approval_status: 'approved'
    },
    {
      team_name: 'Sunday Strikers',
      description: 'Casual recreational team that plays pickup games on Sundays. No commitment required!',
      skill_level: 'intermediate',
      owner: michael._id,
      members: [
        { user: michael._id, role: 'owner' }
      ],
      location: 'North York, Ontario',
      stats: { games_played: 15, wins: 5, losses: 7, draws: 3, goals_for: 20, goals_against: 28 },
      is_recruiting: true,
      approval_status: 'approved'
    },
    // A pending team for admin testing
    {
      team_name: 'New Stars FC',
      description: 'Brand new team looking to make a name in the league.',
      skill_level: 'intermediate',
      owner: emma._id,
      members: [
        { user: emma._id, role: 'owner' }
      ],
      location: 'Brampton, Ontario',
      is_recruiting: true,
      approval_status: 'pending'
    }
  ];

  return Team.insertMany(teams);
};

// Create events - soroush is NOT attending any events
const createEvents = async (users, fields) => {
  const marcus = users.find(u => u.username === 'marcusj');
  const sofia = users.find(u => u.username === 'sofiam');
  const michael = users.find(u => u.username === 'michaelb');
  const david = users.find(u => u.username === 'davidc');
  const aisha = users.find(u => u.username === 'aishap');

  const downsview = fields.find(f => f.name.includes('Downsview'));
  const scarborough = fields.find(f => f.name.includes('Scarborough'));
  const mississauga = fields.find(f => f.name.includes('Mississauga'));
  const northYork = fields.find(f => f.name.includes('North York'));

  // Future dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const in2Weeks = new Date();
  in2Weeks.setDate(in2Weeks.getDate() + 14);

  const events = [
    {
      title: 'Weekly Pickup Game - Downsview',
      description: 'Regular weekly pickup game. All skill levels welcome! We split teams fairly and rotate players.',
      event_type: 'pickup_game',
      creator: marcus._id,
      date: tomorrow,
      start_time: '19:00',
      end_time: '21:00',
      location: {
        name: downsview?.name || 'Downsview Sports Complex',
        address: '1750 Sheppard Ave W, Toronto',
        coordinates: { lat: 43.7508, lng: -79.4808 }
      },
      max_participants: 22,
      skill_level: 'all',
      cost: 10,
      attendees: [
        { user: marcus._id, status: 'going' },
        { user: david._id, status: 'going' },
        { user: aisha._id, status: 'going' }
      ],
      status: 'upcoming',
      visibility: 'public',
      approval_status: 'approved'
    },
    {
      title: 'Intermediate Training Session',
      description: 'Focused training session on passing and movement. Coach-led drills and small-sided games.',
      event_type: 'training',
      creator: sofia._id,
      date: nextWeek,
      start_time: '10:00',
      end_time: '12:00',
      location: {
        name: mississauga?.name || 'Mississauga Valley Soccer Fields',
        address: '1275 Mississauga Valley Blvd, Mississauga'
      },
      max_participants: 16,
      skill_level: 'intermediate',
      cost: 15,
      attendees: [
        { user: sofia._id, status: 'going' }
      ],
      status: 'upcoming',
      visibility: 'public',
      approval_status: 'approved'
    },
    {
      title: 'Sunday Funday - Casual Kick',
      description: 'No pressure, just fun! Bring your friends and family. We have extra balls and bibs.',
      event_type: 'pickup_game',
      creator: michael._id,
      date: nextWeek,
      start_time: '14:00',
      end_time: '16:00',
      location: {
        name: northYork?.name || 'North York Indoor Soccer',
        address: '4850 Yonge St, North York'
      },
      max_participants: 20,
      skill_level: 'beginner',
      cost: 0,
      attendees: [
        { user: michael._id, status: 'going' }
      ],
      status: 'upcoming',
      visibility: 'public',
      approval_status: 'approved'
    },
    {
      title: 'Competitive 7v7 Tournament',
      description: 'Single day tournament with prizes! Teams of 7 compete for glory and bragging rights.',
      event_type: 'tournament',
      creator: marcus._id,
      date: in2Weeks,
      start_time: '09:00',
      end_time: '17:00',
      location: {
        name: scarborough?.name || 'Scarborough Sports Centre',
        address: '2900 Birchmount Rd, Scarborough'
      },
      max_participants: 56,
      skill_level: 'competitive',
      cost: 25,
      attendees: [
        { user: marcus._id, status: 'going' },
        { user: aisha._id, status: 'going' }
      ],
      status: 'upcoming',
      visibility: 'public',
      approval_status: 'approved'
    },
    // A pending event for admin testing
    {
      title: 'Night League Tryouts',
      description: 'Tryouts for our competitive night league team.',
      event_type: 'tryout',
      creator: david._id,
      date: in2Weeks,
      start_time: '20:00',
      end_time: '22:00',
      location: {
        name: 'Downsview Sports Complex',
        address: '1750 Sheppard Ave W, Toronto'
      },
      max_participants: 30,
      skill_level: 'competitive',
      cost: 0,
      attendees: [
        { user: david._id, status: 'going' }
      ],
      status: 'upcoming',
      visibility: 'public',
      approval_status: 'pending'
    }
  ];

  return Event.insertMany(events);
};

// Default image shown on all seed classifieds — posters can replace via Edit Listing
const DEFAULT_CLASSIFIED_IMAGE = 'https://placehold.co/800x600/0d4a1a/4ade80?text=Soccer+Connect';

// Create classifieds - comprehensive marketplace seed covering all types
const createClassifieds = async (users) => {
  const marcus  = users.find(u => u.username === 'marcusj');
  const sofia   = users.find(u => u.username === 'sofiam');
  const emma    = users.find(u => u.username === 'emmaw');
  const james   = users.find(u => u.username === 'jamesw');
  const soroush = users.find(u => u.username === 'soroush');
  const admin   = users.find(u => u.username === 'admin');

  const classifieds = [
    // ── EQUIPMENT FOR SALE ──────────────────────────────────────────────────
    {
      title: 'Nike Mercurial Vapor 15 Elite – Size 10',
      description: 'Barely used Nike Mercurial Vapor 15 Elite boots in excellent condition. Worn only 3 times on natural grass — no turf wear. Comes with original box and extra laces. Selling because they run a half-size small for me. Retail $350, asking $180 OBO.',
      classified_type: 'equipment_sale',
      creator: marcus._id,
      price: 180,
      condition: 'like-new',
      location: 'Toronto, Ontario',
      contact_email: 'marcus@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Adidas Predator GK Gloves – Size 9',
      description: 'Adidas Predator Pro goalkeeper gloves. Used for one full season (spring league). Palm grip is still in great shape — just some minor cosmetic wear on the backhand. Size 9, fits most adults. Great for recreational or intermediate keepers.',
      classified_type: 'equipment_sale',
      creator: marcus._id,
      price: 45,
      condition: 'good',
      location: 'Toronto, Ontario',
      contact_email: 'marcus@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Puma Future 7 Cleats – Size 11 (Turf)',
      description: 'Puma Future 7 Play TT turf cleats, size 11. Bought for indoor but switched to another pair. Only worn twice indoors. No sign of wear on the studs. Comes in original box.',
      classified_type: 'equipment_sale',
      creator: james._id,
      price: 65,
      condition: 'like-new',
      location: 'Vaughan, Ontario',
      contact_email: 'jamesw@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Full Goalkeeper Kit – Shirt, Shorts, Socks (M)',
      description: 'Complete goalkeeper kit in medium. Includes padded GK shirt, padded shorts, and grip socks. All from the same brand, washed and in excellent condition. Selling as a bundle only — great deal for a keeper just starting out.',
      classified_type: 'equipment_sale',
      creator: sofia._id,
      price: 55,
      condition: 'good',
      location: 'Mississauga, Ontario',
      contact_email: 'sofia@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Match Balls x5 – Nike Flight (Used)',
      description: 'Five Nike Flight match balls. Used across two seasons of competitive league play. All hold air well and have no major scuffs. Perfect for training, pickup games, or keeping a few spares. Selling as a set.',
      classified_type: 'equipment_sale',
      creator: james._id,
      price: 80,
      condition: 'fair',
      location: 'Vaughan, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'FREE – Soccer Cones & Training Ladder',
      description: 'Giving away a set of 20 disc cones (orange) and a 6-metre agility ladder. Both used but fully functional — great for individual training or coaching youth sessions. Pick up only from Vaughan area.',
      classified_type: 'equipment_sale',
      creator: james._id,
      price: 0,
      condition: 'fair',
      location: 'Vaughan, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── EQUIPMENT WANTED ────────────────────────────────────────────────────
    {
      title: 'WTB: Size 8 GK Gloves – Any Brand',
      description: 'Looking for goalkeeper gloves in size 8, any condition as long as the palms are intact. Just need something affordable for training sessions. Happy to pay up to $25. Can pick up anywhere in the GTA.',
      classified_type: 'equipment_wanted',
      creator: soroush._id,
      location: 'North York, Ontario',
      contact_email: 'soroush.salari2023@gmail.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Wanted: Full-Size Training Goal (Portable)',
      description: 'Looking to buy a portable full-size (8x24) or 7-aside training goal for backyard use. Needs to fold flat for storage. Willing to pay $80–$150 depending on condition. DM with photos.',
      classified_type: 'equipment_wanted',
      creator: emma._id,
      location: 'Brampton, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── LOOKING FOR PLAYERS ─────────────────────────────────────────────────
    {
      title: 'Competitive Team Seeking Striker – Fall Season',
      description: 'We are a competitive-level 11-aside team (Toronto Sunday League, Division 2) looking for a clinical striker ahead of the fall season. Must be available Sunday mornings 9–11 AM and Tuesday evening training 7–9 PM. Experience in league play required. Trial match before signing — contact us to arrange.',
      classified_type: 'looking_for_players',
      creator: sofia._id,
      location: 'Mississauga, Ontario',
      position_needed: 'forward',
      skill_level: 'competitive',
      contact_email: 'sofia@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Recreational 5-aside Team Looking for a Goalkeeper',
      description: 'Our Friday night indoor 5-aside team is missing a keeper. We play at Chinguacousy Rec Centre in Brampton, every Friday 8–9 PM. Totally casual — just here for fun and a bit of exercise. All skill levels welcome, no experience necessary.',
      classified_type: 'looking_for_players',
      creator: emma._id,
      location: 'Brampton, Ontario',
      position_needed: 'goalkeeper',
      skill_level: 'beginner',
      contact_email: 'emma@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Intermediate 7-aside – Need CB and Midfielder',
      description: 'Looking for two players to complete our summer roster: one central defender and one box-to-box midfielder. We play Saturday afternoons at Downsview Park. Intermediate level, mix of ages 20–40. Friendly atmosphere but we do take results seriously. Message us for a trial session.',
      classified_type: 'looking_for_players',
      creator: marcus._id,
      location: 'North York, Ontario',
      position_needed: 'defender',
      skill_level: 'intermediate',
      contact_email: 'marcus@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── LOOKING FOR TEAM ────────────────────────────────────────────────────
    {
      title: 'Midfielder Looking for Recreational Team – Weekends',
      description: "Hi! I'm Soroush, 28M, central or attacking midfielder with about 8 years of casual play. Just moved to North York and looking for a weekend team. Not looking for anything super competitive — just want to enjoy the game and meet people. Available Saturdays and Sundays.",
      classified_type: 'looking_for_team',
      creator: soroush._id,
      location: 'North York, Ontario',
      skill_level: 'intermediate',
      contact_email: 'soroush.salari2023@gmail.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Defender Looking for Competitive 11-aside League',
      description: "Experienced CB, 31M, played in Toronto District Amateur Soccer League for 4 seasons. Looking for a competitive team ahead of the fall registration. Strong in the air, good 1v1 defender. Can also play fullback. Available any day after 6 PM.",
      classified_type: 'looking_for_team',
      creator: emma._id,
      location: 'Brampton, Ontario',
      skill_level: 'competitive',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── COACHING ────────────────────────────────────────────────────────────
    {
      title: 'UEFA B License Coach – 1-on-1 & Small Group Sessions',
      description: 'Professional coach with UEFA B license and 10+ years working with youth academies and adult recreational teams. Offering individual technical sessions (first touch, shooting, 1v1), positional coaching, and small group (2–4 players) tactical sessions. Sessions held at Centennial Park or by request. 60 min: $75 | 90 min: $100 | Package of 5 sessions: $320.',
      classified_type: 'coaching',
      creator: admin._id,
      price: 75,
      location: 'Etobicoke, Ontario',
      contact_email: 'admin@soccerconnect.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Youth Goalkeeper Coaching – Ages 8–16',
      description: 'Goalkeeper-specific training for youth players ages 8–16. Former semi-pro keeper with 5 years of coaching experience. Focus areas: positioning, shot-stopping fundamentals, distribution, and dealing with crosses. Sessions are 45–60 minutes at Vaughan Soccer Centre turf fields. $60/session or $200 for a 4-session block. Limited spots available.',
      classified_type: 'coaching',
      creator: james._id,
      price: 60,
      location: 'Vaughan, Ontario',
      contact_email: 'jamesw@test.com',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── OTHER ────────────────────────────────────────────────────────────────
    {
      title: 'Looking for Pickup Game Partners – Weekday Mornings',
      description: "I play casual pickup 3–4 days a week (Mon/Wed/Fri mornings, roughly 7–9 AM) at Eglinton Flats and I'm always looking for more players to join. No commitment, just show up when you can. All positions and skill levels welcome — we usually get 8–12 players. Message me to be added to the WhatsApp group.",
      classified_type: 'other',
      creator: marcus._id,
      location: 'Etobicoke, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },
    {
      title: 'Soccer Carpool – Mississauga to Vaughan (Saturday AM)',
      description: "Looking for 1–2 people who need a ride from central Mississauga to Vaughan Soccer Centre on Saturday mornings. I leave around 7:45 AM and return around 12:30 PM. Happy to split gas. Good way to meet teammates too — I play for the Vaughan Wolves.",
      classified_type: 'other',
      creator: sofia._id,
      location: 'Mississauga, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'approved',
      status: 'active'
    },

    // ── PENDING (admin approval queue) ──────────────────────────────────────
    {
      title: 'Adidas X Speedportal Boots – Size 9.5 (Pending Review)',
      description: 'Lightly used Adidas X Speedportal.1 FG boots in solar red/yellow colourway. Size 9.5. Worn for half a season, studs in great shape. Selling because I moved to turf exclusively. Asking $120.',
      classified_type: 'equipment_sale',
      creator: soroush._id,
      price: 120,
      condition: 'good',
      location: 'North York, Ontario',
      images: [DEFAULT_CLASSIFIED_IMAGE],
      approval_status: 'pending',
      status: 'active'
    }
  ];

  return Classified.insertMany(classifieds);
};

// Main seed function
const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Clear all collections
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Event.deleteMany({}),
      Classified.deleteMany({}),
      Field.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({})
    ]);
    console.log('Cleared all collections\n');

    // Seed fields
    console.log('Seeding fields...');
    const fields = await Field.insertMany(gtaFields);
    console.log(`✓ Created ${fields.length} fields\n`);

    // Seed users
    console.log('Seeding users...');
    const users = await createUsers();
    console.log(`✓ Created ${users.length} users`);
    console.log('  - soroush (YOUR TEST USER - has nothing assigned)');
    console.log('  - admin (platform admin)');
    console.log('  - Other users have teams and events\n');

    // Seed teams
    console.log('Seeding teams...');
    const teams = await createTeams(users);
    console.log(`✓ Created ${teams.length} teams`);
    console.log('  - 3 approved teams');
    console.log('  - 1 pending team (for admin testing)\n');

    // Seed events
    console.log('Seeding events...');
    const events = await createEvents(users, fields);
    console.log(`✓ Created ${events.length} events`);
    console.log('  - 4 approved events');
    console.log('  - 1 pending event (for admin testing)\n');

    // Seed classifieds
    console.log('Seeding classifieds...');
    const classifieds = await createClassifieds(users);
    console.log(`✓ Created ${classifieds.length} classifieds\n`);

    console.log('='.repeat(50));
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\nTest accounts:');
    console.log('  Email: soroush.salari2023@gmail.com | Password: mYTR6RHmXd@WNmz (empty user)');
    console.log('  Email: admin@soccerconnect.com | Password: password123 (admin)');
    console.log('  Email: marcus@test.com | Password: password123 (has team + events)');
    console.log('\nNote: soroush user has NO team and NO events - perfect for testing empty states!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };
