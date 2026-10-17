# Data

## processed/
The CSV files the Power BI model loads (UTF-8, comma-separated, one header row). Point the **DataFolder** parameter in Power BI Desktop to this folder before refreshing.

| File | Rows | Grain | Source | Status |
|---|---|---|---|---|
| `FactAirportMonthly.csv` | 3,496 | Airport x month, 2022-01 to 2025-12 (76 airports) | Eurostat `avia_tf_aca`, `avia_tf_ala` | Included (CC BY 4.0) |
| `FactRouteMonthly.csv` | 42,001 | Reporting airport x partner airport x direction x month, 2022-01 to 2024-12 | Eurostat `avia_par_dk/fi/no/se` | Included (CC BY 4.0) |
| `DimAirport_Final.csv` | 215 | Airport (incl. one unknown-partner row) | OurAirports, Eurostat codes | Included (public domain and CC BY 4.0) |
| `FactAvinorMonthly.csv` | header only | Airport x month, 2022-01 to 2025-12 (43 airports; 2,064 rows when built) | Avinor monthly traffic statistics | **Placeholder.** Build it with `scripts/prepare-avinor.js` |
| `FactHelsinkiAnnual.csv` | header only | Year x traffic type, 1998-2025 (56 rows when built) | Finavia | **Placeholder.** Build it with `scripts/prepare-finavia.js` |

The two placeholders hold only the column names, so the model refreshes without them; the Norway and Helsinki pages stay empty until the files are built. Download steps: [README](../README.md#add-the-avinor-and-finavia-data).

Conventions:
- Empty cells are missing or confidential values, never zero. Eurostat confidential route values have `ValueStatus = Confidential`.
- Columns starting with `DQ_` are data-quality flags. No source value was edited; the flags tell the measures which rows to use.
- `Source*` columns record the source dataset, file and retrieval date for each row.

## dictionaries/
One Excel data dictionary per table: column definitions, data types, allowed values and the meaning of each `DQ_` flag. The Avinor and Finavia dictionaries describe the columns only and contain no data.

## Licences
Eurostat data: CC BY 4.0, "Source: Eurostat". OurAirports data: public domain. See [../DATA_SOURCES.md](../DATA_SOURCES.md) for attribution and terms.
