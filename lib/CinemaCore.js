const InMemoryDataStore = require('./InMemoryDataStore');
const XxiConnector = require('./XxiConnector');

class CinemaCore {
  static init() {
    let providerConnectors = [XxiConnector];
    let dataStore = new InMemoryDataStore();
    let providers =
      providerConnectors.map(constructor => new constructor(dataStore));
    console.log(providers);

    CinemaCore.dataStore = dataStore;
    CinemaCore.providers = providers;

    CinemaCore.loadedCities = new Set();

    return Promise.all(providers.map(provider => provider.init()));
    // .then(() => {
    //   for (let cityName of dataStore.cities) {
    //     CinemaCore.loadCity(cityName);
    //   }
    // });
  }

  static loadCity(cityName) {
    console.log(`Loading ${cityName}...`);
    cityName = cityName.trim().toUpperCase();
    if (CinemaCore.loadedCities.has(cityName)) {
      return;
    }

    let throbber = setInterval(() => {
      console.log(`Still loading ${cityName}...`);
    }, 3000);

    let loadPromises =
      Promise.all(CinemaCore.providers
        .map(provider => provider.loadCity(cityName)));

    return loadPromises.then(() => {
      clearInterval(throbber);
      console.log(`Finished loading ${cityName}`);
      CinemaCore.loadedCities.add(cityName);
    });
  }

  static getScheduleByFilmAndCity(cityName, filmTitle,
                                  date=moment().format('YYYY-MM-DD'),
                                  time='00:00') {
    let schedule = new Map;
      // Map of Map of Array of string
      // level 1: theatre
      // level 2: variant
      // level 3: time

    for (let screening of CinemaCore.dataStore.screenings) {
      if (screening.city === cityName &&
          screening.filmTitle === filmTitle &&
          screening.date === date &&
          screening.time >= time) {
        let {theatreName, variant, time} = screening;
        if (!schedule.get(theatreName)) {
          schedule.set(theatreName, new Map);
        }
        if (!schedule.get(theatreName).get(variant)) {
          schedule.get(theatreName).set(variant, []);
        }
        let times = schedule.get(theatreName).get(variant);
        times.push(time);
        times.sort();
      }
    }

    return schedule;
  }
}

module.exports = CinemaCore;