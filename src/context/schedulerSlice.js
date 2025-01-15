/** @format */

import { createSlice } from '@reduxjs/toolkit';
import {
	getBookingData,
	deleteSchedulerBooking as deleteBooking,
	allocateDriver,
	completeBookings,
	// bookingFindByKeyword,
	// bookingFindByTerm,
	findBookingById,
	bookingFindByBookings,
	softAllocateDriver,
} from '../utils/apiReq';
import axios from 'axios';
import { formatDate } from '../utils/formatDate';

const isMobile = window.innerWidth <= 640;

const filterScheduledBookings = function (booking) {
	return {
		bookingId: booking.bookingId,
		bookingTime: booking.bookingTime,
		pickupDateTime: booking.pickupDate,
		endTime: booking.endDate || booking.pickupDate,
		backgroundColorRGB: booking.color,
		subject: booking.cellText,
		...booking,
	};
};

const schedulerSlice = createSlice({
	name: 'scheduler',
	initialState: {
		bookings: [],
		loading: false,
		currentlySelectedBookingIndex: -1,
		selectedDriver: null,
		activeDate: new Date().toISOString(),
		activeComplete: isMobile ? true : false,
		activeAllocate: true,
		activeSearch: false,
		activeSoftAllocate: false,
		activeSearchResults: [],
		activeSearchResult: null,
		showDriverAvailability: false,
		dateControl: formatDate(new Date().toISOString()),
	},
	reducers: {
		insertBookings: (state, action) => {
			state.bookings = action.payload;
		},
		removeBooking: (state, action) => {
			state.bookings.splice(action.payload, 1);
		},
		completeActiveBookingStatus: (state, action) => {
			state.activeComplete = action.payload;
		},
		allocateActiveBookingStatus: (state, action) => {
			state.activeAllocate = action.payload;
		},
		changeActiveDate: (state, action) => {
			state.activeDate = new Date(action.payload).toISOString();
		},
		setDateControl: (state, action) => {
			state.dateControl = new Date(action.payload).toISOString();
		},
		selectBookingFromScheduler: (state, action) => {
			state.currentlySelectedBookingIndex = action.payload;
		},
		selectDriver: (state, action) => {
			state.selectedDriver = action.payload;
		},
		setActiveBookingIndex: (state, action) => {
			state.bookings.forEach((booking, index) => {
				if (booking.bookingId === action.payload) {
					state.currentlySelectedBookingIndex = index;
					return;
				}
			});
		},
		makeSearchActive: (state, action) => {
			state.activeSearch = true;
			state.activeSearchResults = action.payload;
		},
		makeSearchInactive: (state) => {
			state.activeSearch = false;
			state.activeSearchResults = [];
		},
		setActiveSearchResultClicked: (state, action) => {
			state.activeSearchResult = action.payload;
		},
		changeShowDriverAvailability: (state, action) => {
			state.showDriverAvailability = action.payload;
		},
		updateBookingAtIndex: (state, action) => {
			state.bookings.forEach((booking, index) => {
				if (booking.bookingId === action.payload.bookingId) {
					state.bookings[index] = action.payload;
					return;
				}
			});
		},
		setLoading: (state, action) => {
			state.loading = action.payload;
		},
		setActiveSoftAllocate: (state, action) => {
			state.activeSoftAllocate = action.payload;
		},
	},
});

export function getRefreshedBookings() {
	return async (dispatch, getState) => {
		// const activeTestMode = getState().bookingForm.isActiveTestMode;
		const { activeDate, activeComplete, activeAllocate } = getState().scheduler;

		// const response = await getBookingData(activeDate, activeTestMode);
		const response = await getBookingData(activeDate);

		if (response.status === 'success') {
			let filteredBookings = [];
			if (activeComplete && activeAllocate) {
				// Case 1: Show all bookings
				filteredBookings = response.bookings;
			} else if (activeComplete && !activeAllocate) {
				// Case 2: Show all bookings except those that have a userId
				filteredBookings = response.bookings.filter(
					(booking) => !booking?.userId
				);
			} else if (!activeComplete && activeAllocate) {
				// Case 3: Show all bookings except those with status === 3
				filteredBookings = response.bookings.filter(
					(booking) => booking.status !== 3
				);
			} else if (!activeComplete && !activeAllocate) {
				// Case 4: Show bookings that have status !== 3 and no userId
				filteredBookings = response.bookings.filter(
					(booking) => booking.status !== 3 && !booking?.userId
				);
			}
			// console.log('Filtered Bookings:', filteredBookings);

			dispatch(schedulerSlice.actions.insertBookings(filteredBookings));
		}
		return response;
	};
}

