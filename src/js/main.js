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
        //Anropar utskrift med variabler till select
        writeWaters(myName, myId, myLatitude, myLongitude)
    })
    .catch(error => {
        console.error('Fel vid hämtning av stationer:', error);
    });
}

//Utskrift till select med alla namn vars url fungerar
async function writeWaters(waters, ids){
    //console.log(waters);
    //console.log(ids);
    let workingIds = [];
    let workingNames = [];
    let watersEl = document.getElementById("water");
    //const url= `https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/5/station/${id}/period/latest-day/data.json`;
    //let data = await tryUrl(id);
    
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
            console.log("Skippar länkar som inte fungerar")
        }
    }
    //Gör nya objekt för bara namn och id för att lättare hålla reda på vad som finns i objekt
    const stations = workingNames.map((name, i) => ({
        name: name,
        id: ids[i],
      }));
      //Kolla så att idn och namn stämmer
      console.log(stations[0]);
      console.log(waters[0]);
      console.log(ids[0]);
      //Eventlyssnare lyssnar på "change" för att kunna ta ut värden från den avlda
    watersEl.addEventListener('change', function(event) {
        const chosenName = event.target.value;
        
        // Hitta objekt ur stations för att matcha namn och id
        const selectedStation = stations.find(station => station.name === chosenName);
        //const selectedPosition = stations.find(position => position.latitude === selectedName);
      

      });
}

//Kollar idn med url för att filtrera bort ogilitga
async function tryUrl(id){
    const url= `https://opendata-download-ocobs.smhi.se/api/version/latest/parameter/5/station/${id}/period/latest-day/data.json`
    try{
        console.log("kollar id");
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