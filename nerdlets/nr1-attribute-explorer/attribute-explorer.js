import React from 'react';
import { Layout, LayoutItem, PlatformStateContext, LineChart, HistogramChart, HeadingText, NrqlQuery, Grid, GridItem, BarChart,
  Dropdown, DropdownItem, Button, BlockText, Tile, Spinner, Stack, StackItem, SectionMessage, ChartGroup, navigation } from 'nr1'

// A list of attributes that it makes no sense to display and will always be exclude from the UI. These are mainly time based attributes.
const excludeAttributes = ["appId", "duration", "entityGuid", "entity.guid", "nr.guid", "timestamp", "totalTime", "databaseDuration",
    "externalDuration", "gcCumulative", "parent.transportDuration", "queueDuration", "totalTime", "webDuration", "duration.ms"];

/*
  Main worker class for the AttributeExplorer, called from index.js.
*/
export default class AttributeExplorer extends React.Component {
  constructor(props) {
    super(props);
    // Set the background colour to ensure it looks nice! For some reason this seems to be necessary.
    document.getElementById("root").style.backgroundColor = "rgb(241, 242, 242)";
    //console.log(props);
    // Save these locally, probably not necessary, but then I am not a React programmer!
    this.accountId = props.accountId;
    this.guid = props.entityGuid;
    // The domain - APM or EXT (EXT represents OTEL).
    this.domain = props.domain;

    // Arrays of attribute names for the charts - all, numbers and booleans.
    // If an attribute is say a number it will appear both in the all and number array.
    // Sometimes we need to know if an attribute is say a boolean.
    this.attributes = [];
    this.numberAttributes = [];
    this.booleanAttributes = [];

    // Default Trace filter, based on the entity guid (by default only show traces for the entity).
    this.defaultTraceFilter = [{"attr":"entityGuid","operator":"EQ","value":this.guid}];
    // Current Trace filter, to start with set it to the default.
    this.traceFilter = this.defaultTraceFilter;

    // The different metrics we can display for the attributes in the lower section.
    this.metric = ["50th percentile", "75th percentile", "90th percentile", "99th percentile", "Average", "Count"];
    // Start with the "90th percentile".
    this.currentMetric = 2;

    // The event types we can use. The first 3 are for APM and the last one for OTEL.
    this.eventTypes = ["Transaction", "TransactionError", "Span", "Span"];
    // Descriptive names for the event types we use. Spans appears twice, once each for APM and OTEL, as they use different attributes for errors etc.
    this.event = ["Transactions", "Errors", "Spans", "Spans(OTEL)"];
    // Current event we are using default to Transactions.
    this.currentEvent = 0;
    // If we are in an OTEL service then we can only use "Spans(OTEL)".
    if (this.domain === "EXT") {
      this.currentEvent = 3;
    }
    // Duration is stored in ms for OTEl spans so need a way to treat this differently.
    this.duration = ["duration", "duration", "duration", "duration.ms/1000"];
    // The global where clause being used in the NRQL queries, changes as filters are applied.
    this.attribWhere = "";
    // Ceiling for the histogram chart, default to 3 seconds.
    this.histogramCeiling = 3;

    // Set the default state. Add empty charts as this helps stability of the UI.
    this.state = {
      headerCharts: [<LineChart fullWidth />, <LineChart fullWidth />, <HistogramChart fullWidth />],
      charts: [],
      metric: this.metric[this.currentMetric],
      event: this.event[this.currentEvent],
    };
    // Now populate the charts.
    this.getCharts(true);
  };

