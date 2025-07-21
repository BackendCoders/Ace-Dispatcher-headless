/** @format */

import { WarningAmberOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

export default function WarningModal({ setIsWarningOpen, resolve }) {
	const handleWarningYes = () => {
		resolve(true);
		setIsWarningOpen(false);
	};

	const handleWarningNo = () => {
		resolve(false);
		setIsWarningOpen(false);
	};
	return (
		<div className='flex flex-col items-center justify-center w-[80vw] sm:w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4 gap-4'>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
					<WarningAmberOutlined sx={{ color: '#E45454' }} />
				</div>
				<div className='flex w-full flex-col justify-center items-center'>
					<p className='font-bold text-xl text-red-400 '>Warning!</p>
				</div>
			</div>
			<div className='text-start w-full'>
				{`Please check the passenger count, you have added vias they should match the number of passengers to continue saving this booking click 'yes'
			or 'no' or go back and edit.`}
			</div>

			<div className='w-full flex items-center justify-center gap-4'>
				<Button
					variant='contained'
					color='info'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={handleWarningNo} // Close modal on "No"
				>
					No
				</Button>
				<Button
					variant='contained'
					color='error'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={handleWarningYes} // Call confirmCancelJob to execute cancellation
				>
					Yes
				</Button>
			</div>
		</div>
	);
}
