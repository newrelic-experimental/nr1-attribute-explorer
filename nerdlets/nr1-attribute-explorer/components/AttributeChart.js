// AttributeChart.js
import React from "react";
import {
  PlatformStateContext,
  NrqlQuery,
  GridItem,
  Tile,
  HeadingText,
  BarChart,
  Spinner,
  Stack,
  StackItem,
  SectionMessage,
  Popover,
  PopoverBody,
  PopoverTrigger,
} from "nr1";
import { PopoverChart } from "./PopoverChart";

const AttributeChartQuery = ({
  accountId,
  query,
  pollInterval,
  timeRange,
  onClickBar,
}) => {
  return (
    <PlatformStateContext.Consumer>
      {(platformState) => (
        <NrqlQuery
          accountIds={[accountId]}
          query={query}
          pollInterval={pollInterval}
          timeRange={platformState.timeRange}
        >
          {({ loading, error, data }) => {
            if (loading) {
              return <Spinner type={Spinner.TYPE.DOT} />;
            }

            if (error) {
              return (
                <Stack>
                  <StackItem>
                    <SectionMessage
                      type={SectionMessage.TYPE.WARNING}
                      title="Chart failed to display."
                      description={error.message}
                    />
                  </StackItem>
                </Stack>
              );
            }

            if (data != null && data.length > 0) {
              return <BarChart data={data} fullWidth onClickBar={onClickBar} />;
            } else {
              return <div className="myNoData">No values.</div>;
            }
          }}
        </NrqlQuery>
      )}
    </PlatformStateContext.Consumer>
  );
};

const AttributeChart = ({
  accountId,
  attribute,
  query,
  onClickBar,
  pollInterval = 60000, // 60 seconds,
}) => {
  return (
    <GridItem columnSpan={2}>
      <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
        <div className="myHeader">
          <Popover openOnHover="true">
            <PopoverTrigger>
              <HeadingText type={HeadingText.TYPE.HEADING_5}>
                {attribute}
              </HeadingText>
            </PopoverTrigger>
            <PopoverBody>
              <PopoverChart
                accountId={accountId}
                query={query}
              />
            </PopoverBody>
          </Popover>
        </div>
        <AttributeChartQuery
          accountId={accountId}
          query={query}
          pollInterval={pollInterval}
          onClickBar={onClickBar}
        />
      </Tile>
    </GridItem>
  );
};

export { AttributeChart };
