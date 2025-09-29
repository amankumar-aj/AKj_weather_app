// API Configuration
const api_key = '7467c1d7b6298d3aa85f264dfb58ba58';

// DOM Elements
let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    locationBtn = document.getElementById('locationBtn'),
    suggestionsBox = document.getElementById('suggestionsBox'),
    currentWeatherCard = document.querySelectorAll('.weather-left .card')[0],
    fiveDaysForecastCard = document.querySelector('.day-forecast'),
    aqiCard = document.querySelectorAll('.highlights .card')[0],
    sunriseCard = document.querySelectorAll('.highlights .card')[1],
    humidityVal = document.getElementById('humidityVal'),
    pressureVal = document.getElementById('pressureVal'),
    visibilityVal = document.getElementById('visibilityVal'),
    windspeedVal = document.getElementById('windspeedVal'),
    feelsVal = document.getElementById('feelsVal'),
    hourlyForecastCard = document.querySelector('.hourly-forecast'),
    aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

// Variables for suggestions
let debounceTimer;
let currentSuggestions = [];

// Initialize app with Delhi weather when page loads
function initializeApp() {
    getCityCoordinates('Delhi');
}

// Debounce function for search suggestions
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Get city suggestions from OpenWeather Geocoding API
async function getCitySuggestions(query) {
    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    showLoadingSuggestions();
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${api_key}`
        );
        const data = await response.json();
        
        currentSuggestions = data;
        displaySuggestions(data);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        showNoResults();
    }
}

// Display suggestions in the dropdown
function displaySuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        showNoResults();
        return;
    }

    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.add('active');
    suggestionsBox.classList.remove('loading', 'no-results');

    suggestions.forEach((city, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <span class="suggestion-name">${city.name}</span>
            <span class="suggestion-details">${city.country}${city.state ? `, ${city.state}` : ''}</span>
        `;
        
        suggestionItem.addEventListener('click', () => {
            selectSuggestion(city);
        });

        // Add keyboard navigation
        suggestionItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                selectSuggestion(city);
            }
        });

        suggestionItem.setAttribute('tabindex', '0');
        suggestionsBox.appendChild(suggestionItem);
    });
}

// Show loading state for suggestions
function showLoadingSuggestions() {
    suggestionsBox.innerHTML = '<div class="suggestion-item">Searching...</div>';
    suggestionsBox.classList.add('active', 'loading');
    suggestionsBox.classList.remove('no-results');
}

// Show no results message
function showNoResults() {
    suggestionsBox.innerHTML = '<div class="suggestion-item">No cities found</div>';
    suggestionsBox.classList.add('active', 'no-results');
    suggestionsBox.classList.remove('loading');
}

// Hide suggestions
function hideSuggestions() {
    suggestionsBox.classList.remove('active', 'loading', 'no-results');
    currentSuggestions = [];
}

// Select a suggestion
function selectSuggestion(city) {
    cityInput.value = `${city.name}, ${city.country}`;
    hideSuggestions();
    getWeatherDetails(city.name, city.lat, city.lon, city.country, city.state);
}

// Keyboard navigation for suggestions
function handleKeyboardNavigation(e) {
    const suggestions = suggestionsBox.querySelectorAll('.suggestion-item');
    const activeElement = document.activeElement;
    let currentIndex = -1;

    if (!suggestionsBox.classList.contains('active') || suggestions.length === 0) {
        return;
    }

    suggestions.forEach((suggestion, index) => {
        if (suggestion === activeElement) {
            currentIndex = index;
        }
    });

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
            suggestions[nextIndex].focus();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
            suggestions[prevIndex].focus();
            break;
            
        case 'Escape':
            hideSuggestions();
            cityInput.focus();
            break;
            
        case 'Enter':
            if (currentIndex !== -1) {
                e.preventDefault();
                suggestions[currentIndex].click();
            }
            break;
    }
}

