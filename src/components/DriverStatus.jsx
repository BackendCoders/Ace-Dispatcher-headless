/** @format */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { driverShift } from '../utils/apiReq';
import Loader from './Loader';
import { useMediaQuery } from '@mui/material';
import isLightColor from '../utils/isLight';

function DriverStatus({ availabilityDate }) {
	const [data, setData] = useState([]);
	const { bookings, activeBookingIndex } = useSelector(
		(state) => state.bookingForm
	);
	const isMobile = useMediaQuery('(max-width:640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

	const [loading, setLoading] = useState(false);
	const date =
		isMobile || isTablet
			? availabilityDate
			: bookings[activeBookingIndex].pickupDateTime;

	useEffect(() => {
		let intervalId;
		async function getData() {
			// const response = await getDriverAvailability(
			// 	new Date(date).toISOString(),
			// 	isActiveTestMode
			// );

			const response = await driverShift();
			console.log(response);
			const result = Object.values(response);
			result.pop();
			if (response.status === 'success') {
				const resultArray = Object.keys(response)
					.filter((key) => !isNaN(key)) // Keep only numeric keys
					.map((key) => response[key]);
				setData(resultArray);
				setLoading(false);
			}
		}
		getData();

		intervalId = setInterval(getData, 2000);

		return () => clearInterval(intervalId);
		// }, [date, isActiveTestMode]);
	}, []);

	const status = {
		1000: 'Start',
		1001: 'Finish',
		1002: 'OnBreak',
		1003: 'FinishBreak',
		3003: 'OnRoute',
		3004: 'AtPickup',
		3005: 'POB',
		3006: 'ST',
		3007: 'Clear',
		3008: 'NoJob',
		2000: 'Accept',
		2001: 'Reject',
		2002: 'TimedOut',
	};

	const statusColors = {
		1000: 'bg-blue-500', // Start
		1001: 'bg-gray-500', // Finish
		1002: 'bg-cyan-950', // OnBreak
		1003: 'bg-green-500', // FinishBreak
		3003: 'bg-orange-500', // OnRoute
		3004: 'bg-indigo-500', // AtPickup
		3005: 'bg-green-900', // PassengerOnBoard
		3006: 'bg-yellow-500', // SoonToClear
		3007: 'bg-green-500', // Clear
		3008: 'bg-red-500', // NoJob
		2000: 'bg-green-600', // Accept
		2001: 'bg-red-600', // Reject
		2002: 'bg-yellow-600', // TimedOut
	};

	return (
		<div className='flex flex-col items-center justify-center w-full h-full bg-white rounded-lg px-4 pb-4 sm:p-6 sm:pb-4'>
			<div className='flex w-full flex-col justify-center items-center pb-2'>
				<p className='font-medium'>
					{date?.split('T')[0].split('-').reverse().join('/')}{' '}
					{date?.split('T')[1]}
				</p>
			</div>
			<div className='m-auto w-full h-full overflow-auto mb-4'>
				{loading ? (
					<Loader />
				) : (
					data?.map((el) => (
						<>
							<div
								key={el?.userId}
								className='flex justify-center w-full items-center mx-auto cursor-pointer gap-4 mb-2 rounded-md p-1'
								style={{
									backgroundColor: el?.colourCode,
									color: isLightColor(el?.colourCode) ? 'black' : 'white',
								}}
							>
								<div className='w-full mx-auto flex gap-4 justify-center items-center'>
									<p
										className={`text-sm w-6 h-6 text-center`}
										style={{
											backgroundColor: el?.colourCode,
											color: isLightColor(el?.colourCode) ? 'black' : 'white',
										}}
									>
										{el?.userId}
									</p>
									<div className='flex flex-col w-[60%] justify-center items-start text-center'>
										<p>{el?.fullname}</p>
									</div>
									<div
										className={`text-sm text-white px-3 py-1 rounded ${
											statusColors[el?.status] || 'bg-gray-400'
										}`}
									>
										{status[el?.status]}
									</div>
								</div>
							</div>
						</>
					))
				)}
			</div>
		</div>
	);
}

export default DriverStatus;
