// Minimal, dependency-free reader for .xlsx workbooks (Office Open XML).
// Reads sheet names and cell values (numbers, shared strings, inline strings, booleans).
// Usage: const { readWorkbook } = require('./xlsx-reader');
//        const wb = readWorkbook('file.xlsx');  wb.sheetNames; wb.sheet(name) -> { cell('B4'), rows }
'use strict';
const fs = require('fs');
const zlib = require('zlib');

function unzip(buf) {
  // Find the End of Central Directory record (signature 0x06054b50).
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a zip file (no end of central directory)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip central directory');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    files.set(name, { method, csize, dataStart });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return (name) => {
    const f = files.get(name);
    if (!f) return null;
    const raw = buf.subarray(f.dataStart, f.dataStart + f.csize);
    if (f.method === 0) return raw.toString('utf8');
    if (f.method === 8) return zlib.inflateRawSync(raw).toString('utf8');
    throw new Error(`Unsupported zip compression method ${f.method} for ${name}`);
  };
}

const decode = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// Text of an <si> or <is> element: concatenate every <t> run, ignoring phonetic runs (<rPh>).
const textOf = (xml) => {
  const clean = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  for (const m of clean.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) out += m[1] ? decode(m[1]) : '';
  return out;
};

const colIndex = (letters) => [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
const colLetters = (index) => { let s = ''; for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };

function readWorkbook(filePath) {
  const get = unzip(fs.readFileSync(filePath));
  const wbXml = get('xl/workbook.xml');
  if (!wbXml) throw new Error(`${filePath}: not an .xlsx workbook`);
  const relsXml = get('xl/_rels/workbook.xml.rels') || '';
  const rels = {};
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[1]); const target = /\bTarget="([^"]+)"/.exec(m[1]);
    if (id && target) rels[id[1]] = target[1];
  }
  const sheets = [];
  for (const m of wbXml.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = /\bname="([^"]*)"/.exec(m[1]); const rid = /\br:id="([^"]+)"/.exec(m[1]);
    if (!name || !rid) continue;
    let target = rels[rid[1]];
    target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
    sheets.push({ name: decode(name[1]), path: target });
  }
  const ssXml = get('xl/sharedStrings.xml') || '';
  const shared = [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));

  const cache = new Map();
  function sheet(name) {
    if (cache.has(name)) return cache.get(name);
    const meta = sheets.find((s) => s.name === name);
    if (!meta) throw new Error(`${filePath}: sheet "${name}" not found`);
    const xml = get(meta.path) || '';
    const cells = new Map();
    let maxRow = 0, maxCol = 0;
    for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1]; const body = m[2] || '';
      const ref = /\br="([A-Z]+)(\d+)"/.exec(attrs);
      if (!ref) continue;
      const type = (/\bt="([^"]+)"/.exec(attrs) || [])[1] || 'n';
      const v = /<v>([\s\S]*?)<\/v>/.exec(body);
      let value = null;
      if (type === 's') value = v ? shared[parseInt(v[1], 10)] : null;
      else if (type === 'inlineStr') value = textOf(body);
      else if (type === 'str') value = v ? decode(v[1]) : null;
      else if (type === 'b') value = v ? v[1] === '1' : null;
      else if (type === 'e') value = v ? { error: decode(v[1]) } : null;
      else value = v ? Number(v[1]) : null;
      if (value === null || value === '') continue;
      const r = parseInt(ref[2], 10), c = colIndex(ref[1]);
      cells.set(ref[1] + ref[2], value);
      if (r > maxRow) maxRow = r; if (c > maxCol) maxCol = c;
    }
    const s = {
      name, maxRow, maxCol,
      cell: (refText) => (cells.has(refText) ? cells.get(refText) : null),
      at: (row, col) => { const k = colLetters(col) + row; return cells.has(k) ? cells.get(k) : null; },
    };
    cache.set(name, s);
    return s;
  }
  return { sheetNames: sheets.map((s) => s.name), sheet };
}

module.exports = { readWorkbook, colIndex, colLetters };
