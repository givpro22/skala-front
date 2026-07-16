/* ============================================================
   realtimeInfo.js — [과제] 실시간 날씨 · DOM 조작 + 이벤트 처리
   · weatherAPI.js 모듈에서 함수들을 import (모듈 분리)
   · <select> 도시 선택 change 이벤트 → 날씨를 비동기로 조회
   · 결과를 DOM(innerHTML)에 실시간으로 반영 (현재/체감/풍속/최고최저/시간별)
   · 터미널(weather 명령)에서도 재사용하도록 window 에 노출
   · <script type="module"> 로 로드해야 import 가 동작함
   ============================================================ */

import { fetchWeather, describeWeather } from "./weatherAPI.js";

// 터미널 등 다른(비모듈) 스크립트에서 재사용할 수 있게 전역에 노출
window.skalaWeather = { fetch: fetchWeather, describe: describeWeather, cities: {} };

// 시간별 기온 → 미니 막대 그래프(sparkline) HTML 생성
function buildHourly(hourly, unit) {
    if (!hourly || !hourly.length) return "";
    var temps = hourly.map(function (h) { return h.temp; });
    var min = Math.min.apply(null, temps);
    var max = Math.max.apply(null, temps);
    var span = (max - min) || 1;
    var bars = hourly.map(function (h) {
        var px = 14 + Math.round((h.temp - min) / span * 46);  // 14~60px
        return '<div class="wh-col" title="' + h.hour + '시 ' + h.temp + unit + '">' +
                   '<span class="wh-t">' + Math.round(h.temp) + '°</span>' +
                   '<span class="wh-bar" style="height:' + px + 'px"></span>' +
                   '<span class="wh-h">' + h.hour + '시</span>' +
               '</div>';
    }).join("");
    return '<div class="weather-hourly">' + bars + '</div>';
}

// 날씨 데이터 → 카드 HTML 생성 (터미널/위젯 공용)
function renderCard(city, w) {
    var desc = describeWeather(w.weatherCode);
    return '<div class="weather-card" data-sky="' + desc[2] + '">' +
        '<div class="weather-top">' +
            '<div class="weather-icon">' + desc[1] + '</div>' +
            '<div class="weather-info">' +
                '<p class="weather-city">' + city + '</p>' +
                '<p class="weather-temp">' + Math.round(w.temperature) + w.tempUnit + '</p>' +
                '<p class="weather-meta">' + desc[0] + ' · 체감 ' + Math.round(w.apparent) + w.tempUnit + '</p>' +
            '</div>' +
        '</div>' +
        '<div class="weather-stats">' +
            '<span class="ws"><b>💧 습도</b>' + w.humidity + w.humidityUnit + '</span>' +
            '<span class="ws"><b>🌬 바람</b>' + Math.round(w.wind) + ' ' + w.windUnit + '</span>' +
            '<span class="ws"><b>↑ 최고</b>' + Math.round(w.tempMax) + w.tempUnit + '</span>' +
            '<span class="ws"><b>↓ 최저</b>' + Math.round(w.tempMin) + w.tempUnit + '</span>' +
        '</div>' +
        buildHourly(w.hourly, w.tempUnit) +
    '</div>';
}
window.skalaWeather.renderCard = renderCard;

document.addEventListener("DOMContentLoaded", function () {
    var select = document.getElementById("citySelect");
    var box = document.getElementById("weather-box");
    if (!select || !box) return;

    // <option> 들을 순회하며 도시명→좌표 사전을 구성 (터미널 weather 명령용)
    for (var i = 0; i < select.options.length; i++) {
        var o = select.options[i];
        window.skalaWeather.cities[o.textContent.trim()] = { lat: o.dataset.lat, lon: o.dataset.lon };
    }

    var first = true;

    // 선택된 도시의 날씨를 조회해 화면에 반영하는 함수
    async function updateWeather() {
        var opt = select.options[select.selectedIndex];
        var city = opt.textContent.trim();
        var lat = opt.dataset.lat;
        var lon = opt.dataset.lon;

        if (!lat || !lon) {
            box.innerHTML = '<p class="weather-hint">도시를 선택하면 실시간 날씨를 보여드려요.</p>';
            return;
        }

        // 로딩 상태 표시 (DOM 조작)
        box.innerHTML = '<p class="weather-loading">' + city + ' 날씨를 불러오는 중...</p>';

        try {
            var w = await fetchWeather(lat, lon);
            box.innerHTML = renderCard(city, w);
            // 사용자가 직접 도시를 바꿔 조회하면 업적 해금 (첫 자동조회는 제외)
            if (!first && window.unlock) window.unlock("weather");
            first = false;
        } catch (err) {
            box.innerHTML = '<p class="weather-err">' + err.message + '</p>';
            first = false;
        }
    }

    // change 이벤트 등록 (이벤트 처리)
    select.addEventListener("change", updateWeather);

    // 첫 진입 시 기본 선택 도시의 날씨를 자동으로 조회
    updateWeather();
});
