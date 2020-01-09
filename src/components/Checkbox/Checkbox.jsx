const React = require('react');
const PropTypes = require('prop-types');

const Checkbox = (props) => {
    return <input type="checkbox" {...props} />
}

Checkbox.propTypes = {
    type: PropTypes.string
};
module.exports = Checkbox;