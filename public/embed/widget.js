/**
 * Local Booking Engine — Embed Widget
 * Version: 1.1.0
 *
 * Usage:
 *   <!-- Inline form -->
 *   <div id="lbe-booking-form" data-tenant="YOUR_TENANT_ID"></div>
 *
 *   <!-- Floating button -->
 *   <div id="lbe-floating" data-tenant="YOUR_TENANT_ID" data-mode="floating"></div>
 *
 *   <!-- Modal trigger -->
 *   <button data-lbe-trigger data-tenant="YOUR_TENANT_ID">Book Now</button>
 *
 *   <script src="https://your-app.com/embed/widget.js" async></script>
 *
 * No framework dependencies. Vanilla JS + Shadow DOM for CSS isolation.
 */
(function () {
  'use strict';

  // ─── Config ────────────────────────────────────────────────────────────────
  var API_BASE = (function () {
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    if (scripts.length) {
      var src = scripts[scripts.length - 1].getAttribute('src');
      return src.replace('/embed/widget.js', '');
    }
    return '';
  })();

  // ─── State ─────────────────────────────────────────────────────────────────
  var tenantConfigs = {};
  var modalOpen = false;
  var modalEl = null;

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // ─── Utilities ─────────────────────────────────────────────────────────────
  function fetchConfig(tenantId, cb) {
    if (tenantConfigs[tenantId]) { cb(null, tenantConfigs[tenantId]); return; }
    var url = API_BASE + '/api/embed/' + tenantId + '/config';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        tenantConfigs[tenantId] = data;
        cb(null, data);
      } else {
        cb(new Error('Failed to load booking form configuration'));
      }
    };
    xhr.onerror = function () { cb(new Error('Network error')); };
    xhr.send();
  }

  function submitForm(tenantId, payload, cb) {
    var url = API_BASE + '/api/embed/' + tenantId + '/submit';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        cb(null, JSON.parse(xhr.responseText));
      } else {
        try {
          cb(new Error(JSON.parse(xhr.responseText).message || 'Submission failed'));
        } catch (e) {
          cb(new Error('Submission failed'));
        }
      }
    };
    xhr.onerror = function () { cb(new Error('Network error')); };
    xhr.send(JSON.stringify(payload));
  }

  function getUtmParams() {
    var params = {};
    var search = window.location.search.slice(1).split('&');
    var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    for (var i = 0; i < search.length; i++) {
      var pair = search[i].split('=');
      if (utmKeys.indexOf(pair[0]) !== -1) {
        params[pair[0]] = decodeURIComponent(pair[1] || '');
      }
    }
    params.source_page = window.location.href;
    params.referring_url = document.referrer || null;
    return params;
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function toISO(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatDisplay(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ─── CSS ───────────────────────────────────────────────────────────────────
  function buildCSS(embed) {
    var primary    = embed.primary_color      || '#6172f3';
    var bg         = embed.background_color   || '#ffffff';
    var textColor  = embed.text_color         || '#111827';
    var labelColor = embed.label_color        || '#374151';
    var border     = embed.input_border_color || '#d1d5db';
    var radius     = (embed.border_radius !== undefined ? embed.border_radius : 10) + 'px';
    var font       = embed.font_family        || 'Inter';
    var fontStack  = font + ', system-ui, sans-serif';

    // Derive a slightly lighter primary for hover states
    return [
      ':host { font-family: ' + fontStack + '; box-sizing: border-box; }',
      '*, *::before, *::after { box-sizing: inherit; }',
      '.lbe-widget { max-width: 480px; background: ' + bg + '; border-radius: calc(' + radius + ' + 6px); padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }',
      '.lbe-heading { font-size: 18px; font-weight: 700; color: ' + textColor + '; margin: 0 0 4px; }',
      '.lbe-subheading { font-size: 14px; color: #6b7280; margin: 0 0 20px; }',
      '.lbe-field { margin-bottom: 14px; position: relative; }',
      '.lbe-label { display: block; font-size: 13px; font-weight: 500; color: ' + labelColor + '; margin-bottom: 5px; }',
      '.lbe-required { color: #ef4444; margin-left: 2px; }',
      '.lbe-input, .lbe-textarea, .lbe-select { width: 100%; padding: 9px 12px; font-size: 14px; border: 1.5px solid ' + border + '; border-radius: ' + radius + '; outline: none; transition: border-color 0.15s; font-family: inherit; background: ' + bg + '; color: ' + textColor + '; }',
      '.lbe-input:focus, .lbe-textarea:focus, .lbe-select:focus { border-color: ' + primary + '; box-shadow: 0 0 0 3px ' + primary + '33; }',
      '.lbe-textarea { resize: none; }',
      '.lbe-input.error, .lbe-textarea.error { border-color: #ef4444; }',
      '.lbe-error-text { font-size: 12px; color: #ef4444; margin-top: 4px; display: none; }',
      '.lbe-error-text.visible { display: block; }',
      '.lbe-submit { width: 100%; padding: 12px; font-size: 15px; font-weight: 600; color: #fff; background: ' + primary + '; border: none; border-radius: ' + radius + '; cursor: pointer; transition: opacity 0.15s, transform 0.1s; margin-top: 4px; font-family: inherit; }',
      '.lbe-submit:hover { opacity: 0.9; }',
      '.lbe-submit:active { transform: scale(0.99); }',
      '.lbe-submit:disabled { opacity: 0.6; cursor: not-allowed; }',
      '.lbe-success { text-align: center; padding: 24px 0; }',
      '.lbe-success-icon { font-size: 40px; margin-bottom: 12px; }',
      '.lbe-success-title { font-size: 18px; font-weight: 700; color: ' + textColor + '; margin: 0 0 6px; }',
      '.lbe-success-msg { font-size: 14px; color: #6b7280; margin: 0; }',
      '.lbe-server-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 13px; padding: 10px 12px; border-radius: ' + radius + '; margin-bottom: 12px; display: none; }',
      '.lbe-server-error.visible { display: block; }',

      /* ── Date picker ── */
      '.lbe-date-wrap { position: relative; }',
      '.lbe-date-display { width: 100%; padding: 9px 38px 9px 12px; font-size: 14px; border: 1.5px solid ' + border + '; border-radius: ' + radius + '; outline: none; cursor: pointer; font-family: inherit; background: ' + bg + '; color: ' + textColor + '; text-align: left; transition: border-color 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.lbe-date-display:focus, .lbe-date-display.open { border-color: ' + primary + '; box-shadow: 0 0 0 3px ' + primary + '33; }',
      '.lbe-date-display.error { border-color: #ef4444; }',
      '.lbe-date-icon { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; color: ' + textColor + '; opacity: 0.5; }',
      '.lbe-cal { position: absolute; left: 0; top: calc(100% + 6px); width: 100%; background: ' + bg + '; border: 1.5px solid ' + border + '; border-radius: ' + radius + '; box-shadow: 0 8px 30px rgba(0,0,0,0.12); z-index: 9999; padding: 12px; display: none; min-width: 260px; }',
      '.lbe-cal.open { display: block; }',
      '.lbe-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }',
      '.lbe-cal-title { font-size: 14px; font-weight: 600; color: ' + textColor + '; }',
      '.lbe-cal-nav { width: 28px; height: 28px; border: 0; outline: none; -webkit-appearance: none; appearance: none; background: none; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ' + textColor + '; opacity: 0.5; transition: background 0.15s, opacity 0.15s; padding: 0; }',
      '.lbe-cal-nav:hover { background: ' + primary + '22; opacity: 1; }',
      '.lbe-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }',
      '.lbe-cal-dow { font-size: 11px; font-weight: 600; color: #9ca3af; text-align: center; padding: 4px 0; }',
      '.lbe-cal-day { width: 100%; aspect-ratio: 1; border: 0; outline: none; -webkit-appearance: none; appearance: none; background: none; border-radius: 6px; font-size: 13px; cursor: pointer; color: ' + textColor + '; transition: background 0.1s, color 0.1s; display: flex; align-items: center; justify-content: center; font-family: inherit; padding: 0; }',
      '.lbe-cal-day:hover:not(:disabled) { background: ' + primary + '22; color: ' + textColor + '; }',
      '.lbe-cal-day:disabled { color: #9ca3af; cursor: not-allowed; opacity: 0.4; }',
      '.lbe-cal-day.today { box-shadow: inset 0 0 0 1.5px ' + primary + '; color: ' + primary + '; font-weight: 600; }',
      '.lbe-cal-day.selected { background: ' + primary + ' !important; color: #fff !important; font-weight: 600; }',
      '.lbe-cal-day.other-month { color: ' + textColor + '; opacity: 0.25; }',

      /* ── Floating / Modal ── */
      '.lbe-floating-btn { position: fixed; bottom: 24px; right: 24px; padding: 14px 20px; font-size: 15px; font-weight: 600; color: #fff; background: ' + primary + '; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); z-index: 99998; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s; }',
      '.lbe-floating-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }',
      '.lbe-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px; }',
      '.lbe-modal { position: relative; width: 100%; max-width: 480px; }',
      '.lbe-modal-close { position: absolute; top: -12px; right: -12px; width: 28px; height: 28px; background: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1; }',
    ].join('\n');
  }

  // ─── Form Builder ──────────────────────────────────────────────────────────
  function buildFormHTML(config) {
    var embed = config.embed;
    var services = config.services || [];
    var html = '';

    html += '<h2 class="lbe-heading">' + esc(embed.heading) + '</h2>';
    if (embed.subheading) {
      html += '<p class="lbe-subheading">' + esc(embed.subheading) + '</p>';
    }

    html += '<div class="lbe-server-error" id="lbe-server-error"></div>';

    html += field('text',  'full_name', 'Full Name',      'Jane Smith',          true);
    html += field('email', 'email',     'Email Address',  'jane@example.com',    true);
    html += field('tel',   'phone',     'Phone Number',   '+1 (555) 000-0000',   false);

    if (services.length) {
      html += '<div class="lbe-field">';
      html += '<label class="lbe-label" for="lbe-requested_service">Requested Service</label>';
      html += '<select class="lbe-select" id="lbe-requested_service" name="requested_service">';
      html += '<option value="">Select a service...</option>';
      for (var i = 0; i < services.length; i++) {
        html += '<option value="' + esc(services[i].name) + '">' + esc(services[i].name) + '</option>';
      }
      html += '</select></div>';
    } else {
      html += field('text', 'requested_service', 'Requested Service', embed.requested_service_placeholder || 'e.g. Botox, Facial...', false);
    }

    // Custom date picker (replaces <input type="date">)
    html += datepickerField();

    html += textareaField('notes', 'Additional Notes', 'Anything else we should know?', false);
    html += '<button type="submit" class="lbe-submit" id="lbe-submit">' + esc(embed.button_text) + '</button>';

    return html;
  }

  function datepickerField() {
    return [
      '<div class="lbe-field" id="lbe-field-preferred_date">',
        '<label class="lbe-label">Preferred Date</label>',
        '<div class="lbe-date-wrap">',
          // Hidden value input (stores YYYY-MM-DD, submitted with form)
          '<input type="hidden" id="lbe-preferred_date" name="preferred_date" />',
          // Visible display button
          '<button type="button" class="lbe-date-display" id="lbe-date-display" aria-haspopup="true" aria-expanded="false">',
            '<span id="lbe-date-label" style="color:#9ca3af">Select a date...</span>',
          '</button>',
          // Calendar icon
          '<span class="lbe-date-icon">',
            '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">',
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
            '</svg>',
          '</span>',
          // Calendar dropdown
          '<div class="lbe-cal" id="lbe-cal" role="dialog" aria-label="Date picker">',
            '<div class="lbe-cal-header">',
              '<button type="button" class="lbe-cal-nav" id="lbe-cal-prev" aria-label="Previous month">',
                '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>',
              '</button>',
              '<span class="lbe-cal-title" id="lbe-cal-title"></span>',
              '<button type="button" class="lbe-cal-nav" id="lbe-cal-next" aria-label="Next month">',
                '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>',
              '</button>',
            '</div>',
            '<div class="lbe-cal-grid" id="lbe-cal-grid">',
              DAYS.map(function(d){ return '<div class="lbe-cal-dow">' + d + '</div>'; }).join(''),
            '</div>',
          '</div>',
        '</div>',
        '<p class="lbe-error-text" id="lbe-err-preferred_date"></p>',
      '</div>',
    ].join('');
  }

  function field(type, name, label, placeholder, required) {
    return '<div class="lbe-field">' +
      '<label class="lbe-label" for="lbe-' + name + '">' + esc(label) + (required ? '<span class="lbe-required">*</span>' : '') + '</label>' +
      '<input class="lbe-input" type="' + type + '" id="lbe-' + name + '" name="' + name + '" placeholder="' + esc(placeholder) + '"' + (required ? ' required' : '') + ' />' +
      '<p class="lbe-error-text" id="lbe-err-' + name + '"></p>' +
      '</div>';
  }

  function textareaField(name, label, placeholder, required) {
    return '<div class="lbe-field">' +
      '<label class="lbe-label" for="lbe-' + name + '">' + esc(label) + (required ? '<span class="lbe-required">*</span>' : '') + '</label>' +
      '<textarea class="lbe-textarea" id="lbe-' + name + '" name="' + name + '" rows="3" placeholder="' + esc(placeholder) + '"' + (required ? ' required' : '') + '></textarea>' +
      '<p class="lbe-error-text" id="lbe-err-' + name + '"></p>' +
      '</div>';
  }

  // ─── Date Picker Logic ─────────────────────────────────────────────────────
  function initDatePicker(shadow) {
    var displayBtn  = shadow.getElementById('lbe-date-display');
    var cal         = shadow.getElementById('lbe-cal');
    var calTitle    = shadow.getElementById('lbe-cal-title');
    var calGrid     = shadow.getElementById('lbe-cal-grid');
    var prevBtn     = shadow.getElementById('lbe-cal-prev');
    var nextBtn     = shadow.getElementById('lbe-cal-next');
    var hiddenInput = shadow.getElementById('lbe-preferred_date');
    var labelEl     = shadow.getElementById('lbe-date-label');

    if (!displayBtn || !cal) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var curYear  = today.getFullYear();
    var curMonth = today.getMonth();
    var selected = null; // ISO string

    function renderGrid() {
      calTitle.textContent = MONTHS[curMonth] + ' ' + curYear;

      // Remove existing day buttons (keep the day-of-week headers = first 7 children)
      var children = calGrid.children;
      while (children.length > 7) {
        calGrid.removeChild(children[children.length - 1]);
      }

      var first = new Date(curYear, curMonth, 1);
      var startDay = first.getDay(); // 0=Sun
      var daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
      var daysInPrev  = new Date(curYear, curMonth, 0).getDate();

      // Leading days from previous month
      for (var p = startDay - 1; p >= 0; p--) {
        var d = daysInPrev - p;
        var btn = makeDay(d, curYear, curMonth - 1, true, false, false);
        calGrid.appendChild(btn);
      }

      // Current month days
      for (var day = 1; day <= daysInMonth; day++) {
        var date = new Date(curYear, curMonth, day);
        date.setHours(0,0,0,0);
        var isPast = date < today;
        var isTod  = date.getTime() === today.getTime();
        var iso    = toISO(date);
        var isSel  = selected === iso;
        var btn = makeDay(day, curYear, curMonth, false, isPast, isTod, isSel, iso);
        calGrid.appendChild(btn);
      }

      // Trailing days to fill grid (up to 6 rows × 7 = 42 total cells)
      var total = startDay + daysInMonth;
      var trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
      for (var t = 1; t <= trailing; t++) {
        var btn = makeDay(t, curYear, curMonth + 1, true, false, false);
        calGrid.appendChild(btn);
      }
    }

    function makeDay(day, year, month, otherMonth, disabled, isToday, isSelected, iso) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lbe-cal-day' +
        (otherMonth ? ' other-month' : '') +
        (isToday    ? ' today'       : '') +
        (isSelected ? ' selected'    : '');
      btn.textContent = day;
      if (disabled || otherMonth) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', function () {
          selected = iso;
          hiddenInput.value = iso;
          labelEl.textContent = formatDisplay(iso);
          labelEl.style.color = '';
          displayBtn.classList.remove('open');
          cal.classList.remove('open');
          displayBtn.setAttribute('aria-expanded', 'false');
          renderGrid();
        });
      }
      return btn;
    }

    function openCal() {
      cal.classList.add('open');
      displayBtn.classList.add('open');
      displayBtn.setAttribute('aria-expanded', 'true');
      // If nothing selected, show current month; otherwise show selected month
      if (selected) {
        var parts = selected.split('-');
        curYear  = parseInt(parts[0]);
        curMonth = parseInt(parts[1]) - 1;
      }
      renderGrid();
    }

    function closeCal() {
      cal.classList.remove('open');
      displayBtn.classList.remove('open');
      displayBtn.setAttribute('aria-expanded', 'false');
    }

    displayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      cal.classList.contains('open') ? closeCal() : openCal();
    });

    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      curMonth--;
      if (curMonth < 0) { curMonth = 11; curYear--; }
      renderGrid();
    });

    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      curMonth++;
      if (curMonth > 11) { curMonth = 0; curYear++; }
      renderGrid();
    });

    // Close on click outside (inside shadow DOM)
    shadow.addEventListener('click', function (e) {
      if (!displayBtn.contains(e.target) && !cal.contains(e.target)) {
        closeCal();
      }
    });

    // Close on ESC
    shadow.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCal();
    });

    // Expose getter for form submission
    displayBtn._getISO = function () { return hiddenInput.value; };
  }

  // ─── Form Mount ────────────────────────────────────────────────────────────
  function mountForm(container, tenantId, config, onSuccess) {
    var shadow = container.attachShadow({ mode: 'closed' });

    var style = document.createElement('style');
    style.textContent = buildCSS(config.embed);

    var wrapper = document.createElement('div');
    wrapper.className = 'lbe-widget';
    wrapper.innerHTML = '<form id="lbe-form">' + buildFormHTML(config) + '</form>';

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    var form = shadow.getElementById('lbe-form');
    var submitBtn = shadow.getElementById('lbe-submit');
    var serverErrEl = shadow.getElementById('lbe-server-error');

    initDatePicker(shadow);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(shadow)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      if (serverErrEl) { serverErrEl.classList.remove('visible'); serverErrEl.textContent = ''; }

      var utmParams = getUtmParams();
      var payload = Object.assign({
        full_name:         getVal(shadow, 'full_name'),
        email:             getVal(shadow, 'email'),
        phone:             getVal(shadow, 'phone') || null,
        requested_service: getVal(shadow, 'requested_service') || null,
        preferred_date:    getVal(shadow, 'preferred_date') || null,
        notes:             getVal(shadow, 'notes') || null,
      }, utmParams);

      submitForm(tenantId, payload, function (err, result) {
        if (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = config.embed.button_text;
          if (serverErrEl) {
            serverErrEl.textContent = err.message;
            serverErrEl.classList.add('visible');
          }
          return;
        }
        wrapper.innerHTML = '<div class="lbe-widget"><div class="lbe-success">' +
          '<div class="lbe-success-icon">✓</div>' +
          '<h3 class="lbe-success-title">Request Received!</h3>' +
          '<p class="lbe-success-msg">' + esc(result.message || 'We\'ll be in touch shortly.') + '</p>' +
          '</div></div>';
        if (typeof onSuccess === 'function') onSuccess();
      });
    });
  }

  function getVal(shadow, name) {
    var el = shadow.getElementById('lbe-' + name);
    return el ? el.value.trim() : '';
  }

  function validateForm(shadow) {
    var valid = true;
    var checks = [
      { name: 'full_name', msg: 'Name is required' },
      { name: 'email',     msg: 'Valid email is required', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    ];
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      var val = getVal(shadow, c.name);
      var errEl = shadow.getElementById('lbe-err-' + c.name);
      var inputEl = shadow.getElementById('lbe-' + c.name);
      var hasError = !val || (c.pattern && !c.pattern.test(val));
      if (errEl) { errEl.textContent = hasError ? c.msg : ''; errEl.classList.toggle('visible', hasError); }
      if (inputEl) inputEl.classList.toggle('error', hasError);
      if (hasError) valid = false;
    }
    return valid;
  }

  // ─── Modal ─────────────────────────────────────────────────────────────────
  function openModal(tenantId, config) {
    if (modalOpen) return;
    modalOpen = true;

    modalEl = document.createElement('div');
    modalEl.setAttribute('style', [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.45)',
      'backdrop-filter:blur(4px)', '-webkit-backdrop-filter:blur(4px)',
      'z-index:99999', 'display:flex', 'align-items:center',
      'justify-content:center', 'padding:16px',
    ].join(';'));

    var inner = document.createElement('div');
    inner.setAttribute('style', 'position:relative;width:100%;max-width:480px;');

    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('style', [
      'position:absolute', 'top:-12px', 'right:-12px',
      'width:28px', 'height:28px', 'background:#fff', 'border:none',
      'border-radius:50%', 'cursor:pointer', 'font-size:18px', 'line-height:1',
      'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 2px 8px rgba(0,0,0,0.15)', 'z-index:1', 'color:#374151',
    ].join(';'));
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeModal);

    var formContainer = document.createElement('div');

    inner.appendChild(closeBtn);
    inner.appendChild(formContainer);
    modalEl.appendChild(inner);
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal();
    });

    mountForm(formContainer, tenantId, config, closeModal);
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
    }
    document.addEventListener('keydown', onKey);
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    if (modalEl) { document.body.removeChild(modalEl); modalEl = null; }
    document.body.style.overflow = '';
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    var inlineEl = document.getElementById('lbe-booking-form');
    if (inlineEl) {
      var tenantId = inlineEl.getAttribute('data-tenant');
      if (tenantId) {
        fetchConfig(tenantId, function (err, config) {
          if (err) { console.error('[LBE]', err.message); return; }
          mountForm(inlineEl, tenantId, config);
        });
      }
    }

    var floatingEl = document.getElementById('lbe-floating');
    if (floatingEl) {
      var ftId = floatingEl.getAttribute('data-tenant');
      if (ftId) {
        fetchConfig(ftId, function (err, config) {
          if (err) { console.error('[LBE]', err.message); return; }
          var btn = document.createElement('button');
          var fp = config.embed.primary_color || '#6172f3';
          var ff = (config.embed.font_family || 'Inter') + ', system-ui, sans-serif';
          btn.setAttribute('style', [
            'position:fixed', 'bottom:24px', 'right:24px',
            'padding:14px 20px', 'font-size:15px', 'font-weight:600',
            'color:#fff', 'background:' + fp, 'border:none',
            'border-radius:50px', 'cursor:pointer',
            'box-shadow:0 4px 16px rgba(0,0,0,0.2)', 'z-index:99998',
            'font-family:' + ff, 'transition:transform 0.2s,box-shadow 0.2s',
          ].join(';'));
          btn.textContent = config.embed.button_text;
          btn.addEventListener('mouseover', function () { btn.style.transform = 'translateY(-2px)'; });
          btn.addEventListener('mouseout',  function () { btn.style.transform = ''; });
          btn.addEventListener('click', function () { openModal(ftId, config); });
          document.body.appendChild(btn);
        });
      }
    }

    var triggers = document.querySelectorAll('[data-lbe-trigger]');
    for (var i = 0; i < triggers.length; i++) {
      (function (trigger) {
        var tId = trigger.getAttribute('data-tenant');
        if (!tId) return;
        trigger.addEventListener('click', function () {
          fetchConfig(tId, function (err, config) {
            if (err) { console.error('[LBE]', err.message); return; }
            openModal(tId, config);
          });
        });
      })(triggers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
