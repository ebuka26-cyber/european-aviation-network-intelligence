#!/usr/bin/env node
// Builds data/processed/FactAvinorMonthly.csv from Avinor's monthly traffic statistics workbooks.
//
// Usage:
//   node scripts/prepare-avinor.js <folder with the Avinor .xlsx files> [output folder]
//
//   The output folder defaults to data/processed. It must contain DimAirport_Final.csv,
//   which maps Avinor's IATA codes to the ICAO codes used in the model.
//
// One workbook per month, 2022-01 to 2025-12 (48 files). File names do not matter: the month is
// read from the sheet names. Only the two monthly airport sheets are used ("PAX <Month> - <Year>
// (monthly)" and "Mvt <Month> - <Year> (monthly)"). Year-to-date, key figure, comparison and
// freight sheets, and the percentage-change columns, are not loaded.
//
// Rules (see docs/DATA_MODEL.md and data/dictionaries/FactAvinorMonthly_Data_Dictionary.xlsx):
//   - one row per airport and month; every airport listed in either monthly sheet gets a row
//   - blank cells stay empty (null), published zeros stay 0; nothing is estimated
//   - the build stops if a workbook layout is unknown, a month is missing or duplicated,
//     a value is not a whole non-negative number, or one of the six row identities fails
'use strict';
const fs = require('fs');
const path = require('path');
const { readWorkbook } = require('./xlsx-reader');

const FIRST = '2022-01', LAST = '2025-12';
const BASE_URL = 'https://om.avinor.no/siteassets/om-avinor/trafikkstatistikk/';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The ten Avinor airports that were added to the airport dimension from OurAirports.
// Værøy (VRY) has no icao_code in OurAirports; ENVR is its ident and gps_code.
const FROM_OURAIRPORTS_ICAO = new Set(['BJF', 'BVG', 'FDE', 'HVG', 'MEH', 'RET', 'RRS', 'SDN', 'SOJ']);
const FROM_OURAIRPORTS_IDENT = new Set(['VRY']);

const PAX_FIELDS = [
  ['DomesticPaxArrDep', 'C'], ['DomesticPaxTransfer', 'D'], ['DomesticPax', 'E'],
  ['InternationalPaxArrDep', 'G'], ['InternationalPaxTransfer', 'H'], ['InternationalPax', 'I'],
  ['OffshorePax', 'K'], ['TerminalPax', 'M'], ['TransitPax', 'O'], ['TotalPax', 'P'],
];
const MVT_FIELDS = {
  'MVT-L1': [['DomesticCommercialMovements', 'C'], ['InternationalCommercialMovements', 'E'], ['OffshoreCommercialMovements', 'G'],
    ['CommercialMovements', 'I'], ['OtherCivilMovements', 'K'], ['TotalMovements', 'M']],
  'MVT-L2': [['DomesticCommercialMovements', 'C'], ['InternationalCommercialMovements', 'E'], ['OffshoreCommercialMovements', 'G'],
    ['CommercialMovements', 'H'], ['OtherCivilMovements', 'J'], ['TotalMovements', 'L']],
};
const MEASURES = [...PAX_FIELDS.map((f) => f[0]), ...MVT_FIELDS['MVT-L1'].map((f) => f[0])];
const COLUMNS = ['AirportICAO', 'AirportIATA', 'AvinorAirportName', 'MonthStart', 'Period', ...MEASURES,
  'PassengerRowPublished', 'MovementRowPublished', 'DQ_NoTrafficDataPublished', 'DQ_MovementsWithoutPassengers',
  'ICAOMappingSource', 'DQ_Notes', 'SourceFile', 'SourceSheetPassengers', 'SourceSheetMovements',
  'SourceLayoutPassengers', 'SourceLayoutMovements', 'SourceURL', 'SourceRetrievedUTC'];
const UNQUOTED = new Set(['MonthStart', ...MEASURES, 'PassengerRowPublished', 'MovementRowPublished',
  'DQ_NoTrafficDataPublished', 'DQ_MovementsWithoutPassengers']);

const fail = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };
const text = (v) => (v === null || v === undefined ? '' : String(v).trim());

function sheetPeriod(name) {
  const month = MONTHS.findIndex((m) => new RegExp(`\\b${m}\\b`, 'i').test(name));
  const year = /\b(20\d\d)\b/.exec(name);
  return month >= 0 && year ? `${year[1]}-${String(month + 1).padStart(2, '0')}` : null;
}

function headerRow(sheet) {
  for (let r = 1; r <= 12; r++) if (text(sheet.cell('A' + r)) === 'Airport') return r;
  fail(`${sheet.name}: no header row starting with "Airport"`);
}

