/* ============================================================
   weatherAPI.js — [과제] 실시간 날씨 · 모듈 분리 + 비동기 호출
   · API 호출 로직을 별도 모듈로 분리 (관심사 분리)
   · Open-Meteo 무료 API 를 async/await + fetch 로 비동기 호출
   · 별도 API 키가 필요 없는 공개 엔드포인트 사용
   · export 로 함수들을 외부에 공개 (ES6 Module)
   ============================================================ */

// 위도(lat)·경도(lon)를 받아 현재 날씨 + 시간별/일별 예보를 비동기로 가져온다.
export async function fetchWeather(lat, lon) {
    var url = "https://api.open-meteo.com/v1/forecast" +
              "?latitude=" + lat +
              "&longitude=" + lon +
              "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
              "&hourly=temperature_2m" +
              "&daily=temperature_2m_max,temperature_2m_min" +
              "&timezone=auto&forecast_days=1";

    // await 로 응답을 기다린다 (비동기 호출)
    var response = await fetch(url);
    if (!response.ok) {
        throw new Error("날씨 정보를 불러오지 못했습니다. (HTTP " + response.status + ")");
    }

    var data = await response.json();
    var current = data.current;
    var units = data.current_units;

    // 지금 시각 이후의 시간별 기온 6개를 추린다 (시간별 미니 예보용)
    var hourly = [];
    if (data.hourly && data.hourly.time) {
        var times = data.hourly.time;
        var temps = data.hourly.temperature_2m;
        var nowHour = new Date().getHours();
        for (var i = 0; i < times.length && hourly.length < 6; i++) {
            var h = Number(times[i].slice(11, 13));   // "2026-07-16T14:00" → 14
            if (h >= nowHour) {
                hourly.push({ hour: h, temp: temps[i] });
            }
        }
    }

    // 필요한 값만 정리해서 반환
    return {
        temperature: current.temperature_2m,
        apparent: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m,
        weatherCode: current.weather_code,
        tempMax: data.daily ? data.daily.temperature_2m_max[0] : null,
        tempMin: data.daily ? data.daily.temperature_2m_min[0] : null,
        hourly: hourly,
        tempUnit: units.temperature_2m,           // 예: "°C"
        humidityUnit: units.relative_humidity_2m,  // 예: "%"
        windUnit: units.wind_speed_10m             // 예: "km/h"
    };
}

// WMO 날씨 코드 → 한국어 설명 + 아이콘 + 분위기 키(배경 색조용)
export function describeWeather(code) {
    var map = {
        0:  ["맑음", "☀️", "clear"],
        1:  ["대체로 맑음", "🌤️", "clear"], 2: ["구름 조금", "⛅", "cloud"], 3: ["흐림", "☁️", "cloud"],
        45: ["안개", "🌫️", "fog"], 48: ["짙은 안개", "🌫️", "fog"],
        51: ["약한 이슬비", "🌦️", "rain"], 53: ["이슬비", "🌦️", "rain"], 55: ["강한 이슬비", "🌧️", "rain"],
        61: ["약한 비", "🌧️", "rain"], 63: ["비", "🌧️", "rain"], 65: ["강한 비", "🌧️", "rain"],
        71: ["약한 눈", "🌨️", "snow"], 73: ["눈", "🌨️", "snow"], 75: ["강한 눈", "❄️", "snow"],
        80: ["소나기", "🌦️", "rain"], 81: ["소나기", "🌧️", "rain"], 82: ["강한 소나기", "⛈️", "storm"],
        95: ["뇌우", "⛈️", "storm"], 96: ["우박 동반 뇌우", "⛈️", "storm"], 99: ["강한 뇌우", "⛈️", "storm"]
    };
    return map[code] || ["알 수 없음", "🌡️", "clear"];
}
