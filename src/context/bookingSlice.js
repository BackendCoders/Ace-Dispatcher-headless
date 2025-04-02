/** @format */

import { createSlice } from '@reduxjs/toolkit';
import {
	makeBooking,
	updateBooking,
	sendQuotes,
	makeBookingQuoteRequest,
} from './../utils/apiReq';
import { formatDate } from './../utils/formatDate';
import { handleSearchBooking } from './schedulerSlice';
import { getRefreshedBookingsLog } from './BookingLogSlice';
import { openSnackbar } from './snackbarSlice';

// Filter data to avoid undefined values and make the data structure consistent
const filterData = (data = {}) => ({
	details: data.Details || '',
	email: data.Email || '',
	bookingId: data.Id || null,
	durationText: Number(data.durationText) ? String(data.durationText) : '20',
	durationMinutes: data.durationMinutes || 0,
	isAllDay: data.IsAllDay || false,
	passengerName: data.PassengerName || '',
	passengers: data.Passengers || 1,
	paymentStatus: data.PaymentStatus || 0,
	scope: data.Scope || 0,
	phoneNumber: data.PhoneNumber || '',
	pickupAddress: data.PickupAddress || '',
	pickupDateTime: data.PickupDateTime
		? formatDate(new Date(data.PickupDateTime))
		: formatDate(new Date()),
	pickupPostCode: data.PickupPostCode || '',
	destinationAddress: data.DestinationAddress || '',
	destinationPostCode: data.DestinationPostCode || '',
	recurrenceRule: data.RecurrenceRule || '',
	price: data.Price || 0,
	priceAccount: data.PriceAccount || 0,
	chargeFromBase: true,
	userId: data.UserId || null,
	returnDateTime: data.ReturnDateTime || null,
	vias: data.Vias || [],
	accountNumber: data.AccountNumber || 9999,
	bookedByName: data.BookedByName || '',
	returnBooking: data.ReturnBooking || false,
	isReturn: data.IsReturn || false,
	repeatBooking: data.RepeatBooking || false,
	frequency: data.Frequency || 'none',
	repeatEnd: data.RepeatEnd || 'never',
	repeatEndValue: data.RepeatEndValue || '',
	driver: data.Driver || {},
	formBusy: data.FormBusy || false,
	isLoading: data.IsLoading || false,
	bookingType: data.bookingType || 'New',
	quoteOptions: null,
	hours: data.Hours ?? 0,
	minutes: data.Minutes ?? 20,
	isASAP: data.isASAP || false,
	manuallyPriced: data.manuallyPriced || false,
	arriveBy: data.arriveBy ? formatDate(new Date(data.arriveBy)) : null,
});

const initialState = {
	bookings: [filterData()],
	isLoading: false,
	error: null,
	activeBookingIndex: 0,
	isBookingOpenInEditMode: false,
	// isActiveTestMode: true,
	isGoogleApiOn: false,
	activeSectionMobileView: 'Scheduler',
	createResponseArray: [],
	bookingQuote: null,
};

const bookingFormSlice = createSlice({
	name: 'bookingForm',
	initialState,
	reducers: {
		// update the specific value of the booking form data based on the itemIndex
		updateDataValue: {
			prepare(itemIndex, property, value) {
				return { payload: { itemIndex, property, value } };
			},
			reducer(state, action) {
				const { itemIndex, property, value } = action.payload;
				state.bookings[itemIndex][property] = value;
			},
		},
		// add new booking data to the booking form basically to from the CLI caller events
		addData(state, action) {
			state.bookings.push(filterData(action.payload));
			state.activeBookingIndex = state.bookings[state.activeBookingIndex]
				.formBusy
				? state.activeBookingIndex
				: state.bookings.length - 1;
		},
		addDataFromSchedulerInEditMode(state, action) {
			const data = filterData({});
			data.bookingType = 'Current';
			action.payload = {
				...action.payload,
				pickupDateTime: formatDate(action.payload.pickupDateTime),
			};
			// console.log(action.payload);

			state.bookings.push({ ...data, ...action.payload });
			state.activeBookingIndex = state.bookings.length - 1;
		},
		setIsBookingOpenInEditMode(state, action) {
			state.isBookingOpenInEditMode = action.payload;
		},
		// to remove a booking session from the booking form data and from the UI
		endBooking(state) {
			const itemIndex = state.activeBookingIndex;
			if (itemIndex === 0) {
				state.bookings[itemIndex] = initialState.bookings[0];
			} else {
				state.bookings.splice(itemIndex, 1);
				state.activeBookingIndex -= 1;
			}
		},
		// this function simply updates the booking key value pair of the booking
		updateBookingData(state, action) {
			const currentBooking = state.bookings[state.activeBookingIndex];
			state.bookings[state.activeBookingIndex] = {
				...currentBooking,
				...action.payload,
			};
		},
		setLoading(state, action) {
			state.isLoading = action.payload;
		},
		setIsGoogleApiOn(state, action) {
			state.isGoogleApiOn = action.payload;
		},
		// changes active tab which makes the flow of form data
		setActiveTabChange(state, action) {
			state.activeBookingIndex = action.payload;
		},
		// sets the mode of app from live to test or vice versa
		// setActiveTestMode(state, action) {
		// 	state.isActiveTestMode = action.payload;
		// },
		// this controller if used to create new booking from scheduler free spaces
		createBookingFromScheduler(state, action) {
			const data = filterData({
				PickupDateTime: action.payload,
				bookingType: 'Previous',
				FormBusy: true,
			});
			const formBusy = state.bookings[state.activeBookingIndex].formBusy;
			if (!formBusy && state.activeBookingIndex === 0) {
				data.bookingType = '';
				state.bookings[state.activeBookingIndex] = data;
			} else {
				state.bookings.push(data);
				state.activeBookingIndex = state.bookings.length - 1;
			}
		},
		setActiveSectionMobileView(state, action) {
			state.activeSectionMobileView = action.payload;
		},
		setCreateResponseArray(state, action) {
			state.createResponseArray = action.payload;
		},
		setBookingQuote(state, action) {
			state.bookingQuote = action.payload;
		},
	},
});

