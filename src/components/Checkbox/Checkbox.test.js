/* eslint-disable no-undef */
const React = require('react');
const Checkbox = require('./Checkbox');
const renderer = require('react-test-renderer');

it('renders correctly', () => {
  const tree = renderer
    .create(<Checkbox />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});