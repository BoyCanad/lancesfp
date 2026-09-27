export interface LyricWord {
  text: string;
  start: number;
  end: number;
}

export interface LyricLine {
  time: number;
  text: string;
  words?: LyricWord[];
  singer?: string;
}

export function formatTimeTTML(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

export function convertElrcToTTML(
  lyrics: LyricLine[] | undefined,
  title = '',
  artist = ''
): string {
  if (!lyrics || lyrics.length === 0) return '';

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  // Collect unique singers for <ttm:agent> declarations
  const singerSet = new Set<string>();
  lyrics.forEach((line) => {
    if (line.singer) singerSet.add(line.singer);
  });

  let agentsXml = '';
  if (singerSet.size > 0) {
    singerSet.forEach((s) => {
      const type =
        s.toLowerCase() === 'all' || s.toLowerCase() === 'group'
          ? 'group'
          : 'person';
      agentsXml += `      <ttm:agent type="${type}" xml:id="${escapeXml(s)}">${escapeXml(s)}</ttm:agent>\n`;
    });
  } else {
    agentsXml = `      <ttm:agent type="person" xml:id="artist">${escapeXml(artist)}</ttm:agent>\n`;
  }

  let pNodes = '';

  lyrics.forEach((line, idx) => {
    const nextLine = lyrics[idx + 1];
    let endSec =
      line.words && line.words.length > 0
        ? Math.max(...line.words.map((w) => w.end))
        : nextLine
        ? nextLine.time
        : line.time + 4;

    if (endSec <= line.time) {
      endSec = line.time + 3;
    }

    const pBegin = formatTimeTTML(line.time);
    const pEnd = formatTimeTTML(endSec);
    const singerAttr = line.singer ? ` ttm:agent="${escapeXml(line.singer)}"` : '';

    if (line.words && line.words.length > 0) {
      let mainSpans = '';
      let bgSpans = '';
      let inParens = false;

      line.words.forEach((w) => {
        const trimmed = w.text.trim();
        if (!trimmed) return;

        const wBegin = formatTimeTTML(w.start);
        const wEnd = formatTimeTTML(Math.max(w.start + 0.05, w.end));
        if (trimmed.startsWith('(')) {
          inParens = true;
        }

        const isBg = inParens;
        // Keep spaces around word text so am-lyrics renders spacing accurately
        const wordText = escapeXml(w.text.replace(/[()]/g, ''));
        const spanXml = `<span begin="${wBegin}" end="${wEnd}">${wordText} </span>`;

        if (isBg) {
          bgSpans += spanXml;
        } else {
          mainSpans += spanXml;
        }

        if (trimmed.endsWith(')')) {
          inParens = false;
        }
      });

      let content = mainSpans;
      if (bgSpans) {
        content += `<span ttm:role="x-bg">${bgSpans}</span>`;
      }

      pNodes += `      <p begin="${pBegin}" end="${pEnd}"${singerAttr}>\n        ${content}\n      </p>\n`;
    } else {
      const lineText = escapeXml(line.text.trim());
      pNodes += `      <p begin="${pBegin}" end="${pEnd}"${singerAttr}>${lineText}</p>\n`;
    }
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xmlns:itunes="http://music.apple.com/metadata">
  <head>
    <metadata>
      <ttm:title>${escapeXml(title)}</ttm:title>
${agentsXml}    </metadata>
  </head>
  <body>
    <div>
${pNodes}    </div>
  </body>
</tt>`;
}
