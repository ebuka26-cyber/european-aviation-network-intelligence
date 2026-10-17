# DAX measures

The model has **79 measures** in one measure table (`_Measures`), grouped in six display folders. Each measure carries an ID (A = airport, R = route, N = Norway/Avinor, H = Helsinki/Finavia, Q = data quality, L = labels) that the report pages, tooltips and quality rules refer to.

This file is generated from `powerbi/European_Aviation_Intelligence.SemanticModel/definition/tables/_Measures.tmdl`; the TMDL file is the source of truth.

| Display folder | Measures |
|---|---|
| 01 Airport Performance | 19 |
| 02 Route Intelligence | 22 |
| 03 Norway (Avinor) | 16 |
| 04 Helsinki (Finavia) | 11 |
| 05 Data Quality & Coverage | 7 |
| 06 Labels & Helpers | 4 |
| **Total** | **79** |

## 01 Airport Performance

| ID | Measure | Format | Description |
|---|---|---|---|
| A01 | Total Passengers | `#,##0` | Eurostat passengers carried at the selected airports (arrivals + departures). Summing airports counts a domestic passenger at both airports. Never add Avinor, Finavia or route passengers. |
| A02 | Total Passengers PY | `#,##0` | Total Passengers for the same months one year earlier. DimDate shifted back one year; DimYear filter removed. Blank for 2022 (no 2021 data). |
| A03 | Total Passengers LFL | `#,##0` | Helper: current passengers on airport-months that also have data one year earlier (like-for-like). |
| A04 | Total Passengers PY LFL | `#,##0` | Helper: prior-year passengers on the same airport-months as Total Passengers LFL. |
| A05 | Passenger Growth YoY % | `+0.0%;-0.0%;0.0%` | Like-for-like year-on-year change in passengers carried (MD-05). Blank for 2022. |
| A06 | Passenger Growth YoY % (Reported) | `+0.0%;-0.0%;0.0%` | Change in reported totals, without coverage adjustment. Use only beside Passenger Growth YoY % on the Data Quality page; label "reported totals, coverage changes included". |
| A07 | Commercial Flights | `#,##0` | Eurostat commercial air flights (passenger + all-cargo), arrivals + departures. Sweden Jan-Feb 2022 excluded (under-reported). Not the same figure as Avinor movements. |
| A08 | Passenger Flights | `#,##0` | Commercial passenger flights, arrivals + departures. Sweden Jan-Feb 2022 excluded. Part of Commercial Flights: never add the two. |
| A09 | Available Seats | `#,##0` | Seats offered on commercial passenger flights, arrivals + departures. Sweden Jan-Feb 2022 excluded (MD-07 option a). |
| A10 | Passengers On Board (LF basis) | `#,##0` | Hidden helper: passengers on board on rows valid for load factor. Never shown as a passenger total. |
| A11 | Seats (LF basis) | `#,##0` | Hidden helper: seats on the same rows valid for load factor. |
| A12 | Passenger Load Factor | `0.0%` | Passengers on board / seats on the same valid rows (ratio of sums). Excludes rows with DQ_CapacityValidForLoadFactor = FALSE, including Sweden Jan-Feb 2022. |
| A13 | Load Factor Change (pp) | `+0.0" pp";-0.0" pp"` | Change in load factor against the same months a year earlier, in percentage points (valid rows only). |
| A14 | Commercial Flights Growth YoY % | `+0.0%;-0.0%;0.0%` | Like-for-like change in commercial flights. Sweden Jan-Feb 2022 is excluded, so Jan-Feb 2023 Swedish pairs drop out of 2023 growth automatically. |
| A15 | Passengers per Passenger Flight | `#,##0.0` | Average passengers on board per passenger flight on the same valid rows (aircraft size and loading). |
| A16 | Nordic Passenger Share | `0.0%` | Share of all 76 Nordic airports' passengers held by the selected airports or country (airport filters removed in the denominator). Airport-statistics convention. |
| A17 | Airport Passenger Rank | `0` | Rank of an airport by passengers within the visible selection; blank when the airport has no data. Use with DimAirport[InFactAirportMonthly] = TRUE as a visual filter. |
| A18 | Airports Reporting | `0` | Number of airports with data in the selection (76, 73, 73, 72 by year). |
| A19 | Nordic Airport Passenger Rank | `\#0` | Rank of the selected airport by passengers among all reporting Nordic airports (1 = most passengers; ties share a rank). Airport filters, including a drill-through filter, are removed for the peer set; date and year filters are kept. Blank unless exactly one airport with data is selected. |

<details><summary>DAX expressions</summary>

**A01 Total Passengers**

```dax
Total Passengers = SUM ( FactAirportMonthly[PassengersCarried] )
```

**A02 Total Passengers PY**

```dax
Total Passengers PY =
CALCULATE (
    [Total Passengers],
    DATEADD ( DimDate[Date], -1, YEAR ),
    REMOVEFILTERS ( DimYear )
)
```

**A03 Total Passengers LFL**

```dax
Total Passengers LFL =
SUMX (
    SUMMARIZE ( FactAirportMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
    VAR Cur = [Total Passengers]
    VAR Prev = [Total Passengers PY]
    RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), Cur )
)
```

**A04 Total Passengers PY LFL**

```dax
Total Passengers PY LFL =
SUMX (
    SUMMARIZE ( FactAirportMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
    VAR Cur = [Total Passengers]
    VAR Prev = [Total Passengers PY]
    RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), Prev )
)
```

**A05 Passenger Growth YoY %**

