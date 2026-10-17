# Data model

The semantic model (`powerbi/European_Aviation_Intelligence.SemanticModel`, TMDL format) is a star schema with **4 fact tables, 6 dimensions and 1 measure table** (11 tables), **12 relationships** and **79 measures**. All tables are imported.

## Design principles
- **One fact per source and grain.** Eurostat airport data, Eurostat route data, Avinor and Finavia have different definitions and grains, so they stay in separate facts with no fact-to-fact relationships. They are compared only through ratio measures.
- **Conformed dimensions.** `DimDate` and `DimYear` filter every fact; `DimAirport` filters the airport-level facts.
- **Role-playing airports for routes.** Routes have an origin and a destination, so `DimOriginAirport` and `DimDestinationAirport` are separate copies of the airport dimension. The reporting-airport relationship from `DimAirport` is inactive and used only inside measures with `USERELATIONSHIP`.
- **Single-direction, one-to-many relationships only.** No bidirectional or many-to-many relationships.
- **Flags, not edits.** Data-quality issues are `DQ_` columns in the facts; measures decide which rows they use.

## Tables
| Table | Source | Grain | Rows | Key columns |
|---|---|---|---|---|
| FactAirportMonthly | Eurostat `avia_tf_aca`, `avia_tf_ala` | Airport x month, 2022-2025 | 3,496 | AirportICAO, MonthStart, PassengersCarried, PassengersOnBoard, CommercialFlights, PassengerFlights, PassengerSeatsAvailable, DQ flags |
| FactRouteMonthly | Eurostat `avia_par_*` | Reporting airport x partner airport x direction x month, 2022-2024 | 42,001 | ReportingAirportICAO, OriginAirportICAO, DestinationAirportICAO, RouteKey, MonthStart, PassengersCarried, PassengersOnBoard, PassengerFlights, PassengerSeatsAvailable, ValueStatus, IsPrimaryReport, DQ flags |
| FactAvinorMonthly | Avinor | Airport x month, 2022-2025 | 2,064 | AirportICAO, MonthStart, DomesticPax, InternationalPax, OffshorePax, TerminalPax, TransitPax, CommercialMovements, DQ flags |
| FactHelsinkiAnnual | Finavia | Year x traffic type (domestic, international), 1998-2025 | 56 | Year, AirportICAO, Arrival, Departure, Transfer and Total passengers |
| DimAirport | OurAirports, plus one unknown-partner row | Airport | 215 | AirportICAO (key), AirportIATA, AirportName, CountryName, Latitude, Longitude, InFact* flags |
| DimOriginAirport | Built in Power Query from DimAirport | Airport (route airports only) | 185 | OriginAirportICAO (key), origin name, country, coordinates |
| DimDestinationAirport | Built in Power Query from DimAirport | Airport (route airports only) | 185 | DestinationAirportICAO (key), destination name, country, coordinates |
| DimRoute | Built in Power Query from FactRouteMonthly and DimAirport | Two-way route (sorted airport pair) | 645 | RouteKey (key), RouteName, RouteScope, DistanceKm (great-circle), DistanceBand |
| DimDate | Built in Power Query | Day, 2022-01-01 to 2025-12-31 | 1,461 | Date (key, marked as date table), MonthStart, Year, month and quarter labels |
| DimYear | Built in Power Query | Year, 1998-2025 | 28 | Year (key), InAnalysisWindow, source-availability flags |
| _Measures | | | | 79 measures in 6 display folders |

## Relationships
| # | From (many) | To (one) | Active |
|---|---|---|---|
| 1 | FactAirportMonthly[AirportICAO] | DimAirport[AirportICAO] | Yes |
| 2 | FactAvinorMonthly[AirportICAO] | DimAirport[AirportICAO] | Yes |
| 3 | FactHelsinkiAnnual[AirportICAO] | DimAirport[AirportICAO] | Yes |
| 4 | FactRouteMonthly[ReportingAirportICAO] | DimAirport[AirportICAO] | **No** (used with `USERELATIONSHIP` for airport-view route measures) |
| 5 | FactRouteMonthly[OriginAirportICAO] | DimOriginAirport[OriginAirportICAO] | Yes |
| 6 | FactRouteMonthly[DestinationAirportICAO] | DimDestinationAirport[DestinationAirportICAO] | Yes |
| 7 | FactRouteMonthly[RouteKey] | DimRoute[RouteKey] | Yes |
| 8 | FactAirportMonthly[MonthStart] | DimDate[Date] | Yes |
| 9 | FactRouteMonthly[MonthStart] | DimDate[Date] | Yes |
| 10 | FactAvinorMonthly[MonthStart] | DimDate[Date] | Yes |
| 11 | DimDate[Year] | DimYear[Year] | Yes |
| 12 | FactHelsinkiAnnual[Year] | DimYear[Year] | Yes |

Year slicers use `DimYear[Year]`, which filters the monthly facts through `DimDate` and the annual Helsinki fact directly.

## Data-quality flags used by the measures
| Flag | Meaning | Effect |
|---|---|---|
| `DQ_SE_JanFeb2022_FlightsSeatsIncomplete` | Sweden under-reported flights and seats in January and February 2022 | Excluded from flight, seat and load-factor measures |
| `DQ_CapacityValidForLoadFactor` | Passengers on board and seats share a basis and are plausible | Load factor uses only these rows (79 airport-months excluded) |
| `ValueStatus` = Confidential | Eurostat keeps the value confidential (Norwegian domestic routes) | Value stays blank; counted by the Confidential Route-Months measure |
| `IsPrimaryReport` | One report per flow and month when both airports report the same flow | Route totals use primary reports only |
| `DQ_ReportingAirportPartialCoverage` | Airport reports routes for only part of the period | Left out of like-for-like route growth |
| `DQ_NoTrafficDataPublished` | Avinor published no figure for the month | Blank, not zero |

## Power Query and the data folder
The four fact tables and the airport dimension are imported from CSV files in the folder named by the **DataFolder** parameter (`data/processed` in this repository). The remaining dimensions are built in Power Query (DimDate and DimYear are generated; DimRoute, DimOriginAirport and DimDestinationAirport come from the route fact and the airport dimension), so a refresh needs only the five CSV files.

In the repository, `FactAvinorMonthly.csv` and `FactHelsinkiAnnual.csv` hold only their header row, because the Avinor and Finavia data are not redistributed. The model still refreshes, and those two tables are empty until they are built with the scripts in [`scripts`](../scripts) (see the [README](../README.md#add-the-avinor-and-finavia-data)).
