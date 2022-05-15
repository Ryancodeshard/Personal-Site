//List.test.js

import React from 'react'
import {render, cleanup} from '@testing-library/react'

import List from './List'

afterEach(cleanup)

it("should render List component", () => {    
    const ListComponent = render(<List />);    
    expect(ListComponent).toBeTruthy();  
});

it('renders data correctly', () => {
    const fakeData = [{
        item: 'item 1',
    },
    {
        item: 'item 2',
    },
    {
        item: 'item 3',
    }]
    const {getAllByTestId} = render(<List />)
    const itemNames = getAllByTestId('single-item').map(li => li.textContent)
    const fakeItems = fakeData.map(c => c.item)
    expect(itemNames).toEqual(fakeItems)
     
  })

  it('Total length of list should be 3', () => {
    const {getByTestId} = render(<List />)
    const listUl = getByTestId('item-list-wrap');
    expect(listUl.children.length).toBe(3);
  })