// Action Creator that will indirectly call the updateDataValue with and set FormBusy
export const updateValue = function (itemIndex, property, value) {
	return function (dispatch, getState) {
		const targetBooking = getState().bookingForm?.bookings[itemIndex];
		if (!targetBooking?.formBusy) {
			dispatch(
				bookingFormSlice.actions.updateDataValue(itemIndex, 'formBusy', true)
			);
		}
		dispatch(
			bookingFormSlice.actions.updateDataValue(itemIndex, property, value)
		);
	};
};

// Action Creator that will indirectly call the updateDataValue without and set FormBusy
export const updateValueSilentMode =
	(itemIndex, property, value) => (dispatch) => {
		dispatch(
			bookingFormSlice.actions.updateDataValue(itemIndex, property, value)
		);
	};

// Action Creator that will save the booking to the Backend api and return the response
export const onCreateBooking = (itemIndex) => async (dispatch, getState) => {
	const targetBooking = getState().bookingForm.bookings[itemIndex];
	// const activeTestMode = getState().bookingForm.isActiveTestMode;
	// const response = await makeBooking(targetBooking, activeTestMode);
	const response = await makeBooking(targetBooking);
	if (response.status === 'success') {
		dispatch(endBooking({ itemIndex }));
		dispatch(setCreateResponseArray(response.value?.entrys));
		dispatch(getRefreshedBookingsLog());
		return { status: 'success' };
	} else {
		dispatch(
			bookingFormSlice.actions.updateDataValue(itemIndex, 'isLoading', false)
		);
		return { status: 'error', message: response.message };
	}
};

// Action Creator that will update the booking to the Backend api and return the response
export const onUpdateBooking = (itemIndex) => async (dispatch, getState) => {
	const targetBooking = getState().bookingForm.bookings[itemIndex];
	const { activeSearch, searchkeywords } = getState().scheduler;
	// const activeTestMode = getState().bookingForm.isActiveTestMode;
	// console.log('targetBooking', targetBooking);
	// const response = await updateBooking(targetBooking, activeTestMode);
	const response = await updateBooking(targetBooking);
	if (response.status === 'success') {
		dispatch(endBooking({ itemIndex }));
		dispatch(setCreateResponseArray(response.value?.res));
		dispatch(getRefreshedBookingsLog());
		if (activeSearch) {
			dispatch(handleSearchBooking(searchkeywords));
		}
		return { status: 'success' };
	} else {
		dispatch(updateValue({ itemIndex, property: 'isLoading', value: false }));
		return { status: 'error', message: response.message };
	}
};

// Action Creator that will remove the booking from the booking form data
export const removeBooking = (itemIndex) => (dispatch) => {
	dispatch(endBooking({ itemIndex }));
};

export const onSendQuoteBooking =
	(itemIndex, selectedOptions) => async (dispatch, getState) => {
		const targetBooking = getState().bookingForm.bookings[itemIndex];
		// const activeTestMode = getState().bookingForm.isActiveTestMode;
		// const response = await makeBooking(targetBooking, activeTestMode);
		console.log('slice---', targetBooking);
		const payload = {
			date: targetBooking?.pickupDateTime,
			pickup: `${targetBooking?.pickupAddress}, ${targetBooking?.pickupPostCode}`,
			vias: targetBooking?.vias,
			destination: `${targetBooking?.destinationAddress}, ${targetBooking?.destinationPostCode}`,
			passenger: targetBooking?.passengerName,
			passengers: targetBooking?.passengers,
			price: targetBooking?.price,
			phone:
				selectedOptions.textMessage || selectedOptions.both
					? targetBooking?.phoneNumber
					: '',
			email:
				selectedOptions.email || selectedOptions.both
					? targetBooking?.email
					: '',
		};
		const response = await sendQuotes(payload);
		if (response.status === 'success') {
			dispatch(endBooking({ itemIndex }));
			return { status: 'success' };
		} else {
			dispatch(
				bookingFormSlice.actions.updateDataValue(itemIndex, 'isLoading', false)
			);
			return { status: 'error', message: response.message };
		}
	};

export function findQuote(data) {
	return async (dispatch) => {
		const quote = await makeBookingQuoteRequest({
			pickupPostcode: data?.pickupPostcode,
			viaPostcodes: data?.viaPostcodes,
			destinationPostcode: data?.destinationPostcode,
			pickupDateTime: data?.pickupDateTime,
			passengers: data?.passengers,
			priceFromBase: data?.priceFromBase,
		});
		if (quote.status === 'success') {
			dispatch(setBookingQuote(quote));

			// updateData('quoteOptions', quote);
		} else {
			dispatch(openSnackbar('Failed to get quote', 'error'));
		}
	};
}

export const {
	addData,
	endBooking,
	setActiveTabChange,
	// setActiveTestMode,
	setActiveSectionMobileView,
	setIsGoogleApiOn,
	updateBookingData,
	addDataFromSchedulerInEditMode,
	setIsBookingOpenInEditMode,
	createBookingFromScheduler,
	setCreateResponseArray,
	setBookingQuote,
} = bookingFormSlice.actions;

export default bookingFormSlice.reducer;
