// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locateBtn = document.getElementById('locate-btn');
const locationName = document.getElementById('location-name');
const lastUpdated = document.getElementById('last-updated');
const currentTemp = document.getElementById('current-temp');
const weatherDesc = document.getElementById('weather-desc');
const weatherIconDisplay = document.getElementById('weather-icon-display');

// 6 Current Metrics
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const uvIndex = document.getElementById('uv-index');
const precipitation = document.getElementById('precipitation');

// Air Quality Elements
const aqiValue = document.getElementById('aqi-value');
const aqiLabel = document.querySelector('.aqi-label');
const aqiStatus = document.getElementById('aqi-status');
const aqiFillRing = document.getElementById('aqi-fill-ring');

const pollutantPm10 = document.getElementById('pollutant-pm10');
const pollutantO3 = document.getElementById('pollutant-o3');
const pollutantSo2 = document.getElementById('pollutant-so2');
const pollutantPm25 = document.getElementById('pollutant-pm25');
const pollutantCo = document.getElementById('pollutant-co');
const pollutantNo2 = document.getElementById('pollutant-no2');

const dotPm10 = document.getElementById('dot-pm10');
const dotO3 = document.getElementById('dot-o3');
const dotSo2 = document.getElementById('dot-so2');
const dotPm25 = document.getElementById('dot-pm25');
const dotCo = document.getElementById('dot-co');
const dotNo2 = document.getElementById('dot-no2');

// Sunrise / Sunset
const sunriseTime = document.getElementById('sunrise-time');
const sunsetTime = document.getElementById('sunset-time');

// Containers
const forecastDaysContainer = document.getElementById('forecast-days-container');
const rainListContainer = document.getElementById('rain-list-container');
const forecastChart = document.getElementById('forecast-chart');

// City Coordinates for Quick Access Tabs
const QUICK_CITIES = {
    'Bangalore': { lat: 12.97194, lon: 77.59369, name: 'Bengaluru, Karnataka, India' },
    'Ajmer': { lat: 26.44989, lon: 74.63992, name: 'Ajmer, Rajasthan, India' },
    'Hyderabad': { lat: 17.38504, lon: 78.48667, name: 'Hyderabad, Telangana, India' }
};

// Common city alias mappings for Geocoding search translation
const CITY_NAME_OVERRIDES = {
    'bangalore': 'Bengaluru',
    'bombay': 'Mumbai',
    'calcutta': 'Kolkata',
    'madras': 'Chennai',
    'peking': 'Beijing',
    'saigon': 'Ho Chi Minh City'
};

// WMO Weather Codes mapping to Emojis and descriptions
// Reference: https://open-meteo.com/en/docs
function getWeatherDetails(code) {
    const map = {
        0: { desc: 'Clear sky', icon: '☀️' },
        1: { desc: 'Mainly clear', icon: '🌤️' },
        2: { desc: 'Partly cloudy', icon: '⛅' },
        3: { desc: 'Overcast', icon: '☁️' },
        45: { desc: 'Fog', icon: '🌫️' },
        48: { desc: 'Depositing rime fog', icon: '🌫️' },
        51: { desc: 'Light drizzle', icon: '🌦️' },
        53: { desc: 'Moderate drizzle', icon: '🌦️' },
        55: { desc: 'Dense drizzle', icon: '🌦️' },
        56: { desc: 'Light freezing drizzle', icon: '🌧️' },
        57: { desc: 'Dense freezing drizzle', icon: '🌧️' },
        61: { desc: 'Slight rain', icon: '🌧️' },
        63: { desc: 'Moderate rain', icon: '🌧️' },
        65: { desc: 'Heavy rain', icon: '🌧️' },
        66: { desc: 'Light freezing rain', icon: '🌧️' },
        67: { desc: 'Heavy freezing rain', icon: '🌧️' },
        71: { desc: 'Slight snow fall', icon: '❄️' },
        73: { desc: 'Moderate snow fall', icon: '❄️' },
        75: { desc: 'Heavy snow fall', icon: '❄️' },
        77: { desc: 'Snow grains', icon: '❄️' },
        80: { desc: 'Slight rain showers', icon: '🌦️' },
        81: { desc: 'Moderate rain showers', icon: '🌦️' },
        82: { desc: 'Violent rain showers', icon: '⛈️' },
        85: { desc: 'Slight snow showers', icon: '❄️' },
        86: { desc: 'Heavy snow showers', icon: '❄️' },
        95: { desc: 'Thunderstorm', icon: '⛈️' },
        96: { desc: 'Thunderstorm with slight hail', icon: '⛈️' },
        99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️' }
    };
    return map[code] || { desc: 'Unknown', icon: '🌡️' };
}

