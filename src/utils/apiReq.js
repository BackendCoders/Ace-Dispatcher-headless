/** @format */

import axios from 'axios';
import { formatDate } from './formatDate';
// import { sendLogs } from './getLogs';
import { filterVias } from './filterVias';
const BASE = import.meta.env.VITE_BASE_URL;

// utils function
function convertDateString(inputDateString) {
	// Parse the input date string
	const date = new Date(inputDateString);

	// Get the components of the date
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	// Construct the output date string
	const outputDateString = `${year}-${month}-${day}T${hours}:${minutes}`;

	return outputDateString;
}

// this was needed when data was not mapped
// after replacement of context with redux use of this fn is not needed
function filterData(data) {
	return JSON.stringify({
		details: data.details,
		email: data.email,
		durationText: Number(data.durationText) ? String(data.durationText) : '0',
		// durationMinutes: data.durationText ? +data.durationText : 0,
		durationMinutes: data.durationMinutes || 0,
		isAllDay: data.isAllDay,
		passengerName: data.passengerName,
		passengers: data.passengers,
		paymentStatus: data.paymentStatus || 0,
		scope: data.scope,
		phoneNumber: data.phoneNumber,
		pickupAddress: data.pickupAddress,
		pickupDateTime: data.pickupDateTime,
		pickupPostCode: data.pickupPostCode,
		destinationAddress: data.destinationAddress,
		destinationPostCode: data.destinationPostCode,
		recurrenceRule: data.recurrenceRule || null,
		recurrenceID: data.recurrenceID || null,
		price: data.price,
		priceAccount: data.priceAccount || 0,
		chargeFromBase: data.chargeFromBase || false,
		userId: data.userId || null,
		returnDateTime: data.returnDateTime || null,
		vias: filterVias(data),
		accountNumber: data.accountNumber,
		bookedByName: data.bookedByName || '',
		bookingId: data.bookingId || null,
		updatedByName: data.updatedByName || '',
		isASAP: data.isASAP || false,
		manuallyPriced: data.manuallyPriced || false,
		arriveBy: data.arriveBy || null,
		isDuplicate: data.isDuplicate || false,
		// actionByUserId: data.actionByUserId || null,
	});
}

function createDateObject(today = new Date()) {
	const fromDate =
		new Date(new Date(today).setHours(0, 0, 0, 0)).getTime() -
		24 * 60 * 60 * 1000;
	const formattedFrom = formatDate(new Date(fromDate));
	const formattedTo = formatDate(
		new Date(today).setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
	);

	return {
		from: formattedFrom,
		to: formattedTo,
	};
}

function setHeaders() {
	const accessToken = localStorage.getItem('authToken');
	if (!accessToken) return {};
	return {
		'Accept': '*/*',
		'Authorization': `Bearer ${accessToken}`,
		'Content-Type': 'application/json',
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0',
	};
}

// event handlers
// Event handlers
async function handleGetReq(URL) {
	try {
		// console.log(URL);
		const response = await axios.get(URL, { headers: setHeaders() });
		if (response.status >= 200 && response.status < 300) {
			return { ...response.data, status: 'success' };
		} else {
			console.log('Unexpected response status:', response);
			return null;
		}
	} catch (err) {
		// sendLogs({ url: URL, error: err.response }, 'error');
		console.error('Error in GET request:', err);
		return {
			...err.response,
			status: err.response.status > 499 ? 'error' : 'fail',
			message: `${
				err.response.status > 499 ? 'server error' : 'Failed'
			} while fetching the data`,
		};
	}
}

async function handlePostReq(URL, data) {
	try {
		const response = await axios.post(URL, data, {
			headers: setHeaders(),
		});

		if (response.status >= 200 && response.status < 300) {
			return { ...response.data, status: 'success' };
		} else {
			console.log('Unexpected response status:', response);
			return null;
		}
	} catch (err) {
		// sendLogs({ url: URL, error: err.response }, 'error');
		return {
			...err.response,
			status: err.response.status > 499 ? 'error' : 'fail',
			message: `${
				err.response.status > 499 ? 'server error' : 'Failed'
			} while fetching the data`,
		};
	}
}