```dax
Passenger Growth YoY % = DIVIDE ( [Total Passengers LFL] - [Total Passengers PY LFL], [Total Passengers PY LFL] )
```

**A06 Passenger Growth YoY % (Reported)**

```dax
Passenger Growth YoY % (Reported) = DIVIDE ( [Total Passengers] - [Total Passengers PY], [Total Passengers PY] )
```

**A07 Commercial Flights**

```dax
Commercial Flights =
CALCULATE (
    SUM ( FactAirportMonthly[CommercialFlights] ),
    KEEPFILTERS ( FactAirportMonthly[DQ_SE_JanFeb2022_FlightsSeatsIncomplete] = FALSE () )
)
```

**A08 Passenger Flights**

```dax
Passenger Flights =
CALCULATE (
    SUM ( FactAirportMonthly[PassengerFlights] ),
    KEEPFILTERS ( FactAirportMonthly[DQ_SE_JanFeb2022_FlightsSeatsIncomplete] = FALSE () )
)
```

**A09 Available Seats**

```dax
Available Seats =
CALCULATE (
    SUM ( FactAirportMonthly[PassengerSeatsAvailable] ),
    KEEPFILTERS ( FactAirportMonthly[DQ_SE_JanFeb2022_FlightsSeatsIncomplete] = FALSE () )
)
```

**A10 Passengers On Board (LF basis)**

```dax
Passengers On Board (LF basis) =
CALCULATE (
    SUM ( FactAirportMonthly[PassengersOnBoard] ),
    KEEPFILTERS ( FactAirportMonthly[DQ_CapacityValidForLoadFactor] = TRUE () )
)
isHidden
```

**A11 Seats (LF basis)**

```dax
Seats (LF basis) =
CALCULATE (
    SUM ( FactAirportMonthly[PassengerSeatsAvailable] ),
    KEEPFILTERS ( FactAirportMonthly[DQ_CapacityValidForLoadFactor] = TRUE () )
)
isHidden
```

**A12 Passenger Load Factor**

```dax
Passenger Load Factor = DIVIDE ( [Passengers On Board (LF basis)], [Seats (LF basis)] )
```

**A13 Load Factor Change (pp)**

```dax
Load Factor Change (pp) =
VAR Cur = [Passenger Load Factor]
VAR Prev =
    CALCULATE ( [Passenger Load Factor], DATEADD ( DimDate[Date], -1, YEAR ), REMOVEFILTERS ( DimYear ) )
RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), ( Cur - Prev ) * 100 )
```

**A14 Commercial Flights Growth YoY %**

```dax
Commercial Flights Growth YoY % =
VAR T =
    ADDCOLUMNS (
        SUMMARIZE ( FactAirportMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
        "@Cur", [Commercial Flights],
        "@Prev", CALCULATE ( [Commercial Flights], DATEADD ( DimDate[Date], -1, YEAR ), REMOVEFILTERS ( DimYear ) )
    )
VAR Cur = SUMX ( FILTER ( T, NOT ISBLANK ( [@Cur] ) && NOT ISBLANK ( [@Prev] ) ), [@Cur] )
VAR Prev = SUMX ( FILTER ( T, NOT ISBLANK ( [@Cur] ) && NOT ISBLANK ( [@Prev] ) ), [@Prev] )
RETURN DIVIDE ( Cur - Prev, Prev )
```

**A15 Passengers per Passenger Flight**

```dax
Passengers per Passenger Flight =
DIVIDE (
    [Passengers On Board (LF basis)],
    CALCULATE ( SUM ( FactAirportMonthly[PassengerFlights] ), KEEPFILTERS ( FactAirportMonthly[DQ_CapacityValidForLoadFactor] = TRUE () ) )
)
```

**A16 Nordic Passenger Share**

```dax
Nordic Passenger Share = DIVIDE ( [Total Passengers], CALCULATE ( [Total Passengers], REMOVEFILTERS ( DimAirport ) ) )
```

**A17 Airport Passenger Rank**

```dax
Airport Passenger Rank =
IF (
    NOT ISBLANK ( [Total Passengers] ),
    RANKX ( ALLSELECTED ( DimAirport[AirportName] ), [Total Passengers], , DESC, DENSE )
)
```

**A18 Airports Reporting**

```dax
Airports Reporting = DISTINCTCOUNT ( FactAirportMonthly[AirportICAO] )
```

**A19 Nordic Airport Passenger Rank**

```dax
Nordic Airport Passenger Rank =
VAR CurPax = [Total Passengers]
RETURN
    IF (
        HASONEVALUE ( DimAirport[AirportName] ) && NOT ISBLANK ( CurPax ),
        VAR Peers =
            CALCULATETABLE (
                ADDCOLUMNS ( VALUES ( DimAirport[AirportName] ), "@Pax", [Total Passengers] ),
                REMOVEFILTERS ( DimAirport ),
                DimAirport[InFactAirportMonthly] = TRUE ()
            )
        RETURN COUNTROWS ( FILTER ( Peers, [@Pax] > CurPax ) ) + 1
    )
```

</details>

## 02 Route Intelligence

