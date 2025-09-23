/** @format */

import {
	ScheduleComponent,
	Day,
	Agenda,
	Inject,
	DragAndDrop,
} from '@syncfusion/ej2-react-schedule';
import { registerLicense } from '@syncfusion/ej2-base';
import Modal from '../components/Modal';
import CustomDialog from '../components/CustomDialog';
import { recordTurnDown, textMessageDirectly } from '../utils/apiReq';
import LongButton from '../components/BookingForm/LongButton';
import SearchIcon from '@mui/icons-material/Search';
// import NoCrashOutlinedIcon from '@mui/icons-material/NoCrashOutlined';

registerLicense(import.meta.env.VITE_SYNCFUSION_KEY);
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import './scheduler.css';
import ProtectedRoute from '../utils/Protected';
import { useEffect, useRef, useState } from 'react';
import Snackbar from '../components/Snackbar-v2';
import { useDispatch, useSelector } from 'react-redux';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CallIcon from '@mui/icons-material/Call';
import Badge from '@mui/material/Badge';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import Button from '@mui/material/Button';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import LocalTaxiOutlinedIcon from '@mui/icons-material/LocalTaxiOutlined';
import CurrencyPoundOutlinedIcon from '@mui/icons-material/CurrencyPoundOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import isLightColor from '../utils/isLight';
import { TextField, Box, Switch, useMediaQuery } from '@mui/material';
import {
	allocateActiveBookingStatus,
	changeActiveDate,
	changeShowDriverAvailability,
	completeActiveBookingStatus,
	getRefreshedBookings,
	mergeTwoBookings,
	setActionLogsOpen,
	setActiveBookingIndex,
	setActiveSearchResult,
	setDateControl,
	setMergeMode,
	setSearchKeywords,
} from '../context/schedulerSlice';
import {
	createBookingFromScheduler,
	setActiveSectionMobileView,
	// setIsGoogleApiOn,
} from '../context/bookingSlice';
import Loader from '../components/Loader';
import { getAllDrivers } from '../utils/apiReq';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { openSnackbar } from '../context/snackbarSlice';
import {
	// changeActiveDate,
	handleSearchBooking,
	makeSearchInactive,
	// setDateControl,
	// makeSearchInactive,
} from '../context/schedulerSlice';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
// import GoogleIcon from '@mui/icons-material/Google';
import ConfirmSoftAllocateModal from '../components/CustomDialogButtons/ConfimSoftAllocateModal';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
const AceScheduler = () => {
	const BASE_URL = import.meta.env.VITE_BASE_URL;
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
	const [recordTurnModal, setRecordTurnModal] = useState(false);
	const [openSearch, setOpenSearch] = useState(false);
	const callerId = useSelector((state) => state.caller);
	// const isGoogleApiOn = useSelector((state) => state.bookingForm.isGoogleApiOn);

	// taking our global states from the redux
	const {
		bookings,
		activeComplete,
		activeAllocate,
		activeDate,
		activeSearch,
		activeSearchResults,
		showDriverAvailability,
		mergeMode,
		// activeSoftAllocate,
		loading: searchLoading,
	} = useSelector((state) => state.scheduler);
	// const activeTestMode = useSelector(
	// 	(state) => state.bookingForm.isActiveTestMode
	// );

	// setting some states for the complenent level state management
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedBookingData, setSelectedBookingData] = useState();
	const [viewBookingModal, setViewBookingModal] = useState(false);
	const [textMessageModal, setTextMessageModal] = useState(false);
	const [confirmSoftModal, setConfirmSoftModal] = useState(false);
	const [driverData, setDriverData] = useState([]);
	const [draggedBooking, setDraggedBooking] = useState(null);
	const dispatch = useDispatch();
	const user = useAuth();
	const scheduleRef = useRef(null);
	// data that syncfusion requires for inside computation of the internal mapping
	const fieldsData = {
		id: 'bookingId',
		subject: { name: 'cellText' },
		isAllDay: { name: 'isAllDay' },
		startTime: { name: 'pickupDateTime' },
		endTime: { name: 'endTime' },
		OwnerColor: { name: 'backgroundColorRGB' },
		// recurrenceRule: { name: 'recurrenceRule' },
		Readonly: { name: 'Readonly' },
	};

	// syncfusion handler function for each render of syncfusion element on the screen
	function onEventRendered(args) {
		if (!args || !args.element || !args.element.classList) {
			console.warn('Event element is null:', args);
			return; // Skip further execution if element is null
		}
		args.element;
		let driverColor = '#795548'; // Default color if both suggestedUserId and userId are null

		if (args?.data?.suggestedUserId && !args?.data?.userId) {
			// If there's a suggestedUserId, use the suggested driver's color
			const suggestedDriver = driverData.find(
				(driver) => driver.id === args.data.suggestedUserId
			);
			if (suggestedDriver) {
				driverColor = suggestedDriver.colorRGB;
			}
		} else if (args?.data?.userId) {
			// If suggestedUserId is null but userId exists, use the user's color
			driverColor = args.data.backgroundColorRGB;
		}

		// Apply gradient based on activeSoftAllocate status
		if (args?.data?.suggestedUserId && !args?.data?.userId) {
			// Use a dot-pattern gradient for soft allocation
			args.element.style.backgroundImage = `
    radial-gradient(${driverColor} 40%, transparent 40%),
    radial-gradient(${driverColor} 40%, transparent 40%)`;

			// Adjust the background size to reflect larger dots and manage spacing
			args.element.style.backgroundSize = '20px 20px'; // Increase size to make dots larger
			args.element.style.backgroundPosition = '0 0, 10px 10px';
			args.element.style.backgroundColor = '#795548';

			const subjectElement = args?.element?.querySelector('.e-subject');
			if (subjectElement) {
				subjectElement.style.display = 'inline-block'; // Ensure it only takes the width of the text
				subjectElement.style.padding = '0 4px'; // Add a little padding if needed
				subjectElement.style.backgroundColor = driverColor; // Optional background for clarity
				subjectElement.style.borderRadius = '4px'; // Round the edges for a badge-like appearance
				subjectElement.style.maxWidth = 'fit-content'; // Ensure it wraps to the text width
				// subjectElement.style.overflow = 'hidden'; // Hide overflow if text exceeds width
				subjectElement.style.whiteSpace = 'wrap'; // Prevent wrapping to new lines
			}
			const timeElement = args?.element?.querySelector('.e-time');
			if (timeElement) {
				timeElement.style.display = 'block';
				timeElement.style.backgroundColor = driverColor;
				timeElement.style.padding = '0 4px'; // Add a little padding if needed
				timeElement.style.borderRadius = '4px';
				timeElement.style.maxWidth = 'fit-content'; // Ensure it wraps to the text width
				// subjectElement.style.overflow = 'hidden'; // Hide overflow if text exceeds width
				timeElement.style.whiteSpace = 'wrap';
			}

			// const subjectElement = args.element.querySelector('.e-subject');

			// // Create the badge element

			// // Append the badge next to the subject text
		} else if (args.data.userId && args.data.status === 1) {
			// Use a -40-degree gradient for normal allocation
			args.element.style.background = `repeating-linear-gradient(-40deg, ${driverColor}, ${driverColor} 10px, rgb(187, 187, 187) 20px)`;
			args.element.style.backgroundColor = driverColor;
		} else {
			// No gradient, just set the color
			args.element.style.backgroundColor = driverColor;
		}

		// Apply the driver color as the background color for fallback cases
		args.element.style.borderRadius = '10px';

		const createBadge = (text, bgColor) => {
			const badge = document.createElement('span');
			badge.textContent = text;
			badge.style.backgroundColor = bgColor;

			badge.style.color = isLightColor(bgColor) ? 'black' : 'white';
			// badge.style.padding = '0px 5px';
			badge.style.padding = '2px 5px';
			badge.style.marginLeft = '5px';
			badge.style.border = `1px solid ${
				isLightColor(bgColor) ? 'black' : 'white'
			}`;
			// badge.style.borderRadius = '50%';
			badge.style.borderRadius = '12px';

			badge.style.fontSize = '12px';
			badge.style.fontWeight = 'bold';
			badge.style.display = 'inline';
			badge.style.whiteSpace = 'wrap';

			return badge;
		};
		const subjectElement = args?.element?.querySelector('.e-subject');
		const parentNode = subjectElement.parentNode;

		if (args?.data?.scope === 4) {
			const badgeColor =
				args.data.paymentStatus === 0
					? 'red'
					: args?.data?.paymentStatus === 2
					? 'green'
					: args.data.paymentStatus === 3
					? 'orange'
					: '';
			const cardBadge = createBadge('Card', badgeColor);
			parentNode.insertBefore(cardBadge, subjectElement);
			// - ${
			// 	args?.data?.paymentStatus === 0
			// 		? 'Unpaid'
			// 		: args?.data?.paymentStatus === 2
			// 		? 'Paid'
			// 		: args?.data?.paymentStatus === 3
			// 		? 'Unpaid'
			// 		: ''
			// }
			// `;

			// subjectElement.appendChild(badge);
		}
		if (args?.data?.isASAP) {
			// const asapBadge = createBadge('ASAP', '#228B22');
			// parentNode.insertBefore(asapBadge, subjectElement);
			args.element.style.border = '3px dashed #228B22';
		}
		if (isLightColor(driverColor)) {
			if (args?.element?.querySelector('.e-subject'))
				args.element.querySelector('.e-subject').style.color = 'black';
			if (args?.element?.querySelector('.e-time'))
				args.element.querySelector('.e-time').style.color = 'black';
			if (args?.element?.querySelector('.e-date-time'))
				args.element.querySelector('.e-date-time').style.color = 'black';
			if (args?.element?.querySelector('.e-icons'))
				args.element.querySelector('.e-icons').style.color = 'black';
		} else {
			if (args?.element?.querySelector('.e-subject'))
				args.element.querySelector('.e-subject').style.color = 'white';
			if (args?.element?.querySelector('.e-time'))
				args.element.querySelector('.e-time').style.color = 'white';
			if (args?.element?.querySelector('.e-date-time'))
				args.element.querySelector('.e-date-time').style.color = 'white';
			if (args?.element?.querySelector('.e-icons'))
				args.element.querySelector('.e-icons').style.color = 'white';
		}

		if (mergeMode) {
			args.element.style.cursor = 'move';

			// Highlight if this is the dragged booking
			if (draggedBooking && args.data.bookingId === draggedBooking.bookingId) {
				args.element.style.opacity = '0.5';
			} else {
				args.element.style.opacity = '1';
			}
		} else {
			args.element.style.cursor = 'default';
			args.element.style.opacity = '1';
		}
	}

	const handleCancelSearch = () => {
		setOpenSearch(false);
		dispatch(makeSearchInactive());
	};

	const handleRecordTurnDown = () => {
		setRecordTurnModal(true);
	};

	const handleTextMessage = () => {
		setTextMessageModal(true);
	};

	// refresh the booking when activeTestMode, currentDate, dispatch, activeComplete changes
	useEffect(() => {
		async function helper() {
			dispatch(getRefreshedBookings());
			getAllDrivers().then((res) => {
				const driverUsers = [
					{ id: 0, fullName: 'Unallocated', colorRGB: '#795548' },
					...res.users,
				];
				setDriverData(driverUsers);
			});
		}
		helper();
	}, [activeDate, dispatch, activeComplete, activeAllocate]);
	// }, [activeTestMode, activeDate, dispatch, activeComplete]);
	// refresh the booking every 10000 (10 sec)
	useEffect(() => {
		async function helper() {
			dispatch(getRefreshedBookings());
		}
		const refreshInterval = setInterval(helper, 10000);
		return () => clearInterval(refreshInterval);
	}, [dispatch]);

	const eventSettings = {
		dataSource: activeSearch ? activeSearchResults || [] : bookings || [],
		fields: fieldsData,
		allowAdding: false,
		allowEditing: false,
		allowDeleting: false,
		recurrenceMode: 'Occurrence',
	};

	// handler funciton for each booking click
	const onEventClick = async (args) => {
		if (activeSearch) {
			// dispatch(setActiveSearchResult(args.event.bookingId, activeTestMode));
			dispatch(setActiveSearchResult(args.event.bookingId));
		} else {
			setSelectedBookingData(args.event);
			dispatch(setActiveBookingIndex(args.event.bookingId));
		}
		setDialogOpen(true);
	};

	const createBookingOnTimeStamp = function (args) {
		dispatch(createBookingFromScheduler(args.startTime));
	};

	// Create a ref for ScheduleComponent
	const onCreate = () => {
		const scheduleObj = scheduleRef.current;
		if (scheduleObj) {
			// Get current time and go 1 hour back
			const currentTime = new Date();
			currentTime.setHours(currentTime.getHours() - 2);

			// Get the local time string
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();

			// Format the time to HH:mm (adding leading zero if needed)
			const formattedTime = `${hours}:${
				minutes < 10 ? '0' + minutes : minutes
			}`;

			// console.log(formattedTime); // This should log the correct time in local format

			// Scroll to the formatted time
			scheduleObj.scrollTo(formattedTime);
		}
	};

	// Effect to trigger scroll on initial load (or whenever necessary)
	useEffect(() => {
		onCreate(); // Call onCreate to scroll when the component mounts
	}, []);

	useEffect(() => {
		dispatch(setActionLogsOpen(false));
	}, [dispatch]);

	function toLocalISODateOnly(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2-digit format
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}
	// console.log('active Date in Scheduler----', activeDate);
	return (
		<ProtectedRoute>
			<Snackbar />
			{searchLoading && <Loader />}

			<ScheduleComponent
				ref={scheduleRef}
				firstDayOfWeek={1}
				height={
					isMobile || isTablet
						? window.innerHeight - 60
						: window.innerHeight - 55
				}
				currentView={activeSearch ? 'Agenda' : 'Day'}
				selectedDate={activeDate}
				navigating={(args) => {
					const isoDateOnly = toLocalISODateOnly(new Date(args.currentDate));
					dispatch(setDateControl(isoDateOnly));
					dispatch(changeActiveDate(isoDateOnly));
				}}
				eventSettings={eventSettings}
				eventRendered={onEventRendered}
				eventClick={onEventClick}
				cellClick={createBookingOnTimeStamp}
				editorTemplate={null}
				popupOpen={(args) => (args.cancel = true)}
				className='schedule-cell-dimension'
				views={[
					{ option: 'Day' },
					{
						option: 'Agenda',
						allowVirtualScrolling: activeSearch ? true : false,
						interval: 1,
					},
				]}
				allowDragAndDrop={mergeMode}
				dragStart={(args) => {
					if (mergeMode && args.event) {
						console.log('Drag Start:', args.data.bookingId);
						setDraggedBooking(args.data.bookingId);
					}
				}}
				dragStop={async (args) => {
					if (mergeMode && draggedBooking) {
						try {
							const scheduler = scheduleRef.current;
							const mouseEvent = args.event?.event;

							// 1. SAFE COORDINATE CHECK
							if (!mouseEvent || !Number.isFinite(mouseEvent.clientX)) {
								console.error('Invalid mouse event');
								return;
							}

							// 2. TRY SCHEDULER API FIRST (Most reliable)
							let targetBooking;
							if (scheduler?.getEventDetails) {
								const eventData = scheduler.getEventDetails(mouseEvent.target);
								targetBooking = eventData?.bookingId || eventData?.Id;
							}

							// 3. DOM FALLBACK (With proper element checking)
							if (!targetBooking) {
								const elements = document.elementsFromPoint(
									mouseEvent.clientX,
									mouseEvent.clientY
								);

								const targetElement = elements.find((el) =>
									el?.classList?.contains('e-appointment')
								);

								// SAFE ATTRIBUTE ACCESS
								const targetBookingElement = targetElement?.hasAttribute?.(
									'data-id'
								)
									? targetElement.getAttribute('data-id')
									: targetElement?.dataset?.bookingId;
								targetBooking = targetBookingElement?.split('_')[1];
							}

							// 4. EXECUTE MERGE
							if (targetBooking && targetBooking !== draggedBooking) {
								const response = await dispatch(
									mergeTwoBookings(targetBooking, draggedBooking)
								);
								if (response.status === 'fail') {
									dispatch(openSnackbar(response.data, 'error'));
								} else {
									dispatch(
										openSnackbar('Booking Merge Successfully!', 'success')
									);
								}
							}
						} catch (error) {
							console.error('Drag stop error:', error);
						} finally {
							setDraggedBooking(null);
							if (args) args.cancel = true;
						}
					}
				}}

				// agendaDaysCount={365}
			>
				{dialogOpen && !viewBookingModal && (
					<Modal
						open={dialogOpen}
						setOpen={setDialogOpen}
					>
						<CustomDialog closeDialog={() => setDialogOpen(false)} />
					</Modal>
				)}
				{viewBookingModal && (
					<Modal
						open={viewBookingModal}
						setOpen={setViewBookingModal}
					>
						<ViewBookingModal
							data={selectedBookingData}
							setViewBookingModal={setViewBookingModal}
						/>
					</Modal>
				)}
				<Inject services={[Day, Agenda, DragAndDrop]} />
			</ScheduleComponent>

			<div className='flex justify-end w-[10%] fixed top-[65px] right-[118px] sm:top-[55px] sm:right-[550px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && !activeSearch && (
					<button
						className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal rounded-lg bg-blue-700 text-white hover:bg-opacity-80 px-2 py-1 sm:px-3 sm:py-2'
						onClick={() => setConfirmSoftModal(true)}
					>
						{isMobile ? 'Conf. SA' : 'Conf. SA'}
					</button>
				)}
			</div>

			<div className='flex justify-end w-[10%] fixed top-[80px] right-[0px] sm:top-[90px] sm:right-[0px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && !activeSearch && (
					<span className='flex flex-row gap-2 items-center align-middle'>
						<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
							Merge Mode
						</span>
						<Switch
							checked={mergeMode}
							onChange={() => {
								dispatch(setMergeMode(!mergeMode));
							}}
							className='text-sm'
							size={isMobile ? 'small' : 'large'}
						/>
					</span>
				)}
			</div>

			<div className='flex justify-end w-[10%] fixed top-[45px] right-[0px] sm:top-[55px] sm:right-[350px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && !activeSearch && (
					<span className='flex flex-row gap-0 sm:gap-2 items-center align-middle'>
						<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
							{isMobile ? 'Allocated' : 'Show Allocated'}
						</span>
						<Switch
							checked={activeAllocate}
							onChange={() => {
								dispatch(allocateActiveBookingStatus(!activeAllocate));
							}}
							className='text-sm'
							size={isMobile ? 'small' : 'large'}
						/>
					</span>
				)}
			</div>
			{/* Changed by Tanya - (9 Aug) */}
			<div className='flex justify-end w-[10%] fixed top-[65px] right-[0px] sm:top-[55px] sm:right-[160px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && !activeSearch && (
					<span className='flex flex-row gap-0 sm:gap-2 items-center align-middle'>
						<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
							{isMobile ? 'Completed' : 'Show Completed'}
						</span>
						<Switch
							checked={activeComplete}
							onChange={() => {
								dispatch(completeActiveBookingStatus(!activeComplete));
							}}
							className='text-sm'
							size={isMobile ? 'small' : 'large'}
						/>
					</span>
				)}
			</div>

			<div className='flex justify-end w-[10%] fixed top-[60px] right-[235px] sm:top-[15px] sm:right-[395px] z-[40]'>
				{callerId.length > 0 && (
					<Badge
						badgeContent={callerId.length}
						color='error'
						className='cursor-pointer select-none animate-bounce'
					>
						<CallIcon />
					</Badge>
				)}
			</div>

			<div className='flex justify-end fixed top-[45px] right-[110px] sm:top-[5px] sm:right-[150px] z-[40]'>
				{!isMobile && (
					<span className='flex flex-row gap-0 sm:gap-0 items-center align-middle'>
						<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
							Availability
						</span>
						<Switch
							checked={showDriverAvailability}
							onChange={() => {
								dispatch(changeShowDriverAvailability(!showDriverAvailability));
							}}
							className='text-sm'
							size={isMobile ? 'small' : 'large'}
						/>
					</span>
				)}
			</div>
			{/* <div className='flex justify-end fixed top-[65px] right-[110px] sm:top-[5px] sm:right-[150px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && (
					<span className='flex flex-row gap-0 sm:gap-0 items-center align-middle'>
						<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
							<GoogleIcon
								fontSize='small'
								className='text-sm'
							/>{' '}
							Api
						</span>
						<Switch
							checked={isGoogleApiOn}
							onChange={(e) => {
								dispatch(setIsGoogleApiOn(e.target.checked));
							}}
							className='text-sm'
							size={isMobile ? 'small' : 'large'}
						/>
					</span>
				)}
			</div> */}
			<div className='flex justify-end fixed top-[15px] right-[160px] sm:top-[10px] sm:right-[130px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && (
					<div className='flex justify-center items-center uppercase'>
						{!activeSearch && (
							<button
								onClick={() => setOpenSearch(true)}
								// className='text-sm'
							>
								{isMobile ? <SearchIcon fontSize='small' /> : <SearchIcon />}
							</button>
						)}
						{activeSearch && (
							<button
								onClick={handleCancelSearch}
								// className='text-sm'
							>
								{isMobile ? (
									<SearchOffOutlinedIcon fontSize='small' />
								) : (
									<SearchOffOutlinedIcon />
								)}
							</button>
						)}
					</div>
				)}
			</div>

			<div className='flex justify-end fixed top-[10px] right-[120px] sm:top-[5px] sm:right-[70px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && (
					<button
						className={`${
							BASE_URL.includes('api.acetaxisdorset')
								? 'bg-[#424242] text-[#C74949] border border-[#C74949]'
								: 'bg-[#C74949] text-white border border-white'
						} px-2 sm:px-4 py-2 rounded-lg uppercase text-xs sm:text-sm`}
						onClick={handleRecordTurnDown}
					>
						No
					</button>
				)}
			</div>

			<div className='flex justify-end fixed top-[10px] right-[80px] sm:top-[5px] sm:right-[10px] z-[40]'>
				{user?.currentUser?.roleId !== 3 && (
					<button
						className={`${
							BASE_URL.includes('api.acetaxisdorset')
								? 'bg-[#424242] text-[#C74949] border border-[#C74949]'
								: 'bg-[#C74949] text-white border border-white'
						} px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-xs`}
						onClick={handleTextMessage}
					>
						<EmailOutlinedIcon
							fontSize='small'
							className='text-xs sm:text-sm'
						/>
					</button>
				)}
			</div>

			{openSearch && (
				<Modal
					open={openSearch}
					setOpen={setOpenSearch}
				>
					<SearchModal
						// handleClick={handleClick}
						openSearch={openSearch}
						// inputRef={inputRef}
						// setSearchData={setSearchData}
						// handleKeyPress={handleKeyPress}
						setOpenSearch={setOpenSearch}
					/>
				</Modal>
			)}
			{recordTurnModal && (
				<Modal
					setOpen={setRecordTurnModal}
					open={recordTurnModal}
				>
					<RecordTurn setRecordTurnModal={setRecordTurnModal} />
				</Modal>
			)}
			{textMessageModal && (
				<Modal
					setOpen={setTextMessageModal}
					open={textMessageModal}
				>
					<TextMessage setTextMessageModal={setTextMessageModal} />
				</Modal>
			)}
			{confirmSoftModal && (
				<Modal
					open={confirmSoftModal}
					setOpen={setConfirmSoftModal}
				>
					<ConfirmSoftAllocateModal setConfirmSoftModal={setConfirmSoftModal} />
				</Modal>
			)}
		</ProtectedRoute>
	);
};
export default AceScheduler;

