import React, { PureComponent, Component } from 'react';
import PropTypes from 'prop-types';
import makeEventProps from 'make-event-props';
import mergeClassNames from 'merge-class-names';
import {AnterosCalendar} from 'anteros-react-calendar';
import Fit from 'react-fit';
import { DayInput, MonthInput, MonthSelect, YearInput } from './AnterosDatePicker';
import { Hour12Input, Hour24Input, MinuteInput, SecondInput, AmPm } from './AnterosTimePicker';
import {
    getYear,
    getMonthHuman,
    getDate,
    getHours,
    getMinutes,
    getSeconds,
    getHoursMinutes,
    getHoursMinutesSeconds,
} from '@wojtekmaj/date-utils';
import {
    getISOLocalDate,
    getISOLocalDateTime,
} from '@wojtekmaj/date-utils';
import { AnterosClock } from 'anteros-react-calendar';
import getUserLocale from 'get-user-locale';
import { buildGridClassNames, columnProps } from "anteros-react-layout";
import { AnterosLocalDatasource, AnterosRemoteDatasource, dataSourceEvents } from "anteros-react-datasource";
import { AnterosUtils, AnterosDateUtils, autoBind } from 'anteros-react-core';

const allViews = ['hour', 'minute', 'second'];
const baseClassName = 'react-datetime-picker';
const outsideActionEvents = ['mousedown', 'focusin', 'touchstart'];
const allValueTypes = [...allViews];

export const isMinDate = (props, propName, componentName) => {
    const { [propName]: minDate } = props;

    if (!minDate) {
        return null;
    }

    if (!(minDate instanceof Date)) {
        return new Error(`Invalid prop \`${propName}\` of type \`${typeof minDate}\` supplied to \`${componentName}\`, expected instance of \`Date\`.`);
    }

    const { maxDate } = props;

    if (maxDate && minDate > maxDate) {
        return new Error(`Invalid prop \`${propName}\` of type \`${typeof minDate}\` supplied to \`${componentName}\`, minDate cannot be larger than maxDate.`);
    }

    return null;
};

export const isMaxDate = (props, propName, componentName) => {
    const { [propName]: maxDate } = props;

    if (!maxDate) {
        return null;
    }

    if (!(maxDate instanceof Date)) {
        return new Error(`Invalid prop \`${propName}\` of type \`${typeof maxDate}\` supplied to \`${componentName}\`, expected instance of \`Date\`.`);
    }

    const { minDate } = props;

    if (minDate && maxDate < minDate) {
        return new Error(`Invalid prop \`${propName}\` of type \`${typeof maxDate}\` supplied to \`${componentName}\`, maxDate cannot be smaller than minDate.`);
    }

    return null;
};

export const isValueType = PropTypes.oneOf(allValueTypes);

export function convert12to24(hour12, amPm) {
    let hour24 = parseInt(hour12, 10);

    if (amPm === 'am' && hour24 === 12) {
        hour24 = 0;
    } else if (amPm === 'pm' && hour24 < 12) {
        hour24 += 12;
    }

    return hour24;
}

export function convert24to12(hour24) {
    const hour12 = hour24 % 12 || 12;

    return [hour12, hour24 < 12 ? 'am' : 'pm'];
}

export function getFormatter(options) {
    return (locale, date) => date.toLocaleString(locale || getUserLocale(), options);
}

const formatDateOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };

export const formatDate = getFormatter(formatDateOptions);

/**
 * Returns a value no smaller than min and no larger than max.
 *
 * @param {*} value Value to return.
 * @param {*} min Minimum return value.
 * @param {*} max Maximum return value.
 */
export function between(value, min, max) {
    if (min && min > value) {
        return min;
    }
    if (max && max < value) {
        return max;
    }
    return value;
}

/**
 * Calls a function, if it's defined, with specified arguments
 * @param {Function} fn
 * @param {Object} args
 */
export function callIfDefined(fn, ...args) {
    if (fn && typeof fn === 'function') {
        fn(...args);
    }
}

const nines = ['9', '٩'];
const ninesRegExp = new RegExp(`[${nines.join('')}]`);
const amPmFormatter = getFormatter({ hour: 'numeric' });

export function getAmPmLabels(locale) {
    const amString = amPmFormatter(locale, new Date(2017, 0, 1, 9));
    const pmString = amPmFormatter(locale, new Date(2017, 0, 1, 21));

    const [am1, am2] = amString.split(ninesRegExp);
    const [pm1, pm2] = pmString.split(ninesRegExp);

    if (pm2 !== undefined) {
        // If pm2 is undefined, nine was not found in pmString - this locale is not using 12-hour time
        if (am1 !== pm1) {
            return [am1, pm1].map(el => el.trim());
        }

        if (am2 !== pm2) {
            return [am2, pm2].map(el => el.trim());
        }
    }

    // Fallback
    return ['AM', 'PM'];
}

export function NativeInput({
    ariaLabel,
    disabled,
    maxDate,
    minDate,
    name,
    onChange,
    required,
    value,
    valueType,
}) {
    const nativeValueParser = (() => {
        switch (valueType) {
            case 'hour':
                return receivedValue => `${getISOLocalDate(receivedValue)}T${getHours(receivedValue)}:00`;
            case 'minute':
                return receivedValue => `${getISOLocalDate(receivedValue)}T${getHoursMinutes(receivedValue)}`;
            case 'second':
                return getISOLocalDateTime;
            default:
                throw new Error('Invalid valueType.');
        }
    })();

    const step = (() => {
        switch (valueType) {
            case 'hour':
                return 3600;
            case 'minute':
                return 60;
            case 'second':
                return 1;
            default:
                throw new Error('Invalid valueType.');
        }
    })();

    function stopPropagation(event) {
        event.stopPropagation();
    }

    return (
        <input
            aria-label={ariaLabel}
            disabled={disabled}
            max={maxDate ? nativeValueParser(maxDate) : null}
            min={minDate ? nativeValueParser(minDate) : null}
            name={name}
            onChange={onChange}
            onFocus={stopPropagation}
            required={required}
            step={step}
            style={{
                visibility: 'hidden',
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
            }}
            type="datetime-local"
            value={value ? nativeValueParser(value) : ''}
        />
    );
}