  // Method to get and return the 3 headers charts as an array.
  // Creating this an array seems to work best!
  async getHeaderCharts() {
    // The error where clause, which varies depending on the event we are using.
    const errorNRQL = [
        ", filter(count(*), WHERE error) as 'Errors'",  // Transactions
        "", // TransactionError (no where clause here, as all are errors!)
        ", filter(count(*), WHERE error.message IS NOT NULL OR error.class IS NOT NULL) as Errors", // Spans (APM)
        ", filter(count(*), WHERE otel.status_code = 'ERROR') as Errors"];  // Spans (OTEL)
    // The response time query in the first chart.
    const responseQuery = "SELECT percentile(" + this.duration[this.currentEvent] + ", 50, 75, 90, 99) as Duration, average(" + 
        this.duration[this.currentEvent] + ") as 'Avg duration' FROM " + this.eventTypes[this.currentEvent] + " WHERE entityGuid = '" + 
        this.guid + "'" + this.attribWhere + " TIMESERIES AUTO";
    // The count and error query in the 2nd chart.
    const countQuery = "SELECT count(*) as 'Count'" + errorNRQL[this.currentEvent] + " FROM " +
        this.eventTypes[this.currentEvent] + " WHERE entityGuid = '" + this.guid + "'" + this.attribWhere + " TIMESERIES AUTO";
    // The histogram query in the 3rd chart.
    const histogramQuery = "SELECT histogram(" + this.duration[this.currentEvent] + ", " + this.histogramCeiling + ", 20) as Duration FROM " +
        this.eventTypes[this.currentEvent] + " WHERE entityGuid = '" + this.guid + "'" + this.attribWhere;
    let headerChartArray = [];
    // Push the 3 charts into the array.
    // Default the time period to the platformState.
    // Refresh once a minute.
    headerChartArray.push(
      <PlatformStateContext.Consumer>
        {
          (platformState) => {
            return <NrqlQuery
              accountIds={[this.accountId]}
              query={responseQuery}
              pollInterval={60000}
              timeRange={platformState.timeRange}
            >
            {
              ({data}) => {
                return <LineChart data={data} fullWidth />;
              }
            }
            </NrqlQuery>
          }
        }
      </PlatformStateContext.Consumer>
    );
    headerChartArray.push(
      <PlatformStateContext.Consumer>
        {
          (platformState) => {
            return <NrqlQuery
              accountIds={[this.accountId]}
              query={countQuery}
              pollInterval={60000}
              timeRange={platformState.timeRange}
            >
            {
              ({data}) => {
                return <LineChart data={data} fullWidth />;
              }
            }
            </NrqlQuery>
          }
        }
      </PlatformStateContext.Consumer>
    );
    headerChartArray.push(
      <PlatformStateContext.Consumer>
        {
          (platformState) => {
            return <NrqlQuery
              accountIds={[this.accountId]}
              query={histogramQuery}
              pollInterval={60000}
              timeRange={platformState.timeRange}
            >
            {
              ({data}) => {
                return <HistogramChart data={data} fullWidth />;
              }
            }
            </NrqlQuery>
          }
        }
      </PlatformStateContext.Consumer>
    );
    return headerChartArray;
  }

