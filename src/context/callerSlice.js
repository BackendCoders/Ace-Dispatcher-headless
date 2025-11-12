/** @format */

import { createSlice } from "@reduxjs/toolkit";
import { convertKeysToCamelCase } from "../utils/casingConverter";
import { formatDate } from "../utils/formatDate";

const initialState = [];

const callerSlice = createSlice({
  name: "caller",
  initialState,
  reducers: {
    addCaller(state, action) {
      state.push(action.payload);
      state[state.length - 1].callerType = "stack";
    },
    removeCaller(state) {
      state.shift();
    },
    addCallerToLookup(state, action) {
      state.unshift(action.payload);
      state[0].callerType = "lookup";
    },
    removeBookingById(state, action) {
      const { type, bookingId } = action.payload;
      // Ensure we're targeting the correct list ('Current' or 'Previous')
      if (state[0][type]) {
        state[0][type] = state[0][type].filter(
          (booking) => booking.bookingId !== bookingId
        );
      }
    },
  },
});

export const addCallerToBooking = function (selectedRow, activeTab) {
  return function (dispatch, getState) {
    const type = activeTab === "current-bookings" ? "Current" : "Previous";
    let targetCallerData = getState().caller[0][type][selectedRow];

    targetCallerData = {
      ...targetCallerData,
      bookingType: type,
      PickupDateTime:
        type === "Current" ? targetCallerData.PickupDateTime : new Date(),
      Scope: type === 0,
      AccountNumber: 9999,
      // Add any additional properties you want to extend here
    };

    dispatch({ type: "bookingForm/addData", payload: targetCallerData });
    dispatch({ type: "caller/removeCaller" });
  };
};

export const updateCurrentBookingWithLookup = function (
  selectedRow,
  activeTab
) {
  return function (dispatch, getState) {
    const type = activeTab === "current-bookings" ? "Current" : "Previous";
    let targetCallerData = convertKeysToCamelCase(
      getState().caller[0][type][selectedRow]
    );
    const currentBooking =
      getState().bookingForm.bookings[
        getState().bookingForm.activeBookingIndex
      ];
    const updatedBooking = {
      ...currentBooking,
      ...targetCallerData,
      recurrenceRule: "",
      pickupDateTime: formatDate(new Date()),
      scope: 0,
      accountNumber: 9999,
    };
    dispatch({
      type: "bookingForm/updateBookingData",
      payload: updatedBooking,
    });
    dispatch({ type: "caller/removeCaller" });
  };
};

export const { addCaller, removeCaller, addCallerToLookup, removeBookingById } =
  callerSlice.actions;

export default callerSlice.reducer;
