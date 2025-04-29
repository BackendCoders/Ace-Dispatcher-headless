/** @format */
import NoCrashOutlinedIcon from '@mui/icons-material/NoCrashOutlined';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { confirmAllSoftAllocate } from '../../utils/apiReq';
import { openSnackbar } from '../../context/snackbarSlice';

function ConfirmSoftAllocateModal({ setConfirmSoftModal }) {
	const dispatch = useDispatch();
	const { dateControl } = useSelector((state) => state.scheduler);

	console.log('soft allocate for date', dateControl);

	const handleConfirmSoftAllocate = async () => {
		try {
			const response = await confirmAllSoftAllocate(dateControl);
			console.log('soft allocate response', response);
			if (response.status === 'success') {
				dispatch(
					openSnackbar(
						'All soft allocated jobs confirmed!',
						'success'
					)
				);
			}
		} catch (error) {
			console.error('Error confirming soft allocation:', error);
			dispatch(
				openSnackbar(
					'Failed to confirm soft allocation!',
					'error'
				)
			);
		} finally {
			setConfirmSoftModal(false);
		}
	};

	return (
		<div className='flex flex-col items-center justify-center w-[80vw] sm:w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4 gap-4'>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
					<NoCrashOutlinedIcon sx={{ color: '#E45454' }} />
				</div>
			</div>
			<div className='text-center w-full'>
				Are you sure you want to commit all soft allocated bookings to
				allocated?
			</div>
			<div className='w-full flex items-center justify-center gap-4'>
				<Button
					variant='contained'
					color='error'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={() => setConfirmSoftModal(false)}
				>
					Cancel
				</Button>
				<Button
					variant='contained'
					color='success'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={handleConfirmSoftAllocate}
				>
					Confirm
				</Button>
			</div>
		</div>
	);
}

export default ConfirmSoftAllocateModal;
