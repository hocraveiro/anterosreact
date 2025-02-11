import React from 'react';
import { AnterosSweetAlert, AnterosError } from '@anterostecnologia/anteros-react-core';
import {
  AnterosCard,
  HeaderActions,
  AnterosForm
} from '@anterostecnologia/anteros-react-containers';
import { AnterosAlert } from '@anterostecnologia/anteros-react-notification';
import { AnterosButton } from '@anterostecnologia/anteros-react-buttons';
import { connect } from 'react-redux';
import { processErrorMessage, processDetailErrorMessage } from '@anterostecnologia/anteros-react-core';
import { dataSourceConstants } from '@anterostecnologia/anteros-react-datasource';
import { autoBind } from '@anterostecnologia/anteros-react-core';
import { AnterosBlockUi } from '@anterostecnologia/anteros-react-loaders';
import { AnterosLoader } from '@anterostecnologia/anteros-react-loaders';

const defaultValues = { messageSaving: 'Aguarde... salvando.', forceRefresh: true };

export default function WithFormTemplate(_loadingProps) {
  let loadingProps = { ...defaultValues, ..._loadingProps };

  const mapStateToProps = state => {
    let user;
    user = state[loadingProps.userReducerName].user
    return {
      dataSource: state[loadingProps.reducerName].dataSource,
      user: user
    };
  };

  const mapDispatchToProps = dispatch => {
    if (loadingProps.forceRefresh) {
      return {
        setNeedRefresh: () => {
          dispatch(loadingProps.actions.setNeedRefresh());
        },
        setDatasource: dataSource => {
          dispatch(loadingProps.actions.setDatasource(dataSource));
        },
        hideTour: () => {
          dispatch({ type: "HIDE_TOUR" });
        },
        setFilter: (
          activeFilter,
          query,
          sort,
          activeSortIndex,
          quickFilterText
        ) => {
          dispatch(
            loadingProps.actions.setFilter(
              activeFilter,
              query,
              sort,
              activeSortIndex,
              quickFilterText
            )
          );
        }
      };
    }
    return {
      setDatasource: dataSource => {
        dispatch(loadingProps.actions.setDatasource(dataSource));
      },
      setFilter: (
        activeFilter,
        query,
        sort,
        activeSortIndex,
        quickFilterText
      ) => {
        dispatch(
          loadingProps.actions.setFilter(
            activeFilter,
            query,
            sort,
            activeSortIndex,
            quickFilterText
          )
        );
      }
    };
  };



  return WrappedComponent => {
    class FormView extends WrappedComponent {
      constructor(props, context) {
        super(props);
        autoBind(this);

        if (!loadingProps.endPoints) {
          throw new AnterosError(
            'Informe o objeto com os endPoints de consulta.'
          );
        }
        if (!loadingProps.resource) {
          throw new AnterosError('Informe o nome do RESOURCE de consulta. ');
        }
        if (!loadingProps.reducerName) {
          throw new AnterosError('Informe o nome do REDUCER. ');
        }
        if (!loadingProps.userReducerName) {
          throw new AnterosError('Informe o nome do REDUCER de Usuários. ');
        }
        if (!loadingProps.actions) {
          throw new AnterosError(
            'Informe o objeto com as actions do REDUCER. '
          );
        }
        if (!loadingProps.formName) {
          throw new AnterosError('Informe o nome do Form. ');
        }
        if (!loadingProps.caption) {
          throw new AnterosError('Informe o caption(titulo) da Form. ');
        }
        if (!loadingProps.routes) {
          throw new AnterosError('Informe as rotas das ações. ');
        }

        if (WrappedComponent.prototype.hasOwnProperty('getRoutes') && this.getRoutes()) {
          loadingProps.routes = this.getRoutes();
        }

        this.state = {
          alertIsOpen: false,
          alertMessage: '',
          saving: false,
          messageLoader: loadingProps.messageSaving
        };
      }

      convertMessage(alertMessage) {
        if (alertMessage.constructor === Array) {
          let result = [];
          alertMessage.forEach((item, index) => {
            result.push(<span style={{
              whiteSpace: "pre"
            }} key={index}>{item + "\n"}</span>);
          });
          return result;
        } else {
          return alertMessage;
        }
      }


      onButtonClick(event, button) {
        let _this = this;

        if (button.props.id === 'btnClose') {
          if (
            WrappedComponent.prototype.hasOwnProperty('onBeforeClose') === true
          ) {
            if (!this.onBeforeClose()) {
              return;
            }
          }
          if (
            WrappedComponent.prototype.hasOwnProperty('customClose') === true
          ) {
            this.customClose();
            return;
          }
          if (
            this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
          ) {
            this.props.dataSource.cancel();
          }
          this.props.history.push(button.props.route);
        } else if (button.props.id === 'btnSave') {
          if (
            WrappedComponent.prototype.hasOwnProperty('onBeforeSave') === true
          ) {
            if (!this.onBeforeSave()) {
              return;
            }
          }
          if (
            WrappedComponent.prototype.hasOwnProperty('customSave') === true
          ) {
            this.customSave();
            return;
          }
          AnterosSweetAlert({
            title: 'Deseja salvar ?',
            text: '',
            type: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            focusCancel: false
          })
            .then(function () {
              _this.setState({
                ..._this.state,
                saving: true
              });
              _this.props.dataSource.post(error => {
                if (error) {
                  var result = _this.convertMessage(processErrorMessage(error));
                  var debugMessage = processDetailErrorMessage(error);
                  _this.setState({
                    ..._this.state,
                    alertIsOpen: true,
                    alertMessage: result,
                    debugMessage: (debugMessage === "" ? undefined : debugMessage),
                    saving: false
                  });
                } else {
                  if (
                    WrappedComponent.prototype.hasOwnProperty('onAfterSave') ===
                    true
                  ) {
                    if (!_this.onAfterSave()) {
                      return;
                    }
                  }
                  _this.setState({
                    ..._this.state,
                    alertIsOpen: false,
                    alertMessage: '',
                    saving: false
                  });

                  if (loadingProps.forceRefresh) {
                    _this.props.setNeedRefresh();
                  }
                  _this.props.history.push(button.props.route);
                }
              });
            })
            .catch(function (reason) {
              // quando apertar o botao "cancelar" cai aqui. Apenas ignora. (sem processamento necessario)
            });
        } else if (button.props.id === 'btnCancel') {
          if (
            WrappedComponent.prototype.hasOwnProperty('onBeforeCancel') === true
          ) {
            if (!this.onBeforeCancel()) {
              return;
            }
          }
          if (
            WrappedComponent.prototype.hasOwnProperty('customCancel') === true
          ) {
            this.customCancel();
            return;
          }
          AnterosSweetAlert({
            title: 'Deseja cancelar ?',
            text: '',
            type: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            focusCancel: true
          })
            .then(function (isConfirm) {
              if (isConfirm) {
                if (
                  _this.props.dataSource.getState() !==
                  dataSourceConstants.DS_BROWSE
                ) {
                  _this.props.dataSource.cancel();
                }
                if (
                  WrappedComponent.prototype.hasOwnProperty('onAfterCancel') ===
                  true
                ) {
                  if (!_this.onAfterCancel()) {
                    return;
                  }
                }
                _this.props.history.push(button.props.route);
              }
              return;
            })
            .catch(function (reason) {
              // quando apertar o botao "cancelar" cai aqui. Apenas ignora. (sem processamento necessario)
            });
        }
      }

      autoCloseAlert() {
        this.setState({
          ...this.state,
          alertIsOpen: false,
          alertMessage: ''
        });
      }

      onCloseAlert() {
        this.setState({
          ...this.state,
          alertIsOpen: false,
          alertMessage: ''
        });
      }

      onDetailClick(event, button) {
        if (this.state.debugMessage) {
          AnterosSweetAlert({
            title: 'Detalhes do erro',
            html: '<b>' + this.state.debugMessage + '</b>',
            width: '1000px'
          });
        }
      }

      componentDidMount() {
        if (WrappedComponent.prototype.hasOwnProperty('onDidMount') === true) {
          this.onDidMount();
        }
      }

      componentWillUnMount() {
        if (WrappedComponent.prototype.hasOwnProperty('onWillUnmount') === true) {
          this.onWillUnmount();
        }
        this.props.hideTour();
      }

      update(newState) {
        this.setState({ ...this.state, ...newState });
      }

      getOwnerForm() {
        return this.owner;
      }

      render() {
        return (
          <AnterosCard
            caption={loadingProps.caption}
            height=""
            withScroll
            className="versatil-card-full"
          >
            <HeaderActions>
              <AnterosButton
                id="btnClose"
                icon="fa fa-times"
                route={loadingProps.routes.close}
                small
                circle
                onButtonClick={this.onButtonClick}
              />
            </HeaderActions>
            <AnterosAlert
              danger
              fill
              isOpen={this.state.alertIsOpen}
              autoCloseInterval={25000}
              onClose={this.onCloseAlert}
            >{this.state.debugMessage ?
              <div>
                {this.state.debugMessage ? <AnterosButton id="dtnDetail" circle small icon="far fa-align-justify" onButtonClick={this.onDetailClick} /> : null}
                {this.state.alertMessage}
              </div>
              : this.state.alertMessage}
            </AnterosAlert>
            <AnterosBlockUi
              styleBlockMessage={{
                border: '2px solid white',
                width: '200px',
                backgroundColor: '#8BC34A',
                borderRadius: '8px',
                color: 'white'
              }}
              styleOverlay={{
                opacity: 0.1,
                backgroundColor: 'black'
              }}
              tag="div"
              blocking={this.state.saving || this.state.loading}
              message={this.state.messageLoader}
              loader={
                <AnterosLoader active type="ball-pulse" color="#02a17c" />
              }
            >
              <AnterosForm id={loadingProps.formName}>
                <WrappedComponent
                  {...this.props}
                  dataSource={this.props.dataSource}
                  loadingProps={loadingProps}
                  onButtonClick={this.onButtonClick}
                  user={this.props.user}
                  ref={ref => (this.owner = ref)}
                  update={this.update}
                  ownerTemplate={this}
                  setDatasource={this.props.setDatasource}
                  setFilter={this.props.setFilter}
                />
              </AnterosForm>
            </AnterosBlockUi>
          </AnterosCard>
        );
      }
    }

    return connect(
      mapStateToProps,
      mapDispatchToProps
    )(FormView);
  };
}
