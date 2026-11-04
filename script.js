const sections = document.querySelectorAll('.reveal');
const progressBar = document.getElementById('scrollProgress');
const navLinks = document.querySelectorAll('.sticky-nav a[href^="#"]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: '0px 0px -30px 0px'
  }
);

sections.forEach((section, i) => {
  section.style.transitionDelay = `${Math.min(i * 40, 180)}ms`;
  observer.observe(section);
});

function updateScrollProgress() {
  if (!progressBar) {
    return;
  }
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

const sectionTargets = [];
navLinks.forEach((link) => {
  const id = link.getAttribute('href');
  if (!id) {
    return;
  }
  const section = document.querySelector(id);
  if (section) {
    sectionTargets.push({ link, section });
  }
});

function updateActiveNav() {
  if (!sectionTargets.length) {
    return;
  }

  const anchor = window.scrollY + 140;
  let active = sectionTargets[0].link;

  sectionTargets.forEach(({ link, section }) => {
    if (anchor >= section.offsetTop) {
      active = link;
    }
  });

  navLinks.forEach((link) => link.classList.remove('active'));
  active.classList.add('active');
  active.scrollIntoView({ block: 'nearest', inline: 'center' });
}

window.addEventListener('scroll', () => {
  updateScrollProgress();
  updateActiveNav();
});

updateScrollProgress();
updateActiveNav();

const template = `TEST CASE ID:
FEATURE:
ENDPOINT:
METHOD:
PRE-CONDITION:
REQUEST:
- URL:
- Headers:
- Parameters:
- Body:
EXPECTED STATUS CODE:
EXPECTED RESPONSE:
TEST ASSERTIONS:
1.
2.
3.
NEGATIVE TEST:
ACTUAL RESULT:
PASS / FAIL`;

const copyBtn = document.getElementById('copyTemplate');
const copyStatus = document.getElementById('copyStatus');

if (copyBtn && copyStatus) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(template);
      copyStatus.textContent = 'Template copied. Paste it into your test documentation.';
    } catch (error) {
      copyStatus.textContent = 'Clipboard blocked in this browser. Copy manually from the template block.';
    }
  });
}

const checklistBox = document.getElementById('checklistBox');
if (checklistBox) {
  checklistBox.addEventListener('change', () => {
    const all = checklistBox.querySelectorAll('input[type="checkbox"]');
    const done = checklistBox.querySelectorAll('input[type="checkbox"]:checked');
    const percent = Math.round((done.length / all.length) * 100);
    document.title = `API Testing War Arena - ${percent}% Checklist Complete`;
  });
}

const runApiChecksBtn = document.getElementById('runApiChecks');
const apiCheckSummary = document.getElementById('apiCheckSummary');
const apiCheckResults = document.getElementById('apiCheckResults');
const downloadApiReportBtn = document.getElementById('downloadApiReport');
const printApiReportBtn = document.getElementById('printApiReport');
const themeToggleBtn = document.getElementById('themeToggle');

const playMethod = document.getElementById('playMethod');
const playUrl = document.getElementById('playUrl');
const playHeaders = document.getElementById('playHeaders');
const playBody = document.getElementById('playBody');
const sendPlayRequestBtn = document.getElementById('sendPlayRequest');
const playSummary = document.getElementById('playSummary');
const playResponse = document.getElementById('playResponse');

let latestApiResults = [];

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('theme-dark');
    if (themeToggleBtn) {
      themeToggleBtn.textContent = 'Switch to Day Mode';
    }
  } else {
    document.body.classList.remove('theme-dark');
    if (themeToggleBtn) {
      themeToggleBtn.textContent = 'Switch to Night Mode';
    }
  }
}

const savedTheme = localStorage.getItem('spsu-theme');
applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem('spsu-theme', nextTheme);
  });
}

async function runApiCheck(name, url, options, validate) {
  const start = performance.now();
  try {
    const response = await fetch(url, options);
    const elapsed = Math.round(performance.now() - start);

    let payload = null;
    const text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      payload = text;
    }

    const passed = validate(response, payload);
    return {
      name,
      status: response.status,
      time: elapsed,
      passed,
      note: passed ? 'Matched expected behavior' : 'Review expected behavior for this endpoint'
    };
  } catch (error) {
    return {
      name,
      status: 'NETWORK_ERROR',
      time: '-',
      passed: false,
      note: 'Network or CORS issue while calling endpoint'
    };
  }
}

function renderApiCheckResults(results) {
  apiCheckResults.innerHTML = '';
  results.forEach((result, index) => {
    const card = document.createElement('article');
    card.className = 'result-item';
    card.style.animationDelay = `${Math.min(index * 80, 320)}ms`;

    const statusClass = result.passed ? 'result-pass' : 'result-fail';
    const verdict = result.passed ? 'PASS' : 'FAIL';

    card.innerHTML = `
      <h4>${result.name}</h4>
      <p class="result-meta">Status: <strong>${result.status}</strong></p>
      <p class="result-meta">Response Time: <strong>${result.time} ms</strong></p>
      <p class="result-meta ${statusClass}">${verdict}</p>
      <p class="result-meta">${result.note}</p>
    `;

    apiCheckResults.appendChild(card);
  });
}