  // Method to get/refresh the charts
  async getCharts(getAttrib) {
    // String used as a place holder in the NRQL
    const attributeString = "ATTRIBUTE";
    // Get the correct NRQL for the duration (OTEL is different from APM).
    const dur = this.duration[this.currentEvent];
    // Array of NRQL syntax strings for the metrics that can be selected.
    const values = ["percentile(" + dur + ", 50)", "percentile(" + dur + ", 75)", "percentile(" + dur + ", 90)",
      "percentile(" + dur + ", 99)", "average(" + dur + ")", "count(*)"];
    // The query we will be using to populate attribuate charts.
    const chartQuery = "SELECT " + values[this.currentMetric] + " FROM " + this.eventTypes[this.currentEvent] +
      " WHERE entityGuid = '" + this.guid + "'" + this.attribWhere + " FACET `" + attributeString + "`";
    // If we have been told to refresh the attribute list (the event type has changed) then do this.
    if (getAttrib) {
      await this.getAttributes();
      await this.get95Duration();
    }
    // Loop through all the attributes and build an array of charts
    let chartsArray = [];
    for (let i = 0; i < this.attributes.length; i++) {
      // The time period is set by the platformState.timeRange
      // Set the refresh of charts to every minute.
      // Show a spinner while the charts are loading.
      // Show any errors in place of the charts if we get an error returned.
      // Show the text "No values." if no data is returned, rather than an empty chart (this can easily happened when filters are selected).
      chartsArray.push(<GridItem columnSpan={2}><Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
        <div className="myHeader"><HeadingText type={HeadingText.TYPE.HEADING_5}>{this.attributes[i]}</HeadingText></div>
        <PlatformStateContext.Consumer>
          {
            (platformState) => {
              return <NrqlQuery
                accountIds={[this.accountId]}
                query={chartQuery.replace(attributeString, this.attributes[i])}
                pollInterval={60000}
                timeRange={platformState.timeRange}
              >
              
                {({ loading, error, data }) => {
                  if (loading) {
                    return <Spinner type={Spinner.TYPE.DOT} />;
                  }
                
                  if (error) {
                    return (
                      <Stack><StackItem><SectionMessage
                        type={SectionMessage.TYPE.WARNING}
                        title="Chart failed to display."
                        description={error.message}
                      /></StackItem></Stack>
                    );
                  }

                  if (data != null && data.length > 0) {
                    //console.log(this.attributes[i]);
                    //console.log(data);
                    return <BarChart
                      data={data}
                      fullWidth
                      onClickBar={(evt) => this.setAttribute(this.attributes[i], evt.metadata.name)}
                    />;
                  }
                  else return <div className="myNoData">No values.</div>
                }
              }
              </NrqlQuery>
            }
          }
          </PlatformStateContext.Consumer>
        </Tile></GridItem>);
    }
    // Get the header charts.
    const header = await this.getHeaderCharts();
    // Now set the state so the UI will refresh.
    this.setState({
      charts: chartsArray,
      metric: this.metric[this.currentMetric],
      event: this.event[this.currentEvent],
      headerCharts: header,
    });
  };

  // Method that takes an arrary of attribute names and returns another array of attribute names
  // excluding any attributes we do not want to display in the charts (mainly response timings).
  getAttributesFromArray (attrib) {
    let attribArray = [];
    for (let i = 0; i < attrib.length; i++) {
      if (attribArray.indexOf(attrib[i]) < 0 && excludeAttributes.indexOf(attrib[i]) < 0) {
        attribArray.push(attrib[i]);
      }   
    }
    return attribArray;
  }

  // Method to get a list of all attributes for this event type and entity.
  // Note this currently gets the list for the last day. This means if there is no data for this entity in the last day
  // then no attributes will be returned! This should probably be a user specified setting. Making this value too large
  // can degrade load performance and make it look like nothing is happening!
  async getAttributes() {
    // Query to get the attribute list.
    const sampleQuery = "SELECT keyset() FROM " + this.eventTypes[this.currentEvent] + " WHERE entityGuid = '" + this.guid +
        "' SINCE 1 days ago";
    let attribArray = [];
    // Run and wait for the query.
    const res = await NrqlQuery.query({
      accountIds: [this.accountId],
      query: sampleQuery,
      formatType: NrqlQuery.FORMAT_TYPE.RAW});
    // Save global lists of attributes - all, numbers and booleans,
    // excluding any unwanted attributes, which we do not want to display in charts.
    attribArray = this.getAttributesFromArray(res.data.results[0].allKeys);
    attribArray.sort(function(a, b){return a.toUpperCase().localeCompare(b.toUpperCase());});
    //console.log(attribArray);
    this.attributes = attribArray;
    this.numberAttributes = this.getAttributesFromArray(res.data.results[0].numericKeys);
    this.booleanAttributes = this.getAttributesFromArray(res.data.results[0].booleanKeys);
  };

