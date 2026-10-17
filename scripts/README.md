# Scripts

Two Node.js scripts build the Avinor and Finavia tables from the publishers' own workbooks. These tables are not included in the repository (see [../DATA_SOURCES.md](../DATA_SOURCES.md)).

| Script | Input | Output |
|---|---|---|
| `prepare-avinor.js` | A folder with Avinor's 48 monthly traffic statistics workbooks, January 2022 to December 2025 | `data/processed/FactAvinorMonthly.csv`, 2,064 rows x 34 columns |
| `prepare-finavia.js` | Finavia's "Helsinki Airport passengers 1998-2025" workbook | `data/processed/FactHelsinkiAnnual.csv`, 56 rows x 17 columns |
| `xlsx-reader.js` | | Small Excel (.xlsx) reader used by both scripts |

**Requirements:** [Node.js](https://nodejs.org/) 18 or later. No packages to install.

**Run** from the repository folder (download links in the [README](../README.md#add-the-avinor-and-finavia-data)):
```
node scripts/prepare-avinor.js "<folder with the Avinor workbooks>"
node scripts/prepare-finavia.js "<path to Helsinki Airport passengers 1998-2025-fi-fi.xlsx>"
```
An optional second argument sets another output folder; it must contain `DimAirport_Final.csv` for the Avinor script.

## What the scripts do
**Avinor**
- Reads the two monthly airport sheets in each workbook ("PAX ... (monthly)" and "Mvt ... (monthly)") and takes the month from the sheet names. Year-to-date, key figure, 2019 comparison and freight sheets, and the percentage-change columns, are not used.
- Recognises the three passenger layouts and two movement layouts Avinor used between 2022 and 2025.
- Writes one row per airport and month, maps IATA codes to ICAO codes with `DimAirport_Final.csv`, and adds the data-quality flags and lineage columns described in `data/dictionaries/FactAvinorMonthly_Data_Dictionary.xlsx`.

**Finavia**
- Checks the layout (title, group and column headers), reads one row per year and writes a Domestic and an International row with arrival, departure, transfer and total passengers. The GRAND TOTAL block is used only to check that the two rows add up.

**Both**
- Blank cells stay empty (null) and published zeros stay 0. Nothing is estimated or filled in.
- The build stops with a message if a month or year is missing or duplicated, the layout is unknown, a value is not a whole non-negative number, or a published total does not equal the sum of its parts.
- `SourceRetrievedUTC` is taken from the downloaded file's modification time.

## Validation
Run on the workbooks downloaded for this project, both scripts reproduce the tables used for the dashboard exactly: every value in all 2,064 Avinor rows and 56 Finavia rows, the flags and the lineage columns. The only difference is `SourceRetrievedUTC`, which reflects when the files were copied.

Avinor sometimes publishes a new version of a month's workbook. If you download the files today, a few figures can differ slightly from the screenshots in this repository.
