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

function getRandomKey(object) {
  const keys = Object.keys(object);

  if (keys.length === 0) {
    return undefined;
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

function stripHtmlFence(value) {
  return value
    .replace(/^\s*```html\s*(?:\r?\n)?/i, "")
    .replace(/(?:\r?\n)?\s*```\s*$/, "");
}

const setClock = async () => {
  const data = await window.clocks.get()
  const iframe = document.createElement('iframe');
  const key = getRandomKey(data.clocks);
  if (key) {
    iframe.srcdoc = injectStyles(stripHtmlFence(data.clocks[key]), overrides);
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.title = 'Runtime Iframe';

    document.getElementById('model-info').textContent = key;
    document.getElementById('put-clock-here').replaceChildren(iframe);
  }
}

setClock();
setInterval(async () => {
  setClock();
}, 60000)