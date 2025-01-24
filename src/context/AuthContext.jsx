/** @format */

import { createContext, useState, useEffect } from 'react';
import { getAccountList } from '../utils/apiReq';
import { getAllDrivers } from '../utils/apiReq';
import { sendLogs } from '../utils/getLogs';
const BASEURL = import.meta.env.VITE_BASE_URL;

const AuthContext = createContext({
	currentUser: null,
	isAuth: false,
	login: () => {},
	logout: () => {},
	getToken: () => {},
	setToken: () => {},
	isLoading: false,
});

const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [isAuth, setIsAuth] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Function to handle login logic (replace with your backend API call)
	const login = async (credentials) => {
		setIsLoading(true);
		try {
			const request = {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credentials),
			};
			const response = await fetch(BASEURL + '/api/UserProfile/Login', request);

			sendLogs(
				{
					url: `${BASEURL}/api/UserProfile/Login`,
					requestBody: request,
					response: response,
				},
				'info'
			);

			if (response.ok) {
				const data = await response.json();
				console.log(data);
				setCurrentUser(data);
				getUserRole(data);
				setIsAuth(true);
				setToken(data.token); // Assuming response contains a token
				setUsername(credentials.username);
				localStorage.setItem('userData', JSON.stringify(data));
				getAccountList();
				alert('Login successful');
			} else {
				const data = await response.json();
				alert(data.message);
				// Handle login failure (e.g., display error message)
			}
		} catch (error) {
			console.error('Login error:', error);
			// Handle login error
		} finally {
			setIsLoading(false);
		}
	};

	// Function to get user from the token
	const getUser = async (token, username) => {
		setIsLoading(true);
		try {
			const request = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			};
			const response = await fetch(
				BASEURL + `/api/UserProfile/GetUser?username=${username}`,
				request
			);
			sendLogs(
				{
					url: `${BASEURL}/api/UserProfile/GetUser?username=${username}`,
					requestBody: request,
					response,
				},
				'info'
			);

			if (response.ok) {
				const data = await response.json();
				setCurrentUser(data);
				getUserRole(data);
				setIsAuth(true);
				getAccountList();
			} else {
				console.error('Get user failed:', response.statusText);
				// Handle get user failure
			}
		} catch (error) {
			console.error('Get user error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Function to handle logout logic (replace with your backend API call)
	const logout = () => {
		localStorage.removeItem('authToken');
		localStorage.removeItem('username');
		setCurrentUser(null);
		setIsAuth(false);
	};

	// Function to retrieve stored token from local storage (optional)
	function getToken() {
		return localStorage.getItem('authToken');
	}
	function getUsername() {
		return localStorage.getItem('username');
	}

	// Function to save token to local storage (optional)
	const setToken = (token) => {
		localStorage.setItem('authToken', token);
	};
	function setUsername(username) {
		localStorage.setItem('username', username);
	}

	// Check if user is authenticated based on token or currentUser
	useEffect(() => {
		setIsLoading(true);
		const token = getToken();
		const username = getUsername();

		if (!token || !username) {
			setCurrentUser(null);
		} else if (!currentUser) {
			const userData = JSON.parse(localStorage.getItem('userData'));

			if (userData) {
				setCurrentUser(userData); // Set from localStorage
				getUserRole(userData); // Set role and isAdmin
			} else {
				getUser(token, username); // Fetch user if not in localStorage
			}
		}
		setIsAuth(!!token); // Set auth status
		setIsLoading(false);
	}, []); // Run only on component mount

	useEffect(() => {
		const handleMessage = (event) => {
			const allowedOrigin = import.meta.env.VITE_PARENT_URL; // Parent application URL

			// Validate the origin of the message
			if (event.origin === allowedOrigin) {
				const { token, userData, username } = event.data; // Token sent by parent app
				if (token && userData && username) {
					// Save token to local storage
					setToken(token);
					localStorage.setItem('authToken', token);

					// Save username to state and local storage
					setUsername(username);
					localStorage.setItem('username', username);

					// Save user data to state and local storage
					setCurrentUser(userData);
					getUserRole(userData);
					getAccountList();
					localStorage.setItem('userData', JSON.stringify(userData));

					// Set authentication status to true
					setIsAuth(true);

					// Optionally fetch additional user details if needed
					getUser(token, username); // Fetch user details using the token and username
					console.log('User data and token received via postMessage:', {
						token,
						userData,
						username,
					});
				} else {
					console.warn(
						'Invalid message data received. Missing token, userData, or username:',
						event.data
					);
				}
			} else {
				console.warn('Untrusted origin:', event.origin);
			}
		};

		// Add event listener for message
		window.addEventListener('message', handleMessage);

		// Cleanup on component unmount
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	function getUserRole(currentUser) {
		getAllDrivers().then((res) => {
			const allUsers = res.users;
			const user = allUsers.find((user) => user?.id === currentUser?.id);
			if (user) {
				const updatedUser = {
					...currentUser,
					role: user.role,
					isAdmin: user.role === 1,
				};
				setCurrentUser(updatedUser);
				localStorage.setItem('userData', JSON.stringify(updatedUser)); // Save with role
			}
		});
	}

	const value = {
		currentUser,
		isAuth,
		isLoading,
		login,
		logout,
		getToken,
		setToken,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
