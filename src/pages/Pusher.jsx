/** @format */
import { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { Button, Switch, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

import Booking from './Booking';
import Map from '../components/Map';
import Modal from '../components/Modal';
import SimpleSnackbar from '../components/Snackbar-v2';
import Scheduler from './Scheduler';
import {
	addData,
	endBooking,
	onCreateBooking,
	onUpdateBooking,
	setActiveTabChange,
} from '../context/bookingSlice';

import { useDispatch } from 'react-redux';
import { addCaller } from '../context/callerSlice';
import Pusher from 'pusher-js';
import JourneyQuote from '../components/JourneyQuote';

import { openSnackbar } from '../context/snackbarSlice';
// import DriverSection from '../components/DriverSection';
import { getRefreshedBookings } from '../context/schedulerSlice';
import CustomDriverAvailabilityChart from '../components/CustomDriverAvailabilityChart';
import { loadGoogleMapsScript } from '../utils/googleMap';
import { sendLogs } from '../utils/getLogs';
import AvailbilityChartMobileView from '../components/AvailbilityChartMobileView';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DriverStatus from '../components/DriverStatus';
import Logs from '../components/Logs';

const pusher = new Pusher('8d1879146140a01d73cf', {
	cluster: 'eu',
});

// subscribing to a channel for caller id
const channel = pusher.subscribe('my-channel');

export default function Push() {
	const data = useSelector((state) => state.bookingForm.bookings);
	const [mapLoaded, setMapLoaded] = useState(false);
	const activeTab = useSelector(
		(state) => state.bookingForm.activeBookingIndex
	);
	const { showDriverAvailability } = useSelector((state) => state.scheduler);
	const dispatch = useDispatch();
	const [secondaryTab, setSecondaryTab] = useState(1);
	const [thirdTab, setThirdTab] = useState(0);
	const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
	const activeSectionMobileView = useSelector(
		(state) => state.bookingForm.activeSectionMobileView
	);

	const [availabilityDate, setAvailabilityDate] = useState('');
	const [oldAvailbility, setOldAvailbility] = useState(false);
	const isMobile = useMediaQuery('(max-width:640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

	const handleChange = (event, newValue) => {
		dispatch(setActiveTabChange(newValue));
	};

	async function handleBookingUpload(id = activeTab) {
		const currentBooking = data[id];
		try {
			let response;
			if (currentBooking.bookingType === 'Current') {
				response = await dispatch(onUpdateBooking(id));
				if (response.status === 'success') {
					dispatch(getRefreshedBookings());
					dispatch(openSnackbar('Booking Updated Successfully', 'success'));
				} else {
					dispatch(openSnackbar('Failed to Update Booking', 'error'));
				}
			} else {
				response = await dispatch(onCreateBooking(id));
				if (response.status === 'success') {
					dispatch(getRefreshedBookings());
					dispatch(openSnackbar('Booking Created Successfully', 'success'));
				} else {
					dispatch(openSnackbar('Failed to Create Booking', 'error'));
				}
			}

			return response;
		} catch (error) {
			dispatch(openSnackbar('Failed to process booking', 'error'));
			console.error('Error processing booking:', error);
		}
	}

	useEffect(() => {
		const updateAvailabilityDate = () => {
			const now = new Date();
			const formattedDate = `${now.getFullYear()}-${String(
				now.getMonth() + 1
			).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(
				now.getHours()
			).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
			setAvailabilityDate(formattedDate);
		};

		// Initial update when the component is mounted
		updateAvailabilityDate();

		// Update every minute (or adjust to your needs, e.g. every second)
		// const intervalId = setInterval(updateAvailabilityDate, 1000); // 60000ms = 1 minute

		// Cleanup interval when component is unmounted
		// return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		function handleBind(data) {
			try {
				const parsedData = JSON.parse(data.message);
				const PhoneNumber = parsedData.Telephone;
				if (
					parsedData.Current.length === 0 &&
					parsedData.Previous.length === 0
				) {
					dispatch(addData({ PhoneNumber, bookingType: 'Previous' }));
				} else {
					dispatch(addCaller(parsedData));
				}
				sendLogs(
					{
						event: 'caller id event',
						Telephone: PhoneNumber,
						data: parsedData,
					},
					'info'
				);
			} catch (error) {
				console.error('Failed to parse message data:', error);
			}
		}
		channel.bind('my-event', handleBind);
		return () => {
			channel.unbind('my-event', handleBind);
		};
	}, [dispatch]);

	useEffect(() => {
		loadGoogleMapsScript((res) => {
			setMapLoaded(Boolean(res));
		}, mapLoaded);
	}, [mapLoaded]);

	const handleKeyDown = (event) => {
		if (event.key === 'F1') {
			event.preventDefault();
			setSecondaryTab(0);
		} else if (event.key === 'F2') {
			event.preventDefault();
			setSecondaryTab(1);
		} else if (event.key === 'F3') {
			event.preventDefault();
			setSecondaryTab(2);
		}
		// else if (event.key === 'F4') {
		// 	event.preventDefault();
		// 	setSecondaryTab(3);
		// }
	};
	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	// all for the slider between componenet
	const [leftWidth, setLeftWidth] = useState(40);

	const handleResize = (event, { size }) => {
		const newWidth = (size.width / window.innerWidth) * 100;
		if (newWidth >= 30 && newWidth <= 70) {
			setLeftWidth(newWidth);
		}
	};

	return (
		<Box
			className='flex'
			sx={{ width: '100%', overflow: 'hidden' }}
		>
			<Modal
				open={isConfirmationModalOpen}
				setIsOpen={setIsConfirmationModalOpen}
			>
				<ConfirmDeleteBookingModal
					deleteBooking={() => dispatch(endBooking())}
					id={activeTab}
					setIsConfirmationModalOpen={setIsConfirmationModalOpen}
				/>
			</Modal>
			{isMobile || isTablet ? (
				<Box
					sx={{
						margin: '0 auto',
						overflow: 'auto',
						width: '100%',
						borderColor: '#e5e7eb',
						borderWidth: '1px',
					}}
				>
					{showDriverAvailability ? (
						<Box sx={{ padding: '16px' }}>
							<Box>
								<input
									required
									type='datetime-local'
									className='w-full bg-input text-foreground p-2 rounded-lg border border-border'
									value={availabilityDate}
									onChange={(e) => setAvailabilityDate(e.target.value)}
								/>
							</Box>
							<Box>
								<span className='flex justify-end gap-2 items-center'>
									<div className='p-2 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
										<PersonOutlineOutlinedIcon
											sx={{ color: '#E45454' }}
											fontSize='14px'
										/>
									</div>
									<span className='font-medium'>
										Use Old Driver Availability
									</span>
									<Switch
										checked={oldAvailbility}
										onChange={(e) => setOldAvailbility(e.target.checked)}
									/>
								</span>
							</Box>
							{oldAvailbility ? (
								<AvailbilityChartMobileView
									availabilityDate={availabilityDate}
								/>
							) : (
								<CustomDriverAvailabilityChart
									availabilityDate={availabilityDate}
								/>
							)}
						</Box>
					) : (
						<>
							{activeSectionMobileView === 'Booking' ? (
								<>
									<Tabs
										value={activeTab}
										sx={{
											'backgroundColor': '#e5e7eb',
											'height': '50px',
											'& .MuiTabs-flexContainer': {
												height: '100%',
											},
											'& .MuiTab-root': {
												minHeight: '50px',
											},
										}}
										onChange={handleChange}
										variant='scrollable'
										scrollButtons
										allowScrollButtonsMobile
										aria-label='scrollable force tabs example'
									>
										{data.map((item, index) => {
											let label =
												index === 0 ? 'New Booking' : item.phoneNumber;
											label +=
												item.bookingType === 'Previous'
													? ' (New)'
													: item.bookingType === 'Current'
													? ' (Edit)'
													: '';
											return (
												<Tab
													label={label}
													icon={
														index !== 0 ? (
															<CancelIcon
																color='error'
																onClick={() => setIsConfirmationModalOpen(true)}
															/>
														) : null
													}
													iconPosition='end'
													key={index}
													style={{
														color: item.formBusy ? '#B91C1C' : '',
													}}
												/>
											);
										})}
									</Tabs>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-evenly',
											margin: 'auto',
											alignContent: 'center',
										}}
									>
										<Booking
											bookingData={data[activeTab]}
											key={activeTab}
											id={activeTab}
											onBookingUpload={handleBookingUpload}
										/>
										<SimpleSnackbar />
									</Box>
								</>
							) : activeSectionMobileView === 'DriverStatus' ? (
								<Box className='mt-4 flex flex-col justify-center items-center gap-2'>
									<div className='font-medium text-sm flex gap-1 justify-center items-center'>
										<div className='w-6 h-6 text-center rounded-full bg-red-200'>
											<PersonOutlineOutlinedIcon
												fontSize='18px'
												className=' text-red-600'
											/>
										</div>
										<span>Driver Status</span>
									</div>
									<DriverStatus />
								</Box>
							) : (
								<Scheduler />
							)}
						</>
					)}
				</Box>
			) : (
				<>
					<ResizableBox
						width={(leftWidth / 100) * window.innerWidth}
						height={window.innerHeight * 1}
						minConstraints={[window.innerWidth * 0.3, window.innerHeight * 0.9]}
						maxConstraints={[window.innerWidth * 0.7, window.innerHeight * 0.9]}
						axis='x'
						resizeHandles={['e']}
						onResize={handleResize}
						style={{ display: 'flex', overflow: 'hidden' }}
					>
						<>
							{/*  box containg the form*/}
							<Box
								sx={{
									margin: '0 auto',
									overflow: 'auto',
									width: '100%',
									borderColor: '#e5e7eb',
									borderWidth: '1px',
								}}
							>
								<Tabs
									value={activeTab}
									sx={{
										'backgroundColor': '#e5e7eb',
										'height': '50px',
										'& .MuiTabs-flexContainer': {
											height: '100%',
										},
										'& .MuiTab-root': {
											minHeight: '50px',
										},
									}}
									onChange={handleChange}
									variant='scrollable'
									scrollButtons
									allowScrollButtonsMobile
									aria-label='scrollable force tabs example'
								>
									{data.map((item, index) => {
										let label = index === 0 ? 'New Booking' : item.phoneNumber;
										label +=
											item.bookingType === 'Previous'
												? ' (New)'
												: item.bookingType === 'Current'
												? ' (Edit)'
												: '';
										return (
											<Tab
												label={label}
												icon={
													index !== 0 ? (
														<CancelIcon
															color='error'
															onClick={() => setIsConfirmationModalOpen(true)}
														/>
													) : null
												}
												iconPosition='end'
												key={index}
												style={{
													color: item.formBusy ? '#B91C1C' : '',
												}}
											/>
										);
									})}
								</Tabs>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-evenly',
										margin: 'auto',
										alignContent: 'center',
									}}
								>
									<Booking
										bookingData={data[activeTab]}
										key={activeTab}
										id={activeTab}
										onBookingUpload={handleBookingUpload}
									/>
									<SimpleSnackbar />
								</Box>
							</Box>
							{showDriverAvailability && (
								<Box
									sx={{
										margin: '0 auto',
										overflow: 'hidden',
										width: '50%',
										borderColor: '#e5e7eb',
										borderWidth: '1px',
									}}
								>
									<Tabs
										value={thirdTab}
										sx={{
											'backgroundColor': '#e5e7eb',
											'height': '50px',
											'& .MuiTabs-flexContainer': {
												height: '100%',
											},
											'& .MuiTab-root': {
												minHeight: '50px',
											},
										}}
										onChange={(e, value) => setThirdTab(value)}
										variant='scrollable'
										scrollButtons
										allowScrollButtonsMobile
										aria-label='scrollable force tabs example'
									>
										<Tab label='Availability' />
										<Tab label='Status' />
									</Tabs>
									{thirdTab === 0 ? (
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-evenly',
												margin: 'auto',
												alignContent: 'center',
											}}
										>
											<CustomDriverAvailabilityChart />
										</Box>
									) : (
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-evenly',
												margin: 'auto',
												alignContent: 'center',
											}}
										>
											<DriverStatus />
										</Box>
									)}
								</Box>
							)}
						</>
					</ResizableBox>
					<Box
						sx={{
							margin: '0vh auto',
							// height: '90vh',
							overflow: 'hidden',
							width: `${100 - leftWidth}%`,
							borderColor: '#e5e7eb',
							borderWidth: '1px',
						}}
					>
						{/* driver availibility tab */}
						<Tabs
							value={secondaryTab}
							sx={{
								backgroundColor: '#e5e7eb',
								position: 'sticky',
								top: 0,
								zIndex: 10,
							}}
							onChange={(event, newValue) => setSecondaryTab(newValue)}
							variant='scrollable'
							scrollButtons
							allowScrollButtonsMobile
							aria-label='scrollable force tabs example'
						>
							{/* <Tab label='Availability' /> */}
							<Tab label='Map' />
							<Tab label='Scheduler' />
							<Tab label='Logs' />
							{/* <Tab label='Msg' /> */}
						</Tabs>
						{/*secondaryTab === 0 && (
					<CustomDriverAvailibilityChart />
					// <div className='rotate-[90deg] mt-48'>
					// 	<AvailabilityChart />
					// </div>
				)*/}
						{secondaryTab === 0 && (
							<>
								<Map />
								<JourneyQuote quoteOptions={data[activeTab].quoteOptions} />
							</>
						)}
						{secondaryTab === 1 ? <Scheduler /> : null}
						{secondaryTab === 2 && <Logs />}
						{/* {secondaryTab === 3 && <DriverSection />} */}
					</Box>
				</>
			)}

			{/* box containing the map and driver avialability */}
		</Box>
	);
}

function ConfirmDeleteBookingModal({
	setIsConfirmationModalOpen,
	id,
	deleteBooking,
}) {
	const handleClick = () => {
		setIsConfirmationModalOpen(false);
		deleteBooking();
	};
	return (
		<div className='flex flex-col items-center justify-center w-[70vw] sm:w-[20vw] bg-white rounded-lg p-4 gap-4'>
			<div className='flex justify-between items-center  bg-cyan-600 text-white w-full rounded-lg p-2'>
				<h2 className='text-xl font-semibold bg-cyan-600 text-white w-full'>
					Discard Booking
				</h2>
				<CloseIcon onClick={() => setIsConfirmationModalOpen(false)} />
			</div>
			<h2>Are you sure you want to remove this booking?</h2>
			<div className='flex justify-center items-center gap-2'>
				<Button
					variant='contained'
					sx={{ backgroundColor: '#0891b2' }}
					onClick={() => handleClick(id)}
				>
					Yes
				</Button>
				<Button
					color='inherit'
					variant='contained'
					onClick={() => setIsConfirmationModalOpen(false)}
				>
					No
				</Button>
			</div>
		</div>
	);
}
