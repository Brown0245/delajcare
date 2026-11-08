/**
 * Dela J Care Solutions — Cloudflare Worker
 *
 * Serves the static site from /public and handles two form endpoints:
 *   POST /api/contact  – care / staffing enquiries
 *   POST /api/apply    – job applications (optional resume attachment)
 * Both email the business via Cloudflare Email Service (binding "EMAIL").
 *
 * Settings (wrangler.jsonc "vars" or dashboard):
 *   TO_EMAIL         – where enquiries are delivered (verified destination address)
 *   CAREERS_EMAIL    – optional; where job applications go (defaults to TO_EMAIL)
 *   FROM_EMAIL       – sender on your domain, e.g. website@delajcare.ca
 * Optional secret:
 *   TURNSTILE_SECRET – enables Cloudflare Turnstile spam checks
 */

const PHONE = '(647) 575-5277';

const TOPICS = ['Care for a family member', 'Care for myself', 'Staffing for a facility', 'Joining the Dela J team', 'Share a review', 'Something else'];
const ROLES = ['Personal Support Worker (PSW)', 'Registered Practical Nurse (RPN)', 'Registered Nurse (RN)', 'Other'];
const EXPERIENCE = ['New graduate', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'];
const AVAILABILITY = ['Weekdays', 'Evenings', 'Nights', 'Weekends'];
const TRANSPORT = ['Yes, I have a car', 'I have a licence but no car', 'No, I use transit'];

const RESUME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const ROUTES = {
  '/api/contact': { handler: handleContact, maxBytes: 10_000 },
  '/api/apply': { handler: handleApply, maxBytes: 7_500_000 },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = ROUTES[url.pathname];

    if (route) {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      }
      try {
        const pre = await readSubmission(request, env, route.maxBytes);
        if (pre.response) return pre.response;
        return await route.handler(pre.data, env);
      } catch (err) {
        console.error(`Unhandled error on ${url.pathname}:`, err && err.stack ? err.stack : err);
        return json({ ok: false, error: `Something went wrong. Please call us at ${PHONE}.` }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

/* ---------------- Shared request checks ---------------- */

async function readSubmission(request, env, maxBytes) {
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return { response: json({ ok: false, error: 'Invalid request origin.' }, 403) };
  }
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    return { response: json({ ok: false, error: 'Please submit the form from our website.' }, 415) };
  }
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxBytes) {
    return { response: json({ ok: false, error: 'That submission is too large. Resumes must be under 5 MB.' }, 413) };
  }
  const raw = await request.text();
  if (raw.length > maxBytes) {
    return { response: json({ ok: false, error: 'That submission is too large. Resumes must be under 5 MB.' }, 413) };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { response: json({ ok: false, error: 'Invalid form data.' }, 400) };
  }
  if (!data || typeof data !== 'object') {
    return { response: json({ ok: false, error: 'Invalid form data.' }, 400) };
  }

  // Bot traps: hidden honeypot field, or submitted impossibly fast. Pretend success.
  if (clean(data.company) || (typeof data.elapsedMs === 'number' && data.elapsedMs < 2500)) {
    return { response: json({ ok: true }) };
  }

  if (env.TURNSTILE_SECRET) {
    const passed = await verifyTurnstile(env.TURNSTILE_SECRET, data.turnstileToken, request.headers.get('CF-Connecting-IP'));
    if (!passed) {
      return { response: json({ ok: false, error: 'Spam check failed. Please try again, or call us.' }, 400) };
    }
  }

  if (!env.EMAIL || !env.TO_EMAIL || !env.FROM_EMAIL) {
    console.error('Email is not configured: set the EMAIL binding, TO_EMAIL and FROM_EMAIL.');
    return { response: json({ ok: false, error: `Our form is temporarily unavailable. Please call us at ${PHONE}.` }, 503) };
  }

  return { data };
}

/* ---------------- /api/contact ---------------- */

async function handleContact(data, env) {
  const form = {
    name: clean(data.name, 100),
    phone: clean(data.phone, 30),
    email: clean(data.email, 200),
    topic: oneOf(clean(data.topic, 60), TOPICS, 'Something else'),
    message: clean(data.message, 2000, true),
  };

  const errors = [];
  if (!form.name) errors.push('your name');
  if (!validPhone(form.phone)) errors.push('a valid phone number');
  if (form.email && !validEmail(form.email)) errors.push('a valid email address');
  if (data.consent !== true) errors.push('your consent to be contacted');
  if (errors.length) return json({ ok: false, error: `Please include ${errors.join(', ')}.` }, 400);

  const rows = [
    ['Name', form.name],
    ['Phone', form.phone],
    ['Email', form.email || '(not given)'],
    ['About', form.topic],
    ['Message', form.message || '(none)'],
    ['Received', torontoNow()],
  ];

  return sendEmail(env, {
    to: env.TO_EMAIL,
    subject: `New website enquiry: ${form.topic} — ${form.name}`,
    heading: 'New website enquiry',
    rows,
    phone: form.phone,
    footer: 'This person agreed to be contacted about their request.',
  });
}

/* ---------------- /api/apply ---------------- */

async function handleApply(data, env) {
  const availability = Array.isArray(data.availability)
    ? data.availability.map((v) => clean(v, 20)).filter((v) => AVAILABILITY.includes(v))
    : [];

  const form = {
    name: clean(data.name, 100),
    phone: clean(data.phone, 30),
    email: clean(data.email, 200),
    role: oneOf(clean(data.role, 60), ROLES, 'Other'),
    experience: oneOf(clean(data.experience, 30), EXPERIENCE, 'Not given'),
    transport: oneOf(clean(data.transport, 40), TRANSPORT, 'Not given'),
    areas: clean(data.areas, 200),
    message: clean(data.message, 2000, true),
  };

  const errors = [];
  if (!form.name) errors.push('your name');
  if (!validPhone(form.phone)) errors.push('a valid phone number');
  if (!validEmail(form.email)) errors.push('a valid email address');
  if (data.consent !== true) errors.push('your consent');
  if (errors.length) return json({ ok: false, error: `Please include ${errors.join(', ')}.` }, 400);

  // Optional resume attachment.
  let attachments;
  if (data.resume && typeof data.resume === 'object' && data.resume.content) {
    const name = clean(data.resume.name, 120).replace(/[^\w.\- ]+/g, '_');
    const ext = (name.split('.').pop() || '').toLowerCase();
    const type = RESUME_TYPES[ext];
    const content = String(data.resume.content).replace(/\s+/g, '');
    const bytes = Math.floor((content.length * 3) / 4);
    if (!type || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
      return json({ ok: false, error: 'Resumes must be a PDF or Word document.' }, 400);
    }
    if (bytes > MAX_RESUME_BYTES) {
      return json({ ok: false, error: 'Resumes must be under 5 MB.' }, 413);
    }
    attachments = [{ content, filename: name || `resume.${ext}`, type, disposition: 'attachment' }];
  }

  const rows = [
    ['Name', form.name],
    ['Position', form.role],
    ['Phone', form.phone],
    ['Email', form.email],
    ['Experience', form.experience],
    ['Availability', availability.length ? availability.join(', ') : '(not given)'],
    ['Areas', form.areas || '(not given)'],
    ['Transportation', form.transport],
    ['Resume', attachments ? `Attached (${attachments[0].filename})` : 'Not provided'],
    ['Notes', form.message || '(none)'],
    ['Received', torontoNow()],
  ];

  return sendEmail(env, {
    to: env.CAREERS_EMAIL || env.TO_EMAIL,
    subject: `Job application: ${form.role} — ${form.name}`,
    heading: 'New job application',
    rows,
    phone: form.phone,
    footer: 'The applicant agreed to have this information used to consider their application.',
    attachments,
  });
}

/* ---------------- Email ---------------- */

async function sendEmail(env, { to, subject, heading, rows, phone, footer, attachments }) {
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${footer}`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#26314B">
<h2 style="margin:0 0 16px">${esc(heading)}</h2>
<table cellpadding="8" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="font-weight:bold;vertical-align:top;border-bottom:1px solid #E8EBF1">${esc(k)}</td><td style="border-bottom:1px solid #E8EBF1;white-space:pre-wrap">${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="color:#5A6378;font-size:13px">${esc(footer)} Call back: <a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a>.</p>
</body></html>`;

  const message = { to, from: env.FROM_EMAIL, subject, text, html };
  if (attachments) message.attachments = attachments;

  try {
    await env.EMAIL.send(message);
  } catch (err) {
    console.error('Email send failed:', err && err.code, err && err.message);
    return json({ ok: false, error: `We could not send this. Please call us at ${PHONE}.` }, 502);
  }
  return json({ ok: true });
}

/* ---------------- Helpers ---------------- */

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await res.json();
    return out.success === true;
  } catch (err) {
    console.error('Turnstile check failed:', err);
    return false;
  }
}

function clean(value, max = 200, multiline = false) {
  if (typeof value !== 'string') return '';
  let v = value.replace(/\u0000/g, '').trim();
  if (!multiline) v = v.replace(/[\r\n\t]+/g, ' ');
  return v.slice(0, max);
}

const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);
const validPhone = (p) => p.replace(/\D/g, '').length >= 7;
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const torontoNow = () => new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}
