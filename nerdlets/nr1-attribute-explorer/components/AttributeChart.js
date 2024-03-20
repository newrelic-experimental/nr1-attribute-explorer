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
} from "nr1";

const AttributeChartQuery = ({
  accountId,
  query,
  pollInterval,
  timeRange,
  onClickBar,
}) => {
  return (
    <NrqlQuery
      accountIds={[accountId]}
      query={query}
      pollInterval={pollInterval}
      timeRange={timeRange}
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
          <HeadingText type={HeadingText.TYPE.HEADING_5}>
            {attribute}
          </HeadingText>
        </div>
        <PlatformStateContext.Consumer>
          {(platformState) => (
            <AttributeChartQuery
              accountId={accountId}
              query={query}
              pollInterval={pollInterval}
              platformState={platformState}
              onClickBar={onClickBar}
            />
          )}
        </PlatformStateContext.Consumer>
      </Tile>
    </GridItem>
  );
};

export { AttributeChart };
