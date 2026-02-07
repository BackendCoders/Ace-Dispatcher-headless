import { useRef } from 'react';

function createSessionToken() {
	// Modern browsers: cryptographically strong UUID
	return crypto.randomUUID();
}

export function useAddressSessionToken() {
	const tokenRef = useRef(null);

	const getToken = () => {
		if (!tokenRef.current) tokenRef.current = createSessionToken();
		return tokenRef.current;
	};

	const resetToken = () => {
		tokenRef.current = null;
	};

	return { getToken, resetToken };
}
