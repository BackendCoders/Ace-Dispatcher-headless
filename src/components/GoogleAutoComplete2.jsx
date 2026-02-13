import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import { getAddress, resolveAddress } from '../utils/apiReq';
import { useAddressSessionToken } from '../hooks/useAddressSessionToken';

const objectToArray = (obj) =>
	Object.values(obj).filter((v) => typeof v === 'object');

function GoogleAutoComplete({
	placeholder,
	value,
	onChange,
	onPushChange, // This will push both the full address and postcode to the parent
	inputRef,
	handleChangeRef,
	handleClickRef,
	// setPostcodeFilled,
}) {
	const [suggestions, setSuggestions] = useState([]);
	const [showOption, setShowOption] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [blur, setBlur] = useState(false);
	const cacheRef = useRef({});
	const { getToken, resetToken } = useAddressSessionToken();

	// Handle input change and fetch address suggestions from both sources
	const handleInputChange = async (event) => {
		onChange(event); // Update the input field in the parent component
		const input = event.target.value.trim().toLowerCase();
		setHighlightedIndex(-1); // Reset highlighted index

		// Fetch suggestions if input length is greater than or equal to 4
		if (input.length >= 4) {
			if (cacheRef.current[input]) {
				setSuggestions(cacheRef.current[input]);
				setShowOption(true);
			} else {
				try {
					const sessionToken = getToken();
					const addressSuggestions = objectToArray(
						await getAddress(input, sessionToken),
					);

					const addressFormatted = addressSuggestions.map((suggestion) => {
						const cleanedAddress = suggestion.label;
						return {
							label: cleanedAddress, // Use the address directly
							name: suggestion.name,
							id: suggestion.id,
							address: cleanedAddress || 'Unknown Address',
							postcode:
								(suggestion?.label?.match(
									/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
								) || [''])[0] || suggestion.secondaryText,
							source: suggestion.type,
						};
					});
					// console.log({ addressFormatted });
					setSuggestions(addressFormatted);

					//Store the suggestions in the cache
					cacheRef.current[input] = addressFormatted;
				} catch (error) {
					console.error('Error fetching address suggestions:', error);
					setSuggestions([]); // Clear suggestions on error
				}
			}
		} else {
			resetToken();
			setSuggestions([]); // Clear suggestions if input is too short
		}
	};

	// Handle suggestion selection
	const handleSuggestionSelect = async (suggestion) => {
		let selectedAddress = suggestion.address || 'Unknown Address';
		let selectedPostcode = suggestion.postcode || 'No Postcode';

		// If the suggestion is from getAddress.io, fetch full details before updating the form
		if (suggestion.source === 'google') {
			try {
				const sessionToken = getToken();
				const fullDetails = await resolveAddress(suggestion.id, sessionToken);
				if (fullDetails) {
					// selectedAddress =
					// 	fullDetails.formatted_address.join(', ') || 'Unknown Address';
					selectedPostcode = fullDetails.postcode || 'No Postcode';
				}
			} catch (error) {
				console.error('Error fetching full address details:', error);
			}
		}

		// Update the input field directly with the selected address
		onChange({ target: { value: selectedAddress } });
		resetToken();

		// Push both the selected address and postcode to the parent component
		onPushChange({
			address: selectedAddress,
			postcode: selectedPostcode,
			name: suggestion.name || '',
		});
		// setPostcodeFilled(true); // Set postcode filled flag to true

		// Clear suggestions and reset highlighted index
		setSuggestions([]);
		setHighlightedIndex(-1);
	};

	// Handle blur to close the suggestions list
	const handleBlur = () => {
		setTimeout(() => {
			setBlur(true);
			setShowOption(false);
		}, 200); // Delay to allow click to register
	};

	// Handle keyboard navigation in the suggestions list
	const handleKeyDown = (event) => {
		if (showOption) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setHighlightedIndex((prevIndex) =>
					prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0,
				);
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				setHighlightedIndex((prevIndex) =>
					prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1,
				);
			} else if (event.key === 'Enter' && highlightedIndex >= 0) {
				event.preventDefault();
				handleSuggestionSelect(suggestions[highlightedIndex]);
			}
		}
	};

	// console.log('cache address', cacheRef.current);

	// Show the suggestions dropdown if there are suggestions and no blur
	useEffect(() => {
		if (suggestions.length > 0) setShowOption(true);
		if (value.length < 3) {
			setSuggestions([]);
			setShowOption(false);
		}
	}, [suggestions.length, value.length]);

	return (
		<div className='relative'>
			<TextField
				value={value}
				onFocus={() => setBlur(false)}
				onBlur={handleBlur}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				label={placeholder}
				fullWidth
				required={true}
				onKeyDownCapture={handleChangeRef}
				autoComplete='new-password'
				id={Math.random().toString(36).substring(7)}
				className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 w-full'
				inputRef={inputRef}
				onClick={handleClickRef}
			/>
			{showOption && !blur && (
				<ul className='absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-[40vh] overflow-auto'>
					{suggestions.map((option, index) => (
						<li
							key={index}
							onClick={() => {
								console.log('Clicked Option:', option);
								handleSuggestionSelect(option);
							}}
							onMouseOver={() => setHighlightedIndex(index)}
							className={`px-4 py-2 cursor-pointer ${
								index === highlightedIndex ? 'bg-gray-100' : ''
							}`}
						>
							{option.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default GoogleAutoComplete;
