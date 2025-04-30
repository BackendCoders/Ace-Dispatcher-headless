/** @format */

import {
	AdvancedMarker,
	APIProvider,
	Map,
	useMap,
	useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllGPS } from '../utils/apiReq';
import { convertHexToRgba } from '../utils/isLight';

const GoogleMap = () => {
	const pos = { lat: 51.0397, lng: -2.2863 };
	const mapRef = useRef(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const [tileLoaded, setTileLoaded] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const timeoutRef = useRef(null);
	const [drivers, setDrivers] = useState([]);
	const [isBouncing, setIsBouncing] = useState(false);
	const data = useSelector((state) => state.bookingForm.bookings);
	const activeTab = useSelector(
		(state) => state.bookingForm.activeBookingIndex
	);
	const currentBooking = data[activeTab];
	const hasBookingData =
		currentBooking?.pickupAddress && currentBooking?.destinationAddress
			? true
			: false;

	// Fetch driver GPS data
	const fetchGPSData = async () => {
		try {
			const response = await getAllGPS();
			if (response?.status === 'success') {
				const mappedDrivers = Object.values(response).filter(
					(item) => typeof item === 'object'
				);
				setDrivers(mappedDrivers);
			}
		} catch (error) {
			console.error('Error fetching GPS data:', error);
		}
	};

	useEffect(() => {
		if (!hasBookingData) {
			fetchGPSData();
			const interval = setInterval(fetchGPSData, 10000);
			return () => clearInterval(interval);
		}
	}, [hasBookingData]);

	const handleMapLoad = () => {
		setMapLoaded(true);
	};

	const handleMapError = (error) => {
		console.error('Error loading Google Maps API:', error);
		setMapLoaded(false);
	};

	useEffect(() => {
		if (!mapLoaded || (mapLoaded && !tileLoaded)) {
			timeoutRef.current = setTimeout(() => {
				setReloadKey((prevKey) => prevKey + 1);
			}, 1000);
		} else if (mapLoaded && tileLoaded) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [mapLoaded, tileLoaded]);

	const getColoredCarIcon = (color) =>
		`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
		  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="${convertHexToRgba(
				color
			)}">
			<path fill="${convertHexToRgba(
				color
			)}" d="M5 16c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm13 0c-.55 0-1 
			  .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-13.65-2.5l1.45-4.5h11.4l1.45 
			  4.5H4.35zM20 8h-1.26l-1.6-4.79A1.99 1.99 0 0015.21 2H8.79c-.84 0-1.59.52-1.89 
			  1.31L5.26 8H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1c0 1.1.9 2 2 2s2-.9 
			  2-2h6c0 1.1.9 2 2 2s2-.9 2-2h1c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z"/>
		  </svg>
		`)}`;

	return (
		<APIProvider
			apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
			onLoad={handleMapLoad}
			onError={handleMapError}
		>
			{mapLoaded ? (
				<Map
					key={reloadKey}
					defaultZoom={13}
					defaultCenter={pos}
					disableDefaultUI={true}
					onTilesLoaded={(tile) => {
						mapRef.current = tile.map;
						setTileLoaded(true);
					}}
					fullscreenControl={true}
					zoomControl={true}
					style={{ height: '50%', width: '100%' }}
					mapId='da37f3254c6a6d1c'
				>
					{tileLoaded && (
						<>
							{hasBookingData ? (
								<Direction mapRef={mapRef} />
							) : (
								drivers.map((driver) => (
									<AdvancedMarker
										key={driver.userId}
										position={{
											lat: driver.latitude || 0,
											lng: driver.longitude || 0,
										}}
										title={`Driver: ${driver.username || 'Unknown'} | Speed: ${
											driver.speed?.toFixed(2) || 'N/A'
										} km/h`}
									>
										<img
											src={getColoredCarIcon(driver.htmlColor || '#fff')}
											alt='car'
											style={{
												width: '25px',
												height: '25px',
												animation:
													isBouncing === driver.regNo
														? 'bounce 0.5s infinite alternate'
														: 'none',
											}}
										/>
									</AdvancedMarker>
								))
							)}
						</>
					)}
				</Map>
			) : (
				<div className='flex justify-center items-center'>
					<div className='spinner'></div>
				</div>
			)}
		</APIProvider>
	);
};

function Direction({ mapRef }) {
	const map = useMap();
	const routeLibrary = useMapsLibrary('routes');
	const [directionService, setDirectionService] = useState(null);
	const [directionRenderer, setDirectionRenderer] = useState(null);

	const data = useSelector((state) => state.bookingForm.bookings);
	const activeTab = useSelector(
		(state) => state.bookingForm.activeBookingIndex
	);
	const currentBooking = data[activeTab] || {};
	const {
		pickupAddress,
		pickupPostCode,
		destinationAddress,
		destinationPostCode,
		vias,
	} = currentBooking;

	useEffect(() => {
		if (!routeLibrary || !map) {
			return;
		}
		const renderer = new routeLibrary.DirectionsRenderer({ map });
		setDirectionService(new routeLibrary.DirectionsService());
		setDirectionRenderer(renderer);

		return () => {
			// Clean up renderer when component unmounts
			renderer.setMap(null);
			setDirectionService(null);
			setDirectionRenderer(null);
		};
	}, [map, routeLibrary]);

	useEffect(() => {
		if (!directionService || !directionRenderer) {
			return;
		}

		if (!pickupAddress || !destinationAddress) {
			directionRenderer.setDirections({ routes: [] });

			if (mapRef.current) {
				mapRef.current.setZoom(13);
				mapRef.current.setCenter({ lat: 51.0388, lng: -2.2799 });
			}
			return;
		}

		const waypoints = vias.map((via) => ({
			location: `${via.address}, ${via.postCode}`,
		}));

		directionService
			.route({
				origin: `${pickupAddress}, ${pickupPostCode}`,
				destination: `${destinationAddress}, ${destinationPostCode}`,
				travelMode: window.google.maps.TravelMode.DRIVING,
				provideRouteAlternatives: true,
				waypoints,
			})
			.then((res) => {
				directionRenderer.setDirections(res);

				if (mapRef.current && res.routes.length > 0) {
					const bounds = new window.google.maps.LatLngBounds();
					res.routes.forEach((route) => {
						route.bounds && bounds.extend(route.bounds.getNorthEast());
						route.bounds && bounds.extend(route.bounds.getSouthWest());
					});
					mapRef.current.fitBounds(bounds);
				}
			})
			.catch((err) =>
				console.error('Error occurred while fetching directions:', err)
			);

		return () => {
			// Clear directions when dependencies change
			directionRenderer.setDirections({ routes: [] });
			if (mapRef.current) {
				mapRef.current.setZoom(13);
				mapRef.current.setCenter({ lat: 51.0388, lng: -2.2799 });
			}
		};
	}, [
		directionService,
		directionRenderer,
		pickupAddress,
		pickupPostCode,
		destinationAddress,
		destinationPostCode,
		vias,
		mapRef,
	]);

	return null;
}

export default GoogleMap;