  // Method to get the 95th percentile response time, which is used to set the ceiling of the histogram.
  // Note, this usees the default time period and is not changed when the user changes the chart time period,
  // which could lead to some strange results (for example all points on the chart being at the beginning or end of the histogram).
  // It would be better if this changed when the user changes the time period, but I haven't found a nice way to do it.
  async get95Duration() {
    // Query to get the 95th percentile.
    const durationQuery = "SELECT percentile(" + this.duration[this.currentEvent] + ", 95) FROM " + this.eventTypes[this.currentEvent] +
        " WHERE entityGuid = '" + this.guid + "'";
    // Execute the query and wait for the result.
    const res = await NrqlQuery.query({
      accountIds: [this.accountId],
      query: durationQuery,
      formatType: NrqlQuery.FORMAT_TYPE.RAW});
    //console.log(res);
    if (res.data.results.length > 0) {
      // If we got a result, then get it as a number.
      let dur = Number(res.data.results[0].percentiles[95]);
      // Do some maths of round up to a nive value.
      if (dur > 1) {
        dur = Math.round(dur + Number.EPSILON + 0.5);
      } else if (dur > 0.1) {
        dur = Math.round(((dur + Number.EPSILON)*10) + 0.5)/10;
      }
      else {
        dur = Math.round(((dur + Number.EPSILON)*100) + 0.5)/100;
      }
      //console.log(dur);
      // Set the global value for the histogram ceiling.
      this.histogramCeiling = dur;
    }
  }

  // Method called when the user clicks on an attribute in one of the charts.
  // This causes the charts to be filtered by the selected attribute value.
  async setAttribute(attrib, val) {
    // If the attribute is not a number or boolean then we need to be using a quote.
    let quote = "'";
    if (this.numberAttributes.indexOf(attrib) >= 0 || this.booleanAttributes.indexOf(attrib) >= 0) {
      quote = "";
    }
    // Build a local where clause for this attribute and value.
    const addWhere = " AND " + attrib + " = " + quote + val + quote;
    if (this.attribWhere.search(addWhere) < 0) {
      // The attribute does not exist in the global where clause, so we need to add it (the attribute has been selected).
      // Add it to the global where clause.
      this.attribWhere = this.attribWhere + addWhere;
      // Now add it to the Trace filters, booleans are a special case.
      if (this.booleanAttributes.indexOf(attrib) < 0) {
        this.traceFilter.push({"attr":attrib,"operator":"EQ","value":val});
      }
      else {
        this.traceFilter.push({"attr":attrib,"operator":val.toUpperCase(),"value":null});
      }
    }
    else {
      // The user is deselecting the attribute and value.
      // Remove the attribute and value form the global where clause and Trace filters.
      this.attribWhere = this.attribWhere.replace(addWhere, "");
      for (let i = 0; i < this.traceFilter.length; i++) {
        if (this.traceFilter[i].attr === attrib) {
          this.traceFilter.splice(i, 1);
        }
      }
    }
    //console.log(this.traceFilter);
    // Rebuild the charts.
    this.getCharts(false);
  }

  // Method to set the selected metric type ("50th percentile", "75th percentile", etc.).
  async setMetric(metric) {
    // Save the selected metric and refresh the charts.
    this.currentMetric = metric;
    this.getCharts(false);
  }

  // Method to set the event type (only ever called for APM) - Transaction, TranactionErrors and Span.
  async setEvent(event) {
    // Save the selected event type and refresh everything (including the attribute list).
    this.currentEvent = event;
    this.getCharts(true);
  }

  // Method to clear the Trace filters, when the clear filter button is pressed.
  async clearFilter() {
    // Clear the attribute where clause.
    this.attribWhere = "";
    // Set the Trace filter back to the default (remove all items from the array apart from the first).
    this.traceFilter = this.traceFilter.slice(0, 1);
    //console.log(this.traceFilter);
    // Re-display the charts.
    this.getCharts(false);
  }

  // Method to open the Traces stacked nerdlet (display Traces filtered by the selected criteria).
  async getTraces() {
    // Create the nerdlet state for the Traces UI, adding the current trace filters.
    const nerdletState = {
      id: 'distributed-tracing-nerdlets.distributed-tracing-launcher',
      urlState: {"query":{"operator":"AND","indexQuery":{"conditionType":"INDEX","operator":"AND","conditions":[]},
          "spanQuery":{"operator":"AND","conditionSets":[{"conditionType":"SPAN","operator":"AND",
          "conditions":this.traceFilter}]}}},
    }
    //console.log(this.traceFilter);
    // Display the Traces.
    navigation.openStackedNerdlet(nerdletState)
  }