NativeInput.propTypes = {
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
    maxDate: isMaxDate,
    minDate: isMinDate,
    name: PropTypes.string,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
    ]),
    valueType: isValueType,
};

export function Divider({ children }) {
    return (
        <span className="react-datetime-picker__inputGroup__divider">
            {children}
        </span>
    );
}

Divider.propTypes = {
    children: PropTypes.node,
};





const defaultMinDate = new Date(-8.64e15);
const defaultMaxDate = new Date(8.64e15);

function datesAreDifferent(date1, date2) {
    return (
        (date1 && !date2)
        || (!date1 && date2)
        || (date1 && date2 && date1.getTime() !== date2.getTime())
    );
}

function isSameDate(date, year, month, day) {
    return (
        getYear(date) === year
        && getMonthHuman(date) === month
        && getDate(date) === day
    );
}

function getValue(value, index) {
    if (!value) {
        return null;
    }

    const rawValue = value instanceof Array && value.length === 2 ? value[index] : value;

    if (!rawValue) {
        return null;
    }

    const valueDate = new Date(rawValue);

    if (isNaN(valueDate.getTime())) {
        throw new Error(`Invalid date: ${value}`);
    }

    return valueDate;
}

function getDetailValue({
    value, minDate, maxDate,
}, index) {
    const valuePiece = getValue(value, index);

    if (!valuePiece) {
        return null;
    }

    return between(valuePiece, minDate, maxDate);
}

const getDetailValueFrom = args => getDetailValue(args, 0);

const getDetailValueTo = args => getDetailValue(args, 1);

function isValidInput(element) {
    return element.tagName === 'INPUT' && element.type === 'number';
}

function findInput(element, property) {
    let nextElement = element;
    do {
        nextElement = nextElement[property];
    } while (nextElement && !isValidInput(nextElement));
    return nextElement;
}

function focus(element) {
    if (element) {
        element.focus();
    }
}

function renderCustomInputs(placeholder, elementFunctions, allowMultipleInstances) {
    const usedFunctions = [];
    const pattern = new RegExp(
        Object.keys(elementFunctions).map(el => `${el}+`).join('|'), 'g',
    );
    const matches = placeholder.match(pattern);

    return placeholder.split(pattern)
        .reduce((arr, element, index) => {
            const divider = element && (
                // eslint-disable-next-line react/no-array-index-key
                <Divider key={`separator_${index}`}>
                    {element}
                </Divider>
            );
            const res = [...arr, divider];
            const currentMatch = matches && matches[index];

            if (currentMatch) {
                const renderFunction = (
                    elementFunctions[currentMatch]
                    || elementFunctions[
                    Object.keys(elementFunctions)
                        .find(elementFunction => currentMatch.match(elementFunction))
                    ]
                );

                if (!allowMultipleInstances && usedFunctions.includes(renderFunction)) {
                    res.push(currentMatch);
                } else {
                    res.push(renderFunction(currentMatch, index));
                    usedFunctions.push(renderFunction);
                }
            }
            return res;
        }, []);
}

