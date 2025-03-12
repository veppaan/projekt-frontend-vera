"use strict";

window.onload = () =>{
    getStations();
}

function getStations(){
    //Hämtar url med alla vatten-stationer
    fetch(`https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/5.json`)
    .then(response => {
        // Kollar om responsen är ok
        if (!response.ok) {
            throw new Error('Något gick fel med förfrågan');
        }
        return response.json(); //Gör om data till JSON
    })
    .then(data => {
        //Variabler för olika attribut som finns i datan, använder mig av map för att hitta
        const myName = data.station.map(station => station.name);
        const myId = data.station.map(station => station.id);
        const myLatitude = data.station.map(station => station.latitude);
        const myLongitude = data.station.map(station => station.longitude);
        console.log(data);
    })
    .catch(error => {
        console.error('Fel vid hämtning av stationer:', error);
    });
}