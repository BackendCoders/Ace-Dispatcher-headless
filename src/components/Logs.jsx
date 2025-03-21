/** @format */

import { useState } from 'react';
import BookingsLog from './BookingsLog';
import ActionLog from './ActionLog';

export default function Logs() {
	const [isBookingLogs, setIsBookingLog] = useState(true);
	return (
		<div className='flex flex-col'>
			<div className='flex justify-start items-start gap-4 p-2'>
				<button
					onClick={() => setIsBookingLog(true)}
					className={`${
						isBookingLogs ? 'text-blue-500' : ''
					} font-semibold transition-all duration-100`}
				>
					Booking Logs
				</button>
				<button
					onClick={() => setIsBookingLog(false)}
					className={`${
						isBookingLogs ? '' : 'text-blue-500'
					} font-semibold transition-all duration-100`}
				>
					Action Logs
				</button>
			</div>
			<div>{isBookingLogs ? <BookingsLog /> : <ActionLog />}</div>
		</div>
	);
}