function RecordTurn({ setRecordTurnModal }) {
	// const dispatch = useDispatch();
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitSuccessful, errors }, // Access form errors
	} = useForm({
		defaultValues: {
			amount: '',
		},
	});

	const handleSubmitForm = async (data) => {
		const newinputData = {
			amount: Number(data.amount) || 0,
		};

		// Dispatch search action only if some data is entered
		if (data.amount) {
			// if (isMobile || isTablet) {
			// 	setActiveSectionMobileView('Scheduler');
			// }
			const response = await recordTurnDown(newinputData);
			console.log('recordTurnDown Response---', response);
			setRecordTurnModal(false);
			openSnackbar('Record Send Successfully', 'success');
			// Close the modal after search
		} else {
			console.log('Please enter search criteria');
		}
	};

	useEffect(() => {
		if (isSubmitSuccessful) {
			reset({
				amount: '',
			});
		}
	}, [reset, isSubmitSuccessful]);

	return (
		<div className='bg-white fixed right-[-167px] top-[-230px] p-6 rounded-lg shadow-lg w-[90vw] md:w-[45vw] sm:w-[25vw] max-w-md mx-auto'>
			<h2 className='text-2xl font-semibold mb-4 flex gap-1 items-center'>
				<PermPhoneMsgIcon />
				Record Turn Down
			</h2>
			<form onSubmit={handleSubmit(handleSubmitForm)}>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Amount'
						fullWidth
						error={!!errors.amount} // Show error if validation fails
						helperText={errors.amount ? 'Amount is required' : ''}
						{...register('amount')}
					/>
				</Box>

				<div className='mt-4 flex gap-1'>
					<LongButton
						type='submit'
						color='bg-green-700'
					>
						Submit
					</LongButton>
					<LongButton
						color='bg-red-700'
						onClick={() => setRecordTurnModal(false)} // Close modal on Cancel
					>
						Cancel
					</LongButton>
				</div>
			</form>
		</div>
	);
}

