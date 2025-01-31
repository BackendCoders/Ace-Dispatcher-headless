/** @format */

import { Outlet } from 'react-router-dom';
// import Header from './ui/Header';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import CallerIdPopUp from './components/CallerIdPopUp';
import { Provider } from 'react-redux';
import store from './store';
import Footer from './ui/Footer';
import { checkPreviousLogs } from './utils/getLogs';
import { useMediaQuery } from '@mui/material';

function AppLayout() {
	const isMobile = useMediaQuery('(max-width:640px)');
	checkPreviousLogs();
	return (
		<AuthProvider>
			<BookingProvider>
				<Provider store={store}>
					<CallerIdPopUp />
					{/* <Header /> */}
					<Outlet />
					{isMobile && <Footer />}
				</Provider>
			</BookingProvider>
		</AuthProvider>
	);
}

export default AppLayout;
