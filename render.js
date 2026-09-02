const CLOCK_INTERVAL = 60 * 1000;

const overrides = `
  html, body { overflow: hidden }
`;

function injectStyles(html, css) {
  const styleTag = `<style>${css}</style>`;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleTag}</head>`);
  }

  return `${styleTag}${html}`;
}

function stripHtmlFence(value) {
  return value
    .replace(/^\s*```html\s*(?:\r?\n)?/i, '')
    .replace(/(?:\r?\n)?\s*```\s*$/, '');
}

async function setClock() {
  const clockObj = await window.clocks.get();

  const model = Object.keys(clockObj.clocks)[0];
  const body = clockObj.clocks[model];

  const iframe = document.createElement('iframe');
  if (model) {
    iframe.srcdoc = injectStyles(stripHtmlFence(body), overrides);
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.title = 'Runtime Iframe';
    iframe.sandbox = '';

    document.getElementById('model-info').textContent = model;
    document.getElementById('put-clock-here').replaceChildren(iframe);
  }
}

function getTiming() {
  const now = new Date();
  const seconds = now.getSeconds();
  return CLOCK_INTERVAL - seconds * 1000;
}

function scheduleRerender() {
  const timer = getTiming();
  if (timer > 3000) setClock();
  setTimeout(scheduleRerender, getTiming());
}

scheduleRerender();
