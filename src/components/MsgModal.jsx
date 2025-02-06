/** @format */

import { Button, Switch } from '@mui/material';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { useState } from 'react';
import { sendMsgToAllDrivers, sendMsgToDriver } from '../utils/apiReq';
import { openSnackbar } from '../context/snackbarSlice';
import { useDispatch } from 'react-redux';
function MsgModal({ selectedDriver, handleClose }) {
	const dispatch = useDispatch();
	const [isAllDriverOn, setIsAllDriverOn] = useState(false);
	const [msg, setMsg] = useState('');
	const handleChange = () => {
		setIsAllDriverOn(!isAllDriverOn);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!msg.trim()) {
			return dispatch(openSnackbar('Write Some Message for Driver', 'error'));
		}

		try {
			let response;
			if (isAllDriverOn) {
				response = await sendMsgToAllDrivers({
					message: msg,
				});
			} else {
				response = await sendMsgToDriver({
					userId: selectedDriver?.userId, // Fix: Ensure userId is included
					message: msg,
				});
			}

			if (response.status === 'success') {
				dispatch(
					openSnackbar(
						isAllDriverOn ? 'Sent To All Drivers' : 'Message sent successfully',
						'success'
					)
				);
				setMsg(''); // Clear message input after sending
				handleClose();
			} else {
				dispatch(openSnackbar('Unable To Send.', 'error'));
			}
		} catch (error) {
			console.error(error);
			dispatch(openSnackbar('Unable To Send.', 'error'));
		}
	};
	return (
		<div className='flex flex-col items-center justify-center w-[80vw] sm:w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4 gap-4'>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
					<GroupOutlinedIcon sx={{ color: '#E45454' }} />
				</div>
				<div className='flex w-full flex-col justify-center items-center'>
					<p className='font-medium text-xl '>
						{isAllDriverOn
							? 'Send To All Drivers'
							: `Send To ${selectedDriver?.fullname}`}
					</p>
				</div>
			</div>
			<div className='text-center w-full'>
				<span className='flex flex-row gap-2 items-center align-middle'>
					<span className='select-none whitespace-nowrap text-xs sm:text-sm uppercase font-normal'>
						All Driver
					</span>
					<Switch
						checked={isAllDriverOn}
						onChange={handleChange}
						className='text-sm'
					/>
				</span>
			</div>
			<form
				onSubmit={handleSubmit}
				className='w-full flex flex-col justify-center items-center gap-3 -mt-3'
			>
				<div className='w-full relative flex flex-col justify-center items-start gap-2'>
					<label>Message</label>
					<textarea
						type='text'
						value={msg || ''}
						onChange={(e) => setMsg(e.target.value)}
						className='w-full py-2 p-2 border border-gray-500 rounded-md placeholder:text-slate-900'
					/>
				</div>
				<div className='flex flex-row justify-center items-center w-full gap-2'>
					<Button
						variant='contained'
						color='error'
						sx={{ paddingY: '0.5rem', marginTop: '4px' }}
						className='w-full cursor-pointer'
						onClick={handleClose}
					>
						Cancel
					</Button>
					<Button
						variant='contained'
						color='success'
						sx={{ paddingY: '0.5rem', marginTop: '4px' }}
						className='w-full cursor-pointer'
						type='submit'
					>
						Send
					</Button>
				</div>
			</form>
		</div>
	);
}

export default MsgModal;
