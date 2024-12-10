/** @format */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAvailabilityDriverOld } from '../utils/apiReq';
import Loader from './Loader';
import { useMediaQuery } from '@mui/material';

function AvailbilityChartMobileView({ availabilityDate }) {
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
		async function getData() {
			// const response = await getDriverAvailability(
			// 	new Date(date).toISOString(),
			// 	isActiveTestMode
			// );
			const response = await getAvailabilityDriverOld(
				new Date(date).toISOString()
			);
			console.log(response);
			const result = Object.values(response);
			result.pop();
			if (response.status === 'success') {
				// const availableDrivers = result.filter(
				// 	(driver) => driver.availableHours.length > 0
				// );
				// const unavailableDrivers = result.filter(
				// 	(driver) => driver.availableHours.length === 0
				// );

				// // Sort both groups alphabetically by fullName
				// availableDrivers.sort((a, b) => a.fullName.localeCompare(b.fullName));
				// unavailableDrivers.sort((a, b) => a.fullName.localeCompare(b.fullName));
				// setData([...availableDrivers, ...unavailableDrivers]);
				setData(response.drivers);
				setLoading(false);
			}
		}
		getData();
		// }, [date, isActiveTestMode]);
	}, [date]);

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
					data.map((el, idx) => (
						<>
							<div
								key={idx}
								className='bg-gray-200 flex justify-center w-full items-center mx-auto cursor-pointer gap-4 mb-2'
							>
								<div className='w-full mx-auto flex gap-4 justify-center items-center'>
									<div
										style={{ backgroundColor: el?.colorCode }}
										className={`h-5 w-5`}
									></div>
									<div className='flex flex-col w-[80%] justify-center items-start'>
										<p className='text-[.75rem]'>
											({el?.userId}) - {el?.fullName}{' '}
										</p>
										<p className='text-[.6rem]'>{el?.description}</p>
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

export default AvailbilityChartMobileView;
