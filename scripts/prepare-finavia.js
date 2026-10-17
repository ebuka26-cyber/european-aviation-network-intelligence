#!/usr/bin/env node
// Builds data/processed/FactHelsinkiAnnual.csv from Finavia's "Helsinki Airport passengers 1998-2025" workbook.
//
// Usage:
//   node scripts/prepare-finavia.js "<path to Helsinki Airport passengers 1998-2025-fi-fi.xlsx>" [output folder]
//
//   The output folder defaults to data/processed.
//
// The workbook has one sheet: a title in A1, group headers in row 2 (Domestic B:E, International F:I,
// GRAND TOTAL J:M), component headers in row 3 and one row per year from row 4. The script writes one
// row per year and traffic type (Domestic, International) with the four published measures. The GRAND
// TOTAL block is not loaded; it is used only for the DQ_YearReconcilesWithGrandTotal check.
// Years after 2025 are skipped, because the model's year table ends in 2025.
// The build stops if the layout differs, a year is missing or duplicated, or a value is not a whole
// non-negative number. Blank cells stay empty (null), never 0.
'use strict';
const fs = require('fs');
const path = require('path');
const { readWorkbook } = require('./xlsx-reader');

const LAST_YEAR = 2025;
const COMPONENTS = ['Arrival passengers', 'Departure passengers', 'Transfer passengers', 'Total'];
const COLUMNS = ['Year', 'AirportICAO', 'FinaviaAirportName', 'TrafficType', 'ArrivalPassengers', 'DeparturePassengers',
  'TransferPassengers', 'TotalPassengers', 'InAnalysisWindow', 'DQ_TotalMatchesComponents', 'DQ_YearReconcilesWithGrandTotal',
  'SourceDataset', 'SourceFile', 'SourceSheet', 'SourceRow', 'SourceColumns', 'SourceRetrievedUTC'];
const UNQUOTED = new Set(['Year', 'ArrivalPassengers', 'DeparturePassengers', 'TransferPassengers', 'TotalPassengers',
  'InAnalysisWindow', 'DQ_TotalMatchesComponents', 'DQ_YearReconcilesWithGrandTotal', 'SourceRow']);

const fail = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };
const text = (v) => (v === null || v === undefined ? '' : String(v).trim());
const cols = (from) => { const i = from.charCodeAt(0); return [0, 1, 2, 3].map((k) => String.fromCharCode(i + k)); };
const csvField = (col, v) => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (UNQUOTED.has(col)) return String(v);
  return '"' + String(v).replace(/"/g, '""') + '"';
};

function main() {
  const [file, outArg] = process.argv.slice(2);
  if (!file) fail('usage: node scripts/prepare-finavia.js "<Helsinki Airport passengers workbook .xlsx>" [output folder]');
  const outDir = outArg || path.join(__dirname, '..', 'data', 'processed');
  const wb = readWorkbook(file);
  const sheetName = wb.sheetNames.includes('Page1_1') ? 'Page1_1' : wb.sheetNames[0];
  const s = wb.sheet(sheetName);

  // Layout guards
  const title = /^HELSINKI AIRPORT PASSENGERS (\d{4})-(\d{4})$/.exec(text(s.cell('A1')).toUpperCase());
  if (!title) fail(`A1 should read "HELSINKI AIRPORT PASSENGERS <first>-<last>", found "${text(s.cell('A1'))}"`);
  if (text(s.cell('B2')) !== 'Domestic' || text(s.cell('F2')) !== 'International' || text(s.cell('J2')).toUpperCase() !== 'GRAND TOTAL') {
    fail('row 2 should hold the groups Domestic (B), International (F) and GRAND TOTAL (J)');
  }
  const groups = { D: cols('B'), I: cols('F'), G: cols('J') };
  for (const g of Object.values(groups)) g.forEach((c, k) => { if (text(s.cell(c + '3')) !== COMPONENTS[k]) fail(`${c}3 should read "${COMPONENTS[k]}"`); });

  const num = (ref) => {
    const v = s.cell(ref);
    if (v === null || text(v) === '') return null;
    const n = typeof v === 'number' ? v : Number(text(v));
    if (!Number.isInteger(n) || n < 0) fail(`${ref}: expected a whole non-negative number, found ${JSON.stringify(v)}`);
    return n;
  };

  const years = [];
  for (let r = 4; r <= s.maxRow; r++) {
    const y = text(s.cell('A' + r));
    if (!/^\d{4}$/.test(y)) continue;
    const vals = {};
    for (const [g, cs] of Object.entries(groups)) vals[g] = cs.map((c) => num(c + r));
    years.push({ year: Number(y), row: r, vals });
  }
  const list = years.map((y) => y.year);
  if (!list.length || list[0] !== 1998 || new Set(list).size !== list.length || list[list.length - 1] - list[0] + 1 !== list.length) {
    fail('years must be unique and consecutive from 1998');
  }

  const retrieved = fs.statSync(file).mtime.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const out = [];
  for (const { year, row, vals } of years) {
    if (year > LAST_YEAR) { console.log(`skipped ${year} (the model covers 1998-${LAST_YEAR})`); continue; }
    const reconciles = [0, 1, 2, 3].every((k) => vals.D[k] !== null && vals.I[k] !== null && vals.G[k] !== null && vals.D[k] + vals.I[k] === vals.G[k]);
    for (const [type, g, range] of [['Domestic', 'D', 'B:E'], ['International', 'I', 'F:I']]) {
      const [arr, dep, trf, tot] = vals[g];
      out.push({
        Year: year, AirportICAO: 'EFHK', FinaviaAirportName: 'Helsinki Airport', TrafficType: type,
        ArrivalPassengers: arr, DeparturePassengers: dep, TransferPassengers: trf, TotalPassengers: tot,
        InAnalysisWindow: year >= 2022 && year <= 2025,
        DQ_TotalMatchesComponents: [arr, dep, trf, tot].includes(null) ? null : arr + dep + trf === tot,
        DQ_YearReconcilesWithGrandTotal: reconciles,
        SourceDataset: `Finavia Helsinki Airport passengers ${title[1]}-${title[2]}`,
        SourceFile: 'Finavia/' + path.basename(file), SourceSheet: sheetName, SourceRow: row, SourceColumns: range,
        SourceRetrievedUTC: retrieved,
      });
    }
  }
  const lines = [COLUMNS.join(','), ...out.map((r) => COLUMNS.map((c) => csvField(c, r[c])).join(','))];
  const target = path.join(outDir, 'FactHelsinkiAnnual.csv');
  fs.writeFileSync(target, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');
  console.log(`wrote ${target}: ${out.length} rows (${out.length / 2} years)`);
}

main();
