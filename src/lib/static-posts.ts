/**
 * Static blog posts — displayed on /blog when Sanity CMS has no published content.
 * Once Ambra & Tika start publishing via Sanity Studio, these will be replaced
 * by the real posts from the CMS.
 *
 * To write posts in Sanity Studio, go to https://sanity.io/manage → talkinflag project.
 */

export interface StaticPost {
  slug: string;
  title: string;
  author: string;
  publishedAt: string; // ISO date string
  category: string;
  excerpt: string;
  body: string; // Plain text / simple markdown-like paragraphs
  isStatic: true;
}

export const staticPosts: StaticPost[] = [
  {
    slug: "flag-football-la-2028-olympics",
    title: "Flag Football Is Going to the Olympics. Here's Why It Matters.",
    author: "Talkin Flag",
    publishedAt: "2026-05-01T00:00:00Z",
    category: "International",
    excerpt:
      "When the International Olympic Committee officially added flag football to the LA 2028 program, it wasn't just a scheduling decision — it was a cultural moment. We break down what it means for the sport.",
    body: `When the International Olympic Committee officially added flag football to the LA 2028 Summer Games program, it wasn't just a scheduling decision — it was a cultural moment decades in the making.

Flag football has been played competitively since the 1940s. It grew quietly at military bases, youth recreation leagues, and eventually high school programs across the United States before finding passionate communities on every continent. The road to Los Angeles 2028 was built by thousands of athletes, coaches, and administrators who believed the sport deserved a global stage.

Now it has one.

What makes this moment especially significant is the timing. The 2028 Olympics will be held in Los Angeles — a city synonymous with NFL culture, entertainment, and the intersection of sport and spectacle. For a sport that sits exactly at that intersection, LA is the perfect debut.

The format for the Olympic tournament is still being finalized, but what we know is this: it will be fast, it will be unpredictable, and it will introduce flag football to a television audience that numbers in the billions. For every kid who has never thrown a spiral, seeing elite athletes compete on the Olympic stage will be the moment that changes everything.

For the women's game, the impact could be transformative. Women's flag football has grown faster than almost any other sport in the past decade — fueled by NFL FLAG programs, collegiate championships, and a generation of athletes who grew up with the game. The Olympics gives that growth a finish line to aim for and a story to tell.

Here at Talkin Flag, we've been fortunate to speak with athletes, coaches, and administrators who are building this sport from the ground up. From Italy to Sri Lanka, from Puerto Rico to Nigeria — the Talkin Flag community spans every time zone. The Olympics brings all of those communities into a single moment.

The countdown to LA 2028 has started. And we'll be covering every step of the journey.`,
    isStatic: true,
  },
  {
    slug: "womens-flag-football-rise",
    title: "The Fastest Growing Sport in the World Is Women's Flag Football",
    author: "Talkin Flag",
    publishedAt: "2026-04-15T00:00:00Z",
    category: "Women's Flag",
    excerpt:
      "Participation numbers are exploding. College programs are emerging. And the best players in the world are getting the recognition they've always deserved. The women's flag football revolution is real.",
    body: `The numbers don't lie. Women's flag football participation has grown by triple digits in the past five years across the United States, and the trend is even more dramatic internationally.

In 2018, a handful of high schools in California offered girls flag football as a varsity sport. By 2026, more than 40 states have organized girls flag football programs, with college programs following closely behind. The sport is no longer a niche — it's the fastest-growing women's team sport in America.

The reasons are both structural and cultural.

Structurally, flag football has almost no barrier to entry. You don't need expensive equipment. You don't need a perfectly maintained field. You need a ball, some flags, and enough space to run routes. This democratizing accessibility has made flag football the sport of choice for school districts, communities, and countries that want to give women a pathway into American football without the cost or contact.

Culturally, a generation of women who grew up watching the NFL have been waiting for a version of the sport that was built for them. The NFL's investment in FLAG programs — including formal college scholarship pipelines — has created a conveyor belt from youth leagues to organized competition.

Internationally, the story is equally exciting. National teams from Italy, Mexico, Brazil, Canada, and dozens of other countries are competing at IFAF World Championships at levels that would have seemed impossible a decade ago. Italy's women's national team — whose members include people close to the Talkin Flag family — has been among the most competitive programs in Europe.

On this podcast, we've spoken with QBs who are redefining what a field general looks like, wide receivers who make defenders look silly, and coaches who are building programs from scratch in countries where American football was barely known five years ago. Every conversation reinforces the same truth: the talent in women's flag football has always been there. The world is finally paying attention.

The question isn't whether women's flag football will reach the mainstream. It already has. The question is how high it goes from here.`,
    isStatic: true,
  },
  {
    slug: "italy-flag-football-global-force",
    title: "How Italy Became One of the Most Feared Flag Football Nations on Earth",
    author: "Ambra Marcucci",
    publishedAt: "2026-03-22T00:00:00Z",
    category: "International",
    excerpt:
      "Italy's rise in flag football is no accident. It's the product of elite coaching, a fiercely competitive national program, and a generation of athletes who decided to be the best in the world at something America thought it owned.",
    body: `Italy has never been a country that does things quietly. Whether it's architecture, cuisine, design, or football — yes, football — Italians approach mastery with a particular intensity. Flag football is no different.

When I first joined the Italian National Flag Football Team, I knew I was stepping into something serious. The coaching staff studied film with the obsessiveness of a Serie A manager. The athletes trained year-round across multiple regions, coming together for national camp sessions that felt closer to professional football preparation than recreational sport. There was nothing casual about it.

And the results reflected that commitment.

Italy's women's national team has competed at IFAF World Championships and emerged as one of Europe's most consistent performers. The national program has developed a pipeline of athletes who play at the highest international level — not because flag football fell into Italy's lap, but because Italian athletes and coaches decided to build something world-class.

What makes Italy's approach distinctive is its fusion of tactical intelligence and physical athleticism. Italian football programs across all levels emphasize scheme and spacing over pure athleticism. The result is a flag football culture that can scheme against any opponent, adapt in real time, and execute at the highest level of pressure.

My sister Tika and I have been products of this environment. Growing up in this program, training alongside athletes who treat international competition as the most important thing they do — it shapes you. It makes you better than you could become alone.

For those who haven't paid attention to international flag football: start now. The countries building programs from scratch — Italy, Mexico, Germany, Japan, Canada, Brazil — are closing the gap with the United States faster than anyone expected. The Olympic era will prove it once and for all.

Italy isn't coming. Italy is already here.`,
    isStatic: true,
  },
  {
    slug: "flag-football-recruiting-guide-2026",
    title: "How to Get Recruited in Flag Football: The Complete 2026 Guide",
    author: "Talkin Flag",
    publishedAt: "2026-02-10T00:00:00Z",
    category: "Recruiting",
    excerpt:
      "The flag football recruiting landscape is changing fast. With the Olympics on the horizon and college programs multiplying, here's exactly what coaches look for — and how to get in front of them.",
    body: `Flag football recruiting is no longer a rumor or a distant possibility. It is happening right now — at the college level, at the national team level, and increasingly at the professional level. If you're a serious flag football player in 2026 and you're not thinking about how to get in front of coaches, you are already behind.

Here's everything you need to know.

**Build a highlight reel — and make it short**

The first thing any serious recruiter will ask you for is footage. Not a two-hour compilation of every play you've ever made. A focused, three-to-five minute highlight reel that shows your specific skill set within the first thirty seconds.

If you're a QB, leads with your arm talent and decision-making. If you're a route runner, leads with releases, separations, and catches in traffic. If you play defense, leads with your best coverage reps and any pick sixes or big plays.

Upload it to YouTube (unlisted is fine) and have the link ready everywhere — your player profile, your email, your DMs. The coach who can't find your film in thirty seconds will move on to someone else.

**Create a player profile online**

The Talkin Flag player database is one of the places college coaches and national team selectors are increasingly checking when they want to find flag football talent. Submit your profile with accurate position, level, school or club, and your highlight reel link.

Think of it as your flag football resume. It doesn't get you recruited on its own — but it keeps you discoverable when a coach is looking for exactly your position at exactly your level.

**Attend the right tournaments**

Coaches recruit heavily at high-visibility events. The NFL FLAG national championships. IFAF-sanctioned international tournaments. College showcase events that have emerged specifically to surface talent for programs.

If you're serious about getting recruited at the college level, you need to be competing at tournaments where college coaches show up. Research which events in your region have a track record of player development and coach attendance.

**Reach out directly — it works**

Email coaches directly. This sounds obvious but most players don't do it. Find the contact for flag football coaches at schools you're interested in, write a three-sentence email with your highlights link and key stats, and send it. Follow up once if you don't hear back.

At the national team level, find out who manages the selection process for your country's program. Attend national camps. Introduce yourself to staff. Be the player who is impossible to overlook because you made sure they knew you existed.

**The Olympic pipeline is real**

With flag football officially at LA 2028, national programs around the world are actively building rosters and talent pipelines. This is the single biggest recruiting opportunity the sport has ever seen. Athletes who would have had no pathway to elite competition two years ago now have a direct route to representing their country on the Olympic stage.

The window is open. The question is whether you're prepared to walk through it.`,
    isStatic: true,
  },
  {
    slug: "mental-performance-flag-football",
    title: "The Mental Game: How Elite Flag Football Players Train Their Minds",
    author: "Talkin Flag",
    publishedAt: "2026-01-18T00:00:00Z",
    category: "Mental Performance",
    excerpt:
      "The difference between a good flag football player and a great one often comes down to what happens between the ears. We've interviewed sport psychologists, Olympic-level coaches, and elite athletes — here's what they all agree on.",
    body: `In almost every conversation we've had on Talkin Flag, the topic of mental performance comes up. Not always by name — sometimes it's disguised as "game IQ," "staying locked in," or "handling pressure" — but the underlying subject is always the same. The mental game is real, it's trainable, and most flag football players aren't training it.

Here's what elite athletes and coaches have taught us.

**Pressure is a skill, not a condition**

The athletes who perform best at international tournaments, national championships, and Olympic qualifiers don't feel less pressure than everyone else. They've simply learned to interpret pressure as a signal of importance rather than a threat. When the stakes go up, their focus sharpens rather than scatters.

This mental shift — from threat response to challenge response — is the foundation of elite performance psychology. It can be trained. It starts with awareness: noticing when you shift into threat mode, catching it, and consciously reframing the moment. The more you practice this, the faster it becomes automatic.

**Routine is protection**

Elite players build pre-snap, pre-play, and pre-game routines not because routines are comforting — but because routines narrow attention and eliminate distractions at the exact moment when distractions are most dangerous.

Watch any elite quarterback before a snap. There is something happening in those two or three seconds before the ball moves. They're not guessing. They're resetting to a reliable internal state. That state is rehearsed. It doesn't happen accidentally.

Your pre-play routine doesn't need to look like anyone else's. It needs to reliably bring you to your sharpest mental state. Build it, refine it, and protect it.

**Film study is mental training**

Most players think of film study as technical work — identifying tendencies, recognizing formations, understanding what the opponent does. That's true. But film study is also one of the most powerful mental performance tools available, because it trains anticipation.

When you've seen a coverage rotation a hundred times on film, your brain processes it faster in a real game. Decision-making speed — which feels like instinct — is actually pattern recognition built through deliberate study. The athletes who seem to play one step ahead are usually the ones who studied one step ahead.

**The reset is more important than the play**

Every player makes mistakes. The separating factor between average and elite isn't the frequency of mistakes — it's the recovery time. Elite players develop a mental reset that wipes the last play and restores focus in seconds. Mediocre players carry bad plays forward, which turns one mistake into three.

The reset can be a breath, a word, a physical gesture — anything that reliably signals to your nervous system that the last play is over and the next one is beginning. Practice it in training so it's available to you when it counts.

**Talk to someone who specializes in this**

The most consistent thing we've heard from elite flag football athletes across every country and level is simple: at some point, they stopped trying to figure out the mental game alone. They worked with a sports psychologist, a performance coach, or a mentor who understood the psychology of competition.

This isn't weakness. It's the same logic that drives every other aspect of athletic development. Nobody tries to self-coach their footwork without feedback. The mental game deserves the same investment.

The players who will represent their countries at LA 2028 won't just be the most physically gifted athletes in the field. They'll be the ones who spent years training every dimension of their performance — including the one that happens between the ears.`,
    isStatic: true,
  },
  {
    slug: "flag-football-positions-guide",
    title: "Flag Football Positions Explained: Roles, Skills, and What Coaches Look For",
    author: "Talkin Flag",
    publishedAt: "2025-12-05T00:00:00Z",
    category: "Coaching",
    excerpt:
      "Whether you're a player figuring out your best fit or a coach building a roster, understanding what each position demands changes everything. Here's the complete breakdown of every flag football position.",
    body: `Flag football may look simpler than tackle on the surface, but the positional demands are every bit as specific — and in some ways, more demanding. Without pads and blocking schemes to hide mismatches, every position on the field requires a precise skill set. Understanding what each role demands is the foundation of every successful flag football player and coaching staff.

**Quarterback (QB)**

The quarterback is the most scrutinized position in flag football, and for good reason. The QB is responsible for reading defenses pre-snap, making the right decision with the ball under pressure, and executing with accuracy — all without a pocket or an offensive line to protect them.

Elite QBs at the national and international level share several traits: exceptional field vision, the ability to process coverage quickly, arm talent across all distances, and composure when the defense brings pressure. At the youth and high school level, a QB's mobility matters enormously. At the elite level, processing speed is what separates good from great.

**Wide Receiver (WR)**

The WR is the most physically explosive position in flag football. Great receivers combine route precision, release quickness at the line, and the ability to make contested catches. Unlike tackle football, flag football WRs rarely have the benefit of physical separation — they must create it through footwork, leverage, and timing.

At the elite level, WRs who can run every route in the tree — not just vertical — are the most valuable. The ability to win from the slot versus the boundary, to adjust to off-timing throws, and to break tackles (in a flag context, to extend plays) are all separating factors.

**Center (C)**

The center is the quarterback's primary receiver and the engine of the short passing game. In flag football, the center snaps the ball and immediately becomes an eligible receiver. Elite centers are precise route runners with excellent hands and the quickness to get open in tight windows underneath.

At the national level, the center position has become increasingly specialized. The timing between QB and center — both on the snap and in the receiving game — is one of the most rehearsed aspects of elite flag offense.

**Rusher**

The rusher is unique to flag football: a pass rusher who attacks the QB after a designated wait or snap count. Great rushers combine first-step quickness, hand technique to defeat blockers, and the closing speed to finish plays. On defense, the rusher often doubles as a linebacker in coverage when not rushing.

For athletes transitioning from tackle football, the rusher position is often where defensive linemen and linebackers find their flag football home. The combination of physicality and anticipation required makes it one of the most technical defensive positions in the sport.

**Defensive Back (DB)**

Defensive backs in flag football face one of the most demanding jobs in sports: covering elite wide receivers with no physical contact allowed, in a pure man-coverage environment. DBs must combine anticipation, hip fluidity, and closing speed with the ability to pull flags in the open field.

At the international level, DB play is where games are won and lost. The ability to trail elite receivers without giving up separation requires elite athleticism and, just as importantly, advanced technique. The best DBs study route trees obsessively — knowing what an offense wants to do is as valuable as the physical tools to stop it.

**Linebacker (LB)**

The linebacker reads offenses, drops into zone coverage, and attacks the line of scrimmage as needed. In flag football, the LB is often the defensive quarterback — responsible for calling coverages, disguising looks, and communicating assignments.

Great LBs combine football IQ with physical tools. The ability to read a screen pass, sink into a hook zone, and still attack the QB when the rusher fails are all in the LB's job description. At elite levels, the linebacker is frequently the smartest defensive player on the field.

**Building Your Roster**

The best flag football teams are built around positional depth, not just stars. A great QB means nothing if there are no WRs who can separate. A dominant rusher is less impactful without DBs who can hold coverage long enough for the rush to arrive.

When evaluating players for each position, start with the specific demands of that role — not just overall athleticism. A player who is a good overall athlete but struggles to process the game quickly will never be an elite QB. A receiver who can't separate at the top of routes will never be a weapon at the national level.

For a database of verified, ranked flag football players at every position, visit the Talkin Flag player rankings.`,
    isStatic: true,
  },
  {
    slug: "flag-football-drills-for-all-levels",
    title: "The Best Flag Football Drills for Every Level of the Game",
    author: "Talkin Flag",
    publishedAt: "2025-11-12T00:00:00Z",
    category: "Coaching",
    excerpt:
      "Whether you're coaching a youth league or preparing for international competition, these drills will develop the route running, coverage, and quarterback skills that win games.",
    body: `Great flag football players aren't born — they're built on repetition. The drills you run in practice are the foundation of everything that happens on game day. Whether you're a first-year youth coach or preparing a team for national championship competition, these drills will develop the skills that matter most.

Here's a breakdown of the most effective drills at every level.

**QB Mechanics: The Towel Drill**

This drill is as simple as it is effective. Place a towel flat on the ground about five yards in front of the quarterback. Have the QB take a snap, drop back two steps, and throw to land the ball directly on the towel. The goal is to develop accuracy, release point consistency, and touch on short-to-intermediate throws.

Advanced version: move the towel to different spots — left hash, right hash, middle — and call the target just before the snap. This forces the QB to work through progressions rather than locking on to a single receiver.

**Route Running: The Release and Stem**

This is the most underrated skill in flag football, and the one that separates good receivers from great ones. Set up two cones: one at the line of scrimmage and one five yards upfield. The receiver's job is to sprint through both cones with a hard, low shoulder fake at the first cone before breaking to their route at the second.

Do this at game speed. Do it a hundred times. The ability to create separation at the release point — before the cornerback has time to recover — is what makes elite WRs dangerous.

**Coverage: The Mirror Drill**

Pair up a defensive back and a receiver. No ball. The DB's job is to shadow the receiver for five seconds, staying within arm's reach without letting the receiver create separation. The receiver can run any combination of cuts, fakes, and direction changes.

This drill develops the hip flexibility, footwork, and change-of-direction ability that elite DBs rely on. Run it daily in short bursts. You will see the results in games within two weeks.

**Team: The Half-Field Scrimmage**

Full scrimmages are useful. But half-field scrimmages — offense against defense on one half of the field only — create more repetitions in less time and force both sides to deal with tighter spacing.

The offense is forced to throw quickly and use the entire route tree. The defense is forced to communicate coverage assignments in compressed situations. The half-field format eliminates dead time between plays and builds the intensity level that translates to games.

Run it with a shot clock (8 seconds) for the offense. Every second the QB holds the ball builds pressure that mirrors what happens in real game situations.

**1-on-1 Flag Pull Technique**

Flag pulling is the most neglected fundamentals area in flag football, and it costs games. Set up a straight line with cones. Have one defender sprint toward one ball carrier running a straight route and practice approaching to remove the flag at the hips — not reaching, not diving, but staying in control and stripping the flag cleanly.

Defenders who lunge lose contain. Defenders who stay disciplined, stay low, and approach under control win the flag pull almost every time. This drill should be part of every practice at every level.

**Advanced: Blitz Pickup and Quick Release**

For teams preparing for competitive and international play, the blitz pickup drill is essential. Set up a defense with a rusher who engages a single blocker. The blocker's job is to create a two-count window for the QB to release the ball to a predetermined hot route.

The QB must identify the blitz pre-snap, signal the hot route, take the snap, and throw immediately on the two-count. Run this drill until the QB-blocker communication and the hot route timing are automatic. At elite levels, this sequence happens in under two seconds.

**The Mindset Behind Drill Work**

Every drill listed here has one thing in common: they're designed to build habits that perform under pressure. The goal isn't to look good in practice. The goal is to automate the skill so it's available when the stakes are highest.

Run these drills at game speed. Compete every rep. And remember — the teams that win at the national and international level aren't necessarily the most talented. They're the teams that practiced the right things the most times.

For a database of coaches and players at every level, visit the Talkin Flag player rankings.`,
    isStatic: true,
  },
];

export function getStaticPostBySlug(slug: string): StaticPost | undefined {
  return staticPosts.find((p) => p.slug === slug);
}
