# Ashley Lyons — Singer-Songwriter Website

An elaborate, fully-featured static website for a nature-themed folk artist.
No build step, no framework — plain HTML, CSS, and vanilla JavaScript.

## Structure

```
ashleylyons/
├── index.html          # Single-page site (all sections)
├── 404.html            # Themed not-found page
├── robots.txt          # Crawl rules
├── sitemap.xml         # SEO sitemap
├── _headers            # Cloudflare Pages caching + security headers
├── css/styles.css      # Design system + components + responsive
├── js/main.js          # Player, lightbox, data renderers, forms, animations
└── assets/             # Favicon + Open Graph image (SVG)
```

## Sections
Hero · About · Music (audio player + discography) · Tour dates · Video · Gallery (lightbox) · Store · Newsletter · Footer/contact.

## Features
- Nature palette (forest, moss, sage, bark, cream, gold) with Cormorant Garamond + Jost
- Layered SVG hero landscape with scroll parallax
- Functional audio player (synthesized tones via Web Audio API — swap in real `<audio>` later)
- Gallery lightbox with keyboard navigation (arrows / Esc)
- Scroll-reveal animations via IntersectionObserver
- Data-driven tour / gallery / store (edit the arrays at the top of `js/main.js`)
- Accessible: skip link, ARIA, focus states, `prefers-reduced-motion` support
- Fully responsive (mobile nav drawer, fluid type)

## Run locally
Just open `index.html`, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy — Cloudflare Pages
Since the domain is already on Cloudflare, this is the smoothest path.

**Option A — Git integration (recommended)**
1. Push this folder to a GitHub/GitLab repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select the repo. Build settings:
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `/`
4. Deploy. Every push to the main branch redeploys automatically.
5. Custom domains → add your domain (DNS is auto-configured since it's already on Cloudflare).

**Option B — Direct upload / Wrangler**
```bash
npm install -g wrangler
wrangler pages deploy . --project-name=ashley-lyons
```

## Replace placeholders before launch
- Domain `ashleylyons.net` in `index.html` (OG tags), `robots.txt`, `sitemap.xml`
- Video embed URL in `js/main.js` (`videoEmbed.src`)
- Streaming / social links (currently `#`)
- Real audio: replace the Web Audio tone generator with `<audio>` elements + file URLs
- Photography: the gradient placeholders can be swapped for real images
- Newsletter: wire the form submit to your email provider (Mailchimp, Buttondown, etc.)
- Store: link out to Bandcamp/Shopify or wire a real cart
