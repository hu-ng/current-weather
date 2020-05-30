const owm_key = "4e4596a7e12935c57acd71082d72551f";
const form = document.getElementById("searchWeather");
const searchInput = document.getElementById("cityName");
const metricRadio = document.getElementById("metric");
const currentLocationBtn = document.getElementById("currentLocation");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  display();
});

currentLocationBtn.addEventListener("click", (event) => {
  navigator.geolocation.getCurrentPosition(display, alert);
});

async function display(geoPosition) {
  let units = metricRadio.checked ? "metric" : "imperial";
  let apiData;
  if (geoPosition) {
    apiData = await getWeatherDataCoord(geoPosition, units);
  } else {
    apiData = await getWeatherData(searchInput.value, units);
  }

  if (apiData.temps) {
    let gifData = await getGifUrl(apiData.weather[0].main.toLowerCase());

    displayGif(gifData);
    displayWeather(apiData);
  } else {
    alert(apiData.message[0].toUpperCase() + apiData.message.slice(1));
  }
}

function displayGif(gifUrl) {
  const imgContainer = document.getElementById("weatherGif");
  if (imgContainer.firstElementChild) {
    imgContainer.removeChild(imgContainer.firstElementChild);
  }
  const img = document.createElement("img");
  img.style.width = "100%";
  img.src = gifUrl;
  imgContainer.appendChild(img);
}

function insertRow(tableElem, name, data) {
  let row = document.createElement("tr");
  let rowName = document.createElement("th");
  rowName.innerText = name;
  let rowData = document.createElement("td");
  rowData.innerText = data;
  row.appendChild(rowName);
  row.appendChild(rowData);
  tableElem.appendChild(row);
}

function displayWeather(weatherData) {
  const weatherContainer = document.getElementById("tempData");
  if (weatherContainer.firstElementChild) {
    weatherContainer.removeChild(weatherContainer.firstElementChild);
  }
  const table = document.createElement("table");
  table.classList.add("table");
  table.classList.add("table-borderless");
  table.classList.add("table-responsive-sm");

  // City name
  insertRow(table, "City Name", weatherData.cityName);

  // Weather description
  insertRow(table, "Weather Description", weatherData.weather[0].main);

  // Temp stats
  for (const [measurement, value] of Object.entries(weatherData.temps)) {
    insertRow(
      table,
      transformTempDisplayName(measurement),
      value + ` ${weatherData.unit}`
    );
  }

  weatherContainer.appendChild(table);
}

function transformTempDisplayName(name) {
  return name
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

async function getWeatherData(city, units) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${owm_key}&units=${units}`
    );
    const data = await response.json();
    return processData(data, units);
  } catch (error) {
    console.log("reject", error);
  }
}

async function getWeatherDataCoord(position, units) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${owm_key}&units=${units}`
    );
    const data = await response.json();
    return processData(data, units);
  } catch (error) {
    console.log("reject", error);
  }
}

async function getGifUrl(keyword) {
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/translate?api_key=iXZjQ2BvU5Mxe9QUBBYByRZ2vAc4PWGd&s=${keyword}`,
    { mode: "cors" }
  );
  const data = await response.json();
  const gifUrl = data.data.images.original.url;
  return gifUrl;
}

function processData(data, units) {
  if (["400", "404"].includes(data.cod)) {
    return data;
  }
  console.log(data.name);
  let processed = {};
  processed.temps = data.main;
  processed.unit = units == "metric" ? "C" : "F";
  processed.cityName = data.name;
  delete processed.temps["pressure"];
  delete processed.temps["humidity"];

  processed.weather = data.weather;
  return processed;
}