/**
 * Build a clean display location name without duplicate fields
 */
function buildDisplayName(name, region, country) {
    const parts = [];
    if (name) parts.push(name.trim());
    if (region && region.trim() !== name.trim()) parts.push(region.trim());
    if (country && country.trim() !== name.trim() && country.trim() !== (region || '').trim()) parts.push(country.trim());
    return parts.join(', ');
}

/**
 * Formats ISO date time string to localized Sunrise / Sunset format (e.g. 05:54 AM)
 */
function formatSunTime(isoString) {
    if (!isoString) return '--:-- --';
    const dateObj = new Date(isoString);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Formats ISO Date to full day name (e.g. Wednesday)
 */
function getDayName(isoDateString) {
    const dateObj = new Date(isoDateString);
    return dateObj.toLocaleDateString(undefined, { weekday: 'long' });
}

/**
 * Formats ISO Date to short day name (e.g. Wed)
 */
function getShortDayName(isoDateString) {
    const dateObj = new Date(isoDateString);
    return dateObj.toLocaleDateString(undefined, { weekday: 'short' });
}

/**
 * Fetches current temperatures of Bengaluru, Ajmer, and Hyderabad to update tab UI labels
 */
async function fetchTabTemperatures() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=12.97194,26.44989,17.38504&longitude=77.59369,74.63992,78.48667&current=temperature_2m`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        
        // Multi-coordinates queries return an array or object depending on input parameters
        const arrayData = Array.isArray(data) ? data : [data];
        if (arrayData.length >= 3) {
            document.getElementById('tab-temp-bangalore').textContent = `${Math.round(arrayData[0].current.temperature_2m)}°C`;
            document.getElementById('tab-temp-ajmer').textContent = `${Math.round(arrayData[1].current.temperature_2m)}°C`;
            document.getElementById('tab-temp-hyderabad').textContent = `${Math.round(arrayData[2].current.temperature_2m)}°C`;
        }
    } catch (e) {
        console.error('Error fetching tab temperatures:', e);
    }
}

/**
 * Returns color status and numeric threshold classification for AQI values (European AQI index scale 0-100+)
 */
function getAqiDetails(val) {
    if (val <= 20) return { label: 'Good', color: '#10b981', desc: 'Air is clean and healthy' };
    if (val <= 40) return { label: 'Fair', color: '#eab308', desc: 'Air quality is acceptable' };
    if (val <= 60) return { label: 'Moderate', color: '#f97316', desc: 'Moderate air pollution detected' };
    if (val <= 80) return { label: 'Poor', color: '#ef4444', desc: 'Poor air conditions. Take caution' };
    return { label: 'Very Poor', color: '#7f1d1d', desc: 'Hazardous air quality levels' };
}

/**
 * Helper to classification dot color class for pollutant metrics
 */
function updatePollutantStatus(element, dot, value, thresholds) {
    element.textContent = Math.round(value);
    
    // Clear existing status dot classes
    dot.className = 'pollutant-dot';
    
    if (value <= thresholds.good) {
        dot.classList.add('dot-green');
    } else if (value <= thresholds.fair) {
        dot.classList.add('dot-yellow');
    } else if (value <= thresholds.mod) {
        dot.classList.add('dot-orange');
    } else {
        dot.classList.add('dot-red');
    }
}

/**
 * Updates the SVG circular progress gauge and text contents for Air Quality overview
 */
function updateAqiWidget(aqiVal, dataCurrent) {
    // 1. Calculate main gauge
    const details = getAqiDetails(aqiVal);
    aqiValue.textContent = aqiVal;
    aqiLabel.textContent = details.label;
    aqiLabel.style.color = details.color;
    aqiStatus.textContent = details.desc;

    // SVG Circle Stroke calculation (Radius = 50, Circumference = 314)
    const ringPercentage = Math.min(aqiVal, 100);
    const offset = 314 - (314 * ringPercentage) / 100;
    aqiFillRing.style.stroke = details.color;
    aqiFillRing.style.strokeDashoffset = offset;

    // 2. Map pollutants grid
    // European Environmental Agency Standard thresholds
    updatePollutantStatus(pollutantPm10, dotPm10, dataCurrent.pm10, { good: 20, fair: 40, mod: 50 });
    updatePollutantStatus(pollutantO3, dotO3, dataCurrent.ozone, { good: 50, fair: 100, mod: 130 });
    updatePollutantStatus(pollutantSo2, dotSo2, dataCurrent.sulphur_dioxide, { good: 50, fair: 100, mod: 200 });
    updatePollutantStatus(pollutantPm25, dotPm25, dataCurrent.pm2_5, { good: 10, fair: 20, mod: 25 });
    updatePollutantStatus(pollutantCo, dotCo, dataCurrent.carbon_monoxide, { good: 4000, fair: 7000, mod: 10000 });
    updatePollutantStatus(pollutantNo2, dotNo2, dataCurrent.nitrogen_dioxide, { good: 40, fair: 90, mod: 120 });
}

/**
 * Renders the 7-day forecast cards at the top of the forecast widget
 */
function renderForecastDays(daily) {
    forecastDaysContainer.innerHTML = '';
    
    // Skip index 0 (today) to show the next 7 days in the horizontal list
    for (let i = 0; i < 7; i++) {
        const timeVal = daily.time[i];
        const tempMax = daily.temperature_2m_max[i];
        const code = daily.weather_code[i];
        const details = getWeatherDetails(code);

        const card = document.createElement('div');
        card.className = 'forecast-day-card';
        card.innerHTML = `
            <span class="forecast-card-name">${getShortDayName(timeVal)}</span>
            <span class="forecast-card-icon">${details.icon}</span>
            <span class="forecast-card-temp">${Math.round(tempMax)}°C</span>
        `;
        forecastDaysContainer.appendChild(card);
    }
}

/**
 * Renders the vertical list of days showing precipitation probabilities
 */
function renderChancesOfRain(daily) {
    rainListContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const timeVal = daily.time[i];
        const rainProb = daily.precipitation_probability_max[i] ?? 0;

        const row = document.createElement('div');
        row.className = 'rain-row';
        row.innerHTML = `
            <span class="rain-day-name">${getDayName(timeVal)}</span>
            <div class="rain-bar-container">
                <div class="rain-bar-fill" style="width: ${rainProb}%"></div>
            </div>
            <span class="rain-percent">${rainProb}%</span>
        `;
        rainListContainer.appendChild(row);
    }
}

/**
 * Draws a highly polished curved line chart on the Canvas displaying temperature trends
 */
function drawForecastChart(daily) {
    if (!forecastChart) return;
    
    const temps = daily.temperature_2m_max.slice(0, 7);
    const dayLabels = daily.time.slice(0, 7).map(t => getDayName(t));

    // Handle high DPI screens for sharp canvas rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = forecastChart.getBoundingClientRect();
    forecastChart.width = rect.width * dpr;
    forecastChart.height = rect.height * dpr;
    forecastChart.style.width = `${rect.width}px`;
    forecastChart.style.height = `${rect.height}px`;

    const ctx = forecastChart.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const width = rect.width;
    const height = rect.height;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Scale calculations
    const minTemp = Math.min(...temps) - 1;
    const maxTemp = Math.max(...temps) + 1;
    const tempRange = maxTemp - minTemp;

    // Calculate coordinate points
    const points = temps.map((temp, index) => {
        const x = paddingLeft + (index / (temps.length - 1)) * chartWidth;
        const y = paddingTop + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
        return { x, y };
    });

    // 1. Draw Gradient fill under the curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
    }
    // Close the path to form a polygon for gradient fill
    ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
    ctx.lineTo(points[0].x, height - paddingBottom);
    ctx.closePath();

    const fillGradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    fillGradient.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    fillGradient.addColorStop(1, 'rgba(56, 189, 248, 0.00)');
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // 2. Draw curved trend line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    
    // Reset shadow properties for text and points
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 3. Draw circular glowing points on temperature nodes
    points.forEach((p, idx) => {
        // Inner circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Outer glow border ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    });

    // 4. Draw temperature text values above points
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 12px Inter';
    ctx.textAlign = 'center';
    points.forEach((p, idx) => {
        ctx.fillText(`${Math.round(temps[idx])}°C`, p.x, p.y - 14);
    });

    // 5. Draw horizontal day names below points
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Inter';
    ctx.textAlign = 'center';
    points.forEach((p, idx) => {
        ctx.fillText(dayLabels[idx], p.x, height - 10);
    });
}

/**
 * Fetches real-time weather and air quality from Open-Meteo free API using coordinates
 * @param {number} lat 
 * @param {number} lon 
 * @param {string} displayName 
 */
async function fetchWeatherByCoords(lat, lon, displayName) {
    try {
        // 1. Fetch main weather forecast details (7 days)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,pressure_msl,weather_code,precipitation&daily=temperature_2m_max,weather_code,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error(`Weather service error (Status ${weatherResponse.status})`);
        }

        const weatherData = await weatherResponse.json();

        // 2. Fetch air quality details
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
        const airQualityResponse = await fetch(airQualityUrl);
        
        let aqiVal = 9; // Default mockup placeholder
        let aqiCurrent = { pm10: 9, ozone: 50, sulphur_dioxide: 14, pm2_5: 7, carbon_monoxide: 577, nitrogen_dioxide: 14 };

        if (airQualityResponse.ok) {
            const aqData = await airQualityResponse.json();
            if (aqData.current) {
                aqiVal = aqData.current.european_aqi ?? 9;
                aqiCurrent = aqData.current;
            }
        }

        // 3. Dynamically update Dashboard UI components
        updateDashboard(weatherData, aqiVal, aqiCurrent, displayName);

    } catch (error) {
        console.error('Weather Coords Fetch Error:', error.message);
        alert(`Failed to fetch weather: ${error.message}`);
    }
}

/**
 * Fetches weather by searching city names and geocoding
 * @param {string} city 
 */
async function fetchWeatherData(city) {
    try {
        let cleanCity = city.trim();
        if (!cleanCity) return;

        // Apply city alias overrides if matched (case-insensitive)
        const lowerCity = cleanCity.toLowerCase();
        if (CITY_NAME_OVERRIDES[lowerCity]) {
            cleanCity = CITY_NAME_OVERRIDES[lowerCity];
        }

        // 1. Geocode city name to coordinates
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (!geocodeResponse.ok) {
            throw new Error(`Geocoding service error (Status ${geocodeResponse.status})`);
        }
        
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('City not found. Please verify the spelling.');
        }

        const location = geocodeData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const displayName = buildDisplayName(location.name, location.admin1, location.country);

        // Update active quick tab states if query matches tab cities
        updateActiveTab(location.name);

        // 2. Fetch weather using coordinates
        await fetchWeatherByCoords(lat, lon, displayName);

    } catch (error) {
        console.error('Weather Fetch Error:', error.message);
        alert(`Failed to fetch weather data: ${error.message}`);
    }
}

/**
 * HTML5 Geolocation API coordinate query
 */
function locateUser() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    locateBtn.textContent = '⌛';
    locateBtn.style.pointerEvents = 'none';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const reverseGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
                const response = await fetch(reverseGeoUrl);
                
                let displayName = 'Current Location';
                if (response.ok) {
                    const data = await response.json();
                    const cityName = data.city || data.locality || 'Current Location';
                    displayName = buildDisplayName(cityName, data.principalSubdivision, data.countryName);
                }

                // De-activate quick tabs since it's custom coordinates geolocation
                document.querySelectorAll('.city-tab').forEach(t => t.classList.remove('active'));

                await fetchWeatherByCoords(lat, lon, displayName);
            } catch (err) {
                console.error('Reverse Geocode Error:', err.message);
                await fetchWeatherByCoords(lat, lon, `Loc: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
            } finally {
                locateBtn.textContent = '📍';
                locateBtn.style.pointerEvents = 'auto';
            }
        },
        (error) => {
            console.error('Geolocation Error:', error);
            let errMsg = 'Unable to retrieve your location.';
            if (error.code === error.PERMISSION_DENIED) {
                errMsg = 'Location permission denied. Please allow location access in your browser settings.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errMsg = 'Location information is unavailable.';
            } else if (error.code === error.TIMEOUT) {
                errMsg = 'Location request timed out.';
            }
            alert(errMsg);
            locateBtn.textContent = '📍';
            locateBtn.style.pointerEvents = 'auto';
        },
        { timeout: 10000 }
    );
}

