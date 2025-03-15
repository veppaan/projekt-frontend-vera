"use strict";

window.onload = () =>{
    getStations();
    startMap();
}

async function getStations(){
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
        //Anropar utskrift med variabler till select
        writeWaters(myName, myId, myLatitude, myLongitude);
    })
    .catch(error => {
        console.error('Fel vid hämtning av stationer:', error);
    });
}

//Utskrift till select med alla namn vars url fungerar
async function writeWaters(waters, ids){
    //console.log(waters);
    //console.log(ids);
    let workingNames = [];
    let watersEl = document.getElementById("water");
    let loadingEl = document.querySelector(".loading-elements");
    let optionsEl = document.querySelector("#section-option");
    
    //Loopar igenom alla idn för att kunna ta bort alla ogiltiga
    for (let i = 0; i <= ids.length; i++){
        //Funktion som kollar url
        let data = await tryUrl(ids[i]);
        //Om datan (urlen med speciellt id) kommer tillbaka som true läggs dess namn till i select-lista
        if(data){ 
                let optionEl = document.createElement("option");
                optionEl.value = waters[i];
                optionEl.textContent = waters[i];
                watersEl.appendChild(optionEl);
                workingNames.push(waters[i]);
            
        }else{
            console.log("Skippar länk som inte fungerar")
        }
        //Kollar om loopen är klar så att laddings-animering slutar och listan med stationer visas
        if( i === ids.length -1){
            loadingEl.style.display = 'none';
            optionsEl.style.display = 'block'; 
            setTimeout(() => {
                optionsEl.style.opacity = '1';
            }, 10); //Mjuk övergång i 1s till att den syns
        }
    }
    //Gör nya objekt för bara namn och id för att lättare hålla reda på vad som finns i objekt
    const stations = waters.map((name, i) => ({
        name: name,
        id: ids[i],
      }));
      //Eventlyssnare lyssnar på "change" för att kunna ta ut värden från den avlda
    watersEl.addEventListener('change', function(event) {
        const chosenName = event.target.value;
        
        // Hitta objekt ur stations för att matcha namn och id
        const chosenStation = stations.find(station => station.name === chosenName);
        //Anropar ny funktion med valt namn och id som ska visa dess temperatur
        showWater(chosenStation.name, chosenStation.id); 
      });
}

//Kollar idn med url för att filtrera bort ogilitga
async function tryUrl(id){
    const url= `https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/5/station/${id}/period/latest-day/data.json`
    try{
    let response = await fetch(url);
        // Kollar om responsen är ok
        if (!response.ok) {
            return false;
        }
        return true;
        
    }catch(error){
        return false;
    }
}
//Hämtar ny url och skriver ut vattentemperaturen
async function showWater(name, id){
    let url = `https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/5/station/${id}/period/latest-day/data.json`;
    //Hämtar url med det unika id:t från vald station
     await fetch(url)
    .then(response => {
        // Kollar om responsen är ok
        if (!response.ok) {
            throw new Error('Något gick fel med förfrågan');
        }
        return response.json(); // Omvandla till json
    })
    .then(data => {
        //Temperatur ligger under value.value så jag tar första arrayen (senaste hämtningen)
        if (data && data.value) {
            let waterResultEl = document.getElementById("water-result");
            let waveDegreeEl = document.querySelector(".degree");
            let allResultEL = document.getElementById("all-result");
            let chooseStationEl = document.getElementById("small-text");
            waterResultEl.innerHTML="";
            //senaste resultatet
            const latestValue = data.value[data.value.length -1];
            allResultEL.style.display = "block";
            chooseStationEl.style.display = "none";
            waterResultEl.innerHTML=`Havstemperaturen vid station ${name} vid senaste mätningen:`;
            waveDegreeEl.textContent=`${latestValue.value} °C`; //Enda funktionen som inte tar bort animeringen

            const chosenLatitude = data.position[0].latitude;
            const chosenLongitude = data.position[0].longitude;

            initMap(chosenLatitude, chosenLongitude, name);
            getWaveData(chosenLatitude, chosenLongitude);
            showChart(data);
          }else{
            waterResultEl.innerHTML=`Temperaturen i vattnet från station ${name} gick inte att hämta...`;
          }
    })
    .catch(error => {
        //Fångar upp fel
        console.error('Fel vid hämtning av data:', error);
    });
}
async function startMap(){
        const latitude = 62.915;
        const longitude = 17.380;
    
        const { Map } = await google.maps.importLibrary("maps");
    
        map = new Map(document.getElementById("map"), {
            center: { lat: latitude, lng: longitude},
            zoom: 5,
        });
}
let map;
let marker;
async function initMap(latitude, longitude, name){

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), {
        center: { lat: latitude, lng: longitude},
        zoom: 11,
        mapId: "29dd997073953c33",
    });
    marker = new AdvancedMarkerElement({
        map,
        position: { lat: latitude, lng: longitude },
        title: name
    });

    let mapHeadingEl = document.getElementById("head-map");
    mapHeadingEl.innerHTML=`${name}:s kartposition`;
}

