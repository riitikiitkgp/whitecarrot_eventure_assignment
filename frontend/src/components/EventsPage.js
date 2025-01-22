import React, { useState, useEffect } from "react";
import "./EventsPage.css"; // Ensure you have the necessary styles

function EventsPage() {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    // useEffect(() => {
    //     filterEvents();  
    // }, [startDate, endDate, events]);

    const [nextPageToken, setNextPageToken] = useState(null);
    const [prevPageTokens, setPrevPageTokens] = useState([]);

    const fetchEvents = async (pageToken = null, isNext = true) => {
        // console.log(1);
        setLoading(true);
        try {
            // await new Promise(resolve => setTimeout(resolve, 800));
            const queryParams = new URLSearchParams();
            if (pageToken) queryParams.append('pageToken', pageToken);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const response = await fetch(`http://localhost:5000/events?${queryParams.toString()}`, {
            // const response = await fetch(`https://rendereventureflaskdeployment.onrender.com/events?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();
            // console.log(data)

            // setEvents(data.events);
            setNextPageToken(data.nextPageToken);

            setFilteredEvents(data.events);

            if (isNext && pageToken && (prevPageTokens.length === 0 || pageToken !== prevPageTokens[prevPageTokens.length - 1])) {
                // console.log("*");
                setPrevPageTokens(prevTokens => [...prevTokens, pageToken]);
            } else if (!isNext && prevPageTokens.length > 0) {
                setPrevPageTokens(prevTokens => prevTokens.slice(0, -1)); // Remove the last token if going back
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            setFilteredEvents([]); 
            return; 
        }
        fetchEvents();
    }, [startDate, endDate]);

    const handleNext = () => {
        if (nextPageToken) {
            fetchEvents(nextPageToken, true);
        }
    };

    const handlePrevious = () => {
        if (prevPageTokens.length > 1) {
            const newPrevTokens = [...prevPageTokens];
            newPrevTokens.pop();
            const prevPageToken = newPrevTokens[newPrevTokens.length - 1];
            fetchEvents(prevPageToken, false);
        } else {
            fetchEvents(null, false);
        }
    };

    // const filterEvents = () => {
    //     if (!startDate && !endDate) {
    //         setFilteredEvents(events);
    //         return;
    //     }

    //     const start = startDate ? new Date(startDate) : null;
    //     const end = endDate ? new Date(endDate) : null;

    //     const filtered = events.filter(event => {
    //         const eventDate = new Date(event.start.date || event.start.dateTime);

    //         if (start && end) {
    //             return eventDate >= start && eventDate <= end;
    //         } else if (start) {
    //             return eventDate >= start;
    //         } else if (end) {
    //             return eventDate <= end;
    //         }
    //         return true;
    //     });

    //     setFilteredEvents(filtered);
    // };

    return (
        <div className="eventpage">
            <div className="navbar-box">
                <h1>Eventure</h1>
                <div className="navbar-item-2">
                    <h1>Welcome User</h1>
                    <button className="logout-btn" onClick={() => {
                        localStorage.clear();
                        window.location.href = '/';
                    }}> Logout </button>
                </div>

            </div>
            <div className="box-2">

                <div className="event-filer-date flex justify-end mb-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div className="relative overflow-x-auto" style={{ maxHeight: '40vh' }}>
                    <table className="table w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Event Name</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Time</th>
                                <th scope="col" className="px-6 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">Loading events...</td>
                                </tr>
                            ) : startDate && endDate && new Date(startDate) > new Date(endDate) ? ( // Check if start date is greater than end date
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-red-500">Start date cannot be greater than end date.</td>
                                </tr>
                            ) : filteredEvents.length === 0 ? ( // Check if there are no events
                                <tr>
                                    <td colSpan="4" className="text-center py-4">No events</td>
                                </tr>
                            ) : (
                                filteredEvents.map((event, index) => {
                                    // console.log('Rendering event:', event);
                                    // console.log(prevPageTokens.length);
                                    const eventName = event.summary || "No Title";
                                    const startDate = event.start.date || event.start.dateTime;
                                    const date = new Date(startDate).toLocaleDateString();
                                    const time = event.start.dateTime ? new Date(startDate).toLocaleTimeString() : "All Day";
                                    const location = event.location || "No Location";

                                    return (
                                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <th scope="row" className="event-name-col px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white ">
                                                {eventName}
                                            </th>
                                            <td className="event-date-col px-6 py-4">{date}</td>
                                            <td className="event-time-col px-6 py-4">{time}</td>
                                            <td className="event-loc-col px-6 py-4">{location}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    {/* </div> */}

                    {!loading && (
                        <div className="pagination-buttons mt-4 flex justify-between">
                            <button
                                className={`pagination-btn px-4 py-2 bg-blue-500 text-white rounded ${prevPageTokens.length <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handlePrevious}
                                disabled={prevPageTokens.length <= 0}
                            >
                                Previous Events
                            </button>
                            <button
                                className={`pagination-btn px-4 py-2 bg-blue-500 text-white rounded ${!nextPageToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleNext}
                                disabled={!nextPageToken}
                            >
                                Next Events
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventsPage;