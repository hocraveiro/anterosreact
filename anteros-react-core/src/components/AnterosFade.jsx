import React, { Component } from "react";
import PropTypes from "prop-types";
import lodash from "lodash";
import { AnterosUtils } from "./AnterosUtils";

export class AnterosFade extends Component {
	constructor(props) {
		super(props);

		this.state = {
			mounted: !props.transitionAppear
		};

		this.onLeave = this.onLeave.bind(this);
		this.onEnter = this.onEnter.bind(this);
		this.timers = [];
	}

	componentWillUnmount() {
		this.timers.forEach(timer => clearTimeout(timer));
	}
	onEnter(cb) {
		return () => {
			cb();
			if (this.props.onEnter) {
				this.props.onEnter();
			}
		};
	}
	onLeave(cb) {
		return () => {
			cb();
			if (this.props.onLeave) {
				this.props.onLeave();
			}
		};
	}

	componentWillAppear(cb) {
		if (!this.props.transitionAppear) {
			this.onEnter(cb)();
		}

		this.timers.push(
			setTimeout(this.onEnter(cb), this.props.transitionAppearTimeout)
		);
	}

	componentDidAppear() {
		this.setState({
			mounted: true
		});
	}

	componentWillEnter(cb) {
		if (!this.props.transitionEnter) {
			this.onEnter(cb)();
		}

		this.timers.push(
			setTimeout(this.onEnter(cb), this.props.transitionEnterTimeout)
		);
	}

	componentDidEnter() {
		this.setState({
			mounted: true
		});
	}

	componentWillLeave(cb) {
		this.setState({
			mounted: false
		});

		if (!this.props.transitionLeave) {
			this.onLeave(cb)();
		}

		this.timers.push(
			setTimeout(this.onLeave(cb), this.props.transitionLeaveTimeout)
		);
	}
	render() {
		const {
			baseClass,
			baseClassIn,
			className,
			cssModule,
			tag: Tag
		} = this.props;
		const attributes = lodash.omit(
			this.props,
			Object.keys(AnterosFade.propTypes)
		);

		const classes = AnterosUtils.mapToCssModules(
			AnterosUtils.buildClassNames(
				className,
				baseClass,
				this.state.mounted ? baseClassIn : false
			),
			cssModule
		);

		return <Tag {...attributes} className={classes} />;
	}
}

AnterosFade.propTypes = {
	baseClass: PropTypes.string,
	baseClassIn: PropTypes.string,
	tag: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	className: PropTypes.string,
	cssModule: PropTypes.object,
	transitionAppearTimeout: PropTypes.number,
	transitionEnterTimeout: PropTypes.number,
	transitionLeaveTimeout: PropTypes.number,
	transitionAppear: PropTypes.bool,
	transitionEnter: PropTypes.bool,
	transitionLeave: PropTypes.bool,
	onLeave: PropTypes.func,
	onEnter: PropTypes.func
};

AnterosFade.defaultProps = {
	tag: "div",
	baseClass: "fade",
	baseClassIn: "show",
	transitionAppearTimeout: 0,
	transitionEnterTimeout: 0,
	transitionLeaveTimeout: 0,
	transitionAppear: true,
	transitionEnter: true,
	transitionLeave: true
};