export class DateTimeInput extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const { minDate, maxDate } = nextProps;

        const nextState = {};

        /**
         * If isWidgetOpen flag has changed, we have to update it.
         * It's saved in state purely for use in getDerivedStateFromProps.
         */
        if (nextProps.isWidgetOpen !== prevState.isWidgetOpen) {
            nextState.isWidgetOpen = nextProps.isWidgetOpen;
        }

        /**
         * If the next value is different from the current one  (with an exception of situation in
         * which values provided are limited by minDate and maxDate so that the dates are the same),
         * get a new one.
         */
        const nextValue = getDetailValueFrom({ value: nextProps.value, minDate, maxDate });
        const values = [nextValue, prevState.value];
        if (
            // Toggling calendar visibility resets values
            nextState.isCalendarOpen // Flag was toggled
            || datesAreDifferent(
                ...values.map(value => getDetailValueFrom({ value, minDate, maxDate })),
            )
            || datesAreDifferent(
                ...values.map(value => getDetailValueTo({ value, minDate, maxDate })),
            )
        ) {
            if (nextValue) {
                [, nextState.amPm] = convert24to12(getHours(nextValue));
                nextState.year = getYear(nextValue);
                nextState.month = getMonthHuman(nextValue);
                nextState.day = getDate(nextValue);
                nextState.hour = getHours(nextValue);
                nextState.minute = getMinutes(nextValue);
                nextState.second = getSeconds(nextValue);
            } else {
                nextState.amPm = null;
                nextState.year = null;
                nextState.month = null;
                nextState.day = null;
                nextState.hour = null;
                nextState.minute = null;
                nextState.second = null;
            }
            nextState.value = nextValue;
        }

        return nextState;
    }

    state = {
        amPm: null,
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null,
        second: null,
    };

    get formatTime() {
        const { maxDetail } = this.props;

        const options = { hour: 'numeric' };
        const level = allViews.indexOf(maxDetail);
        if (level >= 1) {
            options.minute = 'numeric';
        }
        if (level >= 2) {
            options.second = 'numeric';
        }

        return getFormatter(options);
    }

    // eslint-disable-next-line class-methods-use-this
    get formatNumber() {
        const options = { useGrouping: false };

        return getFormatter(options);
    }

    get dateDivider() {
        return this.datePlaceholder.match(/[^0-9a-z]/i)[0];
    }

    get timeDivider() {
        return this.timePlaceholder.match(/[^0-9a-z]/i)[0];
    }

    get datePlaceholder() {
        const { locale } = this.props;

        const year = 2017;
        const monthIndex = 11;
        const day = 11;

        const date = new Date(year, monthIndex, day);

        return (
            formatDate(locale, date)
                .replace(this.formatNumber(locale, year), 'y')
                .replace(this.formatNumber(locale, monthIndex + 1), 'M')
                .replace(this.formatNumber(locale, day), 'd')
        );
    }

    get timePlaceholder() {
        const { locale } = this.props;

        const hour24 = 21;
        const hour12 = 9;
        const minute = 13;
        const second = 14;
        const date = new Date(2017, 0, 1, hour24, minute, second);

        return (
            this.formatTime(locale, date)
                .replace(this.formatNumber(locale, hour12), 'h')
                .replace(this.formatNumber(locale, hour24), 'H')
                .replace(this.formatNumber(locale, minute), 'mm')
                .replace(this.formatNumber(locale, second), 'ss')
                .replace(new RegExp(getAmPmLabels(locale).join('|')), 'a')
        );
    }

    get placeholder() {
        const { format } = this.props;

        if (format) {
            return format;
        }

        return `${this.datePlaceholder}\u00a0${this.timePlaceholder}`;
    }

    get maxTime() {
        const { maxDate } = this.props;

        if (!maxDate) {
            return null;
        }

        const { year, month, day } = this.state;

        if (!isSameDate(maxDate, year, month, day)) {
            return null;
        }

        return getHoursMinutesSeconds(maxDate);
    }

    get minTime() {
        const { minDate } = this.props;

        if (!minDate) {
            return null;
        }

        const { year, month, day } = this.state;

        if (!isSameDate(minDate, year, month, day)) {
            return null;
        }

        return getHoursMinutesSeconds(minDate);
    }

    get commonInputProps() {
        const {
            className,
            disabled,
            isWidgetOpen,
            maxDate,
            minDate,
            required,
        } = this.props;

        return {
            className,
            disabled,
            maxDate: maxDate || defaultMaxDate,
            minDate: minDate || defaultMinDate,
            onChange: this.onChange,
            onKeyDown: this.onKeyDown,
            onKeyUp: this.onKeyUp,
            placeholder: '  ',
            // This is only for showing validity when editing
            required: required || isWidgetOpen,
            itemRef: (ref, name) => {
                // Save a reference to each input field
                this[`${name}Input`] = ref;
            },
        };
    }

    get commonTimeInputProps() {
        const { maxTime, minTime } = this;

        return {
            maxTime,
            minTime,
        };
    }

    /**
     * Returns value type that can be returned with currently applied settings.
     */
    get valueType() {
        const { maxDetail } = this.props;

        return maxDetail;
    }

    onClick = (event) => {
        if (event.target === event.currentTarget) {
            // Wrapper was directly clicked
            const firstInput = event.target.children[1];
            focus(firstInput);
        }
    }

    onKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case this.dateDivider:
            case this.timeDivider: {
                event.preventDefault();

                const { target: input } = event;
                const property = event.key === 'ArrowLeft' ? 'previousElementSibling' : 'nextElementSibling';
                const nextInput = findInput(input, property);
                focus(nextInput);
                break;
            }
            default:
        }
    }

    onKeyUp = (event) => {
        const { key, target: input } = event;

        const isNumberKey = !isNaN(parseInt(key, 10));

        if (!isNumberKey) {
            return;
        }

        const { value } = input;
        const max = input.getAttribute('max');

        /**
         * Given 1, the smallest possible number the user could type by adding another digit is 10.
         * 10 would be a valid value given max = 12, so we won't jump to the next input.
         * However, given 2, smallers possible number would be 20, and thus keeping the focus in
         * this field doesn't make sense.
         */
        if ((value * 10 > max) || (value.length >= max.length)) {
            const property = 'nextElementSibling';
            const nextInput = findInput(input, property);
            focus(nextInput);
        }
    }

    /**
     * Called when non-native date input is changed.
     */
    onChange = (event) => {
        const { name, value } = event.target;

        switch (name) {
            case 'hour12': {
                this.setState(
                    prevState => ({
                        hour: value ? convert12to24(parseInt(value, 10), prevState.amPm) : null,
                    }),
                    this.onChangeExternal,
                );
                break;
            }
            case 'hour24': {
                this.setState(
                    { hour: value ? parseInt(value, 10) : null },
                    this.onChangeExternal,
                );
                break;
            }
            default: {
                this.setState(
                    { [name]: value ? parseInt(value, 10) : null },
                    this.onChangeExternal,
                );
            }
        }
    }

    /**
     * Called when native date input is changed.
     */
    onChangeNative = (event) => {
        const { onChange } = this.props;
        const { value } = event.target;

        if (!onChange) {
            return;
        }

        const processedValue = (() => {
            if (!value) {
                return null; 
            }

            const [valueDate, valueTime] = value.split('T');

            const [yearString, monthString, dayString] = valueDate.split('-');
            const year = parseInt(yearString, 10);
            const monthIndex = parseInt(monthString, 10) - 1 || 0;
            const day = parseInt(dayString, 10) || 1;

            const [hourString, minuteString, secondString] = valueTime.split(':');
            const hour = parseInt(hourString, 10) || 0;
            const minute = parseInt(minuteString, 10) || 0;
            const second = parseInt(secondString, 10) || 0;

            const proposedValue = new Date();
            proposedValue.setFullYear(year, monthIndex, day);
            proposedValue.setHours(hour, minute, second, 0);

            return proposedValue;
        })();

        onChange(processedValue, false);
    }

    onChangeAmPm = (event) => {
        const { value } = event.target;

        this.setState(
            ({ amPm: value }),
            this.onChangeExternal,
        );
    }

    /**
     * Called after internal onChange. Checks input validity. If all fields are valid,
     * calls props.onChange.
     */
    onChangeExternal = () => {
        const { onChange } = this.props;

        if (!onChange) {
            return;
        }

        const formElements = [
            this.dayInput,
            this.monthInput,
            this.yearInput,
            this.hour12Input,
            this.hour24Input,
            this.minuteInput,
            this.secondInput,
            this.amPmInput,
        ].filter(Boolean);

        const formElementsWithoutSelect = formElements.slice(0, -1);

        const values = {};
        formElements.forEach((formElement) => {
            values[formElement.name] = formElement.value;
        });

        if (formElementsWithoutSelect.every(formElement => !formElement.value)) {
            onChange(null, false);
        } else if (
            formElements.every(formElement => formElement.value && formElement.validity.valid)
        ) {
            const year = parseInt(values.year, 10);
            const monthIndex = parseInt(values.month, 10) - 1 || 0;
            const day = parseInt(values.day || 1, 10);
            const hour = parseInt(values.hour24 || convert12to24(values.hour12, values.amPm) || 0, 10);
            const minute = parseInt(values.minute || 0, 10);
            const second = parseInt(values.second || 0, 10);

            const proposedValue = new Date();
            proposedValue.setFullYear(year, monthIndex, day);
            proposedValue.setHours(hour, minute, second, 0);
            const processedValue = proposedValue;
            onChange(processedValue, false);
        }
    }

    renderDay = (currentMatch, index) => {
        const {
            autoFocus,
            dayAriaLabel,
            dayPlaceholder,
            showLeadingZeros,
        } = this.props;
        const { day, month, year } = this.state;

        if (currentMatch && currentMatch.length > 2) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        const showLeadingZerosFromFormat = currentMatch && currentMatch.length === 2;

        return (
            <DayInput
                key="day"
                {...this.commonInputProps}
                ariaLabel={dayAriaLabel}
                autoFocus={index === 0 && autoFocus}
                month={month}
                placeholder={dayPlaceholder}
                showLeadingZeros={showLeadingZerosFromFormat || showLeadingZeros}
                value={day}
                year={year}
            />
        );
    }

    renderMonth = (currentMatch, index) => {
        const {
            autoFocus,
            locale,
            monthAriaLabel,
            monthPlaceholder,
            showLeadingZeros,
        } = this.props;
        const { month, year } = this.state;

        if (currentMatch && currentMatch.length > 4) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        if (currentMatch.length > 2) {
            return (
                <MonthSelect
                    key="month"
                    {...this.commonInputProps}
                    ariaLabel={monthAriaLabel}
                    autoFocus={index === 0 && autoFocus}
                    locale={locale}
                    placeholder={monthPlaceholder}
                    short={currentMatch.length === 3}
                    value={month}
                    year={year}
                />
            );
        }

        const showLeadingZerosFromFormat = currentMatch && currentMatch.length === 2;

        return (
            <MonthInput
                key="month"
                {...this.commonInputProps}
                ariaLabel={monthAriaLabel}
                autoFocus={index === 0 && autoFocus}
                placeholder={monthPlaceholder}
                showLeadingZeros={showLeadingZerosFromFormat || showLeadingZeros}
                value={month}
                year={year}
            />
        );
    }

    renderYear = (currentMatch, index) => {
        const { autoFocus, yearAriaLabel, yearPlaceholder } = this.props;
        const { year } = this.state;

        return (
            <YearInput
                key="year"
                {...this.commonInputProps}
                ariaLabel={yearAriaLabel}
                autoFocus={index === 0 && autoFocus}
                placeholder={yearPlaceholder}
                value={year}
                valueType="day"
            />
        );
    }

    renderHour = (currentMatch, index) => {
        if (/h/.test(currentMatch)) {
            return this.renderHour12(currentMatch, index);
        }

        return this.renderHour24(currentMatch, index);
    };

    renderHour12 = (currentMatch, index) => {
        const { autoFocus, hourAriaLabel, hourPlaceholder } = this.props;
        const { amPm, hour } = this.state;

        if (currentMatch && currentMatch.length > 2) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        const showLeadingZeros = currentMatch && currentMatch.length === 2;

        return (
            <Hour12Input
                key="hour12"
                {...this.commonInputProps}
                amPm={amPm}
                ariaLabel={hourAriaLabel}
                autoFocus={index === 0 && autoFocus}
                placeholder={hourPlaceholder}
                showLeadingZeros={showLeadingZeros}
                value={hour}
            />
        );
    }

    renderHour24 = (currentMatch, index) => {
        const { autoFocus, hourAriaLabel, hourPlaceholder } = this.props;
        const { hour } = this.state;

        if (currentMatch && currentMatch.length > 2) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        const showLeadingZeros = currentMatch && currentMatch.length === 2;

        return (
            <Hour24Input
                key="hour24"
                {...this.commonInputProps}
                ariaLabel={hourAriaLabel}
                autoFocus={index === 0 && autoFocus}
                placeholder={hourPlaceholder}
                showLeadingZeros={showLeadingZeros}
                value={hour}
            />
        );
    }

    renderMinute = (currentMatch, index) => {
        const { autoFocus, minuteAriaLabel, minutePlaceholder } = this.props;
        const { hour, minute } = this.state;

        if (currentMatch && currentMatch.length > 2) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        const showLeadingZeros = currentMatch && currentMatch.length === 2;

        return (
            <MinuteInput
                key="minute"
                {...this.commonInputProps}
                ariaLabel={minuteAriaLabel}
                autoFocus={index === 0 && autoFocus}
                hour={hour}
                placeholder={minutePlaceholder}
                showLeadingZeros={showLeadingZeros}
                value={minute}
            />
        );
    }

    renderSecond = (currentMatch, index) => {
        const { autoFocus, secondAriaLabel, secondPlaceholder } = this.props;
        const { hour, minute, second } = this.state;

        if (currentMatch && currentMatch.length > 2) {
            throw new Error(`Unsupported token: ${currentMatch}`);
        }

        const showLeadingZeros = currentMatch ? currentMatch.length === 2 : true;

        return (
            <SecondInput
                key="second"
                {...this.commonInputProps}
                ariaLabel={secondAriaLabel}
                autoFocus={index === 0 && autoFocus}
                hour={hour}
                minute={minute}
                placeholder={secondPlaceholder}
                showLeadingZeros={showLeadingZeros}
                value={second}
            />
        );
    }

    renderAmPm = (currentMatch, index) => {
        const { amPmAriaLabel, autoFocus, locale } = this.props;
        const { amPm } = this.state;

        return (
            <AmPm
                key="ampm"
                {...this.commonInputProps}
                ariaLabel={amPmAriaLabel}
                autoFocus={index === 0 && autoFocus}
                locale={locale}
                onChange={this.onChangeAmPm}
                value={amPm}
            />
        );
    }

    renderCustomInputs() {
        const { placeholder } = this;
        const { format } = this.props;

        const elementFunctions = {
            d: this.renderDay,
            M: this.renderMonth,
            y: this.renderYear,
            h: this.renderHour,
            H: this.renderHour,
            m: this.renderMinute,
            s: this.renderSecond,
            a: this.renderAmPm,
        };

        const allowMultipleInstances = typeof format !== 'undefined';
        return renderCustomInputs(placeholder, elementFunctions, allowMultipleInstances);
    }

    renderNativeInput() {
        const {
            disabled,
            maxDate,
            minDate,
            name,
            nativeInputAriaLabel,
            required,
        } = this.props;
        const { value } = this.state;

        return (
            <NativeInput
                key="time"
                ariaLabel={nativeInputAriaLabel}
                disabled={disabled}
                maxDate={maxDate || defaultMaxDate}
                minDate={minDate || defaultMinDate}
                name={name}
                onChange={this.onChangeNative}
                required={required}
                value={value}
                valueType={this.valueType}
            />
        );
    }

    render() {
        const { className, classNameInput } = this.props;

        /* eslint-disable jsx-a11y/click-events-have-key-events */
        /* eslint-disable jsx-a11y/no-static-element-interactions */
        return (
            <div
                className={`${classNameInput} ${className}`}
                onClick={this.onClick}
            >
                {this.renderNativeInput()}
                {this.renderCustomInputs()}
            </div>
        );
    }
}

