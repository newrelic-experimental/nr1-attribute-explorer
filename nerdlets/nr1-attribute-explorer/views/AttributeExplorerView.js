import React from "react";
import { Layout, LayoutItem, Tile, BlockText, Button, Dropdown } from "nr1";
import { HeaderChartsContainer } from "../components/HeaderChartsContainer";
import { AttributeChartsContainer } from "../components/AttributeChartsContainer";
import { CustomDropdown } from "../components/CustomDropdown";

const AttributeExplorerView = ({
  accountId,
  guid,
  eventTypes,
  currentEvent,
  attribWhere,
  duration,
  histogramCeiling,
  metric,
  metricOptions,
  event,
  eventOptions,
  attributes,
  currentMetric,
  setMetric,
  setEvent,
  clearFilter,
  getTraces,
  setAttribute,
  domain,
}) => {
  return (
    <div>
      <Layout>
        <LayoutItem>
          <div className="myBox">
            <HeaderChartsContainer
              accountId={accountId}
              guid={guid}
              eventTypes={eventTypes}
              currentEvent={currentEvent}
              attribWhere={attribWhere}
              duration={duration}
              histogramCeiling={histogramCeiling}
            />
          </div>
        </LayoutItem>
      </Layout>
      <Layout>
        <LayoutItem>
          <div className="myBox">
            <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
              <BlockText
                className="myParameterBox"
                type={BlockText.TYPE.NORMAL}
              >
                <span className="mySpaceRight">Currently displaying:</span>
                <CustomDropdown
                  title={metric}
                  options={metricOptions}
                  onSelect={setMetric}
                  iconType={Dropdown.ICON_TYPE.DATAVIZ__DATAVIZ__BAR_CHART}
                />
                {domain === "APM" && (
                  <span>
                    <span className="mySpaceRight">of:</span>
                    <CustomDropdown
                      title={event}
                      options={eventOptions}
                      onSelect={setEvent}
                      iconType={
                        Dropdown.ICON_TYPE.DATAVIZ__DATAVIZ__TABLE_CHART
                      }
                    />
                  </span>
                )}
                Number of attributes: {attributes.length}
                <Button
                  onClick={getTraces}
                  className="mySpaceLeft"
                  iconType={
                    Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES
                  }
                >
                  Traces
                </Button>
                <div className="mySpaceTop">
                  <Button
                    iconType={
                      Button.ICON_TYPE.INTERFACE__OPERATIONS__FILTER__A_REMOVE
                    }
                    onClick={clearFilter}
                    className="mySpaceRight"
                  >
                    Clear filter
                  </Button>
                  <span className="mySpaceRight">
                    Current filter:{attribWhere.replace(/AND/, "")}
                  </span>
                </div>
              </BlockText>
            </Tile>
          </div>
        </LayoutItem>
      </Layout>
      <Layout>
        <LayoutItem>
          <div className="myBox">
            <AttributeChartsContainer
              accountId={accountId}
              guid={guid}
              eventTypes={eventTypes}
              currentEvent={currentEvent}
              attribWhere={attribWhere}
              duration={duration}
              currentMetric={currentMetric}
              attributes={attributes}
              setAttribute={setAttribute}
            />
          </div>
        </LayoutItem>
      </Layout>
    </div>
  );
};

export { AttributeExplorerView };