| ID | Measure | Format | Description |
|---|---|---|---|
| R01 | Network Passengers | `#,##0` | Eurostat route passengers carried, one primary report per directed flow and month. Responds to origin, destination, route and date filters; ignores DimAirport (R04 inactive). Confidential Norwegian domestic routes are blank. Not an airport or country total. 2022-2024 only. |
| R02 | Network Passengers PY | `#,##0` | Helper: Network Passengers one year earlier (DimDate shifted, DimYear filter removed). Blank for 2022. Valid 2023-01 to 2024-12. |
| R03 | Network Passengers (Selected Airports) | `#,##0` | Network passengers on flows that start or end at any airport selected in DimAirport (for example Country = Norway), each flow counted once. Reads the DimAirport selection with VALUES; no relationship used. With no DimAirport filter it equals Network Passengers. Not additive across countries (a cross-border flow touches two). 2022-2024 only. |
| R04 | Airport Route Passengers (As Reported) | `#,##0` | Airport passengers on reported routes: all route rows of the selected reporting airports, as those airports report them (activates R04 with USERELATIONSHIP; no IsPrimaryReport filter). Flows between two selected reporting airports count at both ends. Only the 43 reporting airports have values. Never a network total. 2022-2024 only. |
| R05 | Network Passengers LFL | `#,##0` | Helper: current network passengers on flow-months that also have published data a year earlier, excluding reporting airports with partial coverage (D-R8). Confidential flows drop out automatically. |
| R06 | Network Passengers PY LFL | `#,##0` | Helper: prior-year network passengers on the same flow-months as Network Passengers LFL. |
| R07 | Route Passenger Growth YoY % | `+0.0%;-0.0%;0.0%` | Like-for-like year-on-year change in route passengers (constant reporting panel). 2024: +5.9% like-for-like versus +7.3% on reported totals. Only 2023 and 2024. |
| R08 | Route Rank | `0` | Rank of a two-way route by network passengers in the visible selection. Use with visual filter DimRoute[IncludesUnknownAirport] = FALSE. Confidential routes have no rank (blank). |
| R09 | Route Share of Network | `0.0%` | Share of all selected network passengers on a route (route filters removed in the denominator). Share of published flows only. |
| R10 | Routes Operated | `#,##0` | Two-way routes with traffic in the selection: primary rows with passengers > 0, flights > 0 or confidential values (MD-06). |
| R11 | Destinations Served | `#,##0` | Destination airports reached from the selected origins over operated primary rows, excluding the unknown partner. |
| R12 | Destination Countries Served | `#,##0` | Countries (ISO) reached from the selected origins over operated primary rows; the fact filter reaches DimDestinationAirport through the expanded table. Faroe Islands = FO. |
| R13 | Domestic Route Passengers | `#,##0` | Network passengers on domestic routes. Understated: Norwegian domestic routes are confidential 2022-04 to 2024-12 (blank). Faroe Islands routes count as Danish domestic (Eurostat). |
| R14 | Nordic Cross-Border Route Passengers | `#,##0` | Network passengers on cross-border routes between Sweden, Norway, Denmark and Finland. Published values only. |
| R15 | International Route Passengers | `#,##0` | Network passengers on routes to and from countries outside the four Nordic countries. Published values only. |
| R16 | Domestic Share of Route Passengers | `0.0%` | Share of published route passengers on domestic routes. Label "published routes"; Norway domestic is missing, so do not compare countries on this measure. |
| R17 | Domestic Routes Operated | `#,##0` | Domestic routes operated. Includes confidential Norwegian routes (MD-06). |
| R18 | International Routes Operated | `#,##0` | Routes leaving the country (Nordic cross-border + outside the Nordics). |
| R19 | Route Passenger Flights | `#,##0` | Commercial passenger flights on the selected flows: primary rows, Sweden Jan-Feb 2022 excluded. |
| R20 | Route Load Factor | `0.0%` | PassengersOnBoard / PassengerSeatsAvailable on primary rows valid for load factor. Never use PassengersCarried with seats. |
| R21 | Average Route Distance (km) | `#,##0` | Passenger-weighted average great-circle distance of the selected traffic (routes with a distance; not EKCH-ZZZZ). Great-circle estimate, not flown distance. |
| R22 | Route Passenger Growth YoY % (Reported) | `+0.0%;-0.0%;0.0%` | Change in reported network passengers (R01) against the prior year, without the constant reporting panel. Use only beside Route Passenger Growth YoY % on the Data Quality page; label "reported totals, coverage changes included". Blank when either year has no route data (2022, 2025). 2023: +16.4%; 2024: +7.3%. |

<details><summary>DAX expressions</summary>

**R01 Network Passengers**

```dax
Network Passengers =
CALCULATE (
    SUM ( FactRouteMonthly[PassengersCarried] ),
    KEEPFILTERS ( FactRouteMonthly[IsPrimaryReport] = TRUE () )
)
```

**R02 Network Passengers PY**

```dax
Network Passengers PY = CALCULATE ( [Network Passengers], DATEADD ( DimDate[Date], -1, YEAR ), REMOVEFILTERS ( DimYear ) )
```

**R03 Network Passengers (Selected Airports)**

```dax
Network Passengers (Selected Airports) =
VAR Sel = VALUES ( DimAirport[AirportICAO] )
RETURN
    CALCULATE (
        [Network Passengers],
        FILTER (
            ALL ( FactRouteMonthly[OriginAirportICAO], FactRouteMonthly[DestinationAirportICAO] ),
            FactRouteMonthly[OriginAirportICAO] IN Sel
                || FactRouteMonthly[DestinationAirportICAO] IN Sel
        )
    )
```

**R04 Airport Route Passengers (As Reported)**

```dax
Airport Route Passengers (As Reported) =
CALCULATE (
    SUM ( FactRouteMonthly[PassengersCarried] ),
    USERELATIONSHIP ( DimAirport[AirportICAO], FactRouteMonthly[ReportingAirportICAO] )
)
```