DateTimeInput.defaultProps = {
    maxDetail: 'minute',
    name: 'datetime',
};

const isValue = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
]);

DateTimeInput.propTypes = {
    amPmAriaLabel: PropTypes.string,
    autoFocus: PropTypes.bool,
    className: PropTypes.string.isRequired,
    dayAriaLabel: PropTypes.string,
    dayPlaceholder: PropTypes.string,
    disabled: PropTypes.bool,
    format: PropTypes.string,
    hourAriaLabel: PropTypes.string,
    hourPlaceholder: PropTypes.string,
    isWidgetOpen: PropTypes.bool,
    locale: PropTypes.string,
    maxDate: isMaxDate,
    maxDetail: PropTypes.oneOf(allViews),
    minDate: isMinDate,
    minuteAriaLabel: PropTypes.string,
    minutePlaceholder: PropTypes.string,
    monthAriaLabel: PropTypes.string,
    monthPlaceholder: PropTypes.string,
    name: PropTypes.string,
    nativeInputAriaLabel: PropTypes.string,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    secondAriaLabel: PropTypes.string,
    secondPlaceholder: PropTypes.string,
    showLeadingZeros: PropTypes.bool,
    value: PropTypes.oneOfType([
        isValue,
        PropTypes.arrayOf(isValue),
    ]),
    yearAriaLabel: PropTypes.string,
    yearPlaceholder: PropTypes.string,
};

