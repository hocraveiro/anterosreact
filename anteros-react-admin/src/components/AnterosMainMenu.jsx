import React, { Component, Fragment } from 'react';

export default class AnterosMainMenu extends Component {

  get componentName(){
    return "AnterosMainMenu";
  }

  render() {
    return <Fragment>{this.props.children}</Fragment>;
  }
}