export function deleteSchedulerBooking(
	cancelBlock,
	fullName,
	id,
	cancelledOnArrival = false
) {
	return async (dispatch, getState) => {
		// console.log({ cancelBlock, fullName, id });
		const {
			bookings,
			currentlySelectedBookingIndex: index,
			activeSearch,
			activeSearchResult,
		} = getState().scheduler;
		// const testMode = getState().bookingForm.isActiveTestMode;
		if (index === -1 && !activeSearch) return;
		const bookingId = activeSearch
			? activeSearchResult.bookingId
			: bookings[index].bookingId;
		console.log({ bookingId });

		const reqData = {
			bookingId,
			cancelledByName: fullName,
			actionByUserId: id,
			cancelBlock,
			cancelledOnArrival: cancelledOnArrival,
		};

		// const data = await deleteBooking(reqData, testMode);
		const data = await deleteBooking(reqData);
		if (data.status === 'success' && cancelledOnArrival === false) {
			dispatch({ type: 'scheduler/removeBooking', payload: index });
		}
		return data;
	};
}

export function allocateBookingToDriver(actionByUserId) {
	return async (dispatch, getState) => {
		// const activeTestMode = getState().bookingForm.isActiveTestMode;
		const isSoftAllocateActive = getState().scheduler.activeSoftAllocate;
		const {
			bookings,
			currentlySelectedBookingIndex,
			selectedDriver,
			activeSearch,
			activeSearchResult,
		} = getState().scheduler;
		const currentBooking = activeSearch
			? activeSearchResult
			: bookings[currentlySelectedBookingIndex];
		// const isActiveTestMode = getState().bookingForm.isActiveTestMode;

		const requestBody = {
			bookingId: currentBooking.bookingId,
			userId: selectedDriver,
			actionByUserId,
		};
		let data;
		if (isSoftAllocateActive) {
			// data = await softAllocateDriver(requestBody, activeTestMode);
			data = await softAllocateDriver(requestBody);
		} else if (!isSoftAllocateActive) {
			// data = await allocateDriver(requestBody, activeTestMode);
			data = await allocateDriver(requestBody);
		}
		// if (data.status === 'success' && isActiveTestMode) {
		if (data.status === 'success') {
			// const notification = await axios.get(
			// 	`https://fcm-notification-a1rh.onrender.com/20`
			// );
			// console.log('notification---', notification);

			// const expoToken = notification.data.data.expoNotificationToken;
			const bookingId = currentBooking.bookingId;
			await axios.post(
				'http://192.168.1.13:80/api/Authenticate/sendnotification',
				{
					userId: selectedDriver,
					title: 'Got a new booking',
					messageBody:
						'You have been allocated a new booking. Please check the app for more details.',
					bookingId: `${bookingId}`,
				}
			);

			dispatch(getRefreshedBookings());
		}
		return data;
	};
}

export function handleCompleteBooking({
	waitingTime,
	parkingCharge,
	priceAccount,
	driverPrice,
}) {
	return async (dispatch, getState) => {
		const {
			bookings,
			currentlySelectedBookingIndex: index,
			activeSearch,
			activeSearchResult,
		} = getState().scheduler;
		// const activeTestMode = getState().bookingForm.isActiveTestMode;
		const bookingId = activeSearch
			? activeSearchResult.bookingId
			: bookings[index].bookingId;

		const response = await completeBookings(
			{
				bookingId,
				waitingTime,
				parkingCharge,
				priceAccount,
				driverPrice,
			}
			// activeTestMode
		);

		if (response === 'success') {
			dispatch(getRefreshedBookings());
		}
		return response;
	};
}

export const handleSearchBooking = function (keyword) {
	// return async (dispatch, getState) => {
	return async (dispatch) => {
		// const activeTestMode = getState().bookingForm.isActiveTestMode;
		// const res = await bookingFindByKeyword(keyword, activeTestMode);
		// if (res.status === 'success') {
		// 	const results =
		// 		res.bookings.filter((booking) => booking.cancelled === false)
		// 	;
		// 	console.log(results);
		// 	dispatch(schedulerSlice.actions.makeSearchActive(results));
		// }
		dispatch(schedulerSlice.actions.setLoading(true));
		// const res = await bookingFindByTerm(keyword, activeTestMode);
		// const res = await bookingFindByBookings(keyword, activeTestMode);
		const res = await bookingFindByBookings(keyword);

		dispatch(schedulerSlice.actions.setLoading(false));
		if (res.status === 'success') {
			const results = res.results
				.filter((booking) => booking.cancelled === false)
				.map((el) => filterScheduledBookings(el));
			dispatch(schedulerSlice.actions.makeSearchActive(results));
		}
	};
};

// export const setActiveSearchResult = function (bookingId, activeTestMode) {
export const setActiveSearchResult = function (bookingId) {
	return async (dispatch) => {
		// const data = await findBookingById(bookingId, activeTestMode);
		const data = await findBookingById(bookingId);
		if (data.status === 'success') {
			dispatch(schedulerSlice.actions.setActiveSearchResultClicked(data));
			// console.log(data);
		}
	};
};

export const {
	completeActiveBookingStatus,
	allocateActiveBookingStatus,
	setDateControl,
	changeActiveDate,
	setActiveBookingIndex,
	selectDriver,
	makeSearchInactive,
	changeShowDriverAvailability,
	updateBookingAtIndex,
	setActiveSearchResultClicked,
	setActiveSoftAllocate,
} = schedulerSlice.actions;

export default schedulerSlice.reducer;