**R05 Network Passengers LFL**

```dax
Network Passengers LFL =
SUMX (
    SUMMARIZE ( FactRouteMonthly, FactRouteMonthly[FlowKey], DimDate[MonthStart] ),
    VAR Cur =
        CALCULATE ( [Network Passengers], KEEPFILTERS ( FactRouteMonthly[DQ_ReportingAirportPartialCoverage] = FALSE () ) )
    VAR Prev =
        CALCULATE ( [Network Passengers PY], KEEPFILTERS ( FactRouteMonthly[DQ_ReportingAirportPartialCoverage] = FALSE () ) )
    RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), Cur )
)
```

**R06 Network Passengers PY LFL**

```dax
Network Passengers PY LFL =
SUMX (
    SUMMARIZE ( FactRouteMonthly, FactRouteMonthly[FlowKey], DimDate[MonthStart] ),
    VAR Cur =
        CALCULATE ( [Network Passengers], KEEPFILTERS ( FactRouteMonthly[DQ_ReportingAirportPartialCoverage] = FALSE () ) )
    VAR Prev =
        CALCULATE ( [Network Passengers PY], KEEPFILTERS ( FactRouteMonthly[DQ_ReportingAirportPartialCoverage] = FALSE () ) )
    RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), Prev )
)
```

**R07 Route Passenger Growth YoY %**

```dax
Route Passenger Growth YoY % = DIVIDE ( [Network Passengers LFL] - [Network Passengers PY LFL], [Network Passengers PY LFL] )
```

**R08 Route Rank**

```dax
Route Rank =
IF (
    NOT ISBLANK ( [Network Passengers] ),
    RANKX ( ALLSELECTED ( DimRoute[RouteName] ), [Network Passengers], , DESC, DENSE )
)
```

**R09 Route Share of Network**

```dax
Route Share of Network = DIVIDE ( [Network Passengers], CALCULATE ( [Network Passengers], REMOVEFILTERS ( DimRoute ) ) )
```

**R10 Routes Operated**

```dax
Routes Operated =
CALCULATE (
    DISTINCTCOUNT ( FactRouteMonthly[RouteKey] ),
    FILTER (
        FactRouteMonthly,
        FactRouteMonthly[IsPrimaryReport] = TRUE ()
            && ( FactRouteMonthly[PassengersCarried] > 0
                || FactRouteMonthly[PassengerFlights] > 0
                || FactRouteMonthly[ValueStatus] = "Confidential" )
    )
)
```

**R11 Destinations Served**

```dax
Destinations Served =
CALCULATE (
    DISTINCTCOUNT ( FactRouteMonthly[DestinationAirportICAO] ),
    FILTER (
        FactRouteMonthly,
        FactRouteMonthly[IsPrimaryReport] = TRUE ()
            && FactRouteMonthly[DestinationAirportICAO] <> "ZZZZ"
            && ( FactRouteMonthly[PassengersCarried] > 0
                || FactRouteMonthly[PassengerFlights] > 0
                || FactRouteMonthly[ValueStatus] = "Confidential" )
    )
)
```

**R12 Destination Countries Served**

```dax
Destination Countries Served =
CALCULATE (
    DISTINCTCOUNT ( DimDestinationAirport[DestinationISOCountryCode] ),
    FILTER (
        FactRouteMonthly,
        FactRouteMonthly[IsPrimaryReport] = TRUE ()
            && FactRouteMonthly[DestinationAirportICAO] <> "ZZZZ"
            && ( FactRouteMonthly[PassengersCarried] > 0
                || FactRouteMonthly[PassengerFlights] > 0
                || FactRouteMonthly[ValueStatus] = "Confidential" )
    )
)
```

**R13 Domestic Route Passengers**

```dax
Domestic Route Passengers = CALCULATE ( [Network Passengers], KEEPFILTERS ( DimRoute[RouteScope] = "Domestic" ) )
```

**R14 Nordic Cross-Border Route Passengers**

```dax
Nordic Cross-Border Route Passengers = CALCULATE ( [Network Passengers], KEEPFILTERS ( DimRoute[RouteScope] = "Cross-border within SE/NO/DK/FI" ) )
```

**R15 International Route Passengers**

```dax
International Route Passengers = CALCULATE ( [Network Passengers], KEEPFILTERS ( DimRoute[RouteScope] = "International (outside SE/NO/DK/FI)" ) )
```

**R16 Domestic Share of Route Passengers**

```dax
Domestic Share of Route Passengers = DIVIDE ( [Domestic Route Passengers], [Network Passengers] )
```

**R17 Domestic Routes Operated**

```dax
Domestic Routes Operated = CALCULATE ( [Routes Operated], KEEPFILTERS ( DimRoute[RouteScope] = "Domestic" ) )
```

**R18 International Routes Operated**

```dax
International Routes Operated =
CALCULATE (
    [Routes Operated],
    KEEPFILTERS ( NOT ( DimRoute[RouteScope] IN { "Domestic", "Unknown partner" } ) )
)
```

**R19 Route Passenger Flights**

```dax
Route Passenger Flights =
CALCULATE (
    SUM ( FactRouteMonthly[PassengerFlights] ),
    KEEPFILTERS ( FactRouteMonthly[IsPrimaryReport] = TRUE () ),
    KEEPFILTERS ( FactRouteMonthly[DQ_SE_JanFeb2022_FlightsSeatsIncomplete] = FALSE () )
)
```

**R20 Route Load Factor**

