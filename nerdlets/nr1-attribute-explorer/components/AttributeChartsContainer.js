import React from "react";
import { Grid } from "nr1";
import { AttributeChart } from "./AttributeChart";

const AttributeChartsContainer = ({
  accountId,
  guid,
  eventTypes,
  currentEvent,
  attribWhere,
  duration,
  currentMetric,
  attributes,
  setAttribute,
}) => {
  // Construct the NRQL query
  const values = [
    `percentile(${duration[currentEvent]}, 50)`,
    `percentile(${duration[currentEvent]}, 75)`,
    `percentile(${duration[currentEvent]}, 90)`,
    `percentile(${duration[currentEvent]}, 99)`,
    `average(${duration[currentEvent]})`,
    "count(*)",
  ];
  const attributeString = "ATTRIBUTE";
  const chartQuery = `SELECT ${values[currentMetric]} FROM ${eventTypes[currentEvent]} WHERE entityGuid = '${guid}'${attribWhere} FACET ${attributeString}`;
  return (
    <Grid>
      {/* Loop through all the attributes and build an array of charts */}
      {attributes.map((attribute) => (
        <AttributeChart
          key={attribute}
          accountId={accountId}
          attribute={attribute}
          query={chartQuery.replace("ATTRIBUTE", attribute)}
          // Uncomment to set the refresh rate to 30 seconds (or any other value you want to use) - default is 60 seconds.
          // pollInterval={30000}
          pollInterval={60000}
          onClickBar={(evt) => setAttribute(attribute, evt.metadata.name)}
        />
      ))}
    </Grid>
  );
};

export { AttributeChartsContainer };
