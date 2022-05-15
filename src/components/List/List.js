//List.js
import React from "react";

const dummyJSON = [
  {
    name: 'item 1',
    description: 'this is a first item'
  },
  {
    name: 'item 2',
    description: 'this is a second item'
  },
  {
    name: 'item 3',
    description: 'this is a third item'
  }
];
const List = () => {
  return (
    <div>
      <ul data-testid="item-list-wrap">
        {dummyJSON.map((item, index) => (
          <li key={index} className="list-item" data-testid="single-item">
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default List;