export default class AnterosDateTimePicker extends Component {
    constructor(props) {
        super(props);
        if (this.props.dataSource) {
            let value = this.props.dataSource.fieldByName(this.props.dataField);
            if (!value) {
                value = '';
            }
            if (!(value instanceof Date)) {
                value = AnterosDateUtils.parseDateWithFormat(value, this.props.format);
            }
            this.state = { value: value };
        } else {
            this.state = { value: this.props.value };
        }
        autoBind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextState = {};

        if (nextProps.isCalendarOpen !== prevState.isCalendarOpenProps) {
            nextState.isCalendarOpen = nextProps.isCalendarOpen;
            nextState.isCalendarOpenProps = nextProps.isCalendarOpen;
        }

        if (nextProps.isClockOpen !== prevState.isClockOpenProps) {
            nextState.isClockOpen = nextProps.isClockOpen;
            nextState.isClockOpenProps = nextProps.isClockOpen;
        }

        return nextState;
    }

    componentDidMount() {
        if (this.props.dataSource) {
            this.props.dataSource.addEventListener(
                [dataSourceEvents.AFTER_CLOSE,
                dataSourceEvents.AFTER_OPEN,
                dataSourceEvents.AFTER_GOTO_PAGE,
                dataSourceEvents.AFTER_CANCEL,
                dataSourceEvents.AFTER_SCROLL], this.onDatasourceEvent);
            this.props.dataSource.addEventListener(dataSourceEvents.DATA_FIELD_CHANGED, this.onDatasourceEvent, this.props.dataField);
        }
        this.handleOutsideActionListeners();
    }

