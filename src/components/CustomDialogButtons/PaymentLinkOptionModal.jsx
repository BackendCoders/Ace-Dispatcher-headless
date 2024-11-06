/** @format */

import { Button, Switch, FormControlLabel, Box } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useState } from 'react';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import SendIcon from '@mui/icons-material/Send';
export default function PaymentLinkOptionModal({
	setOpenSmsDailogModal,
	handlePayClick,
}) {
	const [isTextMessage, setIsTextMessage] = useState(true);
	const [isEmail, setIsEmail] = useState(false);
	const [isBoth, setIsBoth] = useState(false);

	const handleConfirmClick = async () => {
		// Determine the selected options and pass them to handlePayClick
		const selectedOptions = {
			textMessage: isTextMessage,
			email: isEmail,
			both: isBoth,
		};
		handlePayClick(selectedOptions);
		setOpenSmsDailogModal(false);
	};

	return (
		<div className='flex flex-col items-center justify-center w-[80vw] sm:w-[23vw] bg-white rounded-lg px-4 pb-4 pt-5 sm:p-6 sm:pb-4 gap-4'>
			<div className='flex w-full flex-col gap-2 justify-center items-center mt-3'>
				<div className='p-4 flex justify-center items-center text-center rounded-full bg-[#FEE2E2]'>
					<MailOutlineIcon sx={{ color: '#E45454' }} />
				</div>
				<div className='flex w-full flex-col justify-center items-center'>
					<p className='font-medium text-xl'>Choose Your Options</p>
				</div>
			</div>
			<form>
				<div className='w-full justify-start items-center'>
					<FormControlLabel
						control={
							<Switch
								checked={isTextMessage}
								onChange={() => {
									setIsTextMessage(!isTextMessage);
									// Automatically uncheck "Both" if either individual option is selected
									if (isBoth) setIsBoth(false);
								}}
							/>
						}
						label={
							<Box
								display='flex'
								alignItems='center'
							>
								Text Messages{' '}
								<PermPhoneMsgIcon
									sx={{ color: '#9B1FE8', marginLeft: '4px' }}
								/>
							</Box>
						}
					/>
				</div>
				<div className='w-full justify-start items-center'>
					<FormControlLabel
						control={
							<Switch
								checked={isEmail}
								onChange={() => {
									setIsEmail(!isEmail);
									if (isBoth) setIsBoth(false);
								}}
							/>
						}
						label={
							<Box
								display='flex'
								alignItems='center'
							>
								Email{' '}
								<ForwardToInboxIcon
									sx={{ color: '#9B1FE8', marginLeft: '4px' }}
								/>
							</Box>
						}
					/>
				</div>
				<div className='w-full justify-start items-center'>
					<FormControlLabel
						control={
							<Switch
								checked={isBoth}
								onChange={() => {
									setIsBoth(!isBoth);
									// Automatically uncheck individual options if "Both" is selected
									if (!isBoth) {
										setIsTextMessage(false);
										setIsEmail(false);
									}
								}}
							/>
						}
						label={
							<Box
								display='flex'
								alignItems='center'
							>
								Both (Text Messages & Email){' '}
								<SendIcon sx={{ color: '#9B1FE8', marginLeft: '4px' }} />
							</Box>
						}
					/>
				</div>
			</form>
			<div className='w-full flex items-center justify-center gap-4'>
				<Button
					variant='contained'
					color='error'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={() => setOpenSmsDailogModal(false)}
				>
					Cancel
				</Button>
				<Button
					variant='contained'
					color='success'
					sx={{ paddingY: '0.5rem', marginTop: '4px' }}
					className='w-full cursor-pointer'
					onClick={handleConfirmClick}
				>
					Confirm
				</Button>
			</div>
		</div>
	);
}
