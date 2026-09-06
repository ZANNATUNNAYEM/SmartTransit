const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// In-memory cache for weather data (TTL: 5 minutes)
const weatherCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchWeather(lat, lng) {
  const cacheKey = `weather:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const now = Date.now();

  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  console.log(`Fetching live weather from OpenWeather API for lat:${lat}, lng:${lng}`);

  // In case no valid key is provided, return a mock response for fallback/testing
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes('placeholder')) {
    const mockData = {
      condition: 'Rain',
      temp: 24,
      humidity: 85,
      severity: 'moderate',
      timestamp: now,
      mock: true,
    };
    weatherCache.set(cacheKey, { data: mockData, timestamp: now });
    return mockData;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeather API returned status: ${response.status}`);
  }

  const data = await response.json();

  let condition = 'Clear';
  let severity = 'none';

  if (data.weather && data.weather[0]) {
    condition = data.weather[0].main;
  }

  if (condition === 'Rain') {
    severity = 'moderate';
  } else if (condition === 'Thunderstorm' || condition === 'Extreme') {
    severity = 'severe';
  }

  const result = {
    condition,
    temp: data.main.temp,
    humidity: data.main.humidity,
    severity,
    timestamp: now,
    mock: false,
  };

  weatherCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}
