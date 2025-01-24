/** @format */

import { useState, useEffect, useCallback } from 'react';
// import { useBooking } from '../hooks/useBooking';
import { useDispatch, useSelector } from 'react-redux';
import { removeBookingById, removeCaller } from '../context/callerSlice';
import { Button } from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { deleteSchedulerBooking } from '../utils/apiReq';
import { openSnackbar } from '../context/snackbarSlice';

const BookingTable = ({ onConfirm, onSet, numBooking }) => {
	const bookings = useSelector((state) => state.caller[0]);
	// console.log('bookings in caller', bookings);
	const dispatch = useDispatch();
	const [activeTab, setActiveTab] = useState(
		bookings.Current.length > 0 ? 'current-bookings' : 'previous-bookings'
	);

	const [selectedRow, setSelectedRow] = useState(0);
	const isEmpty =
		bookings.Current.length === 0 && bookings.Previous.length === 0;
	// const { onRemoveCaller } = useBooking();

	const confirmSelection = useCallback(() => {
		if (selectedRow !== null) {
			onConfirm(selectedRow, activeTab);
		} else {
			alert('No row selected');
		}
	}, [selectedRow, activeTab, onConfirm]);

	useEffect(() => {
		const traverseTable = (key) => {
			const currentBookings =
				activeTab === 'current-bookings' ? bookings.Current : bookings.Previous;
			if (currentBookings.length === 0) return;

			if (key === 'ArrowUp' && selectedRow > 0) {
				setSelectedRow(selectedRow - 1);
			} else if (
				key === 'ArrowDown' &&
				selectedRow < currentBookings.length - 1
			) {
				setSelectedRow(selectedRow + 1);
			}
		};
		const switchTab = (key) => {
			if (key === 'ArrowLeft' && activeTab === 'previous-bookings') {
				handleTabClick('current-bookings');
			} else if (key === 'ArrowRight' && activeTab === 'current-bookings') {
				handleTabClick('previous-bookings');
			}
		};
		const handleKeyDown = (event) => {
			event.preventDefault();
			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				switchTab(event.key);
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				traverseTable(event.key);
			} else if (event.key === 'Enter') {
				confirmSelection();
			} else if (event.key === 'Escape') {
				dispatch(removeCaller());
				onSet(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [activeTab, selectedRow, bookings, confirmSelection, onSet, dispatch]);

	const handleTabClick = (tab) => {
		setActiveTab(tab);
		setSelectedRow(0);
	};

	const selectRow = (index) => {
		setSelectedRow(index);
	};

	function handleCreateNewBookingWithTelephone() {
		onConfirm({ PhoneNumber: bookings.Telephone });
	}
	// console.log(activeTab);

	return (
		<div className='w-[90vw] sm:w-[55vw] fixed right-[-150px] top-[-150px] bg-white rounded-lg shadow-lg p-5'>
			<div className='flex justify-between'>
				<h2 className='text-xl font-semibold mb-4 '>
					📞 ({bookings.Telephone})
				</h2>
				{numBooking > 1 && (
					<span className='text-center bg-red-700 p-2 text-white'>
						{numBooking} Caller Waiting..
					</span>
				)}
			</div>
			<div className='flex border-b mb-4'>
				<button
					className={`tab-link py-2 px-4 text-gray-600 border-b-2 ${
						activeTab === 'current-bookings'
							? 'border-blue-500'
							: 'border-transparent'
					} hover:border-blue-500 focus:outline-none`}
					onClick={() => handleTabClick('current-bookings')}
				>
					Current Bookings
				</button>
				<button
					className={`tab-link py-2 px-4 text-gray-600 border-b-2 ${
						activeTab === 'previous-bookings'
							? 'border-blue-500'
							: 'border-transparent'
					} hover:border-blue-500 focus:outline-none`}
					onClick={() => handleTabClick('previous-bookings')}
				>
					Previous Bookings
				</button>
			</div>
			<div
				className={`${
					activeTab === 'current-bookings' ? 'block' : 'hidden'
				} min-h-[15vh] max-h-[40vh] overflow-auto`}
			>
				<CurrentTable
					bookings={bookings.Current}
					selectRow={selectRow}
					selectedRow={selectedRow}
					activeTab={activeTab}
				/>
			</div>
			<div
				className={`${
					activeTab === 'previous-bookings' ? 'block' : 'hidden'
				} min-h-[15vh] max-h-[40vh] overflow-auto`}
			>
				<CurrentTable
					bookings={bookings.Previous}
					selectRow={selectRow}
					selectedRow={selectedRow}
				/>
			</div>
			<div className='mt-4'>
				<div className='flex justify-between'>
					{isEmpty ? (
						<button
							className='bg-green-500 text-white py-2 px-4 rounded'
							onClick={handleCreateNewBookingWithTelephone}
						>
							New Booking
						</button>
					) : (
						<>
							{selectedRow !== undefined && selectedRow !== null ? (
								<button
									className='bg-green-500 text-white py-2 px-4 rounded'
									onClick={confirmSelection}
								>
									Confirm
								</button>
							) : (
								<button
									disabled
									className='bg-gray-500 text-white py-2 px-4 rounded'
									onClick={confirmSelection}
								>
									select one
								</button>
							)}
						</>
					)}
					<button
						className='bg-red-500 text-white py-2 px-4 rounded'
						onClick={() => {
							dispatch(removeCaller());
							onSet(false);
						}}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

function CurrentTable({ bookings, selectedRow, selectRow, activeTab }) {
	const [deleteModal, setDeleteModal] = useState(false);
	const activeCurrentTab = activeTab === 'current-bookings';
	const dispatch = useDispatch();
	const [bookingToCancel, setBookingToCancel] = useState(null);
	const user = useAuth();

	const openDeleteModal = (booking) => {
		setBookingToCancel(booking); // Store booking to cancel
		setDeleteModal(true); // Open modal
	};

	const confirmCancelJob = async () => {
		if (bookingToCancel) {
			// console.log('bookingToCancel', bookingToCancel);
			try {
				const data = {
					bookingId: bookingToCancel.Id,
					cancelledByName: user.currentUser?.fullName,
					actionByUserId: user.currentUser.id,
					cancelBlock: false,
					cancelledOnArrival: false,
				};
				// console.log('bookingToCancel', data);
				const response = await deleteSchedulerBooking(data);
				if (response.status === 'success') {
					dispatch(openSnackbar('Job Cancel Successfully', 'success'));
					dispatch(
						removeBookingById({
							type: activeTab === 'current-bookings' ? 'Current' : 'Previous',
							bookingId: bookingToCancel.bookingId,
						})
					);
				}
			} catch (error) {
				console.error('Error canceling booking:', error);
			} finally {
				setDeleteModal(false); // Close modal after action
			}
		}
	};

	const rows = [
		'Date',
		'Pickup Address',
		'Destination Address',
		'Name',
		'Price',
		...(activeCurrentTab ? ['Action'] : []),
	];
	const formatDate = (dateStr) => {
		const d = new Date(dateStr);
		return `${('0' + d.getDate()).slice(-2)}/${('0' + (d.getMonth() + 1)).slice(
			-2
		)}/${d.getFullYear().toString().slice(-2)} ${('0' + d.getHours()).slice(
			-2
		)}:${('0' + d.getMinutes()).slice(-2)}`;
	};

	if (bookings.length === 0) return <div>No bookings</div>;

	return (
		<>
			<table className='min-w-full table-auto'>
				<thead>
					<tr>
						{rows.map((row, index) => (
							<th
								key={index}
								className='px-4 py-2 uppercase text-left'
							>
								{row}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{bookings.map((booking, index) => (
						<tr
							key={index}
							className={`hover:bg-gray-300 cursor-pointer ${
								selectedRow === index ? 'bg-gray-300' : ''
							}`}
							onClick={() => selectRow(index)}
						>
							<td className='border px-4 py-2 whitespace-nowrap'>
								{formatDate(booking.PickupDateTime)}
							</td>
							<td className='border px-4 py-2'>{booking.PickupAddress}</td>
							<td className='border px-4 py-2'>{booking.DestinationAddress}</td>
							<td className='border px-4 py-2'>{booking.PassengerName}</td>
							<td className='border px-4 py-2'>{booking.Price}</td>
							{activeTab === 'current-bookings' && (
								<td className='border px-4 py-2'>
									<button
										className='bg-red-500 text-white py-2 px-4 rounded'
										onClick={(e) => {
											e.stopPropagation(); // Prevent row selection
											openDeleteModal(booking); // Open delete modal with booking data
										}}
									>
										Cancel
									</button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
			<Modal
				open={deleteModal}
				setOpen={setDeleteModal}
			>
				<CancelBookingModal
					confirmCancelJob={confirmCancelJob} // Function to handle job cancellation
					setDeleteModal={setDeleteModal}
				/>
			</Modal>
		</>
	);
}

export default BookingTable;

function CancelBookingModal({ confirmCancelJob, setDeleteModal }) {
	return (
		<div className='flex flex-col items-center justify-center w-[80vw] sm:w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4 gap-4'>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
					<DeleteOutlinedIcon sx={{ color: '#E45454' }} />
				</div>
				<div className='flex w-full flex-col justify-center items-center'>
					<p className='font-medium text-xl '>Cancel Your Bookings</p>
				</div>
			</div>
			<div className='text-center w-full'>
				Are you sure you wish to cancel the selected booking?
			</div>
			<div className='w-full flex items-center justify-center gap-4'>
				<Button
					variant='contained'
					color='info'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={() => setDeleteModal(false)} // Close modal on "No"
				>
					No, Keep
				</Button>
				<Button
					variant='contained'
					color='error'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={confirmCancelJob} // Call confirmCancelJob to execute cancellation
				>
					Yes, Cancel
				</Button>
			</div>
		</div>
	);
}