function paxLayout(sheet) {
  const h = headerRow(sheet);
  if (text(sheet.cell('C' + h)) === 'Arr/dep') return 'PAX-L1';
  if (text(sheet.cell('C' + h)) !== 'Number') fail(`${sheet.name}: unknown passenger layout`);
  return text(sheet.cell('D' + h)) === 'Change' ? 'PAX-L2' : 'PAX-L3';
}

function mvtLayout(sheet) {
  const h = headerRow(sheet);
  const label = text(sheet.cell('H' + h));
  if (label === 'Change') return 'MVT-L1';
  if (label === 'Number') return 'MVT-L2';
  fail(`${sheet.name}: unknown movement layout`);
}

function value(sheet, ref) {
  const v = sheet.cell(ref);
  if (v === null || (typeof v === 'string' && v.trim() === '')) return null;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) fail(`${sheet.name} ${ref}: expected a whole non-negative number, found ${JSON.stringify(v)}`);
  return v;
}

function airportRows(sheet, fields) {
  const rows = new Map();
  for (let r = headerRow(sheet) + 1; r <= sheet.maxRow; r++) {
    const code = text(sheet.cell('B' + r));
    if (!/^[A-Z]{3}$/.test(code)) continue;
    if (rows.has(code)) fail(`${sheet.name}: airport ${code} appears twice`);
    const rec = { name: text(sheet.cell('A' + r)) };
    for (const [field, col] of fields) rec[field] = value(sheet, col + r);
    rows.set(code, rec);
  }
  return rows;
}

function loadIcaoMap(dimFile) {
  if (!fs.existsSync(dimFile)) fail(`${dimFile} not found (it is part of the repository's data/processed folder)`);
  const lines = fs.readFileSync(dimFile, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const parse = (line) => [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)].map((m) => (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]));
  const head = parse(lines[0]);
  const iIcao = head.indexOf('AirportICAO'), iIata = head.indexOf('AirportIATA'), iCountry = head.indexOf('CountryCode');
  const map = new Map();
  for (const line of lines.slice(1)) {
    const f = parse(line);
    if (f[iCountry] === 'NO' && f[iIata]) map.set(f[iIata], f[iIcao]);
  }
  return map;
}

const csvField = (col, v) => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (UNQUOTED.has(col)) return String(v);
  return '"' + String(v).replace(/"/g, '""') + '"';
};

