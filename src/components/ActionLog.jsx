/** @format */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRefreshedBookingsLog } from '../context/BookingLogSlice';
import CustomDialog from './CustomDialog';
import Modal from './Modal';
import {
	setActionLogsOpen,
	setActiveSearchResult,
	setActiveSearchResultClicked,
} from '../context/schedulerSlice';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
export default function ActionLog() {
	const dispatch = useDispatch();
	const { logsArray } = useSelector((state) => state.logs);
	const { activeSearchResults } = useSelector((state) => state.scheduler);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10); // Adjust as needed

	// Pagination calculations
	const totalItems = logsArray?.length || 0;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedLogs = logsArray?.slice(startIndex, endIndex) || [];

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const handlePrevPage = () => {
		if (currentPage > 1) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	const handlePageClick = (page) => {
		setCurrentPage(page);
	};

	const getVisiblePageNumbers = () => {
		const maxVisiblePages = 4;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let endPage = startPage + maxVisiblePages - 1;

		// Adjust if endPage exceeds totalPages
		if (endPage > totalPages) {
			endPage = totalPages;
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		const pageNumbers = [];
		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(i);
		}
		return pageNumbers;
	};

	const visiblePageNumbers = getVisiblePageNumbers();

	useEffect(() => {
		if (activeSearchResults && !dialogOpen) {
			dispatch(setActiveSearchResultClicked(null));
		}
	}, [activeSearchResults, dialogOpen, dispatch]);

	useEffect(() => {
		dispatch(getRefreshedBookingsLog());
	}, [dispatch]);

	return (
		<div className='p-2'>
			{/* <div className='flex justify-between items-center mb-2 '>
				<h2 className='text-lg font-semibold'>Action Logs</h2>
			</div> */}
			<div className='overflow-x-auto'>
				<table className='min-w-full bg-white'>
					<thead className='bg-gray-200 text-gray-600'>
						<tr>
							<th className='py-3 px-4 text-left'>Date/Time</th>
							<th className='py-3 px-4 text-left'>Booking #</th>
							<th className='py-3 px-4 text-left'>User</th>
							<th className='py-3 px-4 text-left'>Action</th>
						</tr>
					</thead>
					<tbody>
						{paginatedLogs.length > 0 ? (
							paginatedLogs.map((booking, index) => (
								<tr
									key={index}
									className={`hover:bg-gray-100 cursor-pointer`}
									onClick={() => {
										setDialogOpen(true);
										dispatch(setActionLogsOpen(true));
										dispatch(setActiveSearchResult(booking?.bookingId));
									}}
								>
									<td className='border px-4 py-2 whitespace-nowrap'>
										{new Date(booking?.timestamp)
											.toLocaleDateString('en-GB')
											?.split('T')[0] +
											' ' +
											booking?.timestamp?.split('T')[1]?.slice(0, 5)}
									</td>
									<td className='border px-4 py-2'>{booking?.bookingId}</td>
									<td className='border px-4 py-2'>{booking?.actionByUser}</td>
									<td className='border px-4 py-2'>{booking?.action}</td>
								</tr>
							))
						) : (
							<div className='flex justify-center items-center w-full'>
								No Data Found
							</div>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className='flex justify-end items-center gap-2 mt-4'>
					<button
						onClick={handlePrevPage}
						disabled={currentPage === 1}
						className='px-3 py-1 bg-gray-200 rounded disabled:opacity-50'
					>
						<IoIosArrowBack fontSize={18} />
					</button>
					<div className='flex space-x-2'>
						{visiblePageNumbers.map((page) => (
							<button
								key={page}
								onClick={() => handlePageClick(page)}
								className={`px-3 py-1 rounded ${
									currentPage === page
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700'
								}`}
							>
								{page}
							</button>
						))}
					</div>
					<button
						onClick={handleNextPage}
						disabled={currentPage === totalPages}
						className='px-3 py-1 bg-gray-200 rounded disabled:opacity-50'
					>
						<IoIosArrowForward fontSize={18} />
					</button>
				</div>
			)}

			{dialogOpen && (
				<Modal
					open={dialogOpen}
					setOpen={setDialogOpen}
				>
					<CustomDialog closeDialog={() => setDialogOpen(false)} />
				</Modal>
			)}
		</div>
	);
}
