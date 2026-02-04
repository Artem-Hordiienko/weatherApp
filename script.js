"use strict";

// Wrap everything in a listener to ensure HTML is ready
document.addEventListener("DOMContentLoaded", () => {

    // --- Configuration ---
    const UserStatus = {
        LoggedIn: "logged-in",
        LoggingIn: "logging-in",
        LoggedOut: "logged-out",
        LogInError: "log-in-error",
        VerifyingLogIn: "verifying-log-in"
    };

    const Default = {
        PIN: "1234"
    };

    const N = {
        clamp: (min, value, max) => Math.min(Math.max(min, value), max),
        rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
    };

    // --- DOM Elements ---
    const Dom = {
        root: document.getElementById("app"),
        inputs: {
            pin: document.getElementById("app-pin-hidden-input")
        },
        items: {
            pinDigits: document.querySelectorAll(".app-pin-digit"),
            pinError: document.getElementById("app-pin-error-text")
        },
        buttons: {
            signIn: document.getElementById("sign-in-button"),
            signOut: document.getElementById("sign-out-button"),
            cancel: document.getElementById("app-pin-cancel-text")
        },
        background: document.getElementById("app-background")
    };

    let currentState = UserStatus.LoggedOut;

    // --- Logic Helpers ---
    const LogInUtility = {
        verify: async (pin) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (pin === Default.PIN) {
                        resolve(true);
                    } else {
                        reject(`Invalid pin: ${pin}`);
                    }
                }, N.rand(300, 700));
            });
        }
    };

    // --- State Management ---
    const setUserStatusTo = (status) => {
        if (!Dom.root) return;

        Object.values(UserStatus).forEach(s => Dom.root.classList.remove(s));
        Dom.root.classList.add(status);
        currentState = status;

        if (status === UserStatus.LoggingIn || status === UserStatus.LogInError) {
            Dom.inputs.pin?.focus();
        }

        if (status === UserStatus.LoggedOut && Dom.inputs.pin) {
            Dom.inputs.pin.value = "";
            updatePinDisplay("");
        }
    };

    // --- UI Updates ---
    const updatePinDisplay = (value) => {
        Dom.items.pinDigits.forEach((digitEl, index) => {
            const digitValue = value[index];
            const digitContent = digitEl.querySelector(".app-pin-digit-value");

            if (value.length === index) {
                digitEl.classList.add("focused");
            } else {
                digitEl.classList.remove("focused");
            }

            if (digitValue) {
                digitContent.innerText = digitValue;
                setTimeout(() => {
                    if (Dom.inputs.pin.value[index]) {
                        digitEl.classList.add("hidden");
                    }
                }, 500);
            } else {
                digitContent.innerText = "";
                digitEl.classList.remove("hidden");
            }
        });

        if (Dom.items.pinError) {
            if (currentState === UserStatus.LogInError) {
                Dom.items.pinError.classList.remove("hidden");
            } else {
                Dom.items.pinError.classList.add("hidden");
            }
        }
    };

    // --- Clock ---
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        document.querySelectorAll(".time").forEach(el => el.innerText = timeString);
    };

    setInterval(updateTime, 1000);
    updateTime(); // Run immediately

    // --- Weather Logic ---
    const WeatherService = {
        codeMap: {
            0: { icon: "fa-sun", text: "Clear Sky" },
            1: { icon: "fa-sun-cloud", text: "Mainly Clear" },
            2: { icon: "fa-clouds-sun", text: "Partly Cloudy" },
            3: { icon: "fa-clouds", text: "Overcast" },
            45: { icon: "fa-smog", text: "Fog" },
            48: { icon: "fa-smog", text: "Depositing Rime Fog" },
            51: { icon: "fa-cloud-drizzle", text: "Light Drizzle" },
            53: { icon: "fa-cloud-drizzle", text: "Moderate Drizzle" },
            55: { icon: "fa-cloud-showers-heavy", text: "Dense Drizzle" },
            61: { icon: "fa-cloud-rain", text: "Slight Rain" },
            63: { icon: "fa-cloud-rain", text: "Moderate Rain" },
            65: { icon: "fa-cloud-showers-heavy", text: "Heavy Rain" },
            71: { icon: "fa-snowflake", text: "Slight Snow" },
            73: { icon: "fa-snowflake", text: "Moderate Snow" },
            75: { icon: "fa-snowflake", text: "Heavy Snow" },
            95: { icon: "fa-cloud-bolt", text: "Thunderstorm" },
            96: { icon: "fa-cloud-bolt", text: "Thunderstorm w/ Hail" },
            99: { icon: "fa-cloud-bolt", text: "Heavy Hail Storm" }
        },
        getInfo: (code) => {
            return WeatherService.codeMap[code] || { icon: "fa-sun", text: "Unknown" };
        },
        getDayName: (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        },
        fetchWeather: async () => {
            if (!navigator.geolocation) {
                console.error("Geolocation not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max&timezone=auto`);
                    if (!response.ok) throw new Error("Weather API failed");
                    const data = await response.json();
                    WeatherService.updateUI(data);
                } catch (error) {
                    console.error("Weather fetch failed:", error);
                }
            }, (err) => {
                console.error("Geolocation denied:", err);
            });
        },
        updateUI: (data) => {
            if (!data.current_weather) return;

            const currentTemp = Math.round(data.current_weather.temperature);
            const currentCode = data.current_weather.weathercode;
            const info = WeatherService.getInfo(currentCode);

            // Widgets
            document.querySelectorAll(".weather").forEach(el => {
                el.querySelector(".weather-temperature-value").innerText = currentTemp;
                el.querySelector(".weather-type").className = `weather-type fa-duotone ${info.icon}`;
            });

            // Tool Card
            const toolCards = document.querySelectorAll(".tool-card");
            toolCards.forEach(card => {
                const label = card.querySelector(".tool-card-label");
                if (label && label.innerText === "Weather") {
                    card.querySelector(".tool-card-name").innerText = info.text;
                    card.querySelector(".tool-card-icon").className = `tool-card-icon fa-solid ${info.icon}`;
                }
            });

            // Daily Forecast
            const dailyContainer = document.querySelector("#weather-section .menu-section-content");
            if (dailyContainer && data.daily) {
                dailyContainer.innerHTML = "";

                data.daily.time.forEach((time, index) => {
                    const maxTemp = Math.round(data.daily.temperature_2m_max[index]);
                    const weatherCode = data.daily.weathercode[index];
                    const dayName = WeatherService.getDayName(time);
                    const dayInfo = WeatherService.getInfo(weatherCode);

                    const cardHTML = `
                        <div class="day-card">
                            <div class="day-card-content">
                                <span class="day-weather-temperature">${maxTemp}<span class="day-weather-temperature-unit">&deg;C</span></span>
                                <i class="day-weather-icon fa-duotone ${dayInfo.icon}"></i>
                                <span class="day-name">${dayName}</span>
                            </div>
                        </div>
                    `;
                    dailyContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        }
    };

    // Start Weather Fetch
    WeatherService.fetchWeather();

    // --- Interactions ---
    if (Dom.buttons.signIn) Dom.buttons.signIn.onclick = () => setUserStatusTo(UserStatus.LoggingIn);
    if (Dom.buttons.signOut) Dom.buttons.signOut.onclick = () => setUserStatusTo(UserStatus.LoggedOut);

    if (Dom.background) {
        Dom.background.onclick = () => {
            if (currentState === UserStatus.LoggedOut) {
                setUserStatusTo(UserStatus.LoggingIn);
            }
        };
    }

    if (Dom.buttons.cancel) Dom.buttons.cancel.onclick = () => setUserStatusTo(UserStatus.LoggedOut);

    // PIN Input
    if (Dom.inputs.pin) {
        Dom.inputs.pin.addEventListener("input", async (e) => {
            const value = e.target.value;

            if (currentState === UserStatus.LogInError) {
                setUserStatusTo(UserStatus.LoggingIn);
            }

            updatePinDisplay(value);

            if (value.length === 4) {
                setUserStatusTo(UserStatus.VerifyingLogIn);
                try {
                    await LogInUtility.verify(value);
                    setUserStatusTo(UserStatus.LoggedIn);
                } catch (err) {
                    console.error(err);
                    setUserStatusTo(UserStatus.LogInError);
                    Dom.inputs.pin.value = "";
                    updatePinDisplay("");
                }
            }
        });

        // Focus handler
        const pinWrapper = document.getElementById("app-pin");
        if (pinWrapper) pinWrapper.onclick = () => Dom.inputs.pin.focus();
    }

    // Drag Service
    const scrollables = document.querySelectorAll(".scrollable-component");
    scrollables.forEach(el => {
        let isDown = false;
        let startX;
        let scrollLeft;

        el.addEventListener('mousedown', (e) => {
            isDown = true;
            el.classList.add('active');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        });
        el.addEventListener('mouseleave', () => {
            isDown = false;
            el.classList.remove('active');
        });
        el.addEventListener('mouseup', () => {
            isDown = false;
            el.classList.remove('active');
        });
        el.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 2;
            el.scrollLeft = scrollLeft - walk;
        });
    });

});