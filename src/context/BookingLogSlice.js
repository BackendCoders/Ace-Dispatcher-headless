/** @format */
import { createSlice } from '@reduxjs/toolkit';
import { getBookingsLog } from '../utils/apiReq';

const initialState = {
	loading: false,
	logsArray: [],
};

const bookingLogSlice = createSlice({
	name: 'logs',
	initialState,
	reducers: {
		setLoading(state, action) {
			state.loading = action.payload;
		},
		setLogsArray(state, action) {
			state.logsArray = action.payload;
		},
	},
});

export function getRefreshedBookingsLog() {
	return async (dispatch) => {
		dispatch(setLoading(true));
		const response = await getBookingsLog();

		if (response.status === 'success') {
			console.log('Filtered Bookings:', response);

			const array = Object.keys(response)
				.filter((key) => key !== 'status')
				.map((key) => response[key]);

			dispatch(bookingLogSlice.actions.setLogsArray(array));
		}
		dispatch(setLoading(false));
		return response;
	};
}

export const { setLogsArray, setLoading } = bookingLogSlice.actions;
export default bookingLogSlice.reducer;