/**
 * Updates active class styling state on horizontal city tabs
 */
function updateActiveTab(cityName) {
    document.querySelectorAll('.city-tab').forEach(tab => {
        const tabCity = tab.getAttribute('data-city');
        const normalizedTab = tabCity.toLowerCase();
        const normalizedSearch = cityName.toLowerCase();
        
        // If matches Bangalore/Bengaluru or exact city names
        if (normalizedSearch.includes(normalizedTab) || normalizedTab.includes(normalizedSearch)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

/**
 * Dynamically updates all Dashboard UI components with API values
 */
function updateDashboard(weatherData, aqiVal, aqiCurrent, displayName) {
    const current = weatherData.current;
    const daily = weatherData.daily;
    const details = getWeatherDetails(current.weather_code);

    // 1. Current Weather Card
    locationName.textContent = displayName;
    currentTemp.textContent = Math.round(current.temperature_2m);
    weatherDesc.textContent = details.desc;
    weatherIconDisplay.textContent = details.icon;

    if (current.time) {
        const timeObj = new Date(current.time);
        const dayNum = timeObj.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthStr = monthNames[timeObj.getMonth()];
        lastUpdated.textContent = `Last Updated, ${dayNum} ${monthStr}`;
    } else {
        lastUpdated.textContent = 'Last Updated, --';
    }

    // 2. 6 Weather Metrics
    humidity.textContent = current.relative_humidity_2m;
    windSpeed.textContent = current.wind_speed_10m;
    
    if (current.visibility !== undefined) {
        visibility.textContent = (current.visibility / 1000).toFixed(0);
    } else {
        visibility.textContent = '--';
    }

    // Displays pressure converted to mm Hg (as shown in user mockup "1011 mm")
    if (current.pressure_msl !== undefined) {
        pressure.textContent = Math.round(current.pressure_msl);
    } else {
        pressure.textContent = '--';
    }

    // Map daily UV index maximum and current precipitation
    uvIndex.textContent = Math.round(daily.uv_index_max[0] ?? 0);
    precipitation.textContent = (current.precipitation ?? 0).toFixed(2);

    // 3. Air Quality gauge and pollutants grid
    updateAqiWidget(aqiVal, aqiCurrent);

    // 4. Sunrise & Sunset
    sunriseTime.textContent = formatSunTime(daily.sunrise[0]);
    sunsetTime.textContent = formatSunTime(daily.sunset[0]);

    // 5. 7-Day Forecast card header list
    renderForecastDays(daily);

    // 6. Chances of Rain progress bar lists
    renderChancesOfRain(daily);

    // 7. Render curved line chart
    drawForecastChart(daily);
}

// Search box query click listeners
searchBtn.addEventListener('click', () => fetchWeatherData(cityInput.value));

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        fetchWeatherData(cityInput.value);
    }
});

// Locate button query listener
locateBtn.addEventListener('click', locateUser);

// Quick tab toggles event listeners
document.querySelectorAll('.city-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const cityKey = tab.getAttribute('data-city');
        const coords = QUICK_CITIES[cityKey];
        if (coords) {
            document.querySelectorAll('.city-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            fetchWeatherByCoords(coords.lat, coords.lon, coords.name);
        }
    });
});

// Setup resize listener to redraw trend canvas chart when windows resizing
window.addEventListener('resize', () => {
    // Redraw the canvas chart if weather data exists on screen
    const nameVal = locationName.textContent;
    // Extract coords of current active tab or locate using active location
    const activeTab = document.querySelector('.city-tab.active');
    if (activeTab) {
        const cityKey = activeTab.getAttribute('data-city');
        const coords = QUICK_CITIES[cityKey];
        if (coords) {
            // Draw chart using coords daily data (we trigger fresh reload to capture scaled metrics)
            fetchWeatherByCoords(coords.lat, coords.lon, coords.name);
        }
    } else {
        // Fallback geocode current city title
        if (nameVal && nameVal !== '--') {
            fetchWeatherData(nameVal.split(',')[0]);
        }
    }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch current temperatures of access tabs
    fetchTabTemperatures();
    // 2. Load default Bangalore weather details
    fetchWeatherData('Bangalore');
});