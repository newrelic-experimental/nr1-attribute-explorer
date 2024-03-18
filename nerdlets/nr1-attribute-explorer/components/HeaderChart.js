import React from "react";
import {
  PlatformStateContext,
  NrqlQuery,
  LineChart,
  HistogramChart,
} from "nr1";

const HeaderChart = ({ accountId, query, chartType, pollInterval = 60000 }) => {
  return (
    <PlatformStateContext.Consumer>
      {(platformState) => (
        <NrqlQuery
          accountIds={[accountId]}
          query={query}
          pollInterval={pollInterval}
          timeRange={platformState.timeRange}
        >
          {({ data }) => {
            switch (chartType) {
              case "line":
                return <LineChart data={data} fullWidth />;
              case "histogram":
                return <HistogramChart data={data} fullWidth />;
              default:
                return null;
            }
          }}
        </NrqlQuery>
      )}
    </PlatformStateContext.Consumer>
  );
};

export { HeaderChart };
