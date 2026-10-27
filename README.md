# M.J.CO website

## GitHub Pages customer preview

The Pages workflow exports public HTML with published project cards, photos, the journal, SEO and appearance settings. Run `node backend/import-facebook.js`, `node backend/apply-seo.js`, then `npm run build:static` to build the public files in `dist`. The workflow deploys only `dist`, excluding private data, backend source and admin tools. GitHub Pages shows an explanation at Website Admin; the functioning CMS requires Node hosting. The canonical public URL is `https://mjcogroup.com/`; set `SITE_URL` when building for a different public URL. Configure `mjcogroup.com` in the repository's Pages settings and point the domain's DNS records to GitHub Pages before publishing. Customer changes made on a hosted backend require a new export to update the static preview.

Run `npm ci`, then `npm start`. Open http://127.0.0.1:5500/admin for the dashboard.

The dashboard includes server page-request totals, top pages and referring domains (30 days), per-page SEO and social metadata, blog/vlog drafts and publishing, and site colors, body font and corner radius. The Pages & Images editor manages page sections, their order, text formatting, bullet lists and uploaded images. Published posts appear at `/journal`.

Management settings and posts are stored in `backend/data/management.json`; traffic aggregates are stored in `backend/data/traffic.json` and flushed every five seconds. Page content is stored in `backend/data/pages.json`; uploaded media is in `backend/uploads`. Back up these files and directories. Use persistent disk storage when deploying. Runtime management and traffic files are excluded from Git.

The default server binds to `127.0.0.1` for local preview. All admin pages and content-management APIs require sign-in, including local access. Run `npm run setup-admin` once to generate a strong password. Login details are saved in the Git-ignored `admin-access.txt`; save the password in your password manager, then remove that file. Only a salted scrypt hash is stored in the Git-ignored `backend/data/admin-auth.json`. Back up this hash file to preserve access. Running setup again keeps existing credentials.

If no password is configured, administration stays locked. You can alternatively configure `ADMIN_PASSWORD` in the hosting environment; it takes precedence over the local hash. Set `HOST` and `PORT` as needed for hosting. Use HTTPS through the hosting provider. Sessions last eight hours, expire on server restart and can be ended with Sign out. Five failed sign-ins from one address trigger a 15-minute wait. This is a single-administrator, file-backed CMS; use a database for multi-instance hosting.

Traffic totals measure page requests, including bots and repeat visits, rather than unique people. Dates use UTC; no IP addresses, visitor cookies or personal identifiers are recorded. SEO changes are emitted in server-rendered HTML; recrawling and search ranking are controlled by search engines.

Run `node --test backend/management.test.js` to check management persistence, publishing, metadata, appearance, analytics and access restrictions using temporary data.

## Facebook project content

The home page opens with a full-screen video showcase and company introduction. Published video posts marked Home + Projects + Blog / Vlog form its playlist. Slides rotate every 15 seconds, with previous, next and pause controls. Reduced-motion preferences show a still photo until Play is chosen; playback stops when the hero is off-screen or the tab is hidden. Background playback requests muted autoplay from Facebook, but Facebook and browser restrictions can still require user interaction. Original MP4 assets are recommended for reliable seamless background video. The hero's text is editable in Pages & content lists → Home → Full-screen video introduction. Keep its HERO_SLIDES comment marker to populate the playlist.

Six supplied Facebook links were reviewed on October 20, 2026. The source links, verified observations and editorial summaries are recorded in `backend/data/facebook-import.json`. Run `node backend/import-facebook.js` once to add them to the CMS. The import keeps an import marker so later customer edits and deletions are not undone by running it again.

In the dashboard's Blog / Vlog section, customers can search entries, filter drafts or Facebook content, edit descriptions and supported media links, publish or hide entries, delete entries, and choose their display location. Featured entries appear on Home (first three), Projects and Blog / Vlog; project entries appear on Projects and Blog / Vlog; other entries appear only on Blog / Vlog. Drafts are excluded from all public views. Source observations are retained as private editorial notes.

Public media loads only when a visitor clicks its load button. Facebook controls availability and embedding, and some visitors may need to open Facebook or sign in. Original source links remain available. Videos have not been downloaded or rehosted. Dates are shown only when verified from the original post; import dates are not presented as original publication dates. Source posts list differing telephone numbers, which were recorded in editorial notes without replacing the website's existing contact details.

Each imported post also has a local cover photo from its original Facebook video preview, stored in `assets/images/projects`. Cover photos appear on the home, project and journal cards without needing to load Facebook. The featured section is placed before the home page's Why Choose section. Customers can upload a replacement cover, provide an image URL and edit its description from the post editor. Clear the cover URL and save to remove a cover.