    componentDidUpdate(prevProps, prevState) {
        const { isCalendarOpen, isClockOpen } = this.state;
        const {
            onCalendarClose,
            onCalendarOpen,
            onClockClose,
            onClockOpen,
        } = this.props;

        const isWidgetOpen = isCalendarOpen || isClockOpen;
        const prevIsWidgetOpen = prevState.isCalendarOpen || prevState.isClockOpen;

        if (isWidgetOpen !== prevIsWidgetOpen) {
            this.handleOutsideActionListeners();
        }

        if (isCalendarOpen !== prevState.isCalendarOpen) {
            callIfDefined(isCalendarOpen ? onCalendarOpen : onCalendarClose);
        }

        if (isClockOpen !== prevState.isClockOpen) {
            callIfDefined(isClockOpen ? onClockOpen : onClockClose);
        }
    }

    componentWillUnmount() {
        this.handleOutsideActionListeners(false);
        if ((this.props.dataSource)) {
            this.props.dataSource.removeEventListener(
                [dataSourceEvents.AFTER_CLOSE,
                dataSourceEvents.AFTER_OPEN,
                dataSourceEvents.AFTER_GOTO_PAGE,
                dataSourceEvents.AFTER_CANCEL,
                dataSourceEvents.AFTER_SCROLL], this.onDatasourceEvent);
            this.props.dataSource.removeEventListener(dataSourceEvents.DATA_FIELD_CHANGED, this.onDatasourceEvent, this.props.dataField);
        }
    }

