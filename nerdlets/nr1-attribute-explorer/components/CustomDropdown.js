import React from "react";
import { Dropdown, DropdownItem } from "nr1";

const CustomDropdown = ({ title, options, onSelect, iconType }) => {
  return (
    <Dropdown title={title} iconType={iconType} className="mySpaceRight">
      {options.map((option, index) => (
        <DropdownItem key={index} onClick={() => onSelect(index)}>
          {option}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export { CustomDropdown };