function getWeatherDetails(name, lat, lon, country, state) {
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`,
        WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`,
        AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;

    let days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];

    let months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    // Fetch AQI
    fetch(AIR_POLLUTION_API_URL)
        .then(res => res.json())
        .then(data => {
            let { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
            aqiCard.innerHTML = `
                <div class="card-head">
                    <p>Air Quality Index</p>
                    <p class="air-index aqi-${data.list[0].main.aqi}">${aqiList[data.list[0].main.aqi - 1]}</p>
                </div>

                <div class="air-indices">
                    <i class="fa-regular fa-wind fa-3x"></i>
                    <div class="item"><p>PM2.5</p><h2>${pm2_5.toFixed(1)}</h2></div>
                    <div class="item"><p>PM10</p><h2>${pm10.toFixed(1)}</h2></div>
                    <div class="item"><p>SO2</p><h2>${so2.toFixed(1)}</h2></div>
                    <div class="item"><p>CO</p><h2>${co.toFixed(1)}</h2></div>
                    <div class="item"><p>NO</p><h2>${no.toFixed(1)}</h2></div>
                    <div class="item"><p>NO2</p><h2>${no2.toFixed(1)}</h2></div>
                    <div class="item"><p>NH3</p><h2>${nh3.toFixed(1)}</h2></div>
                </div>
            `;
        })
        .catch((error) => {
            console.error("Failed to fetch AQI:", error);
            aqiCard.innerHTML = `
                <div class="card-head">
                    <p>Air Quality Index</p>
                    <p class="air-index aqi-1">Good</p>
                </div>
                <div class="air-indices">
                    <i class="fa-regular fa-wind fa-3x"></i>
                    <p>AQI data not available</p>
                </div>
            `;
        });

    // Fetch current weather
    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            let date = new Date();
            let hours = date.getHours().toString().padStart(2, '0');
            let minutes = date.getMinutes().toString().padStart(2, '0'); 
            let seconds = date.getSeconds().toString().padStart(2, '0'); 
            let currentTime = `${hours}:${minutes}:${seconds}`;
            
            currentWeatherCard.innerHTML = `
                <div class="current-weather">
                    <div class="details">
                        <p>Now</p>
                        <h2>${(data.main.temp - 273.15).toFixed(1)}°C</h2>
                        <p>${data.weather[0].description}</p>
                    </div>
                    <div class="weather-icon">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather-icon">
                    </div>
                </div>
                <hr><br>
                <div class="card-footer">
                    <p><i class="fa-light fa-calendar"></i> ${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}</p>
                    <p><i class="fa-light fa-location-dot"></i> ${name}, ${country}</p>
                    <p><i class="fa-light fa-clock"></i> Checked at: ${currentTime}</p>
                </div>
            `;

            let { sunrise, sunset } = data.sys,
                { timezone, visibility } = data,
                { humidity, pressure, feels_like } = data.main,
                { speed } = data.wind;

            let sRiseTime = moment.utc(sunrise, 'X').add(timezone, 'seconds').format('hh:mm A'),
                sSetTime = moment.utc(sunset, 'X').add(timezone, 'seconds').format('hh:mm A');

            sunriseCard.innerHTML = `
                <div class="card-head">
                    <p>Sunrise & Sunset</p>
                </div>
                <div class="sunrise-sunset">
                    <div class="item">
                        <div class="icon"><i class="fa-light fa-sunrise fa-4x"></i></div>
                        <div>
                            <p>Sunrise</p>
                            <h2>${sRiseTime}</h2>
                        </div>
                    </div>
                    <div class="item">
                        <div class="icon"><i class="fa-light fa-sunset fa-4x"></i></div>
                        <div>
                            <p>Sunset</p>
                            <h2>${sSetTime}</h2>
                        </div>
                    </div>
                </div>
            `;

            humidityVal.innerHTML = `${humidity}%`;
            pressureVal.innerHTML = `${pressure} hPa`;
            visibilityVal.innerHTML = `${(visibility / 1000).toFixed(1)} km`;
            windspeedVal.innerHTML = `${speed} m/s`;
            feelsVal.innerHTML = `${(feels_like - 273.15).toFixed(1)}°C`;
        })
        .catch((error) => {
            console.error("Failed to fetch current weather:", error);
            alert("Failed to fetch current weather data");
        });

    // Fetch forecast
    fetch(FORECAST_API_URL)
        .then(res => res.json())
        .then(data => {
            let hourlyForecast = data.list;
            hourlyForecastCard.innerHTML = '';

            for (let i = 0; i <= 7; i++) {
                let hrForecastDate = new Date(hourlyForecast[i].dt_txt);
                let hr = hrForecastDate.getHours();
                let a = 'PM';
                if (hr < 12) a = 'AM';
                if (hr == 0) hr = 12;
                if (hr > 12) hr -= 12;

                hourlyForecastCard.innerHTML += `
                    <div class="card">
                        <p>${hr} ${a}</p>
                        <img src="https://openweathermap.org/img/wn/${hourlyForecast[i].weather[0].icon}.png" alt="">
                        <p>${(hourlyForecast[i].main.temp - 273.15).toFixed(1)}°C</p>
                    </div>
                `;
            }

            let uniqueForecastDays = [];
            let fiveDaysForecast = data.list.filter(forecast => {
                let forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    uniqueForecastDays.push(forecastDate);
                    return true;
                }
                return false;
            });

            fiveDaysForecastCard.innerHTML = '';
            for (let i = 1; i < fiveDaysForecast.length; i++) {
                let date = new Date(fiveDaysForecast[i].dt_txt);
                fiveDaysForecastCard.innerHTML += `
                    <div class="forecast-item">
                        <div class="icon-wrapper">
                            <img src="https://openweathermap.org/img/wn/${fiveDaysForecast[i].weather[0].icon}.png" alt="icon-image">
                            <span>${(fiveDaysForecast[i].main.temp - 273.15).toFixed(1)}°C</span>
                        </div>
                        <p>${date.getDate()} ${months[date.getMonth()]}</p>
                        <p>${days[date.getDay()]}</p>
                    </div>
                `;
            }
        })
        .catch((error) => {
            console.error("Failed to fetch forecast:", error);
            alert("Failed to fetch forecast data");
        });
}