```dax
Route Load Factor =
VAR Pax =
    CALCULATE ( SUM ( FactRouteMonthly[PassengersOnBoard] ), KEEPFILTERS ( FactRouteMonthly[IsPrimaryReport] = TRUE () ), KEEPFILTERS ( FactRouteMonthly[DQ_CapacityValidForLoadFactor] = TRUE () ) )
VAR Seats =
    CALCULATE ( SUM ( FactRouteMonthly[PassengerSeatsAvailable] ), KEEPFILTERS ( FactRouteMonthly[IsPrimaryReport] = TRUE () ), KEEPFILTERS ( FactRouteMonthly[DQ_CapacityValidForLoadFactor] = TRUE () ) )
RETURN DIVIDE ( Pax, Seats )
```

**R21 Average Route Distance (km)**

```dax
Average Route Distance (km) =
VAR T = ADDCOLUMNS ( VALUES ( DimRoute[RouteKey] ), "@Pax", [Network Passengers], "@Km", CALCULATE ( MAX ( DimRoute[DistanceKm] ) ) )
VAR T2 = FILTER ( T, NOT ISBLANK ( [@Pax] ) && NOT ISBLANK ( [@Km] ) )
RETURN DIVIDE ( SUMX ( T2, [@Pax] * [@Km] ), SUMX ( T2, [@Pax] ) )
```

**R22 Route Passenger Growth YoY % (Reported)**

```dax
Route Passenger Growth YoY % (Reported) =
VAR Cur = [Network Passengers]
VAR Prev = [Network Passengers PY]
RETURN IF ( NOT ISBLANK ( Cur ) && NOT ISBLANK ( Prev ), DIVIDE ( Cur - Prev, Prev ) )
```

</details>

## 03 Norway (Avinor)

| ID | Measure | Format | Description |
|---|---|---|---|
| N01 | Avinor Terminal Passengers | `#,##0` | Avinor terminal passengers: domestic + international + offshore (incl. infants and transfer). Never add to Eurostat passengers. MQN 2024-07 blank. |
| N02 | Avinor Domestic Passengers | `#,##0` | Avinor passengers on domestic flights (arriving/departing + transfer). A domestic passenger is counted at both airports when airports are summed. |
| N03 | Avinor International Passengers | `#,##0` | Avinor passengers on international flights (arriving/departing + transfer). Blank, not zero, at airports without international traffic. |
| N04 | Avinor International Share | `0.0%` | Share of fixed-wing terminal passengers on international flights: International / (Domestic + International). Excludes offshore. |
| N05 | Avinor Offshore Passengers | `#,##0` | Helicopter passengers to offshore installations. Not in Eurostat airport totals. |
| N06 | Avinor Transfer Share | `0.0%` | Share of fixed-wing passengers who transfer: (DomesticPaxTransfer + InternationalPaxTransfer) / (Domestic + International). Compare with Finavia HEL Transfer Share only as separate visuals. |
| N07 | Avinor Flight Movements | `#,##0` | Avinor commercial movements: domestic + international + offshore (MD-08). Not the same figure as Eurostat Commercial Flights. |
| N08 | Avinor Total Movements | `#,##0` | All Avinor movements including other civil aviation (secondary to Avinor Flight Movements). Never add to its parts. |
| N09 | Avinor Terminal Passengers PY | `#,##0` | Helper: Avinor terminal passengers one year earlier (DimDate shifted, DimYear filter removed). |
| N10 | Avinor Passenger Growth YoY % | `+0.0%;-0.0%;0.0%` | Like-for-like change in Avinor terminal passengers: airport-month pairs with values in both years (excludes MQN July 2024 and July 2025 comparisons). |
| N11 | Avinor Passengers Excl Offshore | `#,##0` | Data-trust helper: Domestic + International, the Avinor figure comparable with Eurostat PassengersCarried. Comparison only. |
| N12 | Avinor vs Eurostat Ratio | `0.000` | Avinor passengers (excl. offshore) / Eurostat PassengersCarried for the 26 airports in both sources. A ratio, never a sum. 0.997 to 1.003 by year. |
| N13 | Avinor Airports With Data | `0` | Avinor airports with published terminal passengers. |
| N14 | Avinor Passenger Index (2022 = 100) | `0.0` | Avinor terminal passengers in a month as an index, 2022 monthly average = 100, for the same airport selection. Monthly axis only (blank above month level). Base approved as the 2022 average because January 2022 was depressed by COVID-19 restrictions. |
| N15 | Avinor Movement Index (2022 = 100) | `0.0` | Avinor commercial flight movements in a month as an index, 2022 monthly average = 100, for the same airport selection. Monthly axis only (blank above month level). Base approved as the 2022 average because January 2022 was depressed by COVID-19 restrictions. |
| N16 | Avinor International Growth YoY % | `+0.0%;-0.0%;0.0%` | Like-for-like change in Avinor international passengers: airport-month pairs with international values in both years (same method as N10). Blank for 2022. |

<details><summary>DAX expressions</summary>

**N01 Avinor Terminal Passengers**

```dax
Avinor Terminal Passengers = SUM ( FactAvinorMonthly[TerminalPax] )
```

**N02 Avinor Domestic Passengers**

```dax
Avinor Domestic Passengers = SUM ( FactAvinorMonthly[DomesticPax] )
```

**N03 Avinor International Passengers**

```dax
Avinor International Passengers = SUM ( FactAvinorMonthly[InternationalPax] )
```

**N04 Avinor International Share**

```dax
Avinor International Share =
DIVIDE (
    [Avinor International Passengers],
    [Avinor Domestic Passengers] + [Avinor International Passengers]
)
```