function main() {
  const [inDir, outArg] = process.argv.slice(2);
  if (!inDir) fail('usage: node scripts/prepare-avinor.js <folder with the Avinor .xlsx files> [output folder]');
  const outDir = outArg || path.join(__dirname, '..', 'data', 'processed');
  const icao = loadIcaoMap(path.join(outDir, 'DimAirport_Final.csv'));

  const files = fs.readdirSync(inDir).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$')).sort();
  const byPeriod = new Map();
  for (const file of files) {
    const wb = readWorkbook(path.join(inDir, file));
    const pax = wb.sheetNames.filter((n) => /^pax\b/i.test(n) && /\(monthly\)/i.test(n));
    const mvt = wb.sheetNames.filter((n) => /^mvt\b/i.test(n) && /\(monthly\)/i.test(n));
    if (pax.length !== 1 || mvt.length !== 1) fail(`${file}: expected one monthly PAX sheet and one monthly Mvt sheet`);
    const period = sheetPeriod(pax[0]);
    if (!period || sheetPeriod(mvt[0]) !== period) fail(`${file}: the two monthly sheets do not name the same month`);
    const prefix = /^(\d{4})-(\d{2})__/.exec(file);
    if (prefix && `${prefix[1]}-${prefix[2]}` !== period) fail(`${file}: file name month differs from the sheet month ${period}`);
    if (period < FIRST || period > LAST) { console.log(`skipped ${file} (${period} is outside ${FIRST} to ${LAST})`); continue; }
    if (byPeriod.has(period)) fail(`${period} appears in two files (${byPeriod.get(period).file} and ${file}); keep one file per month`);
    byPeriod.set(period, { file, wb, pax: pax[0], mvt: mvt[0] });
  }
  const expected = [];
  for (let y = 2022; y <= 2025; y++) for (let m = 1; m <= 12; m++) expected.push(`${y}-${String(m).padStart(2, '0')}`);
  const missing = expected.filter((p) => !byPeriod.has(p));
  if (missing.length) fail(`missing months: ${missing.join(', ')}`);

  const out = [];
  for (const period of expected) {
    const { file, wb, pax, mvt } = byPeriod.get(period);
    const paxSheet = wb.sheet(pax), mvtSheet = wb.sheet(mvt);
    const pl = paxLayout(paxSheet), ml = mvtLayout(mvtSheet);
    const paxRows = airportRows(paxSheet, PAX_FIELDS), mvtRows = airportRows(mvtSheet, MVT_FIELDS[ml]);
    const name = path.basename(file).replace(/^\d{4}-\d{2}__/, '');
    const url = BASE_URL + (period < '2024-01' ? period.slice(0, 4) + '/' : '') + name;
    const retrieved = fs.statSync(path.join(inDir, file)).mtime.toISOString().replace(/\.\d{3}Z$/, 'Z');
    for (const code of new Set([...paxRows.keys(), ...mvtRows.keys()])) {
      const p = paxRows.get(code), m = mvtRows.get(code);
      const row = { AirportIATA: code, AvinorAirportName: (p || m).name, MonthStart: period + '-01', Period: period };
      for (const f of MEASURES) row[f] = (p && p[f] !== undefined ? p[f] : null) ?? (m && m[f] !== undefined ? m[f] : null);
      const z = (f) => row[f] || 0;
      const identities = [
        z('DomesticPaxArrDep') + z('DomesticPaxTransfer') === z('DomesticPax'),
        z('InternationalPaxArrDep') + z('InternationalPaxTransfer') === z('InternationalPax'),
        z('DomesticPax') + z('InternationalPax') + z('OffshorePax') === z('TerminalPax'),
        z('TerminalPax') + z('TransitPax') === z('TotalPax'),
        z('DomesticCommercialMovements') + z('InternationalCommercialMovements') + z('OffshoreCommercialMovements') === z('CommercialMovements'),
        z('CommercialMovements') + z('OtherCivilMovements') === z('TotalMovements'),
      ];
      if (identities.includes(false)) fail(`${file} ${code}: a published total does not equal the sum of its parts`);
      row.AirportICAO = icao.get(code);
      if (!row.AirportICAO) fail(`${file}: airport ${code} is not in DimAirport_Final.csv`);
      row.ICAOMappingSource = FROM_OURAIRPORTS_IDENT.has(code) ? 'OurAirports ident and gps_code (icao_code blank)'
        : FROM_OURAIRPORTS_ICAO.has(code) ? 'OurAirports icao_code (IATA match)' : 'DimAirport_Extended (IATA match)';
      row.PassengerRowPublished = !!p;
      row.MovementRowPublished = !!m;
      row.DQ_NoTrafficDataPublished = MEASURES.every((f) => row[f] === null);
      row.DQ_MovementsWithoutPassengers = z('TotalMovements') > 0 && z('TotalPax') === 0;
      const mvtBlank = m && MVT_FIELDS[ml].every(([f]) => m[f] === null);
      row.DQ_Notes = [
        !p && 'NO_PASSENGER_ROW_PUBLISHED', !m && 'NO_MOVEMENT_ROW_PUBLISHED', mvtBlank && 'MOVEMENT_ROW_ALL_BLANK',
        row.DQ_MovementsWithoutPassengers && 'MOVEMENTS_WITHOUT_PASSENGERS',
        FROM_OURAIRPORTS_IDENT.has(code) && 'ICAO_FROM_OURAIRPORTS_IDENT',
      ].filter(Boolean).join(';') || null;
      Object.assign(row, {
        SourceFile: 'Avinor/' + path.basename(file), SourceSheetPassengers: p ? pax : null, SourceSheetMovements: m ? mvt : null,
        SourceLayoutPassengers: pl, SourceLayoutMovements: ml, SourceURL: url, SourceRetrievedUTC: retrieved,
      });
      out.push(row);
    }
  }
  out.sort((a, b) => (a.MonthStart < b.MonthStart ? -1 : a.MonthStart > b.MonthStart ? 1 : a.AirportICAO < b.AirportICAO ? -1 : a.AirportICAO > b.AirportICAO ? 1 : 0));
  const keys = new Set(out.map((r) => r.AirportICAO + '|' + r.MonthStart));
  if (keys.size !== out.length) fail('duplicate airport-month keys');

  const lines = [COLUMNS.join(','), ...out.map((r) => COLUMNS.map((c) => csvField(c, r[c])).join(','))];
  const target = path.join(outDir, 'FactAvinorMonthly.csv');
  fs.writeFileSync(target, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');
  console.log(`wrote ${target}: ${out.length} rows (${byPeriod.size} months, ${new Set(out.map((r) => r.AirportICAO)).size} airports)`);
}

main();