function getCityCoordinates(cityName = null) {
    let city = cityName || cityInput.value.trim();
    if (!cityName) {
        cityInput.value = '';
    }
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    hideSuggestions();

    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${api_key}`;
    
    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                alert(`City not found: ${city}`);
                return;
            }

            let { name, lat, lon, country, state } = data[0];
            getWeatherDetails(name, lat, lon, country, state);
        })
        .catch((error) => {
            console.error("Failed to fetch coordinates:", error);
            alert(`Failed to fetch coordinates of ${city}`);
        });
}

// User location
function getuserCoordinates() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        let { latitude, longitude } = position.coords;
        let REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;

        fetch(REVERSE_GEOCODING_URL)
            .then(res => res.json())
            .then(data => {
                let { name, country, state } = data[0];
                getWeatherDetails(name, latitude, longitude, country, state);
            })
            .catch((error) => {
                console.error("Failed to fetch user location:", error);
                alert('Failed to fetch user location');
            });
    }, error => {
        if (error.code === error.PERMISSION_DENIED) {
            alert("Location Permission denied. Please allow location permission to access weather");
        } else {
            alert("Unable to retrieve your location");
        }
    });
}

// Event Listeners
searchBtn.addEventListener('click', () => getCityCoordinates());
locationBtn.addEventListener('click', getuserCoordinates);

// City input event listeners for suggestions
cityInput.addEventListener('input', debounce((e) => {
    getCitySuggestions(e.target.value);
}, 300));

cityInput.addEventListener('focus', () => {
    if (cityInput.value.length >= 2 && currentSuggestions.length > 0) {
        suggestionsBox.classList.add('active');
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        hideSuggestions();
    }
});

// Keyboard navigation
cityInput.addEventListener('keydown', handleKeyboardNavigation);

// Allow Enter key to search
cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getCityCoordinates();
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});