import React from "react";
import {
  PlatformStateContext,
  LineChart,
} from "nr1";

const PopoverChart = ({ accountId, query }) => {
  return (
    <PlatformStateContext.Consumer>
        {(platformState) => {
            query = query + " TIMESERIES";
            if (typeof platformState.timeRange.duration !== 'undefined' && platformState.timeRange.duration !== null) {
                const seconds = platformState.timeRange.duration/1000;
                query = query + " SINCE " + seconds + " seconds ago";
            }
            else {
                if (typeof platformState.timeRange.begin_time !== 'undefined' && platformState.timeRange.begin_time !== null)
                    query = query + " since " + platformState.timeRange.begin_time;
                if (typeof platformState.timeRange.end_time !== 'undefined' && platformState.timeRange.end_time !== null)
                    query = query + " until " + platformState.timeRange.end_time;
            }
            console.log(platformState);
            return (
                <>
                    <div className="myPopover">
                        <LineChart
                            accountIds={[accountId]}
                            query={query}
                        />
                    </div>
                </>
            );
        }}
    </PlatformStateContext.Consumer>
  );
};

export { PopoverChart };