/** @format */
import { createSlice } from '@reduxjs/toolkit';
import { getCOAEntrys } from '../utils/apiReq';
import { formatDate } from '../utils/formatDate';

const initialState = {
	loading: false,
	coaEntries: [],
	coaDate: formatDate(new Date().toISOString()),
};

const coaEntrySlice = createSlice({
	name: 'coaEntry',
	initialState,
	reducers: {
		setLoading(state, action) {
			state.loading = action.payload;
		},
		setCoaEntries(state, action) {
			state.coaEntries = action.payload;
		},
		setCoaDate(state, action) {
			state.coaDate = new Date(action.payload).toISOString();
		},
	},
});

export function getRefreshedCOAEntry(date) {
	return async (dispatch) => {
		dispatch(setLoading(true));

		console.log(date);
		const response = await getCOAEntrys(date);

		if (response.status === 'success') {
			console.log('Filtered Coa Entrys:', response);

			const array = Object.keys(response)
				.filter((key) => key !== 'status')
				.map((key) => response[key]);

			dispatch(coaEntrySlice.actions.setCoaEntries(array));
		}
		dispatch(setLoading(false));
		return response;
	};
}

export const { setCoaEntries, setLoading, setCoaDate } = coaEntrySlice.actions;
export default coaEntrySlice.reducer;