    onDatasourceEvent(event, error) {
        let value = this.props.dataSource.fieldByName(this.props.dataField);
        if (!value) {
            value = '';
        }
        if (!(value instanceof Date)) {
            value = AnterosDateUtils.parseDateWithFormat(value, this.props.format);
        }
        this.setState({ value: value });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.dataSource) {
            let value = nextProps.dataSource.fieldByName(nextProps.dataField);
            if (!value) {
                value = '';
            }
            if (!(value instanceof Date)) {
                value = AnterosDateUtils.parseDateWithFormat(value, this.props.format);
            }
            this.setState({ value: value });
        } else {
            this.setState({ value: nextProps.value });
        }
    }

    get eventProps() {
        return makeEventProps(this.props);
    }

    onOutsideAction(event) {
        if (this.wrapper && !this.wrapper.contains(event.target)) {
            this.closeWidgets();
        }
    }

    onDateChange(value, closeWidgets) {
        const { value: prevValue } = this.props;

        if (prevValue) {
            const valueWithHour = new Date(value);
            valueWithHour.setHours(
                prevValue.getHours(),
                prevValue.getMinutes(),
                prevValue.getSeconds(),
                prevValue.getMilliseconds(),
            );

            this.onChange(valueWithHour, closeWidgets);
        } else {
            this.onChange(value, closeWidgets);
        }
    }

    // eslint-disable-next-line react/destructuring-assignment
    onChange(value, closeWidgets = this.props.closeWidgets) {
        const { onChange } = this.props;

        if (closeWidgets) {
            this.closeWidgets();
        }

        this.setState({ value });

        if (onChange) {
            onChange(value);
        }
    }

    onBlur(event) {
        if (this.props.dataSource && this.props.dataSource.getState !== 'dsBrowse') {
            this.props.dataSource.setFieldByName(this.props.dataField, this.state.value);
        }
    }

    onFocus(event) {
        const { disabled, onFocus } = this.props;

        if (onFocus) {
            onFocus(event);
        }

        // Internet Explorer still fires onFocus on disabled elements
        if (disabled) {
            return;
        }

        switch (event.target.name) {
            case 'day':
            case 'month':
            case 'year':
                this.openCalendar();
                break;
            case 'hour12':
            case 'hour24':
            case 'minute':
            case 'second':
                this.openClock();
                break;
            default:
        }
    }

    openClock() {
        this.setState({
            isCalendarOpen: false,
            isClockOpen: true,
        });
    }

    openCalendar() {
        this.setState({
            isCalendarOpen: true,
            isClockOpen: false,
        });
    }

    toggleCalendar() {
        this.setState(prevState => ({
            isCalendarOpen: !prevState.isCalendarOpen,
            isClockOpen: false,
        }));
    }

    closeWidgets(){
        this.setState((prevState) => {
            if (!prevState.isCalendarOpen && !prevState.isClockOpen) {
                return null;
            }

            return {
                isCalendarOpen: false,
                isClockOpen: false,
            };
        });
    }

    stopPropagation(event){
        event.stopPropagation();
    }

    clear() {
        this.onChange(null);
        if (this.props.dataSource && this.props.dataSource.getState !== 'dsBrowse') {
            this.props.dataSource.setFieldByName(this.props.dataField, undefined);
        }
    }

    handleOutsideActionListeners(shouldListen) {
        const { isCalendarOpen, isClockOpen } = this.state;
        const isWidgetOpen = isCalendarOpen || isClockOpen;

        const shouldListenWithFallback = typeof shouldListen !== 'undefined' ? shouldListen : isWidgetOpen;
        const fnName = shouldListenWithFallback ? 'addEventListener' : 'removeEventListener';
        outsideActionEvents.forEach(eventName => document[fnName](eventName, this.onOutsideAction));
    }

    renderInputs() {
        const {
            amPmAriaLabel,
            autoFocus,
            calendarIcon,
            clearAriaLabel,
            clearIcon,
            dayAriaLabel,
            dayPlaceholder,
            disableCalendar,
            disabled,
            hourAriaLabel,
            hourPlaceholder,
            locale,
            maxDate,
            maxDetail,
            minDate,
            minuteAriaLabel,
            minutePlaceholder,
            monthAriaLabel,
            monthPlaceholder,
            name,
            nativeInputAriaLabel,
            required,
            secondAriaLabel,
            secondPlaceholder,
            showLeadingZeros,
            yearAriaLabel,
            yearPlaceholder,
        } = this.props;
        const { isCalendarOpen, isClockOpen } = this.state;

        const [valueFrom] = [].concat(this.state.value);

        const ariaLabelProps = {
            amPmAriaLabel,
            dayAriaLabel,
            hourAriaLabel,
            minuteAriaLabel,
            monthAriaLabel,
            nativeInputAriaLabel,
            secondAriaLabel,
            yearAriaLabel,
        };

        const placeholderProps = {
            dayPlaceholder,
            hourPlaceholder,
            minutePlaceholder,
            monthPlaceholder,
            secondPlaceholder,
            yearPlaceholder,
        };

        let icon = "fa fa-calendar";
        if (this.props.icon) {
            icon = this.props.icon;
        }

        let readOnly = this.props.readOnly;
        if (this.props.dataSource && !readOnly) {
            readOnly = (this.props.dataSource.getState() === 'dsBrowse');
        }
        let classNameAddOn = AnterosUtils.buildClassNames("input-group-addon",
            (this.props.primary || this.props.fullPrimary ? "btn btn-primary" : ""),
            (this.props.success || this.props.fullSucces ? "btn btn-success" : ""),
            (this.props.info || this.props.fullInfo ? "btn btn-info" : ""),
            (this.props.danger || this.props.fullDanger ? "btn btn-danger" : ""),
            (this.props.warning || this.props.fullWarning ? "btn btn-warning" : ""),
            (this.props.secondary || this.props.fullSecondary ? "btn btn-secondary" : ""),
            (this.props.default || this.props.fullDefault ? "" : ""));

        let classNameInput = AnterosUtils.buildClassNames("form-control",
            (this.props.fullPrimary ? "btn-primary" : ""),
            (this.props.fullSucces ? "btn-success" : ""),
            (this.props.fullInfo ? "btn-info" : ""),
            (this.props.fullDanger ? "btn-danger" : ""),
            (this.props.fullWarning ? "btn-warning" : ""),
            (this.props.fullSecondary ? "btn-secondary" : ""),
            (this.props.fullDefault ? "" : ""));

        return (
            <div className={`${baseClassName}__wrapper`}>
                <DateTimeInput
                    {...ariaLabelProps}
                    {...placeholderProps}
                    autoFocus={autoFocus}
                    className={`${baseClassName}__inputGroup`}
                    classNameInput={classNameInput}
                    disabled={disabled}
                    // format={format}
                    isWidgetOpen={isCalendarOpen || isClockOpen}
                    locale={locale}
                    maxDate={maxDate}
                    maxDetail={maxDetail}
                    minDate={minDate}
                    name={name}
                    onChange={this.onChange}
                    placeholder={this.placeholder}
                    required={required}
                    showLeadingZeros={showLeadingZeros}
                    value={valueFrom}
                />
                {clearIcon !== null && (
                    <button
                        aria-label={clearAriaLabel}
                        className={`${baseClassName}__clear-button ${baseClassName}__button`}
                        disabled={disabled}
                        onClick={this.clear}
                        onFocus={this.stopPropagation}
                        type="button"
                    >
                        {clearIcon}
                    </button>
                )}
                {calendarIcon !== null && !disableCalendar && (
                    <div className={classNameAddOn} onBlur={this.resetValue}
                        onClick={this.toggleCalendar}
                        disabled={disabled}
                        onFocus={this.stopPropagation}
                        style={{ margin: 0, height: '38px', width: '38px' }}>
                        <span><i className={icon} /><img alt="" src={this.props.image} /></span></div>
                )}
            </div>
        );
    }

    renderCalendar() {
        const { disableCalendar } = this.props;
        const { isCalendarOpen } = this.state;

        if (isCalendarOpen === null || disableCalendar) {
            return null;
        }

        const {
            calendarClassName,
            className: dateTimePickerClassName, // Unused, here to exclude it from calendarProps
            maxDetail: dateTimePickerMaxDetail, // Unused, here to exclude it from calendarProps
            onChange,
            value,
            ...calendarProps
        } = this.props;

        const className = `${baseClassName}__calendar`;

        return (
            <Fit>
                <div className={mergeClassNames(className, `${className}--${isCalendarOpen ? 'open' : 'closed'}`)}>
                    <AnterosCalendar
                        className={calendarClassName}
                        onChange={this.onDateChange}
                        value={value || null}
                        {...calendarProps}
                    />
                </div>
            </Fit>
        );
    }

    renderClock() {
        const { disableClock } = this.props;
        const { isClockOpen } = this.state;

        if (isClockOpen === null || disableClock) {
            return null;
        }

        const {
            clockClassName,
            className: dateTimePickerClassName, // Unused, here to exclude it from clockProps
            maxDetail,
            onChange,
            value,
            ...clockProps
        } = this.props;

        const className = `${baseClassName}__clock`;
        const [valueFrom] = [].concat(value);

        const maxDetailIndex = allViews.indexOf(maxDetail);

        return (
            <Fit>
                <div className={mergeClassNames(className, `${className}--${isClockOpen ? 'open' : 'closed'}`)}>
                    <AnterosClock
                        className={clockClassName}
                        renderMinuteHand={maxDetailIndex > 0}
                        renderSecondHand={maxDetailIndex > 1}
                        value={valueFrom}
                        size={200}
                        {...clockProps}
                    />
                </div>
            </Fit>
        );
    }

    render() {
        const { disabled } = this.props;
        const { isCalendarOpen, isClockOpen } = this.state;

        const colClasses = buildGridClassNames(this.props, false, []);

        let className = AnterosUtils.buildClassNames(
            (this.props.className ? this.props.className : ""),
            colClasses);

        let width = this.props.width;
        if (colClasses.length > 0) {
            width = "";
        }

        return (
            <div className={className} onBlur={this.onBlur}>
                <div
                    className={mergeClassNames(
                        baseClassName,
                        `${baseClassName}--${isCalendarOpen || isClockOpen ? 'open' : 'closed'}`,
                        `${baseClassName}--${disabled ? 'disabled' : 'enabled'}`,
                    )}
                    {...this.eventProps}
                    style={{ width: width }}
                    onFocus={this.onFocus}
                    ref={(ref) => {
                        if (!ref) {
                            return;
                        }

                        this.wrapper = ref;
                    }}
                >
                    {this.renderInputs()}
                    {this.renderCalendar()}
                    {this.renderClock()}
                </div>
            </div>
        );
    }
}

const iconProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 19,
    height: 19,
    viewBox: '0 0 19 19',
    stroke: 'black',
    strokeWidth: 2,
};

const CalendarIcon = (
    <svg
        {...iconProps}
        className={`${baseClassName}__calendar-button__icon ${baseClassName}__button__icon`}
    >
        <rect fill="none" height="15" width="15" x="2" y="2" />
        <line x1="6" x2="6" y1="0" y2="4" />
        <line x1="13" x2="13" y1="0" y2="4" />
    </svg>
);

const ClearIcon = (
    <svg
        {...iconProps}
        className={`${baseClassName}__clear-button__icon ${baseClassName}__button__icon`}
    >
        <line x1="4" x2="15" y1="4" y2="15" />
        <line x1="15" x2="4" y1="4" y2="15" />
    </svg>
);

AnterosDateTimePicker.defaultProps = {
    calendarIcon: CalendarIcon,
    clearIcon: ClearIcon,
    closeWidgets: true,
    isCalendarOpen: null,
    isClockOpen: null,
    maxDetail: 'minute',
    width: "auto",
    primary: true,
    showLeadingZeros: false,
    format: 'DD/MM/YYYY hh:mm:ss',
};


AnterosDateTimePicker.propTypes = {
    dataSource: PropTypes.oneOfType([
        PropTypes.instanceOf(AnterosLocalDatasource),
        PropTypes.instanceOf(AnterosRemoteDatasource)
    ]),
    dataField: PropTypes.string,
    amPmAriaLabel: PropTypes.string,
    autoFocus: PropTypes.bool,
    calendarAriaLabel: PropTypes.string,
    calendarClassName: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    calendarIcon: PropTypes.node,
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    clearAriaLabel: PropTypes.string,
    clearIcon: PropTypes.node,
    clockClassName: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    closeWidgets: PropTypes.bool,
    dayAriaLabel: PropTypes.string,
    dayPlaceholder: PropTypes.string,
    disableCalendar: PropTypes.bool,
    disableClock: PropTypes.bool,
    disabled: PropTypes.bool,
    format: PropTypes.string,
    hourAriaLabel: PropTypes.string,
    hourPlaceholder: PropTypes.string,
    isCalendarOpen: PropTypes.bool,
    isClockOpen: PropTypes.bool,
    locale: PropTypes.string,
    maxDate: isMaxDate,
    maxDetail: PropTypes.oneOf(allViews),
    minDate: isMinDate,
    minuteAriaLabel: PropTypes.string,
    minutePlaceholder: PropTypes.string,
    monthAriaLabel: PropTypes.string,
    monthPlaceholder: PropTypes.string,
    name: PropTypes.string,
    nativeInputAriaLabel: PropTypes.string,
    onCalendarClose: PropTypes.func,
    onCalendarOpen: PropTypes.func,
    onChange: PropTypes.func,
    onClockClose: PropTypes.func,
    onClockOpen: PropTypes.func,
    onFocus: PropTypes.func,
    required: PropTypes.bool,
    secondAriaLabel: PropTypes.string,
    secondPlaceholder: PropTypes.string,
    showLeadingZeros: PropTypes.bool,
    value: PropTypes.oneOfType([
        isValue,
        PropTypes.arrayOf(isValue),
    ]),
    yearAriaLabel: PropTypes.string,
    yearPlaceholder: PropTypes.string,
    extraSmall: columnProps,
    small: columnProps,
    medium: columnProps,
    large: columnProps,
    extraLarge: columnProps,
    primary: PropTypes.bool,
    success: PropTypes.bool,
    info: PropTypes.bool,
    danger: PropTypes.bool,
    warning: PropTypes.bool,
    secondary: PropTypes.bool,
    default: PropTypes.bool,
    fullPrimary: PropTypes.bool,
    fullSuccess: PropTypes.bool,
    fullInfo: PropTypes.bool,
    fullDanger: PropTypes.bool,
    fullWarning: PropTypes.bool,
    fullSecondary: PropTypes.bool,
    style: PropTypes.object,
};