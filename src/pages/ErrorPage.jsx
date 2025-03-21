/** @format */

import { Button } from '@mui/material';
import { useRouteError } from 'react-router-dom';
import { sendLogs } from '../utils/getLogs';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from '../context/snackbarSlice';
function ErrorPage() {
	const dispatch = useDispatch();
	const error = useRouteError();
	sendLogs(error, 'error');

	const shouldReload =
		error?.message &&
		error.message.includes(
			"Cannot read properties of null (reading 'classList')"
		);

	useEffect(() => {
		if (shouldReload) {
			console.warn("Detected 'classList' error. Reloading page...");
			dispatch(openSnackbar('Oops some error occur!', 'error'));
			window.location.reload();
		}
	}, [dispatch, shouldReload]);

	if (shouldReload) {
		return null;
	}

	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-background'>
			<img
				className='h-24 w-24 mb-4'
				aria-hidden='true'
				alt='error-icon'
				src='/error.webp'
			/>
			<h1 className='text-3xl text-primary-foreground font-bold mb-2'>
				Oops! An error occurred.
			</h1>
			<p className='text-secondary-foreground mb-4'>
				We&apos;re sorry, something went wrong {error.data || error.message}.
				Please try again later.
			</p>
			<Button
				variant='contained'
				color='inherit'
				onClick={() => (window.location.href = '/')}
			>
				Go back to home
			</Button>
		</div>
	);
}

export default ErrorPage;
