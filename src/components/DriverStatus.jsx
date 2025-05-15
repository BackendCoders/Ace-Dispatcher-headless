/** @format */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { driverShift } from '../utils/apiReq';
import Loader from './Loader';
import { useMediaQuery } from '@mui/material';
import isLightColor from '../utils/isLight';
import PanToolAltOutlinedIcon from '@mui/icons-material/PanToolAltOutlined';
import Modal from '../components/Modal';
import MsgModal from './MsgModal';
function DriverStatus({ availabilityDate }) {
	const [data, setData] = useState([]);
	const [msgModalOpen, setMsgModalOpen] = useState(false);
	const [selectedDriver, setSelectedDriver] = useState({});
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

	const handleClose = () => {
		setMsgModalOpen(false);
	};

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
		1002: 'ON BRK',
		1003: 'FIN BRK',
		3003: 'OR',
		3004: 'AP',
		3005: 'POB',
		3006: 'STC',
		3007: 'CLR',
		3008: 'NOJ',
		2000: 'Accept',
		2001: 'Reject',
		2002: 'TimedOut',
	};

	const statusColors = {
		1000: 'blue', // Start
		1001: 'gray', // Finish
		1002: 'cyan', // OnBreak
		1003: 'green', // FinishBreak
		3003: 'orange', // OnRoute
		3004: 'indigo', // AtPickup
		3005: 'pink', // PassengerOnBoard
		3006: 'yellow', // SoonToClear
		3007: 'green', // Clear
		3008: 'red', // NoJob
		2000: 'green', // Accept
		2001: 'red', // Reject
		2002: 'yellow', // TimedOut
	};

	return (
		<div className='flex flex-col items-center justify-center w-full sm:w-[10%] h-full bg-white rounded-lg px-4 pb-4 sm:p-0 sm:pb-0'>
			<div className='flex w-full flex-col justify-center items-center pb-2'>
				{!isMobile && <h1 className='font-semibold'>Status</h1>}
				{isMobile && (
					<p className={`font-medium ${!isMobile ? 'text-sm mt-2' : ''}`}>
						{date?.split('T')[0].split('-').reverse().join('/')}{' '}
						{date?.split('T')[1]}
					</p>
				)}
			</div>
			<div className='m-auto w-full h-full overflow-auto mb-4'>
				{loading ? (
					<Loader />
				) : (
					data?.map((el) => (
						<>
							{msgModalOpen && (
								<Modal
									open={msgModalOpen}
									setOpen={handleClose}
								>
									<MsgModal
										selectedDriver={selectedDriver}
										handleClose={handleClose}
									/>
								</Modal>
							)}
							<div
								key={el?.userId}
								className='flex sm:flex-col sm:justify-start sm:items-start justify-center w-full items-center mx-auto cursor-pointer gap-4 mb-2 rounded-md p-1'
								style={{
									backgroundColor: el?.colourCode,
									color: isLightColor(el?.colourCode) ? 'black' : 'white',
								}}
								onClick={() => {
									if (!isMobile) {
										setMsgModalOpen(true);
										setSelectedDriver(el);
									}
								}}
							>
								<div className='w-full mx-auto flex sm:flex-col sm:justify-center sm:items-center gap-2 justify-center items-center sm:mt-1'>
									<p
										className={`text-sm text-center`}
										style={{
											backgroundColor: el?.colourCode,
											color: isLightColor(el?.colourCode) ? 'black' : 'white',
										}}
									>
										{el?.userId}{' '}
										{!isMobile && (
											<span
												className='p-1 rounded-md'
												style={{
													backgroundColor: statusColors[el?.status],
													color: isLightColor(statusColors[el?.status])
														? 'black'
														: 'white',
												}}
											>
												{status[el?.status]}
											</span>
										)}
									</p>
									<div className='flex flex-col w-[60%] sm:justify-start justify-center items-start'>
										{isMobile && <p>{el?.fullname}</p>}
										{isMobile && (
											<div className='flex gap-1 items-center'>
												<p className='sm:text-sm whitespace-nowrap'>
													Started @ {el?.startAt?.split('T')[1]?.slice(0, 5)}
												</p>
												<button
													onClick={() => {
														setMsgModalOpen(true);
														setSelectedDriver(el);
													}}
													className={`px-2 rounded-md flex justify-center group items-center border ${
														isLightColor(el?.colourCode)
															? 'border-black'
															: 'border-white'
													}`}
												>
													<PanToolAltOutlinedIcon
														fontSize='16'
														className=''
													/>
												</button>
											</div>
										)}
									</div>
									{isMobile && (
										<div
											className={`text-sm text-white px-3 py-1 rounded`}
											style={{ backgroundColor: statusColors[el?.status] }}
										>
											{status[el?.status]}
										</div>
									)}
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
