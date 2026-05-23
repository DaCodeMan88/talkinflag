-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events (worldwide flag football calendar)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  city TEXT,
  country TEXT,
  country_code CHAR(2),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  level TEXT CHECK (level IN ('youth', 'high_school', 'college', 'pro', 'national', 'international', 'olympics')),
  event_type TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players database
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT CHECK (position IN ('QB', 'WR', 'DB', 'LB', 'C', 'Rusher', 'Utility')),
  level TEXT CHECK (level IN ('youth', 'high_school', 'college', 'national', 'pro')),
  school_or_team TEXT,
  grad_year INTEGER,
  city TEXT,
  state TEXT,
  country TEXT,
  country_code CHAR(2),
  height_in INTEGER,
  weight_lbs INTEGER,
  stats JSONB DEFAULT '{}',
  highlight_url TEXT,
  instagram TEXT,
  ranking_national INTEGER,
  ranking_position INTEGER,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_level ON players(level);
CREATE INDEX IF NOT EXISTS idx_players_country ON players(country_code);
CREATE INDEX IF NOT EXISTS idx_players_ranking ON players(ranking_national);

-- Guest directory
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  episode_numbers INTEGER[],
  country TEXT,
  country_code CHAR(2),
  bio TEXT,
  website_url TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches/scouts (for recruiting portal)
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  school_or_org TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
