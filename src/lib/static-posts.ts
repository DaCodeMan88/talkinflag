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
];

export function getStaticPostBySlug(slug: string): StaticPost | undefined {
  return staticPosts.find((p) => p.slug === slug);
}