function SearchModal({ setOpenSearch }) {
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
	const dispatch = useDispatch();
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitSuccessful, errors }, // Access form errors
	} = useForm({
		defaultValues: {
			pickupAddress: '',
			pickupPostcode: '',
			destinationAddress: '',
			destinationPostcode: '',
			passenger: '',
			phoneNumber: '',
			details: '',
		},
	});

	const handleSubmitForm = async (data) => {
		console.log('form Data', data);
		const newinputData = {
			pickupAddress: data?.pickupAddress || '',
			pickupPostcode: data?.pickupPostcode || '',
			destinationAddress: data?.destinationAddress || '',
			destinationPostcode: data?.destinationPostcode || '',
			passenger: data?.passenger || '',
			phoneNumber: data?.phoneNumber || '',
			details: data?.details || '',
		};

		// Dispatch search action only if some data is entered
		if (
			newinputData.pickupAddress ||
			newinputData.pickupPostcode ||
			newinputData.destinationAddress ||
			newinputData.destinationPostcode ||
			newinputData.passenger ||
			newinputData.phoneNumber ||
			newinputData.details
		) {
			dispatch(setSearchKeywords(newinputData));
			dispatch(handleSearchBooking(newinputData));
			if (isMobile || isTablet) {
				setActiveSectionMobileView('Scheduler');
			}
			setOpenSearch(false);
			// Close the modal after search
		} else {
			console.log('Please enter search criteria');
		}
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'End') {
				handleSubmit(handleSubmitForm)(); // This ensures form validation
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleSubmit]);

	useEffect(() => {
		if (isSubmitSuccessful) {
			reset({
				pickupAddress: '',
				pickupPostcode: '',
				destinationAddress: '',
				destinationPostcode: '',
				passenger: '',
				phoneNumber: '',
				details: '',
			});
		}
	}, [reset, isSubmitSuccessful]);

	return (
		<div className='bg-white fixed right-[-167px] top-[-290px] p-6 rounded-lg shadow-lg w-[90vw] md:w-[45vw] sm:w-[25vw] max-w-md mx-auto'>
			<h2 className='text-2xl font-semibold mb-4 flex gap-1 items-center'>
				<SearchIcon />
				Search Bookings
			</h2>
			<form onSubmit={handleSubmit(handleSubmitForm)}>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Pickup Address'
						fullWidth
						error={!!errors.pickupAddress}
						helperText={
							errors.pickupAddress ? 'Must be at least 3 characters' : ''
						}
						{...register('pickupAddress', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 characters',
							},
						})}
					/>
					<TextField
						label='Pickup Postcode'
						fullWidth
						error={!!errors.pickupPostcode}
						helperText={
							errors.pickupPostcode ? 'Must be at least 3 Numbers' : ''
						}
						{...register('pickupPostcode', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 Numbers',
							},
						})}
					/>
				</Box>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Destination Address'
						fullWidth
						error={!!errors.destinationAddress}
						helperText={
							errors.destinationAddress ? 'Must be at least 3 characters' : ''
						}
						{...register('destinationAddress', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 characters',
							},
						})}
					/>
					<TextField
						label='Destination Postcode'
						fullWidth
						error={!!errors.destinationPostcode}
						helperText={
							errors.destinationPostcode ? 'Must be at least 3 Numbers' : ''
						}
						{...register('destinationPostcode', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 Numbers',
							},
						})}
					/>
				</Box>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Passenger'
						fullWidth
						error={!!errors.passenger}
						helperText={errors.passenger ? 'Must be at least 3 characters' : ''}
						{...register('passenger', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 characters',
							},
						})}
					/>
					<TextField
						label='Phone Number'
						fullWidth
						error={!!errors.phoneNumber}
						helperText={errors.phoneNumber ? 'Must be at least 3 Numbers' : ''}
						{...register('phoneNumber', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 Numbers',
							},
						})}
					/>
				</Box>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Details'
						fullWidth
						error={!!errors.details}
						helperText={errors.details ? 'Must be at least 3 characters' : ''}
						{...register('details', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 characters',
							},
						})}
					/>
				</Box>

				<div className='mt-4 flex gap-1'>
					<LongButton
						type='submit'
						color='bg-green-700'
					>
						Search
					</LongButton>
					<LongButton
						color='bg-red-700'
						onClick={() => setOpenSearch(false)} // Close modal on Cancel
					>
						Cancel
					</LongButton>
				</div>
			</form>
		</div>
	);
}

