import React, { useEffect, useState } from "react";
import { Grid, ChartGroup } from "nr1";
import { HeaderChart } from "./HeaderChart";
import { ChartTile } from "./ChartTile";

const HeaderChartsContainer = ({
  accountId,
  guid,
  eventTypes,
  currentEvent,
  attribWhere,
  duration,
  histogramCeiling,
}) => {
  const [responseQuery, setResponseQuery] = useState("");
  const [countQuery, setCountQuery] = useState("");
  const [histogramQuery, setHistogramQuery] = useState("");

  useEffect(() => {
    const errorNRQL = [
      ", filter(count(*), WHERE error) as 'Errors'", // Transactions
      "", // TransactionError (no where clause here, as all are errors!)
      ", filter(count(*), WHERE error.message IS NOT NULL OR error.class IS NOT NULL) as Errors", // Spans (APM)
      ", filter(count(*), WHERE otel.status_code = 'ERROR') as Errors", // Spans (OTEL)
    ];

    // The response time query for the first chart.
    const newResponseQuery = `SELECT percentile(${duration[currentEvent]}, 50, 75, 90, 99) as Duration, average(${duration[currentEvent]}) as 'Avg duration' FROM ${eventTypes[currentEvent]} WHERE entityGuid = '${guid}'${attribWhere} TIMESERIES AUTO`;
    // The count and error query for the second chart.
    const newCountQuery = `SELECT count(*) as 'Count'${errorNRQL[currentEvent]} FROM ${eventTypes[currentEvent]} WHERE entityGuid = '${guid}'${attribWhere} TIMESERIES AUTO`;
    // The histogram query for the third chart.
    const newHistogramQuery = `SELECT histogram(${duration[currentEvent]}, ${histogramCeiling}, 20) as Duration FROM ${eventTypes[currentEvent]} WHERE entityGuid = '${guid}'${attribWhere}`;

    setResponseQuery(newResponseQuery);
    setCountQuery(newCountQuery);
    setHistogramQuery(newHistogramQuery);
  }, [
    accountId,
    guid,
    eventTypes,
    currentEvent,
    attribWhere,
    duration,
    histogramCeiling,
  ]);

  return (
    <Grid>
      <ChartGroup>
        <ChartTile
          title="Performance over time"
          chart={
            <HeaderChart
              accountId={accountId}
              query={responseQuery}
              chartType="line"
            />
          }
          columnSpan={5}
        />
        <ChartTile
          title="Counts over time"
          chart={
            <HeaderChart
              accountId={accountId}
              query={countQuery}
              chartType="line"
            />
          }
          columnSpan={4}
        />
        <ChartTile
          title="Response time histogram"
          chart={
            <HeaderChart
              accountId={accountId}
              query={histogramQuery}
              chartType="histogram"
            />
          }
          columnSpan={3}
        />
      </ChartGroup>
    </Grid>
  );
};

export { HeaderChartsContainer };