**N05 Avinor Offshore Passengers**

```dax
Avinor Offshore Passengers = SUM ( FactAvinorMonthly[OffshorePax] )
```

**N06 Avinor Transfer Share**

```dax
Avinor Transfer Share =
DIVIDE (
    SUM ( FactAvinorMonthly[DomesticPaxTransfer] ) + SUM ( FactAvinorMonthly[InternationalPaxTransfer] ),
    [Avinor Domestic Passengers] + [Avinor International Passengers]
)
```

**N07 Avinor Flight Movements**

```dax
Avinor Flight Movements = SUM ( FactAvinorMonthly[CommercialMovements] )
```

**N08 Avinor Total Movements**

```dax
Avinor Total Movements = SUM ( FactAvinorMonthly[TotalMovements] )
```

**N09 Avinor Terminal Passengers PY**

```dax
Avinor Terminal Passengers PY = CALCULATE ( [Avinor Terminal Passengers], DATEADD ( DimDate[Date], -1, YEAR ), REMOVEFILTERS ( DimYear ) )
```

**N10 Avinor Passenger Growth YoY %**

```dax
Avinor Passenger Growth YoY % =
VAR T =
    ADDCOLUMNS (
        SUMMARIZE ( FactAvinorMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
        "@Cur", [Avinor Terminal Passengers],
        "@Prev", [Avinor Terminal Passengers PY]
    )
VAR T2 = FILTER ( T, NOT ISBLANK ( [@Cur] ) && NOT ISBLANK ( [@Prev] ) )
VAR Cur = SUMX ( T2, [@Cur] )
VAR Prev = SUMX ( T2, [@Prev] )
RETURN DIVIDE ( Cur - Prev, Prev )
```

**N11 Avinor Passengers Excl Offshore**

```dax
Avinor Passengers Excl Offshore = [Avinor Domestic Passengers] + [Avinor International Passengers]
```

**N12 Avinor vs Eurostat Ratio**

```dax
Avinor vs Eurostat Ratio =
VAR Both =
    CALCULATETABLE (
        VALUES ( DimAirport[AirportICAO] ),
        DimAirport[InFactAirportMonthly] = TRUE (),
        DimAirport[InFactAvinorMonthly] = TRUE ()
    )
RETURN DIVIDE (
    CALCULATE ( [Avinor Passengers Excl Offshore], Both ),
    CALCULATE ( [Total Passengers], Both )
)
```

**N13 Avinor Airports With Data**

```dax
Avinor Airports With Data = CALCULATE ( DISTINCTCOUNT ( FactAvinorMonthly[AirportICAO] ), NOT ISBLANK ( FactAvinorMonthly[TerminalPax] ) )
```

**N14 Avinor Passenger Index (2022 = 100)**

```dax
Avinor Passenger Index (2022 = 100) =
VAR Cur = [Avinor Terminal Passengers]
VAR Base =
    CALCULATE (
        AVERAGEX ( VALUES ( DimDate[YearMonth] ), [Avinor Terminal Passengers] ),
        REMOVEFILTERS ( DimDate ),
        REMOVEFILTERS ( DimYear ),
        DimYear[Year] = 2022
    )
RETURN
    IF ( HASONEVALUE ( DimDate[YearMonth] ) && NOT ISBLANK ( Cur ), DIVIDE ( Cur, Base ) * 100 )
```

**N15 Avinor Movement Index (2022 = 100)**

```dax
Avinor Movement Index (2022 = 100) =
VAR Cur = [Avinor Flight Movements]
VAR Base =
    CALCULATE (
        AVERAGEX ( VALUES ( DimDate[YearMonth] ), [Avinor Flight Movements] ),
        REMOVEFILTERS ( DimDate ),
        REMOVEFILTERS ( DimYear ),
        DimYear[Year] = 2022
    )
RETURN
    IF ( HASONEVALUE ( DimDate[YearMonth] ) && NOT ISBLANK ( Cur ), DIVIDE ( Cur, Base ) * 100 )
```

**N16 Avinor International Growth YoY %**

```dax
Avinor International Growth YoY % =
VAR T =
    ADDCOLUMNS (
        SUMMARIZE ( FactAvinorMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
        "@Cur", [Avinor International Passengers],
        "@Prev", CALCULATE ( [Avinor International Passengers], DATEADD ( DimDate[Date], -1, YEAR ), REMOVEFILTERS ( DimYear ) )
    )
VAR T2 = FILTER ( T, NOT ISBLANK ( [@Cur] ) && NOT ISBLANK ( [@Prev] ) )
VAR Cur = SUMX ( T2, [@Cur] )
VAR Prev = SUMX ( T2, [@Prev] )
RETURN DIVIDE ( Cur - Prev, Prev )
```

</details>

## 04 Helsinki (Finavia)