  // Main render method. Uses a number of state variables to dynamically render various UI components.
  render() {
    /*
    Experimental code, ignore!
    const location1 = navigation.getOpenStackedNerdletLocation({id: "attribute-overlay"});
    const nerdlet = {
      id: 'distributed-tracing.home',
      "urlState": {
        "entityGuid": this.guid,
      },
    };
    console.log(nerdlet);

    const location = navigation.getOpenStackedNerdletLocation(nerdlet);
    */
    return (<div>
      <Layout>
        <LayoutItem>
          <div className="myBox">
            <Grid>
              <ChartGroup>
                <GridItem columnSpan={5}>
                  <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
                    <HeadingText className="mySpaceBelow myHeader">*** Performance over time</HeadingText>
                    {this.state.headerCharts[0]}
                  </Tile>
                </GridItem>
                <GridItem columnSpan={4}>
                  <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
                    <HeadingText className="mySpaceBelow myHeader">Counts over time</HeadingText>
                    {this.state.headerCharts[1]}
                  </Tile>
                </GridItem>
                <GridItem columnSpan={3}>
                  <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
                    <HeadingText className="mySpaceBelow myHeader">Response time histogram</HeadingText>
                    {this.state.headerCharts[2]}
                  </Tile>
                </GridItem>
              </ChartGroup>
            </Grid>
          </div>
        </LayoutItem>
      </Layout>
      <Layout>
      <LayoutItem><div className="myBox"><Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
        <BlockText className="myParameterBox" type={BlockText.TYPE.NORMAL}>
          <span className="mySpaceRight">Currently displaying:</span>
          <Dropdown iconType={Dropdown.ICON_TYPE.DATAVIZ__DATAVIZ__BAR_CHART} title={this.state.metric} className="mySpaceRight">
            <DropdownItem onClick={(evt0) => this.setMetric(0)}>{this.metric[0]}</DropdownItem>
            <DropdownItem onClick={(evt1) => this.setMetric(1)}>{this.metric[1]}</DropdownItem>
            <DropdownItem onClick={(evt2) => this.setMetric(2)}>{this.metric[2]}</DropdownItem>
            <DropdownItem onClick={(evt3) => this.setMetric(3)}>{this.metric[3]}</DropdownItem>
            <DropdownItem onClick={(evt4) => this.setMetric(4)}>{this.metric[4]}</DropdownItem>
            <DropdownItem onClick={(evt5) => this.setMetric(5)}>{this.metric[5]}</DropdownItem>
          </Dropdown>
          {this.domain === "APM" &&
            <span><span className="mySpaceRight">of:</span>
              <Dropdown iconType={Dropdown.ICON_TYPE.DATAVIZ__DATAVIZ__TABLE_CHART} title={this.state.event} className="mySpaceRight">
                <DropdownItem onClick={() => this.setEvent(0)}>{this.event[0]}</DropdownItem>
                <DropdownItem onClick={() => this.setEvent(1)}>{this.event[1]}</DropdownItem>
                <DropdownItem onClick={() => this.setEvent(2)}>{this.event[2]}</DropdownItem>
              </Dropdown>
            </span>
          }
          Number of attributes: {this.attributes.length}
          <Button onClick={() => this.getTraces()} className="mySpaceLeft" iconType={Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES}>Traces</Button>
          <div className="mySpaceTop">
            <Button iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__FILTER__A_REMOVE} onClick={() => this.clearFilter()} className="mySpaceRight">Clear filter</Button>
            <span className="mySpaceRight">Current filter:{this.attribWhere.replace(/AND/, "")}</span>
          </div>
        </BlockText>
      </Tile></div></LayoutItem>
      </Layout>
      <Layout>
        <LayoutItem>
            <div className="myBox"><Grid>{this.state.charts}</Grid></div>
        </LayoutItem>
      </Layout>
    </div>);
  }
}