if (runApiChecksBtn && apiCheckSummary && apiCheckResults) {
  runApiChecksBtn.addEventListener('click', async () => {
    runApiChecksBtn.disabled = true;
    runApiChecksBtn.textContent = 'Running Checks...';
    apiCheckSummary.textContent = 'Executing API checks. Please wait...';

    const checks = [
      runApiCheck(
        'GET /posts',
        'https://jsonplaceholder.typicode.com/posts',
        { method: 'GET' },
        (response, payload) => response.status === 200 && Array.isArray(payload) && payload.length > 0 && payload[0].id && payload[0].title
      ),
      runApiCheck(
        'POST /posts',
        'https://jsonplaceholder.typicode.com/posts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'SPSU Placement Application',
            body: 'Student application created during API Testing War Arena',
            userId: 101
          })
        },
        (response, payload) => response.status === 201 && payload && payload.id
      ),
      runApiCheck(
        'PATCH /posts/1',
        'https://jsonplaceholder.typicode.com/posts/1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Placement Application' })
        },
        (response, payload) => response.status === 200 && payload && payload.title === 'Updated Placement Application'
      ),
      runApiCheck(
        'DELETE /posts/1',
        'https://jsonplaceholder.typicode.com/posts/1',
        { method: 'DELETE' },
        (response) => response.status === 200
      ),
      runApiCheck(
        'NEGATIVE GET /unknown-endpoint',
        'https://jsonplaceholder.typicode.com/unknown-endpoint',
        { method: 'GET' },
        (response) => response.status === 404
      ),
      runApiCheck(
        'NEGATIVE POST missing fields',
        'https://jsonplaceholder.typicode.com/posts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 101 })
        },
        (response) => response.status === 400 || response.status === 422 || response.status === 201
      )
    ];

    const results = await Promise.all(checks);
    latestApiResults = results;
    renderApiCheckResults(results);

    const passCount = results.filter((r) => r.passed).length;
    apiCheckSummary.textContent = `${passCount}/${results.length} checks passed. Note: JSONPlaceholder is a mock API and may accept partial payloads.`;

    runApiChecksBtn.disabled = false;
    runApiChecksBtn.textContent = 'Run All API Checks';
  });
}

function downloadApiReport() {
  if (!latestApiResults.length) {
    apiCheckSummary.textContent = 'Run API checks first, then download report.';
    return;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'SPSU API Testing War Arena Live Console',
    totalChecks: latestApiResults.length,
    passedChecks: latestApiResults.filter((item) => item.passed).length,
    results: latestApiResults
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `spsu-api-report-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  apiCheckSummary.textContent = 'JSON report downloaded successfully.';
}

if (downloadApiReportBtn) {
  downloadApiReportBtn.addEventListener('click', downloadApiReport);
}

if (printApiReportBtn) {
  printApiReportBtn.addEventListener('click', () => {
    if (!latestApiResults.length) {
      apiCheckSummary.textContent = 'Run API checks first, then export PDF.';
      return;
    }

    document.body.classList.add('print-report');
    window.print();
  });
}

window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-report');
});

function parseJsonSafe(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

if (sendPlayRequestBtn && playMethod && playUrl && playHeaders && playBody && playSummary && playResponse) {
  sendPlayRequestBtn.addEventListener('click', async () => {
    const method = playMethod.value;
    const url = playUrl.value.trim();
    const headers = parseJsonSafe(playHeaders.value, null);

    if (!url) {
      playSummary.textContent = 'URL is required.';
      return;
    }

    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
      playSummary.textContent = 'Headers must be a valid JSON object.';
      return;
    }

    const options = {
      method,
      headers
    };

    if (!['GET', 'DELETE'].includes(method)) {
      const parsedBody = parseJsonSafe(playBody.value, null);
      if (!parsedBody) {
        playSummary.textContent = 'Body must be valid JSON for this method.';
        return;
      }
      options.body = JSON.stringify(parsedBody);
    }

    sendPlayRequestBtn.disabled = true;
    sendPlayRequestBtn.textContent = 'Sending...';
    playSummary.textContent = 'Request sent. Waiting for response...';

    const start = performance.now();
    try {
      const response = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      const text = await response.text();
      const data = parseJsonSafe(text, text || {});
      playResponse.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      playSummary.textContent = `Status ${response.status} in ${elapsed} ms`;
    } catch (error) {
      playResponse.textContent = String(error);
      playSummary.textContent = 'Request failed. Check URL, method, network, or CORS policy.';
    } finally {
      sendPlayRequestBtn.disabled = false;
      sendPlayRequestBtn.textContent = 'Send Request';
    }
  });
}