| ID | Measure | Format | Description |
|---|---|---|---|
| H01 | Finavia HEL Passengers | `#,##0` | Finavia Helsinki passengers: arriving, departing and transfer (Domestic + International rows). Annual only: use DimYear, never a month axis. Never add to Eurostat EFHK values. |
| H02 | Finavia HEL Transfer Passengers | `#,##0` | Helsinki transfer passengers (published transfer column). Already inside Finavia HEL Passengers: never add the two. |
| H03 | Finavia HEL Transfer Share | `0.0%` | Transfer passengers / total Helsinki passengers. |
| H04 | Finavia HEL Domestic Passengers | `#,##0` | Helsinki passengers on domestic flights. |
| H05 | Finavia HEL International Passengers | `#,##0` | Helsinki passengers on international flights. |
| H06 | Finavia HEL Domestic Share | `0.0%` | Domestic passengers / all Helsinki passengers (TrafficType filter removed from the denominator). |
| H07 | Finavia HEL Passengers PY | `#,##0` | Helper: Helsinki passengers in the previous year, for one selected year. Blank for 1998 and for multi-year selections. |
| H08 | Finavia HEL Growth YoY % | `+0.0%;-0.0%;0.0%` | Year-on-year change in Helsinki passengers. Coverage is constant (one airport), so no like-for-like adjustment is needed. |
| H09 | Finavia HEL CAGR (Selected Years) | `+0.0%;-0.0%;0.0%` | Compound annual growth rate between the first and last selected years with data. 1998-2025: +2.2% a year; 2022-2025: +9.6% a year. |
| H10 | Finavia HEL Recovery vs 2019 | `0.0%` | Helsinki passengers as a share of the 2019 peak. 2025: 77.7%. |
| H11 | Finavia vs Eurostat EFHK Ratio | `0.000` | Finavia Helsinki total / Eurostat EFHK PassengersOnBoard for the same year (DimYear filters both). Years 2022-2025 only, on a year axis. 0.993 to 0.994 (Finavia excludes infants). A ratio, never a sum. |

<details><summary>DAX expressions</summary>

**H01 Finavia HEL Passengers**

```dax
Finavia HEL Passengers = SUM ( FactHelsinkiAnnual[TotalPassengers] )
```

**H02 Finavia HEL Transfer Passengers**

```dax
Finavia HEL Transfer Passengers = SUM ( FactHelsinkiAnnual[TransferPassengers] )
```

**H03 Finavia HEL Transfer Share**

```dax
Finavia HEL Transfer Share = DIVIDE ( [Finavia HEL Transfer Passengers], [Finavia HEL Passengers] )
```

**H04 Finavia HEL Domestic Passengers**

```dax
Finavia HEL Domestic Passengers =
CALCULATE (
    [Finavia HEL Passengers],
    KEEPFILTERS ( FactHelsinkiAnnual[TrafficType] = "Domestic" )
)
```

**H05 Finavia HEL International Passengers**

```dax
Finavia HEL International Passengers =
CALCULATE (
    [Finavia HEL Passengers],
    KEEPFILTERS ( FactHelsinkiAnnual[TrafficType] = "International" )
)
```

**H06 Finavia HEL Domestic Share**

```dax
Finavia HEL Domestic Share =
DIVIDE (
    [Finavia HEL Domestic Passengers],
    CALCULATE ( [Finavia HEL Passengers], REMOVEFILTERS ( FactHelsinkiAnnual[TrafficType] ) )
)
```

**H07 Finavia HEL Passengers PY**

```dax
Finavia HEL Passengers PY =
VAR Y = MAX ( DimYear[Year] )
RETURN
    IF (
        HASONEVALUE ( DimYear[Year] ),
        CALCULATE ( [Finavia HEL Passengers], REMOVEFILTERS ( DimYear ), DimYear[Year] = Y - 1 )
    )
```

**H08 Finavia HEL Growth YoY %**

```dax
Finavia HEL Growth YoY % = DIVIDE ( [Finavia HEL Passengers] - [Finavia HEL Passengers PY], [Finavia HEL Passengers PY] )
```

**H09 Finavia HEL CAGR (Selected Years)**

```dax
Finavia HEL CAGR (Selected Years) =
VAR Yrs = FILTER ( VALUES ( DimYear[Year] ), NOT ISBLANK ( [Finavia HEL Passengers] ) )
VAR Y0 = MINX ( Yrs, DimYear[Year] )
VAR Y1 = MAXX ( Yrs, DimYear[Year] )
VAR P0 = CALCULATE ( [Finavia HEL Passengers], REMOVEFILTERS ( DimYear ), DimYear[Year] = Y0 )
VAR P1 = CALCULATE ( [Finavia HEL Passengers], REMOVEFILTERS ( DimYear ), DimYear[Year] = Y1 )
RETURN IF ( Y1 > Y0 && P0 > 0, POWER ( DIVIDE ( P1, P0 ), 1 / ( Y1 - Y0 ) ) - 1 )
```

**H10 Finavia HEL Recovery vs 2019**

```dax
Finavia HEL Recovery vs 2019 =
DIVIDE (
    [Finavia HEL Passengers],
    CALCULATE ( [Finavia HEL Passengers], REMOVEFILTERS ( DimYear ), DimYear[Year] = 2019 )
)
```

**H11 Finavia vs Eurostat EFHK Ratio**

```dax
Finavia vs Eurostat EFHK Ratio =
DIVIDE (
    [Finavia HEL Passengers],
    CALCULATE ( SUM ( FactAirportMonthly[PassengersOnBoard] ), KEEPFILTERS ( DimAirport[AirportICAO] = "EFHK" ) )
)
```

</details>

## 05 Data Quality & Coverage

