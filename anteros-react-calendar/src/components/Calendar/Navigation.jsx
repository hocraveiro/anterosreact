import PropTypes from 'prop-types';
import { getUserLocale } from 'get-user-locale';
import {AnterosIcon} from "@anterostecnologia/anteros-react-image";

import {
  getCenturyLabel,
  getDecadeLabel,
  getBeginNext,
  getBeginNext2,
  getBeginPrevious,
  getBeginPrevious2,
  getEndPrevious,
  getEndPrevious2,
} from '../shared/dates';
import {
  formatMonthYear as defaultFormatMonthYear,
  formatYear as defaultFormatYear,
} from '../shared/dateFormatter';
import { isView, isViews } from '../shared/propTypes';

const className = 'react-calendar__navigation';

export default function Navigation({
  activeStartDate,
  drillUp,
  formatMonthYear = defaultFormatMonthYear,
  formatYear = defaultFormatYear,
  locale,
  maxDate,
  minDate,
  navigationAriaLabel = '',
  navigationLabel,
  next2AriaLabel = '',
  next2Label = '»',
  nextAriaLabel = '',
  nextLabel = '›',
  prev2AriaLabel = '',
  prev2Label = '«',
  prevAriaLabel = '',
  prevLabel = '‹',
  setActiveStartDate,
  showDoubleView,
  view,
  views,
}) {
  const drillUpAvailable = views.indexOf(view) > 0;
  const shouldShowPrevNext2Buttons = view !== 'century';

  const previousActiveStartDate = getBeginPrevious(view, activeStartDate);
  const previousActiveStartDate2 = (
    shouldShowPrevNext2Buttons
    && getBeginPrevious2(view, activeStartDate)
  );
  const nextActiveStartDate = getBeginNext(view, activeStartDate);
  const nextActiveStartDate2 = shouldShowPrevNext2Buttons && getBeginNext2(view, activeStartDate);

  const prevButtonDisabled = (() => {
    if (previousActiveStartDate.getFullYear() < 1000) {
      return true;
    }
    const previousActiveEndDate = getEndPrevious(view, activeStartDate);
    return minDate && minDate >= previousActiveEndDate;
  })();

  const prev2ButtonDisabled = shouldShowPrevNext2Buttons && (() => {
    if (previousActiveStartDate2.getFullYear() < 1000) {
      return true;
    }
    const previousActiveEndDate = getEndPrevious2(view, activeStartDate);
    return minDate && minDate >= previousActiveEndDate;
  })();

  const nextButtonDisabled = maxDate && maxDate <= nextActiveStartDate;

  const next2ButtonDisabled = (
    shouldShowPrevNext2Buttons
    && maxDate
    && maxDate <= nextActiveStartDate2
  );

  function onClickPrevious() {
    setActiveStartDate(previousActiveStartDate);
  }

  function onClickPrevious2() {
    setActiveStartDate(previousActiveStartDate2);
  }

  function onClickNext() {
    setActiveStartDate(nextActiveStartDate);
  }

  function onClickNext2() {
    setActiveStartDate(nextActiveStartDate2);
  }

  function renderLabel(date) {
    const label = (() => {
      switch (view) {
        case 'century':
          return getCenturyLabel(locale, formatYear, date);
        case 'decade':
          return getDecadeLabel(locale, formatYear, date);
        case 'year':
          return formatYear(locale, date);
        case 'month':
          return formatMonthYear(locale, date);
        default:
          throw new Error(`Invalid view: ${view}.`);
      }
    })();

    return (
      navigationLabel
        ? navigationLabel({
          date,
          label,
          locale: locale || getUserLocale(),
          view,
        })
        : label
    );
  }

  return (
    <div
      className={className}
      style={{ display: 'flex' }}
    >
      {prev2Label !== null && shouldShowPrevNext2Buttons && (
        <button
          aria-label={prev2AriaLabel}
          className={`${className}__arrow ${className}__prev2-button`}
          disabled={prev2ButtonDisabled}
          onClick={onClickPrevious2}
          type="button"
        >
          <AnterosIcon icon="fas fa-angle-double-left"/>
        </button>
      )}
      <button
        aria-label={prevAriaLabel}
        className={`${className}__arrow ${className}__prev-button`}
        disabled={prevButtonDisabled}
        onClick={onClickPrevious}
        type="button"
      >
        <AnterosIcon icon="fas fa-angle-left"/>
      </button>
      <button
        aria-label={navigationAriaLabel}
        className={`${className}__label`}
        disabled={!drillUpAvailable}
        onClick={drillUp}
        style={{ flexGrow: 1 }}
        type="button"
      >
        {renderLabel(activeStartDate)}
        {showDoubleView && (
          <>
            {' '}
            –
            {' '}
            {renderLabel(nextActiveStartDate)}
          </>
        )}
      </button>
      <button
        aria-label={nextAriaLabel}
        className={`${className}__arrow ${className}__next-button`}
        disabled={nextButtonDisabled}
        onClick={onClickNext}
        type="button"
      >
        <AnterosIcon icon="fas fa-angle-right"/>
      </button>
      {next2Label !== null && shouldShowPrevNext2Buttons && (
        <button
          aria-label={next2AriaLabel}
          className={`${className}__arrow ${className}__next2-button`}
          disabled={next2ButtonDisabled}
          onClick={onClickNext2}
          type="button"
        >
          <AnterosIcon icon="fas fa-angle-double-right"/>
        </button>
      )}
    </div>
  );
}

Navigation.propTypes = {
  activeStartDate: PropTypes.instanceOf(Date).isRequired,
  drillUp: PropTypes.func.isRequired,
  formatMonthYear: PropTypes.func,
  formatYear: PropTypes.func,
  locale: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  minDate: PropTypes.instanceOf(Date),
  navigationAriaLabel: PropTypes.string,
  navigationLabel: PropTypes.func,
  next2AriaLabel: PropTypes.string,
  next2Label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  nextAriaLabel: PropTypes.string,
  nextLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  prev2AriaLabel: PropTypes.string,
  prev2Label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  prevAriaLabel: PropTypes.string,
  prevLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  setActiveStartDate: PropTypes.func.isRequired,
  showDoubleView: PropTypes.bool,
  view: isView.isRequired,
  views: isViews.isRequired,
};
