/** @format */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Switch, TextField, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import CallIcon from '@mui/icons-material/Call';
import Badge from '@mui/material/Badge';
import { useDispatch, useSelector } from 'react-redux';
// import { setActiveTestMode, setIsGoogleApiOn } from '../context/bookingSlice';
import {
	setActiveSectionMobileView,
	setIsGoogleApiOn,
} from '../context/bookingSlice';

import {
	handleSearchBooking,
	makeSearchInactive,
	// makeSearchInactive,
} from '../context/schedulerSlice';
// import CancelIcon from '@mui/icons-material/Cancel';
import LogoImg from '../assets/ace_taxis_v4.svg';
import LongButton from '../components/BookingForm/LongButton';
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
const Navbar = () => {
	const BASE_URL = import.meta.env.VITE_BASE_URL;
	const navigate = useNavigate();
	const { isAuth, logout, currentUser } = useAuth();
	const dispatch = useDispatch();
	const isMobile = useMediaQuery('(max-width:640px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

	// console.log(currentUser);
	// const activeTestMode = useSelector(
	// 	(state) => state.bookingForm.isActiveTestMode
	// );
	const isGoogleApiOn = useSelector((state) => state.bookingForm.isGoogleApiOn);
	const callerId = useSelector((state) => state.caller);
	const { activeSearch } = useSelector((state) => state.scheduler);
	const [openSearch, setOpenSearch] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	// const [searchData, setSearchData] = useState({});
	// const inputRef = useRef(null);

	// const handleKeyPress = (e) => {
	// 	if (e.key === 'Enter') {
	// 		e.preventDefault();
	// 		handleClick(e);
	// 	}
	// };

	const handleCancelSearch = () => {
		setOpenSearch(false);
		dispatch(makeSearchInactive());
	};

	return (
		<>
			<>
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
			</>
			<nav
				className={`sticky top-0 z-50 flex justify-between items-center ${
					BASE_URL.includes('api.acetaxisdorset')
						? 'bg-[#424242]'
						: 'bg-[#C74949]'
				}  text-white p-4`}
			>
				<span className='flex sm:gap-10 items-center justify-between gap-2 w-full'>
					<Link
						to='/pusher'
						className='flex justify-center items-center space-x-2 uppercase'
					>
						<img
							src={LogoImg}
							className='flex h-8 w-8'
						/>
						<span className='text-lg font-bold'>Ace Taxis</span>
						<span className='text-lg hidden sm:block'>
							{BASE_URL.includes('api.acetaxisdorset') ? '' : 'TEST MODE'}
						</span>
					</Link>
					{/* Mobile Menu Toggle */}
					{isAuth && (
						<button
							className='md:hidden block text-2xl focus:outline-none mr-2'
							onClick={() => setMenuOpen(!menuOpen)}
						>
							☰
						</button>
					)}
				</span>

				<span
					className={`${
						menuOpen ? 'flex' : 'hidden'
					} flex-col md:flex md:flex-row items-center justify-end gap-4 sm:gap-10 uppercase text-sm  w-[50%]`}
				>
					{!isAuth ? (
						<></>
					) : (
						<div className='flex flex-row items-center align-middle gap-8'>
							{callerId.length > 0 && (
								<Badge
									badgeContent={callerId.length}
									color='error'
									className='cursor-pointer select-none animate-bounce'
								>
									<CallIcon />
								</Badge>
							)}

							{/* Search Form Started here */}
							{currentUser?.roleId !== 3 && (
								<div className='flex justify-center items-center uppercase'>
									{!activeSearch && (
										<button
											onClick={() => setOpenSearch(true)}
											// className='text-sm'
										>
											Search
										</button>
									)}
									{activeSearch && (
										<button
											onClick={handleCancelSearch}
											// className='text-sm'
										>
											Cancel Search
										</button>
									)}
								</div>
							)}

							{currentUser?.roleId !== 3 && (
								<span className='flex gap-2 items-center'>
									<span className='text-xs sm:text-sm'>Use Google Api</span>
									<Switch
										checked={isGoogleApiOn}
										onChange={(e) => {
											dispatch(setIsGoogleApiOn(e.target.checked));
										}}
										size='small'
									/>
								</span>
							)}

							{/* Test Mode Toogle Button */}
							{/* <span className='flex flex-row gap-2 items-center align-middle'>
								<span>Test Mode</span>
								<Switch
									checked={activeTestMode}
									onChange={(e) => {
										dispatch(setActiveTestMode(e.target.checked));
									}}
								/>
							</span> */}

							{/* Logout Button */}
							{isAuth && (
								<button
									className='bg-blue-500 text-white px-4 py-2 rounded-lg uppercase text-xs sm:text-sm'
									onClick={() => {
										logout();
										navigate('/login');
									}}
								>
									logout
								</button>
							)}
						</div>
					)}
				</span>
				<div
					className={`fixed inset-y-0 right-0 z-50 w-[55%] max-w-xs bg-[#C74949] text-white p-4 transform ${
						menuOpen ? 'translate-x-0' : 'translate-x-full'
					} transition-transform duration-300 ease-in-out md:hidden`}
				>
					<div className='flex justify-between items-center mb-6 mr-10'>
						<span className='text-lg font-bold'>Menu</span>
						<button
							onClick={() => setMenuOpen(false)}
							className='text-2xl'
						>
							✕
						</button>
					</div>

					{/* Caller ID Badge */}
					{(!isMobile || !isTablet || currentUser?.roleId !== 3) &&
						isAuth &&
						callerId.length > 0 && (
							<Badge
								badgeContent={callerId.length}
								color='error'
								className='cursor-pointer animate-bounce mb-4'
							>
								<CallIcon />
							</Badge>
						)}

					<div className='flex gap-4 mb-4'>
						<button
							onClick={() => {
								dispatch(setActiveSectionMobileView('Booking'));
								setMenuOpen(false);
							}}
						>
							Booking
						</button>
					</div>
					<div className='flex gap-4 mb-4'>
						<button
							onClick={() => {
								dispatch(setActiveSectionMobileView('Scheduler'));
								setMenuOpen(false);
							}}
						>
							Diary
						</button>
					</div>

					{/* Search Button */}
					{currentUser?.roleId !== 3 && (
						<div className='flex justify-start items-center uppercase mb-4'>
							{!activeSearch ? (
								<button
									onClick={() => {
										setOpenSearch(true);
										setMenuOpen(false);
									}}
								>
									Search
								</button>
							) : (
								<button
									onClick={() => {
										handleCancelSearch();
										setMenuOpen(false);
									}}
								>
									Cancel Search
								</button>
							)}
						</div>
					)}

					{/* Google API Toggle */}
					{currentUser?.roleId !== 3 && (
						<div className='flex justify-start items-center gap-2 mb-4'>
							<span>Use Google Api</span>
							<Switch
								checked={isGoogleApiOn}
								onChange={(e) => {
									dispatch(setIsGoogleApiOn(e.target.checked));
									setMenuOpen(false);
								}}
							/>
						</div>
					)}

					{/* Logout Button */}
					{isAuth && (
						<button
							className='bg-blue-500 px-4 py-2 rounded-md uppercase'
							onClick={() => {
								logout();
								navigate('/login');
								setMenuOpen(false);
							}}
						>
							Logout
						</button>
					)}
				</div>

				{/* Overlay for closing the panel */}
				{menuOpen && (
					<div
						className='fixed inset-0 z-30 bg-black opacity-50'
						onClick={() => setMenuOpen(false)}
					></div>
				)}
			</nav>
		</>
	);
};

export default Navbar;

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
		const newinputData = {
			pickupAddress: data.pickupAddress || '',
			pickupPostcode: data.pickupPostcode || '',
			destinationAddress: data.destinationAddress || '',
			destinationPostcode: data.destinationPostcode || '',
			passenger: data.passenger || '',
			phoneNumber: data.phoneNumber || '',
			details: data.details || '',
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
		<div className='bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[45vw] sm:w-[25vw] max-w-md mx-auto'>
			<h2 className='text-2xl font-semibold mb-4 flex items-center'>
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
						error={!!errors.pickupAddress} // Show error if validation fails
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