| ID | Measure | Format | Description |
|---|---|---|---|
| Q01 | Airport-Months Excluded from Growth | `0` | Airport-months in the selection without a prior-year value (left out of like-for-like growth). 2023: 5, 2024: 10, 2025: none. Valid 2023-2025. |
| Q02 | Capacity-Invalid Airport-Months | `0` | Airport-months left out of load factor (DQ_CapacityValidForLoadFactor = FALSE). 79 in total. |
| Q03 | Confidential Route-Months | `#,##0` | Flow-months whose values Eurostat keeps confidential (shown as blank): primary rows with ValueStatus = Confidential. 2022: 1,148; 2023: 1,505; 2024: 1,429 (all Norwegian domestic). |
| Q04 | Route Coverage of Airport Traffic | `0.0%` | Route passengers on board (airport view, R04 via USERELATIONSHIP) as a share of airport passengers on board, for the same reporting airports and months. 2024 overall: 70.7%. Explains why route totals are lower than airport totals. |
| Q05 | Partial-Coverage Reporting Airports | `0` | Reporting airports with route rows in fewer than 36 months (EFTU, EFVA, ESMX). Excluded from route growth. |
| Q06 | Avinor Airport-Months Without Passengers | `0` | Avinor airport-months with no published passenger figure: 1 (Mo i Rana, July 2024). |
| Q07 | Last Month With Route Data | `mmm yyyy` | Latest month in the route fact, with date and year filters removed: Dec 2024. |

<details><summary>DAX expressions</summary>

**Q01 Airport-Months Excluded from Growth**

```dax
Airport-Months Excluded from Growth =
SUMX (
    SUMMARIZE ( FactAirportMonthly, DimAirport[AirportICAO], DimDate[MonthStart] ),
    IF ( NOT ISBLANK ( [Total Passengers] ) && ISBLANK ( [Total Passengers PY] ), 1 )
)
```

**Q02 Capacity-Invalid Airport-Months**

```dax
Capacity-Invalid Airport-Months = CALCULATE ( COUNTROWS ( FactAirportMonthly ), KEEPFILTERS ( FactAirportMonthly[DQ_CapacityValidForLoadFactor] = FALSE () ) )
```

**Q03 Confidential Route-Months**

```dax
Confidential Route-Months =
CALCULATE (
    COUNTROWS ( FactRouteMonthly ),
    KEEPFILTERS ( FactRouteMonthly[IsPrimaryReport] = TRUE () ),
    KEEPFILTERS ( FactRouteMonthly[ValueStatus] = "Confidential" )
)
```

**Q04 Route Coverage of Airport Traffic**

```dax
Route Coverage of Airport Traffic =
VAR Pairs =
    CALCULATETABLE (
        SUMMARIZE ( FactRouteMonthly, FactRouteMonthly[ReportingAirportICAO], FactRouteMonthly[MonthStart] ),
        USERELATIONSHIP ( DimAirport[AirportICAO], FactRouteMonthly[ReportingAirportICAO] )
    )
VAR RoutePOB =
    CALCULATE ( SUM ( FactRouteMonthly[PassengersOnBoard] ), USERELATIONSHIP ( DimAirport[AirportICAO], FactRouteMonthly[ReportingAirportICAO] ) )
VAR AirportPOB =
    CALCULATE ( SUM ( FactAirportMonthly[PassengersOnBoard] ), TREATAS ( Pairs, FactAirportMonthly[AirportICAO], FactAirportMonthly[MonthStart] ) )
RETURN DIVIDE ( RoutePOB, AirportPOB )
```

**Q05 Partial-Coverage Reporting Airports**

```dax
Partial-Coverage Reporting Airports = CALCULATE ( DISTINCTCOUNT ( FactRouteMonthly[ReportingAirportICAO] ), KEEPFILTERS ( FactRouteMonthly[DQ_ReportingAirportPartialCoverage] = TRUE () ) )
```

**Q06 Avinor Airport-Months Without Passengers**

```dax
Avinor Airport-Months Without Passengers = CALCULATE ( COUNTROWS ( FactAvinorMonthly ), ISBLANK ( FactAvinorMonthly[TerminalPax] ) )
```

**Q07 Last Month With Route Data**

```dax
Last Month With Route Data = CALCULATE ( MAX ( FactRouteMonthly[MonthStart] ), REMOVEFILTERS ( DimDate ), REMOVEFILTERS ( DimYear ) )
```

</details>

## 06 Labels & Helpers

| ID | Measure | Format | Description |
|---|---|---|---|
| L01 | Selected Period Label |  | Text for page subtitles from the DimYear selection, for example "2025" or "2023 to 2025". |
| L02 | Route Data Note |  | Warning text shown on route visuals when the selected years include 2025. |
| L03 | Growth Coverage Note |  | Tooltip text for growth KPIs: the like-for-like rule and the excluded count. |
| L04 | Norway Route Confidential Note |  | Shown on Norwegian route visuals when confidential route-months exist in the selection. |

<details><summary>DAX expressions</summary>

**L01 Selected Period Label**

```dax
Selected Period Label =
VAR Y0 = MIN ( DimYear[Year] )
VAR Y1 = MAX ( DimYear[Year] )
RETURN IF ( Y0 = Y1, FORMAT ( Y0, "0" ), FORMAT ( Y0, "0" ) & " to " & FORMAT ( Y1, "0" ) )
```

**L02 Route Data Note**

```dax
Route Data Note = IF ( MAX ( DimYear[Year] ) >= 2025, "Route data ends in December 2024; 2025 has no route values." )
```

**L03 Growth Coverage Note**

```dax
Growth Coverage Note = "Like-for-like: " & FORMAT ( [Airport-Months Excluded from Growth] + 0, "0" ) & " airport-months without a prior-year value excluded."
```

**L04 Norway Route Confidential Note**

```dax
Norway Route Confidential Note =
IF (
    [Confidential Route-Months] > 0,
    FORMAT ( [Confidential Route-Months], "#,##0" ) & " Norwegian domestic route-months are confidential (blank, not zero)."
)
```

</details>