function TextMessage({ setTextMessageModal }) {
	const isMobile = useMediaQuery('(max-width: 640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
	const dispatch = useDispatch();
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitSuccessful, errors }, // Access form errors
	} = useForm({
		defaultValues: {
			message: '',
			telephone: '',
		},
	});

	const handleSubmitForm = async (data) => {
		console.log('form Data', data);

		// Dispatch search action only if some data is entered
		if (data?.message || data.telephone) {
			const response = await textMessageDirectly(data);
			if (response.status === 'success') {
				dispatch(openSnackbar('Message Send Successfully', 'success'));
				if (isMobile || isTablet) {
					setActiveSectionMobileView('Scheduler');
				}
				setTextMessageModal(false);
			}
			// Close the modal after search
		} else {
			console.log('Please fill form');
		}
	};

	useEffect(() => {
		if (isSubmitSuccessful) {
			reset({
				message: '',
				telephone: '',
			});
		}
	}, [reset, isSubmitSuccessful]);

	return (
		<div className='bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[45vw] sm:w-[25vw] max-w-md mx-auto'>
			<h2 className='text-2xl font-semibold mb-4 flex gap-1 items-center'>
				<MailOutlineIcon />
				Text Message
			</h2>
			<form onSubmit={handleSubmit(handleSubmitForm)}>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Phone Number'
						fullWidth
						error={!!errors.telephone} // Show error if validation fails
						helperText={errors.telephone ? 'Phone Number is Required' : ''}
						{...register('telephone', {
							required: 'Phone Number field is required',
						})}
					/>
				</Box>
				<Box
					mt={2}
					display='flex'
					justifyContent='space-between'
					gap={2}
				>
					<TextField
						label='Message'
						fullWidth
						error={!!errors.message}
						helperText={errors.message ? 'Must be at least 3 characters' : ''}
						{...register('message', {
							minLength: {
								value: 3,
								message: 'Must be at least 3 characters',
							},
						})}
					/>
				</Box>

				<div className='mt-4 flex gap-1'>
					<LongButton
						type='submit'
						color='bg-green-700'
					>
						Submit
					</LongButton>
					<LongButton
						color='bg-red-700'
						onClick={() => setTextMessageModal(false)} // Close modal on Cancel
					>
						Cancel
					</LongButton>
				</div>
			</form>
		</div>
	);
}

