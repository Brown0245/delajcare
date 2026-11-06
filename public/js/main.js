/* Dela J Care Solutions — interactive pieces */
(function () {
  'use strict';

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        toggle.focus();
      }
    });
  }

  /* ---------- Helpers ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'className') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  /* ---------- "Is it time?" checklist ---------- */
  var signsList = document.getElementById('signs-list');
  if (signsList) {
    var signs = [
      'Skipping meals or an empty fridge',
      'A recent fall or unsteady walking',
      'Missed or mixed-up medications',
      'Bathing or dressing is harder',
      'Housework or bills piling up',
      'Forgetfulness or confusion',
      'Seems lonely or withdrawn',
      'Family caregivers are exhausted'
    ];
    var headline = document.getElementById('signs-headline');
    var body = document.getElementById('signs-body');

    function updateSigns() {
      var count = signsList.querySelectorAll('[aria-pressed="true"]').length;
      if (count === 0) {
        headline.textContent = 'Nothing ticked yet.';
        body.textContent = 'Choose any signs you have noticed.';
      } else if (count === 1) {
        headline.textContent = 'Worth keeping an eye on.';
        body.textContent = 'One sign can be a starting point. A short call can help you plan ahead.';
      } else {
        headline.textContent = count + ' signs. It may be time to talk.';
        body.textContent = 'A little help now often prevents a crisis later. Call us or try the care finder below.';
      }
    }

    signs.forEach(function (label) {
      var box = el('span', { className: 'sign__box', 'aria-hidden': 'true' });
      var btn = el('button', { type: 'button', className: 'sign', 'aria-pressed': 'false' }, [box, el('span', { text: label })]);
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        box.textContent = on ? '✓' : '';
        updateSigns();
      });
      signsList.appendChild(btn);
    });
  }

  /* ---------- Care finder ---------- */
  var whoWrap = document.getElementById('finder-who');
  var needsWrap = document.getElementById('finder-needs');
  if (whoWrap && needsWrap) {
    var who = [
      { id: 'parent', label: 'A parent', text: 'your parent' },
      { id: 'partner', label: 'My partner', text: 'your partner' },
      { id: 'me', label: 'Myself', text: 'you' },
      { id: 'other', label: 'Someone else', text: 'your loved one' }
    ];
    var needs = [
      { id: 'personal', label: 'Bathing & dressing', svc: 'Personal care', by: 'PSW', on: true },
      { id: 'meals', label: 'Meals', svc: 'Meal preparation', by: 'PSW', on: true },
      { id: 'meds', label: 'Medication reminders', svc: 'Medication reminders', by: 'PSW' },
      { id: 'company', label: 'Company & outings', svc: 'Companionship', by: 'PSW' },
      { id: 'home', label: 'Housework & errands', svc: 'Homemaking support', by: 'PSW' },
      { id: 'respite', label: 'A break for me', svc: 'Respite care', by: 'PSW' },
      { id: 'nursing', label: 'Nursing care', svc: 'Nursing visits', by: 'RPN or RN' }
    ];
    var whoText = document.getElementById('finder-who-text');
    var results = document.getElementById('finder-results');
    var empty = document.getElementById('finder-empty');

    function renderResults() {
      results.innerHTML = '';
      var chosen = needs.filter(function (n) { return n.on; });
      chosen.forEach(function (n) {
        results.appendChild(el('li', {}, [document.createTextNode(n.svc), el('span', { text: n.by })]));
      });
      empty.hidden = chosen.length > 0;
      results.hidden = chosen.length === 0;
    }

    who.forEach(function (w, i) {
      var b = el('button', { type: 'button', role: 'radio', className: 'chip chip--dark' + (i === 0 ? ' is-on' : ''), 'aria-checked': String(i === 0), text: w.label });
      b.addEventListener('click', function () {
        whoWrap.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-on'); c.setAttribute('aria-checked', 'false'); });
        b.classList.add('is-on');
        b.setAttribute('aria-checked', 'true');
        whoText.textContent = w.text;
      });
      whoWrap.appendChild(b);
    });

    needs.forEach(function (n) {
      var b = el('button', { type: 'button', className: 'chip chip--dark' + (n.on ? ' is-on' : ''), 'aria-pressed': String(!!n.on), text: n.label });
      b.addEventListener('click', function () {
        n.on = !n.on;
        b.classList.toggle('is-on', n.on);
        b.setAttribute('aria-pressed', String(n.on));
        renderResults();
      });
      needsWrap.appendChild(b);
    });
    renderResults();
  }

  /* ---------- A day with Dela J (tabs) ---------- */
  var panel = document.getElementById('day-panel');
  if (panel) {
    var days = {
      morning: [
        ['8:00', 'A gentle start', 'Help getting up, washing and dressing, at their pace.'],
        ['9:00', 'Breakfast and medications', 'A meal they enjoy, with reminders so medications are taken on time.'],
        ['10:30', 'Fresh air', 'A short walk or time in the garden, with steady support.']
      ],
      afternoon: [
        ['12:30', 'Lunch together', 'Prepared fresh, suited to their tastes and dietary needs.'],
        ['2:00', 'Errands and appointments', 'Groceries, the pharmacy or a ride to the doctor.'],
        ['3:30', 'Company', 'Conversation, cards, photo albums or a favourite show.']
      ],
      evening: [
        ['5:30', 'Dinner and tidy-up', 'A warm meal, dishes done and the kitchen left clean.'],
        ['7:30', 'Winding down', 'Help changing, evening care and getting comfortable.'],
        ['9:00', 'Safe for the night', 'Doors checked, essentials in reach, and a note for the family.']
      ]
    };
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));

    function showDay(key) {
      panel.innerHTML = '';
      days[key].forEach(function (d) {
        panel.appendChild(el('div', { className: 'timeline__item' }, [
          el('span', { className: 'timeline__time', text: d[0] }),
          el('div', {}, [el('p', { className: 'timeline__title', text: d[1] }), el('p', { className: 'timeline__body', text: d[2] })])
        ]));
      });
    }
    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      showDay(tab.getAttribute('data-tab'));
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t, false); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length], true);
        if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
      });
    });
    showDay('morning');
  }

  /* ---------- Pre-select form fields from buttons ---------- */
  function preselect(attr, selectId) {
    var select = document.getElementById(selectId);
    if (!select) return;
    document.querySelectorAll('[' + attr + ']').forEach(function (a) {
      a.addEventListener('click', function () { select.value = a.getAttribute(attr); });
    });
  }
  preselect('data-topic', 'topic');
  preselect('data-role', 'role');

  /* ---------- Turnstile (only if a real site key is set) ---------- */
  var tsWidgets = document.querySelectorAll('.cf-turnstile');
  var tsNeeded = false;
  tsWidgets.forEach(function (ts) {
    var key = ts.getAttribute('data-sitekey') || '';
    if (!key || key === 'TURNSTILE_SITE_KEY') ts.remove();
    else tsNeeded = true;
  });
  if (tsNeeded) {
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }

  /* ---------- Forms (contact + careers) ---------- */
  var MAX_FILE = 5 * 1024 * 1024;
  var FILE_OK = /\.(pdf|docx?)$/i;

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { reject(new Error('read failed')); };
      r.readAsDataURL(file);
    });
  }

  document.querySelectorAll('form.js-form').forEach(function (form) {
    var status = form.querySelector('.form__status');
    var success = document.getElementById(form.getAttribute('data-success'));
    var submit = form.querySelector('button[type="submit"]');
    var label = form.getAttribute('data-submit-label') || submit.textContent;
    var endpoint = form.getAttribute('data-endpoint');
    var startedAt = Date.now();

    function setError(msg) {
      status.textContent = msg;
      status.classList.add('is-error');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('is-error');
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });

      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) {
        if (v instanceof File) return;
        if (k === 'availability') (data[k] = data[k] || []).push(v);
        else data[k] = v;
      });

      var els = form.elements;
      var problems = [];
      if (!String(data.name || '').trim()) problems.push(els.name);
      if (String(data.phone || '').replace(/\D/g, '').length < 7) problems.push(els.phone);
      var emailRequired = els.email && els.email.required;
      if ((emailRequired || data.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) problems.push(els.email);
      var file = els.resume && els.resume.files && els.resume.files[0];
      if (file && (file.size > MAX_FILE || !FILE_OK.test(file.name))) problems.push(els.resume);
      if (!els.consent.checked) problems.push(els.consent);
      if (problems.length) {
        problems.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        problems[0].focus();
        var msg = 'Please check the highlighted fields.';
        if (file && problems.indexOf(els.resume) > -1) msg += ' Resumes must be a PDF or Word file under 5 MB.';
        setError(msg);
        return;
      }

      data.consent = true;
      data.elapsedMs = Date.now() - startedAt;
      var tsInput = form.querySelector('[name="cf-turnstile-response"]');
      if (tsInput) data.turnstileToken = tsInput.value;

      submit.disabled = true;
      submit.textContent = 'Sending…';

      var ready = file
        ? readFile(file).then(function (b64) { data.resume = { name: file.name, type: file.type, content: b64 }; })
        : Promise.resolve();

      ready
        .then(function () {
          return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, body: j }; }); })
        .then(function (r) {
          if (r.ok && r.body.ok) {
            form.hidden = true;
            success.hidden = false;
            success.focus();
          } else {
            setError((r.body && r.body.error) || 'Something went wrong. Please call us at (647) 575-5277.');
            if (window.turnstile) window.turnstile.reset();
          }
        })
        .catch(function () {
          setError('We could not send this. Please call us at (647) 575-5277.');
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = label;
        });
    });
  });

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
