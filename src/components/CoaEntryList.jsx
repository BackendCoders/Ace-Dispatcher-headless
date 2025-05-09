/** @format */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getRefreshedCOAEntry, setCoaDate } from '../context/coaEntrysSlice';
import { isValidDate } from '../utils/isValidDate';
import { formatDate } from '../utils/formatDate';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

export default function CoaEntryList() {
	const dispatch = useDispatch();
	const { coaEntries, coaDate } = useSelector((state) => state.coaEntry);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10); // Adjust as needed

	const date = coaDate && coaDate?.split('T')[0];
	console.log('logs---', coaEntries, coaDate);

	const sortedCoaEntries = [...coaEntries].sort(
		(a, b) => new Date(b.coaDateTime) - new Date(a.coaDateTime)
	);

	// Pagination calculations
	const totalItems = sortedCoaEntries?.length || 0;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedLogs = sortedCoaEntries?.slice(startIndex, endIndex) || [];

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
		dispatch(getRefreshedCOAEntry(date));
	}, [dispatch, date]);

	return (
		<div className='p-2'>
			<div className='flex justify-between items-center p-4'>
				<input
					required
					type='datetime-local'
					className='w-full sm:w-auto bg-input text-foreground p-2 rounded-lg border border-border'
					value={formatDate(coaDate)}
					onChange={(e) => {
						if (!isValidDate(e.target.value)) return;
						dispatch(setCoaDate(e.target.value));
						return e.target.value;
					}}
				/>
			</div>
			<div className='overflow-x-auto'>
				<table className='min-w-full bg-white'>
					<thead className='bg-gray-200 text-gray-600'>
						<tr>
							<th className='py-3 px-4 text-left'>COA Date/Time</th>
							<th className='py-3 px-4 text-left'>Journey Date/Time</th>
							<th className='py-3 px-4 text-left'>Pickup Address</th>
							<th className='py-3 px-4 text-left'>Passenger</th>
							<th className='py-3 px-4 text-left'>Account</th>
						</tr>
					</thead>
					<tbody>
						{paginatedLogs?.length > 0 ? (
							paginatedLogs.map((coa, index) => (
								<tr
									key={index}
									className={`hover:bg-gray-100`}
								>
									<td className='border px-4 py-2 whitespace-nowrap'>
										{new Date(coa?.coaDateTime)
											.toLocaleDateString('en-GB')
											?.split('T')[0] +
											' ' +
											coa?.coaDateTime?.split('T')[1]?.slice(0, 5)}
									</td>
									<td className='border px-4 py-2 whitespace-nowrap'>
										{new Date(coa?.journeyDateTime)
											.toLocaleDateString('en-GB')
											?.split('T')[0] +
											' ' +
											coa?.journeyDateTime?.split('T')[1]?.slice(0, 5)}
									</td>
									<td className='border px-4 py-2'>{coa?.pickupAddress}</td>
									<td className='border px-4 py-2'>
										{coa?.passengerName ? coa?.passengerName : '-'}
									</td>

									<td className='border px-4 py-2'>{coa?.accountNo}</td>
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
		</div>
	);
}
