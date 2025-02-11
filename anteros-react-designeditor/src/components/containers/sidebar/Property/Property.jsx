import React from 'react';
import Animate from 'rc-animate';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';
import { DesignType } from '../../../lib/enum';
import { LazyRenderBox } from '../../../components';
import RowProperty from './RowProperty';

@inject('rootStore')
@observer
class Property extends React.Component {

  onClose = () => {
    const { rootStore: { DesignState } } = this.props;
    DesignState.setSelected(null);
  }

  onUpdate = (key, value) => {
    const { propertyId, rootStore: { DesignState } } = this.props;
    DesignState.updateAttribute(propertyId, key, value);
  }

  onDelete = (guid, type) => {
    const { rootStore: { DesignState } } = this.props;
    if (type === DesignType.CONTENT) {
      DesignState.execCommand('deleteContent', guid);
    } else {
      DesignState.execCommand('deleteRow', guid);
    }
  }

  onCopy = (guid, type) => {
    const { rootStore: { DesignState } } = this.props;
    if (type === DesignType.CONTENT) {
      DesignState.execCommand('copyContent', guid);
    } else {
      DesignState.execCommand('copyRow', guid);
    }
  }

  render() {
    const { propertyId, rootStore: { DesignState } } = this.props;
    const data = DesignState.getDataByGuid(propertyId);
    if (!data) {
      return null;
    }
    const meta = data.values._meta;
    let title = 'Linha';
    let extension = null;
    if (meta.type === DesignType.CONTENT) {
      title = `Conteúdo / ${meta.subtype}`;
      extension = DesignState.getExtension(meta.subtype);
    }
    /* eslint-disable */
    return <div className="ds-options-panel">
      <div className="ds-options-header card">
        <div className="card-row">
          <div className="col-7 ds-options-title">
            <span>{title}</span>
          </div>
          <div className="col-5 text-right">
            <div className="options-item" onClick={() => { this.onDelete(propertyId, meta.type); }} data-tooltipped="" aria-describedby="tippy-tooltip-149" data-original-title="Delete" >
              <a className="fal fa-minus-circle"><i className="fal fa-trash" /></a>
            </div>
            <div className="options-item" onClick={() => { this.onCopy(propertyId, meta.type); }} data-tooltipped="" aria-describedby="tippy-tooltip-150" data-original-title="Duplicate">
              <a className="fal fa-clone"><i className="fal fa-copy" /></a>
            </div>
            <a onClick={this.onClose} className="fal fa-times"><i className="fal fa-chevron-down" /></a>
          </div>
        </div>
      </div>
      <div className="ds-options-content">
        {extension ? new extension().getProperties(data.values, this.onUpdate) : <RowProperty {...data.values} onUpdate={this.onUpdate} />}
      </div>
    </div>;
    /* eslint-enable */
  }
}

@inject('rootStore')
@observer
class PropertyWrap extends React.Component {
  render() {
    const { className, visible = false, destroyOnClose = false, style = {} } = this.props;
    const boxElement = <LazyRenderBox
      key="property"
      className={classnames('property-panel', className)}
      hiddenClassName='hide'
      visible={visible}
      style={style}
    >
      <Property {...this.props} />
    </LazyRenderBox>;
    return <Animate
      key="property"
      showProp="visible"
      transitionAppear
      component=""
      transitionName={`bottom`}
    >
      {(!!visible || !destroyOnClose) ? boxElement : null}
    </Animate>;
  }
}


export default PropertyWrap;