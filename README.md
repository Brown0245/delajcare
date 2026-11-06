# Dela J Care Solutions — website

A fast, mobile-friendly website for **delajcare.ca**, hosted on Cloudflare Workers.
The contact form emails every enquiry straight to the business inbox using Cloudflare's own email service, so there's no third-party form tool and no monthly fee.

```
public/          The website (HTML, CSS, JS, illustrations)
  index.html     Home page
  careers.html   Careers page with job application form (resume upload)
  privacy.html   Privacy policy (fill in the [BRACKETS])
  404.html       "Page not found" page
  _headers       Security headers
src/index.js     Form handlers: /api/contact (enquiries) and /api/apply (job applications)
wrangler.jsonc   Cloudflare settings
```

---

## 1. Set up email in Cloudflare (once)

In the Cloudflare dashboard, open **delajcare.ca → Email**.

1. **Turn on Email Routing.** Cloudflare adds the DNS records for you.
2. **Add a destination address.** Enter the inbox where enquiries should land (for example the owner's Gmail). Click the verification link Cloudflare emails to that inbox.
3. **Create custom addresses `info@delajcare.ca` and `careers@delajcare.ca`** that forward to the same inbox. These are the addresses shown on the website.
4. **Enable sending for the domain** (Email Service). The website sends from `website@delajcare.ca`, so the domain has to be set up for sending. Follow the prompts to add the DNS records.

> Sending to a verified destination address in your own account is free.

## 2. Deploy

The site is already set to answer on `delajcare.ca` and `www.delajcare.ca` (see `routes` in `wrangler.jsonc`).

### Option A: automatic deploys from GitHub (recommended)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Connect GitHub and choose **Brown0245/delajcare**. Keep the default build settings (deploy command `npx wrangler deploy`).
3. After the first deploy, open the Worker → **Settings → Variables and Secrets** and add a **Secret** named `TO_EMAIL` with the inbox for enquiries (see step 3 below).

From then on, every push to `main` on GitHub updates the live site automatically.

### Option B: deploy from your computer

You need Node.js 20 or later.

```bash
npm install
npx wrangler login      # opens a browser to sign in to Cloudflare
npx wrangler deploy
```

The site is live at https://delajcare.ca within a few minutes.
To preview on your own computer first: `npx wrangler dev`, then open http://localhost:8787.

## 3. Set the private inbox address

The inbox address is kept out of this public repo. Set it once:

```bash
npx wrangler secret put TO_EMAIL
# paste the verified inbox, e.g. owner@gmail.com
```

(or add it as a Secret in the dashboard, as in Option A).

Job applications go to `TO_EMAIL` too, with the applicant's resume attached. To send them somewhere else, also set `CAREERS_EMAIL` the same way.

To preview on your own computer first: `npx wrangler dev`, then open http://localhost:8787.

## 4. Optional: stronger spam protection (Turnstile)

The form already blocks most bots (hidden trap field plus a timing check). If spam ever gets through:

1. Dashboard → **Turnstile** → Add site → `delajcare.ca`. You get a **site key** and a **secret key**.
2. In `public/index.html`, replace `TURNSTILE_SITE_KEY` with the site key.
3. Run `npx wrangler secret put TURNSTILE_SECRET` and paste the secret key.
4. `npx wrangler deploy`.

---

## Before launch: fill these in

| Where | What |
|---|---|
| `public/index.html` FAQ | `[MINIMUM]` visit hours, `[TIMEFRAME]` for how fast care can start |
| `public/privacy.html` | `[DATE]`, Privacy Officer `[NAME]`, retention period |
| `public/careers.html` | `[X]` business days to hear back; confirm the four "Why Dela J" promises and the role requirements |
| Whole site | Confirm the service-area towns, the "Specialized support" list, 24/7 availability, and "topping up public care" are all true |
| Founder video | The play button currently scrolls to the contact form. Replace it with a real video when one is recorded |

## Testing the form after deploy

Submit the form on the live site with your own details. The email should arrive in the `TO_EMAIL` inbox within a minute.
If it doesn't, run `npx wrangler tail` while submitting to see the error. The most common cause is the sending domain or destination address not being verified yet (step 1).