let chart;
function showChart(data){
    document.getElementById("chart").style.display = "block";
    let onlyTemp = [];
    let onlyDate = [];
    let array = data.value;
    console.log(data.value);

    const arrayLength = Math.min(10, array.length); //Tar ut 10 eller längden på arrayen om den innehåller mindre

    for(let i = array.length - 1; i >= array.length - arrayLength; i--){
            onlyTemp.push(data.value[i].value);
            let localDate = data.value[i].date;
            //Dubbelkollar att datan använder min tidszon
            let dateTime = new Date(localDate);
            let milliSec = dateTime.getTime();
            onlyDate.push(milliSec);
    }
    console.log(onlyDate);
    let localDate = onlyDate;
    //console.log(onlyTemp);
    let xPoints = onlyDate.length;
    console.log(xPoints);

if(!chart){
    chart = new ApexCharts(document.querySelector("#chart"), {
        series: [{
        name: 'Havstemperatur',
        data: onlyTemp,
      }],
        chart: {
        width: "100%",
        type: 'area',
        zoom:{
            enabled: false
          },
          toolbar:{
            show: false
          },
      },
      title: {
        text: `Senaste temperaturmätningarna`,
        align: "center",
        style:{
            fontSize: "14px",
            fontWeight: "600",
            color: "#324c56",
            fontFamily: "Verdana, Geneva, Tahoma, sans-serif"
        }
    },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: onlyDate
      },
      markers:{
        size: 6,
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      }
      });
      chart.render();
}
//Uppdaterar båda arrayerna vid byte av station (de hängde inte med och använde gammal data) 
chart.updateSeries([{
    data: onlyTemp,
    categories: onlyDate
}]);
//Uppdaterar även diagrammets x-axel för att datan ska bli korrekt på sidan
chart.updateOptions({
    xaxis:{
        categories: onlyDate,
        tickAmount: onlyDate.length
    },
    title:{
        text: `Senaste temperaturmätningarna`
    }
})
}
//Hämtar in nytt API som kollar våghöjder
async function getWaveData(lat, long){
    let url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${long}&current=wave_height`;
     await fetch(url)
    .then(response => 
        response.json() // Omvandla till json
    )
    .then(data => {
        showWaveHeight(data);
    })
    .catch(error => {
        console.error('Fel vid hämtning av våghöjder:', error);
    });
}
function showWaveHeight(currentWave){
    let waveTime = currentWave.current.time;
    let waveHeight = currentWave.current.wave_height;
    let heightText = document.getElementById("height-text");
    const time = new Date(waveTime);

    let day = time.getDate();
    let month = time.getMonth() + 1;
    let hours = time.getHours();
    let minutes = time.getMinutes();
    if(hours < 10){
        hours = hours + "0";
    }
    if(minutes < 10){
        minutes = minutes + "0";
    }

    if(!waveHeight){
        heightText.innerHTML= "Våghöjd saknas vid denna station";
    }else{
        heightText.innerHTML= `Våghöjd <span id="height"> ${waveHeight}m</span> vid senaste mätningen (${hours}:${minutes}, ${day}/${month})`;
    }
    //console.log(`Hämtad ${hours}:${minutes}, ${day}/${month}`)
    //console.log(time.toLocaleString('sv-SE', {timeZone: 'Europe/Stockholm'}));
    //console.log(time.toISOString);
}