async function makeBooking(data) {
	const URL = `${BASE}/api/Bookings/Create`;
	const filteredData = filterData(data);
	console.log('filtered Data is coming', filteredData);
	// const filteredData = data;
	const res = await handlePostReq(URL, filteredData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );
		return res;
}

const getBookingData = async function (date) {
	const accessToken = localStorage.getItem('authToken');
	if (!accessToken) return;

	const URL = `${BASE}/api/Bookings/DateRange`;
	const dataToSend = createDateObject(date);

	// Use handlePostReq function
	const response = await handlePostReq(URL, dataToSend);
	if (response) {
		// localStorage.setItem('bookings', JSON.stringify(response.bookings));
		return response;
	} else {
		console.log('Unexpected response:', response);
	}
};

async function makeBookingQuoteRequest(data) {
	const URL = BASE + '/api/Bookings/GetPrice';
	const requestData = {
		pickupPostcode: data.pickupPostcode,
		viaPostcodes: data.viaPostcodes,
		destinationPostcode: data.destinationPostcode,
		pickupDateTime: convertDateString(data.pickupDateTime),
		passengers: data.passengers,
		priceFromBase: data.priceFromBase || data.chargeFromBase,
		accountNo: data.accountNumber || 9999,
	};

	const res = await handlePostReq(URL, requestData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}
// Local Api for address Suggestions
async function getPoi(code) {
	try {
		const URL = `${BASE}/api/LocalPOI/GetPOI`;
		const config = {
			headers: setHeaders(),
		};
		const body = { searchTerm: `${code}` };
		const { data } = await axios.post(URL, body, config);
		return data;
	} catch (err) {
		console.log(err);
	}
}

// get Address Api Calling for Postcode Suggestions dropdown
async function getPostal(code) {
	const apiKey = import.meta.env.VITE_GETADDRESS_KEY;
	const URL = `https://api.getaddress.io/v2/uk/${code}?api-key=${apiKey}`;
	const res = await handleGetReq(URL);
	return res;
}

async function getAddressDetails(id) {
	const apiKey = import.meta.env.VITE_GETADDRESS_KEY; // Replace with your actual API key
	const URL = `https://api.getAddress.io/get/${id}?api-key=${apiKey}`;
	try {
		const response = await axios.get(URL);
		const data = response.data;
		// console.log('getAddressDetails', data);

		// Clean up formatted_address by filtering out empty or null values
		const cleanedAddress = data.formatted_address
			.filter((line) => line && line.trim()) // Remove empty or undefined lines
			.join(', '); // Combine the filtered address fields

		return {
			address: cleanedAddress, // Use the cleaned address
			postcode: data.postcode || 'No Postcode', // Fallback for postcode
			latitude: data.latitude,
			longitude: data.longitude,
		}; // Return the full address details including postcode
	} catch (error) {
		console.error('Error fetching full address details:', error);
		return null;
	}
}

async function getAddressSuggestions(location) {
	const apiKey = import.meta.env.VITE_GETADDRESS_KEY;
	try {
		// Step 1: Get autocomplete suggestions

		// const filter = {
		// 	radius: {
		// 		km: 10,
		// 	},
		// 	location: {
		// 		longitude: -2.2799,
		// 		latitude: 51.0388,
		// 	},
		// };
		const autocompleteResponse = await axios.post(
			`https://api.getAddress.io/autocomplete/${location}?api-key=${apiKey}`,
			{
				location: {
					latitude: 51.0388,
					longitude: -2.2799,
				},
			}
		);
		const suggestions = autocompleteResponse.data.suggestions;

		// Step 2: Map over the suggestions to format them without making additional API calls
		const formattedSuggestions = suggestions.map((suggestion) => ({
			label: suggestion.address, // Use only the address part for the label
			id: suggestion.id,
			address: suggestion.address || 'Unknown Address', // Keep the suggestion ID for further use
		}));

		return formattedSuggestions;
	} catch (error) {
		console.error('Error fetching address suggestions:', error);
		return [];
	}
}

async function getAllDrivers() {
	const URL = `${BASE}/api/UserProfile/ListUsers`;
	return await handleGetReq(URL);
}

async function getAccountList() {
	const URL = `${BASE}/api/Accounts/GetList`;
	const data = await handleGetReq(URL);
	if (data.status === 'success') {
		const formatedData = Object.keys(data).map((el) => data[el]);
		localStorage.setItem(
			'accounts',
			JSON.stringify([{ accNo: 0, accountName: 'select-233' }, ...formatedData])
		);
		return [{ accNo: 0, accountName: 'select-233' }, ...formatedData];
	}
}

async function updateBooking(data) {
	const URL = `${BASE}/api/Bookings/Update`;
	let filteredData = JSON.parse(filterData(data));

	// Include editBlock if present
	if (data.editBlock) {
		filteredData = { ...filteredData, editBlock: data.editBlock };
	}

	// console.log(filteredData);
	const res = await handlePostReq(URL, filteredData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function deleteSchedulerBooking(data) {
	const URL = `${BASE}/api/Bookings/Cancel`;
	const res = await handlePostReq(URL, {
		bookingId: data.bookingId,
		cancelledByName: data.cancelledByName,
		actionByUserId: data.actionByUserId,
		cancelBlock: data.cancelBlock,
		cancelledOnArrival: data.cancelledOnArrival,
		sendEmail: data.sendEmail,
	});
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function getAvailabilityDriverOld(date) {
	const URL = `${BASE}/api/UserProfile/GetAvailability`;
	return await handlePostReq(URL, { date: new Date(date).toISOString() });
}

async function getDriverAvailability(dueDate) {
	const URL = `${BASE}/api/Availability/General?date=${dueDate}`;
	return await handleGetReq(URL);
}

// async function getAddressSuggestions(location) {
// 	const apiKey = import.meta.env.VITE_GETADDRESS_KEY;
// 	try {
// 		// Get autocomplete suggestions
// 		const autocompleteResponse = await axios.get(
// 			`https://api.getAddress.io/autocomplete/${location}?api-key=${apiKey}`
// 		);
// 		const suggestions = autocompleteResponse.data.suggestions;

// 		// Fetch details for each suggestion
// 		const detailsPromises = suggestions.map(async (suggestion) => {
// 			const detailResponse = await axios.get(
// 				`https://api.getAddress.io/get/${suggestion.id}?api-key=${apiKey}`
// 			);
// 			return detailResponse.data;
// 		});

// 		const details = await Promise.all(detailsPromises);

// 		return details;
// 	} catch (error) {
// 		console.error('Error fetching address suggestions:', error);
// 		return [];
// 	}
// }

// async function getAddressSuggestions(location) {
// 	const apiKey = import.meta.env.VITE_GETADDRESS_KEY;
// 	try {
// 		// Step 1: Get autocomplete suggestions
// 		const autocompleteResponse = await axios.get(
// 			`https://api.getAddress.io/autocomplete/${location}?api-key=${apiKey}`
// 		);
// 		const suggestions = autocompleteResponse.data.suggestions;

// 		// Step 2: Fetch details for each suggestion based on the returned IDs
// 		const detailsPromises = suggestions.map(async (suggestion) => {
// 			// Fetch full details for the suggestion
// 			const detail = await getAddressDetails(suggestion.id);
// 			// console.log({ suggestion, detail });
// 			if (detail) {
// 				return {
// 					label: `${detail.address}, ${detail.postcode}`, // Combine address and postcode
// 					id: suggestion.id,
// 					latitude: detail.latitude,
// 					longitude: detail.longitude,
// 					address: detail.address,
// 					postcode: detail.postcode,
// 				};
// 			} else {
// 				// If details couldn't be fetched, return null (to filter out later)
// 				return null;
// 			}
// 		});

// 		// Await all the promises for full details, then filter out any null values
// 		const details = await Promise.all(detailsPromises);
// 		return details.filter(Boolean); // Filter out null values
// 	} catch (error) {
// 		console.error('Error fetching address suggestions:', error);
// 		return [];
// 	}
// }

async function fireCallerEvent(number) {
	const URL = `${BASE}/api/CallEvents/CallerLookup?caller_id=${number}`;
	if (number.length < 10) return;
	return await handleGetReq(URL);
}

async function allocateDriver(allocateReqData) {
	const URL = `${BASE}/api/Bookings/Allocate`;
	const res = await handlePostReq(URL, allocateReqData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: allocateReqData,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function softAllocateDriver(allocateReqData) {
	const URL = `${BASE}/api/Bookings/SoftAllocate`;
	const res = await handlePostReq(URL, allocateReqData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: allocateReqData,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function completeBookings(completeBookingData) {
	const URL = `${BASE}/api/Bookings/Complete`;
	const res = await handlePostReq(URL, completeBookingData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: completeBookingData,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function bookingFindByTerm(queryField) {
	const URL = `${BASE}/api/Bookings/FindByTerm?term=${queryField}`;
	const res = await handleGetReq(URL);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: queryField,
		// 		headers: setHeaders(),
		// 		// response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function bookingFindByBookings(data) {
	const URL = `${BASE}/api/Bookings/FindBookings`;
	const reqData = {
		pickupAddress: data.pickupAddress || '',
		pickupPostcode: data.pickupPostcode || '',
		destinationAddress: data.destinationAddress || '',
		destinationPostcode: data.destinationPostcode || '',
		passenger: data.passenger || '',
		phoneNumber: data.phoneNumber || '',
		details: data.details || '',
	};
	const res = await handlePostReq(URL, reqData);
	if (res.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: reqData,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );

		return res;
}

async function findBookingById(bookingId) {
	const URL = `${BASE}/api/Bookings/FindById/?bookingId=${bookingId}`;
	return await handleGetReq(URL);
}

async function bookingPayment(data) {
	// console.log(data);

	const response = await axios.post(
		'https://revolut-payment-integration.onrender.com/api/create-payment',
		{
			amount: data.amount,
			currency: 'GBP',
			description: 'Ace Taxi Journey',
			customer_email: data.customer_email,
			pickup: data.pickup,
			passenger: data.passenger,
			date: data.date,
		}
	);

	if (response.status === 'success')
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: response,
		// 	},
		// 	'info'
		// );

		return response;
}

async function sendPaymentLink(paymentDetail) {
	const { telephone, pickup, bookingId, name, email, price } = paymentDetail;
	const URL = `${BASE}/api/Bookings/PaymentLink?bookingId=${Number(
		bookingId
	)}&telephone=${telephone}&email=${email}&name=${name}&price=${Number(
		price
	)}&pickup=${pickup}`;
	return await handleGetReq(URL);
}

async function sendRefundLink(paymentDetail) {
	const { bookingId, price } = paymentDetail;
	const URL = `${BASE}/api/Bookings/RefundPayment?bookingId=${Number(
		bookingId
	)}&price=${Number(price)}`;
	return await handleGetReq(URL);
}

async function driverArrived(bookingId) {
	const URL = `${BASE}/api/DriverApp/Arrived?bookingId=${Number(bookingId)}`;
	return await handleGetReq(URL);
}

async function sendConfirmationText(data) {
	const { bookingId, phone, date } = data;
	const URL = `${BASE}/api/Bookings/SendConfirmationText?phone=${
		phone || ''
	}&date=${date}&bookingId=${Number(bookingId)}`;
	//   console.log(URL);
	return await handleGetReq(URL);
}

async function sendReminderForPayment(data) {
	const { bookingId, phone } = data;
	const URL = `${BASE}/api/Bookings/ReminderPaymentLink?phone=${
		phone || ''
	}&bookingId=${Number(bookingId)}`;
	return await handleGetReq(URL);
}

async function recordTurnDown(data) {
	// const reqData = {
	// 	amount: data.amount || 0,
	// };
	const URL = `${BASE}/api/bookings/recordTurndown?amount=${data?.amount}`;
	const res = await handleGetReq(URL);
	if (res.status === 'success') {
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: reqData,
		// 		headers: setHeaders(),
		// 		response: res,
		// 	},
		// 	'info'
		// );
		return res;
	}
}

async function sendPayReceipt(bookingId) {
	const URL = `${BASE}/api/Bookings/SendPaymentReceipt?bookingId=${bookingId}`;
	return await handleGetReq(URL);
}

async function driverShift() {
	const URL = `${BASE}/api/AdminUI/DriversOnShift`;
	return await handleGetReq(URL);
}

async function sendMsgToDriver(data) {
	const URL = `${BASE}/api/AdminUI/SendMessageToDriver?driver=${
		data.userId
	}&message=${encodeURIComponent(data.message)}`;
	return await handlePostReq(URL, {});
}

async function sendMsgToAllDrivers(data) {
	const URL = `${BASE}/api/AdminUI/SendMessageToAllDrivers?message=${encodeURIComponent(
		data.message
	)}`;
	return await handlePostReq(URL, {});
}

async function sendQuotes(data) {
	const URL = `${BASE}/api/bookings/SendQuote`;
	return await handlePostReq(URL, data);
}

async function getDuration(data) {
	const URL = `${BASE}/api/Bookings/GetDuration?pickupDate=${
		data?.pickupDate
	}&pickupPostcode=${encodeURIComponent(
		data?.pickupPostcode
	)}&destinationPostcode=${data?.destinationPostcode}`;
	try {
		const response = await axios.get(URL, { headers: setHeaders() });
		console.log(response);
		if (response.status !== 200) throw new Error('Could not fetch duration');
		// sendLogs(
		// 	{
		// 		url: URL,
		// 		requestBody: data,
		// 		headers: setHeaders(),
		// 		response: response.data,
		// 	},
		// 	'info'
		// );
		return response;
	} catch (error) {
		console.log(error);
		// sendLogs({ url: URL, error: error }, 'error');
		return error;
	}
}

async function textMessageDirectly(data) {
	const URL = `${BASE}/api/SmsQue/SendText?message=${encodeURIComponent(
		data.message
	)}&telephone=${data.telephone}`;
	return await handlePostReq(URL, null);
}

async function getBookingsLog() {
	const URL = `${BASE}/api/Bookings/GetActionLogs`;
	return await handleGetReq(URL);
}

async function confirmAllSoftAllocate(date) {
	const URL = `${BASE}/api/Bookings/ConfirmAllSoftAllocates?forDate=${date}`;
	return await handlePostReq(URL, null);
}

async function getAllGPS() {
	const URL = `${BASE}/api/UserProfile/GetAllGPS`;
	return await handleGetReq(URL);
}

async function mergeBookings(primaryBookingId, appendBookingId) {
	const URL = `${BASE}/api/Bookings/MergeBookings?primaryBookingId=${primaryBookingId}&appendBookingId=${appendBookingId}`;
	return await handleGetReq(URL);
}

async function createCOAEntry(data) {
	const { accno, journeyDate, passengerName, pickupAddress } = data;
	const URL = `${BASE}/api/Bookings/CreateCOAEntry?accno=${accno}&journeyDate=${journeyDate}&passengerName=${encodeURIComponent(
		passengerName
	)}&pickupAddress=${encodeURIComponent(pickupAddress)}`;
	return handlePostReq(URL, null);
}

async function getCOAEntrys(date) {
	const URL = `${BASE}/api/Bookings/GetCOAEntrys?date=${date}`;
	return await handleGetReq(URL);
}

async function getQuoteHvsDriver(payload) {
	const URL = `${BASE}/api/Bookings/GetPrice`;
	return await handlePostReq(URL, payload);
}

export {
	getBookingData,
	makeBooking,
	getPoi,
	makeBookingQuoteRequest,
	getAllDrivers,
	getPostal,
	getAccountList,
	updateBooking,
	deleteSchedulerBooking,
	getDriverAvailability,
	getAddressSuggestions,
	fireCallerEvent,
	allocateDriver,
	softAllocateDriver,
	completeBookings,
	bookingFindByTerm,
	bookingFindByBookings,
	findBookingById,
	getAddressDetails,
	bookingPayment,
	sendPaymentLink,
	sendRefundLink,
	driverArrived,
	getAvailabilityDriverOld,
	sendConfirmationText,
	sendReminderForPayment,
	recordTurnDown,
	sendPayReceipt,
	driverShift,
	sendMsgToAllDrivers,
	sendMsgToDriver,
	sendQuotes,
	textMessageDirectly,
	getBookingsLog,
	getDuration,
	confirmAllSoftAllocate,
	getAllGPS,
	mergeBookings,
	createCOAEntry,
	getCOAEntrys,
	getQuoteHvsDriver,
};