function ViewBookingModal({ data, setViewBookingModal }) {
	return (
		<div className='flex flex-col items-center justify-center w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
			<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
				<CalendarTodayIcon sx={{ color: '#E45454' }} />
			</div>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='flex w-full flex-col justify-center items-center'>
					<p className='font-medium '>Booking Details</p>
					<div className='font-bold'># {data?.bookingId}</div>
				</div>
				<div className='bg-[#16A34A] text-center font-medium text-white py-2 px-4 w-full rounded-sm'>
					<p>Booking Confirmed</p>
				</div>
				<div className='max-h-[70vh] overflow-auto'>
					{/* Pickup */}
					<div className='bg-[#F3F4F6] w-full flex flex-row justify-between items-center gap-10 border-y-gray-300 border-y '>
						<HomeOutlinedIcon sx={{ color: '#16A34A', marginLeft: '1rem' }} />
						<div className='w-full flex flex-col items-start gap-1 mb-2'>
							<div className='w-full py-1 border-b-gray-300 border-b-[1px]'>
								<p className='font-medium'>Pickup</p>
							</div>
							<div className='w-full flex flex-col items-start'>
								<p className='font-medium'>
									{data?.dateCreated?.split('T').join(' ').split('.')[0]}
								</p>
								<p className='text-[14px] text-orange-900 cursor-pointer'>
									{data?.pickupAddress}
								</p>
								<p className='text-[14px] text-orange-900 cursor-pointer'>
									{data?.pickupPostCode}
								</p>
							</div>
						</div>
					</div>
					{/* Via if Present */}
					{data?.vias.length > 0 && (
						<div className='bg-[#F3F4F6] w-full flex flex-row justify-between items-center gap-10 border-y-gray-300 border-y'>
							<HomeOutlinedIcon sx={{ color: '#16A34A', marginLeft: '1rem' }} />
							<div className='w-full flex flex-col items-start gap-1 mb-2'>
								<div className='w-full py-1 border-b-gray-300 border-b-[1px]'>
									<p className='font-medium'>{`Via's`}</p>
								</div>
								{data?.vias.map((via, index) => (
									<div
										key={index}
										className='w-full flex flex-col items-start'
									>
										<p className='text-[14px] text-orange-900 cursor-pointer'>
											{via.address}
										</p>
										<p className='text-[14px] text-orange-900 cursor-pointer'>
											{via.postCode}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
					{/* Destination */}
					<div className='bg-[#F3F4F6] w-full flex flex-row justify-between items-center gap-10 border-y-gray-300 border-y '>
						<HomeOutlinedIcon sx={{ color: '#16A34A', marginLeft: '1rem' }} />
						<div className='w-full flex flex-col items-start gap-1 mb-2'>
							<div className='w-full py-1 border-b-gray-300 border-b-[1px]'>
								<p className='font-medium'>Destination</p>
							</div>
							<div className='w-full flex flex-col items-start'>
								<p className='text-[14px] text-orange-900 cursor-pointer'>
									{data?.destinationAddress}
								</p>
								<p className='text-[14px] text-orange-900 cursor-pointer'>
									{data?.destinationPostCode}
								</p>
							</div>
						</div>
					</div>
					{/* Details - Journey */}
					<div className='bg-[#F3F4F6] w-full flex flex-row justify-between items-center gap-10 border-y-gray-300 border-y '>
						<div className='w-full flex flex-col items-start gap-1 mb-2'>
							<div className='w-full flex justify-end '>
								<div className='w-[80%] py-1 border-b-gray-300 border-b-[1px]'>
									<p className='font-medium'>Details</p>
								</div>
							</div>
							<div className='w-full flex flex-row justify-start gap-10 items-center'>
								<PersonOutlineOutlinedIcon
									sx={{ marginLeft: '1rem', padding: '1px' }}
								/>
								<div className=' w-full flex flex-col py-1'>
									<p className='font-medium text-black'>
										{data?.passengerName}
									</p>
									<p className='text-[14px] text-black'>
										{data?.passengers} <span>Passenger(s)</span>
									</p>
								</div>
							</div>
							<div className='w-full flex flex-row justify-start gap-10 items-center'>
								<LocalPhoneOutlinedIcon
									sx={{ marginLeft: '1rem', padding: '1px' }}
								/>
								<div className=' w-full flex flex-col py-1'>
									<p className='text-[14px] text-orange-900 cursor-pointer'>
										{data.phoneNumber}
									</p>
								</div>
							</div>
						</div>
					</div>
					{/* Price - Information */}
					<div className='bg-[#F3F4F6] w-full flex flex-row justify-between items-center gap-10 border-y-gray-300 border-y '>
						<div className='w-full flex flex-col items-start gap-1 mb-2'>
							<div className='w-full flex justify-end '>
								<div className='w-[80%] py-1 border-b-gray-300 border-b-[1px]'>
									<p className='font-medium'>Price - Journey Information</p>
								</div>
							</div>
							<div className='w-full flex flex-row justify-start gap-10 items-center'>
								<WatchLaterOutlinedIcon
									sx={{ marginLeft: '1rem', padding: '2px' }}
								/>
								<div className=' w-full flex flex-col py-1'>
									<p className='text-[14px] text-black'>
										{Math.floor(data?.durationMinutes / 60)}{' '}
										<span>Hour(s)</span> {data?.durationMinutes % 60}{' '}
										<span>Minute(s)</span>
									</p>
								</div>
							</div>
							{data?.mileageText > 0 && (
								<div className='w-full flex flex-row justify-start gap-10 items-center'>
									<LocalTaxiOutlinedIcon
										sx={{ marginLeft: '1rem', padding: '2px' }}
									/>
									<div className=' w-full flex flex-col py-1'>
										<p className='text-[14px] text-black'>
											{data?.mileageText}
										</p>
									</div>
								</div>
							)}
							{data?.price > 0 && (
								<div className='w-full flex flex-row justify-start gap-10 items-center'>
									<CurrencyPoundOutlinedIcon
										sx={{ marginLeft: '1rem', padding: '3px' }}
									/>
									<div className=' w-full flex flex-col py-1'>
										<p className='text-[14px] text-orange-900 cursor-pointer'>
											{data.price}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<Button
					variant='contained'
					color='error'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={() => setViewBookingModal(false)}
				>
					Back
				</Button>
			</div>
		</div>
	);
}
