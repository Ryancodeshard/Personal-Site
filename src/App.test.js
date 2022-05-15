import React from 'react'
import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

afterEach(cleanup)
 
test('should generate a snapshot for app component', () => {
  const { asFragment } = render(<App />)
  expect(asFragment(<App />)).toMatchSnapshot()
});