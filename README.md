# LiveWire Intelligence Solutions — AI Website Audit Tool

A live landing page + working audit tool. It fetches a visitor's real website and
scores it on 12 genuine technical/AI-readiness signals, then captures the lead.

Everything here runs on **Netlify's free tier**. No coding required to launch.

---

## What's in this folder

```
livewire-audit/
├── index.html                  ← your landing page (branding lives here)
├── netlify.toml                ← config (don't touch)
└── netlify/functions/audit.js  ← the engine that does the real scan
```

---

## Deploy in ~15 minutes (no command line)

### 1. Make a free Netlify account
Go to https://app.netlify.com/signup — sign up with email or GitHub.

### 2. Drag-and-drop deploy
1. In Netlify, click **Add new site → Deploy manually**.
2. Drag this entire `livewire-audit` folder onto the upload area.
3. Wait ~60 seconds. Netlify gives you a live URL like
   `https://random-name-12345.netlify.app`.
4. Open it. Type any website into the audit box and hit **Run free audit** —
   you'll see a real score. That's your product, live.

> The drag-and-drop method auto-detects the function in `netlify/functions/`.
> If the audit button spins forever, redeploy and make sure you dragged the
> whole folder (not just index.html).

---

## Connect your domain (recommended — see note below)

1. Buy a domain (e.g. `livewireintel.com` or `liveiq.io`).
2. In Netlify: **Domain settings → Add a custom domain** → enter it.
3. Follow Netlify's DNS instructions (it walks you through it).
4. Netlify issues a free SSL certificate automatically.

---

## Make the lead form actually email you (5 min)

Right now the form points at a placeholder. Pick ONE option:

### Easiest: Formspree (free for 50 submissions/mo)
1. Sign up at https://formspree.io → create a form → copy your form ID
   (looks like `xyzabcde`).
2. In `index.html`, find `YOUR_FORM_ID` and replace it with your ID.
3. Re-upload the folder to Netlify. Done — leads now hit your inbox.

### Alternative: Netlify Forms (built in, no third party)
Ask me and I'll switch the form over to Netlify's native handler — then
submissions appear in your Netlify dashboard with email notifications.

### Power option: Zapier → Postiz / CRM
Point the form at a Zapier webhook to auto-route leads into your existing
Postiz / email follow-up flow.

---

## Customizing your branding

Open `index.html` and edit:
- `--red:#c8102e;` near the top → change to your brand color.
- The email `hello@yourdomain.com` (appears twice).
- Pricing numbers in the "Pricing" section.
- Headline copy in the `.hero` block.

---

## What the audit actually checks (so you can defend it to clients)

| Signal | Weight | Why it matters |
|---|---|---|
| JSON-LD schema markup | 22 | Real, Google-supported. Biggest AI-readability lever. |
| HTTPS | 10 | Trust + ranking baseline. |
| Title tag length | 10 | Core on-page SEO. |
| Meta description | 10 | Drives click-through + AI snippets. |
| Single H1 | 8 | Semantic structure. |
| Mobile viewport | 8 | Mobile-first indexing. |
| Canonical tag | 6 | Prevents duplicate-content issues. |
| Open Graph tags | 6 | Social + AI preview accuracy. |
| Image alt coverage | 6 | Accessibility + image understanding. |
| XML sitemap | 6 | Crawl coverage. |
| robots.txt | 4 | Crawl control. |
| llms.txt | 2 | Emerging, low weight — see honesty note. |

### Honesty note on llms.txt
As of 2026, no major AI company has committed to reading llms.txt, adoption is
~10%, and Google has said it's not a ranking signal. We score it at only 2/100
and frame it to clients as cheap future-proofing — never as a traffic driver.
Don't oversell it.

---

## Cost summary
- Netlify hosting: **$0** (free tier covers a small business easily)
- Domain: ~**$12–20/year**
- Formspree: **$0** to start
- **Total to launch: the price of a domain.**
