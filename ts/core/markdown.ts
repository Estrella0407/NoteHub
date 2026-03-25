// ── MARKDOWN PARSER ──
// Pure utility — no DOM references. Used by Editor.tsx for preview rendering.

export function parseMarkdown(md: string): string {
  if (!md || md.trim() === '') {
    return '<p style="color: var(--text-dim);">No content to preview</p>';
  }

  const blocks: Record<string, string> = {};   // token → html
  let   blockIdx = 0;

  function stash(html: string): string {
    const token = `\x00BLOCK${blockIdx++}\x00`;
    blocks[token] = html;
    return token;
  }

  // Extract fenced code blocks BEFORE any escaping
  md = md.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang: string, code: string) =>
    stash(`<pre><code class="lang-${lang}">${
      code.trim()
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    }</code></pre>`)
  );

  // Extract images BEFORE escaping (src must survive intact)
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, src: string) =>
    stash(`<img src="${src}" alt="${alt}" />`)
  );

  // Escape remaining HTML
  md = md
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');

  // Inline code (before everything else that uses backticks)
  md = md.replace(/`([^`]+)`/g, (_, c: string) =>
    stash(`<code>${c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code>`)
  );

  // Tables
  md = md.replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm, (match: string) => {
    const lines   = match.trim().split('\n');
    const headers = lines[0].split('|').slice(1, -1).map((c: string) => c.trim());
    const rows    = lines.slice(2).map((row: string) =>
      row.split('|').slice(1, -1).map((c: string) => c.trim())
    );
    let t = '<table><thead><tr>';
    headers.forEach(h => { t += `<th>${h}</th>`; });
    t += '</tr></thead><tbody>';
    rows.forEach(row => {
      t += '<tr>';
      row.forEach(cell => { t += `<td>${cell}</td>`; });
      t += '</tr>';
    });
    t += '</tbody></table>';
    return stash(t);
  });

  // Block-level elements
  md = md
    .replace(/^### (.+)$/gm,  (_, t: string) => stash(`<h3>${t}</h3>`))
    .replace(/^## (.+)$/gm,   (_, t: string) => stash(`<h2>${t}</h2>`))
    .replace(/^# (.+)$/gm,    (_, t: string) => stash(`<h1>${t}</h1>`))
    .replace(/^> (.+)$/gm,    (_, t: string) => stash(`<blockquote>${t}</blockquote>`))
    .replace(/^---$/gm,       ()             => stash('<hr/>'));

  // Inline formatting
  md = md
    .replace(/==\{([^}]+)\}([^=]+)==/g, '<mark style="background:$1;color:#1a1a1a">$2</mark>')
    .replace(/==([^=]+)==/g,            '<mark>$1</mark>')
    .replace(/\*\*\*(.+?)\*\*\*/g,      '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,          '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,              '<em>$1</em>')
    .replace(/~~(.+?)~~/g,              '<del>$1</del>');

  // Checkboxes
  md = md
    .replace(/^- \[x\] (.+)$/gm, (_, t: string) =>
      stash(`<div class="checkbox-item"><input type="checkbox" class="task-list-item-checkbox" checked><span>${t}</span></div>`)
    )
    .replace(/^- \[ \] (.+)$/gm, (_, t: string) =>
      stash(`<div class="checkbox-item"><input type="checkbox" class="task-list-item-checkbox"><span>${t}</span></div>`)
    );

  // Lists
  md = md
    .replace(/^[-*] (.+)$/gm,  '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  md = md.replace(/((<li>[\s\S]*?<\/li>\n?)+)/g, (m: string) => stash(`<ul>${m}</ul>`));

  // Links
  md = md.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Paragraphs & line breaks
  const paragraphs = md.split(/\n{2,}/);
  md = paragraphs.map((block: string) => {
    block = block.trim();
    if (!block) return '';
    // Already a stashed block token or an HTML tag — leave as-is
    if (/^\x00BLOCK\d+\x00$/.test(block) || /^<[a-z]/i.test(block)) return block;
    // Single line breaks → <br>
    block = block.replace(/\n/g, '<br/>');
    return `<p>${block}</p>`;
  }).filter(Boolean).join('\n');

  // Restore all stashed blocks
  md = md.replace(/\x00BLOCK(\d+)\x00/g, (_, i: string) => blocks[`\x00BLOCK${i}\x00`] || '');

  return md;
}

// Binds checkbox event listeners to the rendered markdown HTML
export function bindMarkdownListeners(container: HTMLElement): void {
  const checkboxes = container.querySelectorAll('.checkbox-item input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      // The Editor component will handle syncing checkbox state back to body
      // via its own onPreviewCheckboxToggle callback
      const checkbox = e.target as HTMLInputElement;
      const span = checkbox.nextElementSibling as HTMLElement | null;
      if (!span) return;
      // Dispatch a custom event that the Editor component can listen for
      container.dispatchEvent(new CustomEvent('checkboxToggle', {
        detail: { text: span.textContent || '', checked: checkbox.checked }
      }));
    });
  });
}
