# Data sources, licences and attribution

The dashboard combines public data from four publishers. This repository redistributes only the Eurostat and OurAirports data. The Avinor and Finavia data are **not included**, because permission to redistribute them has not been confirmed. Users download those files from the publishers and build the two tables with the scripts in [`scripts`](scripts) (steps in the [README](README.md#add-the-avinor-and-finavia-data)).

| Source | What was used | Retrieved | In this repository | Licence or terms | Attribution |
|---|---|---|---|---|---|
| Eurostat | `avia_tf_aca`, `avia_tf_ala`, `avia_par_dk`, `avia_par_fi`, `avia_par_no`, `avia_par_se` | 2026-09-27 | Yes: `FactAirportMonthly.csv`, `FactRouteMonthly.csv`, codes in `DimAirport_Final.csv` | [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/), under the [Eurostat copyright notice](https://ec.europa.eu/eurostat/help/copyright-notice) | "Source: Eurostat", with the dataset codes and access date; changes are stated below |
| OurAirports | `airports.csv`, `countries.csv` | 2026-09-27 | Yes: `DimAirport_Final.csv` | [Public domain](https://ourairports.com/data/) | Not required; credited as "Airport reference data: OurAirports" |
| Avinor | Monthly traffic statistics (passengers and movements), 2022-01 to 2025-12, 48 workbooks | 2026-09-27 and 2026-10-09 | **No** (header-only placeholder `FactAvinorMonthly.csv`) | Published on Avinor's website; no open-data licence was found for these files | "Source: Avinor" on the Norway page and wherever its figures are quoted |
| Finavia | Helsinki Airport passengers 1998-2025 | 2026-09-27 | **No** (header-only placeholder `FactHelsinkiAnnual.csv`) | Published on Finavia's website, which asks users to name the source | "Source: Finavia Corp." on the Helsinki page and wherever its figures are quoted |

## Official downloads for the excluded data
| Publisher | Page | File(s) |
|---|---|---|
| Avinor | Traffic statistics ("Trafikkstatistikk"): [om.avinor.no/om-oss/trafikkstatistikk](https://om.avinor.no/om-oss/trafikkstatistikk/) | One Excel workbook per month ("Trafikktall"), January 2022 to December 2025. The files are stored under `https://om.avinor.no/siteassets/om-avinor/trafikkstatistikk/`, for example [`2022/202201_stat_avinor.xlsx`](https://om.avinor.no/siteassets/om-avinor/trafikkstatistikk/2022/202201_stat_avinor.xlsx) |
| Finavia | Traffic statistics: [English](https://www.finavia.fi/en/about-finavia/about-air-traffic/traffic-statistics), [Finnish](https://www.finavia.fi/fi/tietoa-finaviasta/tietoa-lentoliikenteesta/liikennetilastot) | Long-term statistics: [Helsinki Airport passengers 1998-2025](https://www.finavia.fi/sites/default/files/documents/Helsinki%20Airport%20passengers%201998-2025-fi-fi.xlsx) (arrival, departure and transfer passengers on domestic and international flights) |

Use of the downloaded files is subject to the publishers' own terms. Generated tables should not be redistributed without the publisher's permission.

## Eurostat datasets
| Code | Title (short) | Use in this project |
|---|---|---|
| [`avia_tf_aca`](https://ec.europa.eu/eurostat/databrowser/view/avia_tf_aca/default/table?lang=en) | Air transport by reporting airport and aircraft model, monthly | Passengers on board, flights and seats for 76 Nordic airports (FactAirportMonthly) |
| [`avia_tf_ala`](https://ec.europa.eu/eurostat/databrowser/view/avia_tf_ala/default/table?lang=en) | Air transport by reporting airport and airline licence, monthly | Passengers carried, the headline passenger measure (FactAirportMonthly) |
| [`avia_par_dk`](https://ec.europa.eu/eurostat/databrowser/view/avia_par_dk/default/table?lang=en), [`avia_par_fi`](https://ec.europa.eu/eurostat/databrowser/view/avia_par_fi/default/table?lang=en), [`avia_par_no`](https://ec.europa.eu/eurostat/databrowser/view/avia_par_no/default/table?lang=en), [`avia_par_se`](https://ec.europa.eu/eurostat/databrowser/view/avia_par_se/default/table?lang=en) | Air passenger transport between the main airports of Denmark, Finland, Norway and Sweden and their partner airports, routes, monthly | Route network 2022-2024 (FactRouteMonthly) |

Citation: *Source: Eurostat, datasets avia_tf_aca, avia_tf_ala and avia_par_dk/fi/no/se, accessed 27 September 2026, licensed under CC BY 4.0. Data filtered and reshaped; Eurostat is not responsible for these changes.*

## Changes made to the source data
- Filtered to Sweden, Norway, Denmark and Finland (Eurostat airport data) and to the analysis window 2022-2025 (Finavia 1998-2025 kept for the Helsinki page).
- Aggregate rows (for example aircraft or licence totals) used once and not added to their parts; measures pivoted into columns; codes standardised (ICAO airport codes, ISO country codes).
- Known issues marked with `DQ_` flag columns rather than edited. No value was estimated, interpolated or replaced; Eurostat confidential values remain empty.
- Avinor and Finavia figures are kept on their own pages and compared with Eurostat only as ratios; sources are never added together.

## Notes
- **Eurostat.** Reuse for non-commercial purposes, such as this portfolio project, needs only the attribution above. The Eurostat notice sets extra conditions for some commercial reuse; check it before any commercial use.
- **Disclaimer.** The publishers are not responsible for the analysis, the processed files or any errors introduced in them. OurAirports data come with no guarantee of accuracy.
