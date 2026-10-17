# Quality assurance and validation

Every page was validated in Power BI Desktop: rendered values were compared with DAX queries on the loaded model and with expected values computed independently from the cleaned CSV files during the data audit.

## Model integrity
- 11 tables, 12 relationships (11 active, 1 inactive) and 79 measures, confirmed with the DAX `INFO.TABLES`, `INFO.RELATIONSHIPS` and `INFO.MEASURES` functions.
- All 79 measures evaluate without errors for 2022, 2023, 2024 and 2025. Blanks appear only where expected: growth for 2022 (no prior year), route measures for 2025 (no route data) and single-selection measures such as ranks.
- Report files pass the Power BI report (PBIR) schema validation with no errors or warnings, and every field reference resolves to the model.

## Benchmarks
| Check | Expected | Dashboard |
|---|---|---|
| Passengers 2025 (Eurostat, passengers carried) | 146.9 million | 146.9M |
| Like-for-like passenger growth 2023 / 2024 / 2025 | +14.63% / +4.62% / +3.38% | +14.6% / +4.6% / +3.4% |
| Airports reporting 2022 / 2023 / 2024 / 2025 | 76 / 73 / 73 / 72 | Same |
| Load factor 2025 | 75.8% (+1.3 pp) | Same |
| Growth by country 2025 | DK +4.7%, FI +4.4%, NO +3.0%, SE +2.0% | Same |
| Route passengers 2024 | 85.7 million | 85.70M |
| Route growth 2024, constant panel against reported totals | +5.9% against +7.3% | Same |
| Confidential route-months 2022 / 2023 / 2024 | 1,148 / 1,505 / 1,429 | Same |
| Airport-months excluded from load factor | 79 | 79 |
| Avinor against Eurostat ratio, 2022-2025 | 0.997 to 1.003 | Same |
| Finavia against Eurostat ratio (Helsinki), 2022-2025 | 0.993 to 0.994 (Finavia excludes infants) | Same |
| Helsinki 2025: passengers, recovery against 2019 | 16.98 million, 77.7% | Same |

## End-to-end tests
| Area | Test | Result |
|---|---|---|
| Navigation | Page tabs; Executive Overview opens first; tooltip pages hidden from navigation | Pass |
| Slicers | Year (synced across Pages 1, 2 and 4), country, airport, route scope, year range and multi-year selections | Pass |
| Drill-through | Airport map bubble to Airport Performance, and back | Pass |
| Tooltips | Airport, route and growth-coverage tooltips match DAX for several airports, routes and years | Pass |
| Confidentiality | Norwegian domestic routes stay blank (never zero) on pages, tooltips and in DAX | Pass |
| Missing values | 2022 (no prior year) and 2025 (no route data) show notes or n/a instead of misleading zeros | Pass |

## Reproducibility checks (publication package)
| Check | Result |
|---|---|
| Package opened in Power BI Desktop from a fresh copy, DataFolder set to `data/processed`, full refresh | Pass: 11 tables, 12 relationships, 79 measures; 3,496 airport-month and 42,001 route-month rows; 2025 passengers 146,867,271 (+3.4%), 2024 route passengers 85,702,782, 4,082 confidential route-months |
| Same refresh with the header-only Avinor and Finavia placeholders | Pass: the refresh completes; Pages 1, 2, 3 and 6 work; Pages 4 and 5 are empty |
| `scripts/prepare-avinor.js` and `scripts/prepare-finavia.js` on the workbooks downloaded for the project | Pass: identical to the original tables in every value, flag and lineage column (2,064 and 56 rows); only `SourceRetrievedUTC` reflects the copy time |
| Refresh after running both scripts | Pass: Avinor 2025 terminal passengers 53,046,987 (+3.4%), international share 43.0%, transfer share 16.9%, 632,113 movements; Helsinki 2025 16,980,287 passengers, 77.7% of 2019, transfer share 16.3% |
| Same package in a folder whose full file paths exceed 260 characters | Pages open empty, because Power BI Desktop skips the visual files; the README asks for a short folder path |

## Known limitations
- Route data end in December 2024.
- Norwegian domestic routes are confidential at Eurostat.
- Very small or closing airports can show extreme growth rates; the values are correct (for example, Thisted 2024 -100% after it reported no passengers from March 2024).
- One very long destination name ("Rome–Fiumicino Leonardo da Vinci International Airport") is shortened with "..." in one airport's destination chart; the full name appears on hover.
- The "Key findings, 2025" box on the Executive Overview is a fixed summary of 2025 and says so on the page.
- The Avinor and Finavia data are not redistributed; Pages 4 and 5 need the publishers' files and the two scripts.
