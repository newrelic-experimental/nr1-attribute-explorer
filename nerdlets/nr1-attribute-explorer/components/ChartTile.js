import React from "react";
import { Tile, HeadingText, GridItem } from "nr1";

const ChartTile = ({ title, chart, columnSpan }) => {
  return (
    <GridItem columnSpan={columnSpan}>
      <Tile type={Tile.TYPE.PLAIN} sizeType={Tile.SIZE_TYPE.SMALL}>
        <HeadingText className="mySpaceBelow myHeader">{title}</HeadingText>
        {chart}
      </Tile>
    </GridItem>
  );
};

export { ChartTile };
