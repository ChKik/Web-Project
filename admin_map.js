// rescuer_map.js

//Initialization location
var rescuer_map = L.map('rescuer_map', {
    touchZoom: true,
    tap: true,
    touchRotate: true,
    touchPan: true,
    dragging: true,
}).setView([39.362441, 22.9448657], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(rescuer_map);

//Headquarters location
var HeadquartersIcon = L.icon({
    iconUrl: 'images/office-building.png', 
    iconSize: [25, 41], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34], 
    shadowSize: [41, 41] 
  });

  var VehicleIcon=L.icon({
    iconUrl: 'images/vehicle_icon.png', 
    iconSize: [50, 55], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34], 
    shadowSize: [41, 41]
});

  //////////////////////////////////////////////////////////////////////

  document.addEventListener('DOMContentLoaded', function () {
    fetch('http://localhost:3000/api/getBaseLocation')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Use the fetched coordinates to initialize the marker
                const base_lat = data.location.base_lat;
                const base_lng = data.location.base_lng;

                const base_marker = L.marker([base_lat, base_lng], {
                    icon: HeadquartersIcon,
                    title: "Headquarters",
                    draggable: true
                }).addTo(rescuer_map);

                // Handle the marker dragend event
                base_marker.on('dragend', function (e) {
                    let position = e.target.getLatLng();
                    let confirmation = confirm(`Are you sure you want to update the headquarters location to [${position.lat}, ${position.lng}]?`);

                    if (confirmation) {
                        fetch('http://localhost:3000/api/updateBaseLocation', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                base_lat: position.lat,
                                base_lng: position.lng,
                                base_username: 'Base A'
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Location updated successfully!');
                            } else {
                                alert('Error updating location.');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                    } else {
                        e.target.setLatLng(e.target.getLatLng()); // Reset marker position if cancelled
                    }
                });

            } else {
                console.error('Error fetching base location:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

          // Fetch and display rescuer locations
  fetch('http://localhost:3000/api/getRescuerLocations')
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          data.locations.forEach(location => {
              const { wrk_lat, wrk_lng } = location;
              L.marker([wrk_lat, wrk_lng], { icon: VehicleIcon })
                  .addTo(rescuer_map);
          });
      } else {
          console.error('Error fetching rescuer locations:', data.message);
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });


    // Fetch and display rescuer details
    fetch('http://localhost:3000/api/getRescuerDetails')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          data.details.forEach(detail => {
            const { lat, lng, username, vehicle_id, task_id } = detail;

            let popupContent = `
              <strong>Username:</strong> ${username} <br>
              <strong>Vehicle ID:</strong> ${vehicle_id} <br>
              <strong>Task ID:</strong> ${task_id || 'None'} <br>
            `;

            L.marker([lat, lng], { icon: VehicleIcon })
              .bindPopup(popupContent)
              .addTo(rescuer_map);
          });
        } else {
          console.error('Error fetching rescuer details:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });

      document.getElementById('requestsInProgress').addEventListener('change', updateFilter);
      document.getElementById('acceptedRequests').addEventListener('change', updateFilter);
      document.getElementById('offers').addEventListener('change', updateFilter);
      document.getElementById('vehiclesWithActiveTasks').addΕventListener('change', updateFilter);
      document.getElementById('vehiclesWithoutActiveTasks').addEventListener('change', updateFilter);

      // Function to handle filtering
function updateFilter() {
  const requestStatus = [];
  const offerStatus = [];

  // Get filter values for requests and offers
  if (document.getElementById('requestsInProgress').checked) requestStatus.push('In progress');
  if (document.getElementById('acceptedRequests').checked) requestStatus.push('Accepted');
  if (document.getElementById('offers').checked) offerStatus.push('In progress', 'Accepted');

  // Fetch the filtered markers from the server
  fetch('http://localhost:3000/api/getMarkers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestStatus, offerStatus }),
  })
    .then(response => response.json())
    .then(data => {
      // Clear existing markers (you need a function for this)
      clearMarkers();

      // Add the filtered markers to the map
      data.forEach(markerData => {
        const marker = L.marker([markerData.latitude, markerData.longitude]);
        marker.addTo(rescuer_map);
      });
    })
    .catch(err => console.error('Error fetching markers:', err));
}

});

  //////////////////////////////////////////////////////////////////



// var VehicleIcon=L.icon({
//     iconUrl: 'images/vehicle_icon.png', 
//     iconSize: [50, 55], 
//     iconAnchor: [12, 41], 
//     popupAnchor: [1, -34], 
//     shadowSize: [41, 41]
// });

//prasina offer marker
var offerIcon=L.icon({
  iconUrl: 'images/offer_location_marker.png', 
  iconSize: [50, 50], 
  iconAnchor: [11, 41], 
  popupAnchor: [1, -34], 
  shadowSize: [41, 41]
});

//kokkina request marker.
var requestIcon=L.icon({
  iconUrl: 'images/request_location_marker.png',  
  iconSize: [40, 42], 
  iconAnchor: [10, 41], 
  popupAnchor: [1, -34], 
  shadowSize: [41, 41]
});


//rescuer. Kanonika tha pernei to id analoga me to poios kanei login


var rescuerLat = 39.357441;
var rescuerLng = 22.9648657;

var rescuer_marker = L.marker([rescuerLat, rescuerLng], {
    icon: VehicleIcon,
    draggable: false // epeidh o admin den xreiazetai na kanei update to location tou user
});


// Event listener to update the latitude and longitude variables when the marker is moved
rescuer_marker.on('moveend', function(event) {
    var position = event.target.getLatLng();
    rescuerLat = position.lat;
    rescuerLng = position.lng;
    console.log("New latitude: " + rescuerLat + ", New longitude: " + rescuerLng);
    postCoordinates();
});

rescuer_marker.addTo(rescuer_map).bindPopup('My vehicle').openPopup();
fetchInformation();  //initialize the pop up rescuer map
//update to map kathe 30 deuterolepta
setInterval(fetchInformation, 10000);  // 30000 ms = 30 seconds

let markers=[];


//TEMP RESCUER ID
var rescuer_id=1;
const maxPolylines = 5;
var rescuer_vehicle;

async function fetchInformation() {
const offers_info =  await fetchCitizenOffers();
const requests_info =  await fetchCitizenRequests();
const rescuer_info=  await fetchRescuerInfo();
rescuer_vehicle= rescuer_info[0].res_vehicle_id; //pairnei to oxima toy rescuer  //id anti gia username


if (offers_info || requests_info) {
  clearMarkers();
  displayOffersOnMap(offers_info, rescuer_map);  
  displayRequestsOnMap(requests_info, rescuer_map);  
}
else console.log("error with the display");

}


async function postCoordinates() {
  // for testing
  const wrk_id=1;    //temp tha allaksei argotera

  var data = {
      worker_id: wrk_id,
      latitude: rescuerLat,
      longitude: rescuerLng
  };

  
  try {
    const response = await fetch("http://localhost:3000/save-coordinates-worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Coordinates of rescuer sent successfully:", result);
    } else {
      const errorMessage = (await response.json()).message;
      console.error(`Failed to send coordinates: ${errorMessage}`);
    }
  } catch (error) {
    console.error("An error occurred while sending coordinates:", error);
  }
}


function clearMarkers() {
  markers.forEach(marker => {
    rescuer_map.removeLayer(marker);
  });
  markers = []; // Clear the markers array
}


//koitaei poia citizen requests einai pending. Prepei na fairnei kai auta poy einai accepted apo ton rescuer kapws.
//thelei allagh server side kapws.
async function fetchCitizenRequests() {
  try {
    const response=await fetch('http://localhost:3000/get-citizen-requests');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const requests_info = await response.json();
    console.log(requests_info);
    return requests_info;
  
  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  }
  
}


//koitaei poia citizen offers einai pending
async function fetchCitizenOffers() {
try {
  const response=await fetch('http://localhost:3000/get-citizen-offers');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const offers_info = await response.json();
  console.log(offers_info);
  return offers_info;

} catch (error) {
  console.error('There was an error with the fetch operation:', error);
}

}


//edw fainontai ta offer poy den exw apodextei oi diaswstes akoma. me prasino marker ta offer
function displayRequestsOnMap(requests_info, rescuer_map) {
  const requestsGroupedByLocation = {};

  requests_info.forEach(request => {
    const locationKey = `${request.ctzen_lat},${request.ctzen_lng}`;

    if (!requestsGroupedByLocation[locationKey]) {
      requestsGroupedByLocation[locationKey] = {
        lat: request.ctzen_lat,
        lng: request.ctzen_lng,
        requests: []
      };
    }

    requestsGroupedByLocation[locationKey].requests.push({
      citizen_name: request.citizen_name,
      citizen_lname: request.citizen_lname,
      ph_number: request.ph_number,
      task_id: request.req_task_id,
      date_record: request.req_date_record,
      date_accept: request.req_date_withdraw,
      quantity: request.req_quantity,
      vehicle_username: request.req_vehicle_username,
      item: request.req_item,
      status: request.req_status
    });
  });

  Object.values(requestsGroupedByLocation).forEach(location => {
    let requestsPopupContent = '<div class="popup-content">';
    //pairnei kai to item twra
    location.requests.forEach(request => {
// status=='In progress'. Ama einai true emfanizei ta koympia alliws oxi gia na min exoyme duplicate stin db to idio offer h request.
      const buttonsHtml = request.status === 'In progress'
        // ? `<div class="button-container">
        //      <button class="button accept" onclick="acceptRequest('${request.task_id}', ${location.lat}, ${location.lng},'${request.item}')">Accept</button>
        //      <button class="button reject" onclick="rejectRequest('${request.task_id}')">Reject</button>
        //    </div>`
        // : '';

      requestsPopupContent += `<div>
                               <h3 style="color:red;">Request</h3>
                               <b>Name:</b> ${request.citizen_name} ${request.citizen_lname}<br>
                               <b>Phone:</b> ${request.ph_number}<br>
                               <b>Item:</b> ${request.item}<br>
                               <b>Date:</b> ${request.date_record}<br>
                               <b>Accepted Date:</b> ${request.date_accept}<br>
                               <b>Quantity:</b> ${request.quantity}<br>
                               <b>Vehicle:</b> ${request.vehicle_username}<br>
                               <b>Request ID:</b> ${request.task_id}<br>
                               <h4 style="color:blue;"><b>Request STATUS:</b> ${request.status}<br></h4>
                               ${buttonsHtml}
                               <hr>
                               </div>`;
    });

    requestsPopupContent += '</div>';

    const marker = L.marker([location.lat, location.lng], {
      icon: requestIcon,
      draggable: false
    })
    .addTo(rescuer_map)
    .bindPopup(requestsPopupContent);

    markers.push(marker);
  });
}




//edw fainontai ta offer poy den exw apodextei oi diaswstes akoma. me prasino marker ta offer
function displayOffersOnMap(offers_info, rescuer_map) {
  const offersGroupedByLocation = {};

  offers_info.forEach(offer => {
    const locationKey = `${offer.ctzen_lat},${offer.ctzen_lng}`;

    if (!offersGroupedByLocation[locationKey]) {
      offersGroupedByLocation[locationKey] = {
        lat: offer.ctzen_lat,
        lng: offer.ctzen_lng,
        offers: []
      };
    }

    offersGroupedByLocation[locationKey].offers.push({
      citizen_name: offer.citizen_name,
      citizen_lname: offer.citizen_lname,
      ph_number: offer.ph_number,
      task_id: offer.offer_task_id,
      date_record: offer.offer_date_record,
      date_accept: offer.offer_date_withdraw,
      quantity: offer.offer_quantity,
      vehicle_username: offer.offer_vehicle_username,
      item: offer.offer_item,
      status: offer.offer_status
    });
  });
  //evala an pernaei kai to item
  Object.values(offersGroupedByLocation).forEach(location => {
    let offersPopupContent = '<div class="popup-content">';

    location.offers.forEach(offer => {
      // status=='In progress'. Ama einai true emfanizei ta koympia alliws oxi
      const buttonsHtml = offer.status === 'In progress'
        // ? `<div class="button-container"> 
        //      <button class="button accept" onclick="acceptOffer('${offer.task_id}', ${location.lat}, ${location.lng},'${offer.item}')">Accept</button>  
        //      <button class="button reject" onclick="rejectOffer('${offer.task_id}')">Reject</button>
        //    </div>`
        // : '';

      offersPopupContent += `<div>
                              <h3 style="color:green;">Offer</h3>
                              <b>Name:</b> ${offer.citizen_name} ${offer.citizen_lname}<br>
                              <b>Phone:</b> ${offer.ph_number}<br>
                              <b>Item:</b> ${offer.item}<br>
                              <b>Date:</b> ${offer.date_record}<br>
                              <b>Accepted Date:</b> ${offer.date_accept}<br>
                              <b>Quantity:</b> ${offer.quantity}<br>
                              <b>Vehicle:</b> ${offer.vehicle_username}<br>
                              <b>Offer ID:</b> ${offer.task_id}<br>
                              <h4 style="color:blue;"><b>Offer STATUS:</b> ${offer.status}<br></h4>
                              ${buttonsHtml}
                              <hr>
                              </div>`;
    });

    offersPopupContent += '</div>';

    const marker = L.marker([location.lat, location.lng], {
      icon: offerIcon,
      draggable: false
    })
    .addTo(rescuer_map)
    .bindPopup(offersPopupContent);

    markers.push(marker);
  });
}


async function fetchRescuerInfo(){
  try {
    const response = await fetch(`http://localhost:3000/get-rescuer-info?rescuer_id=${rescuer_id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const rescuer_info = await response.json();
    console.log(rescuer_info);
    return rescuer_info;
  
  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  }
}



var rescuerData = {};

//  rescuer's starting coordinates kai ta polylines toy
rescuerData[rescuer_id] = {
  LatLngsPoints: [[rescuerLat, rescuerLng]], 
  polyline: null  
};


rescuerData[rescuer_id].polyline = L.polyline(rescuerData[rescuer_id].LatLngsPoints, {color: 'red'}).addTo(rescuer_map);


// ama exei offer kai request to idio atomo kanei overlap. Einai ligo megalutero
// to offer ara ginetai na clickareis prosektika.
//meta apo xrono tha kanei pop to prwto stoixeio tis listas afoy o rescuer
// tha exei ftasei
async function acceptRequest(taskId, lat, lng,item) {  //suntetagmenes toy polith
  console.log(`Task request ID ${taskId},${lat},${lng},${item} accepted.`);
  type_flag=0; // an flag =0 einai request

  
  const today = new Date();  //because the date format is different to mysql
  const formattedDate = formatDateToSQL(today);

  let citizen_LatLng=[lat,lng];
  add_polyline_point(rescuer_id,citizen_LatLng,taskId,type_flag,item);
  
  try { //kanei update to offer se accept kai vazei to oxhma toy rescuer.
    const response = await fetch('http://localhost:3000/update-request-accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        rescuer:rescuer_id,
        rescuer_vehicle:rescuer_vehicle,
        date:formattedDate
      })
    });

    fetchCitizenRequests();  //meta to update se accept kane fetch ksana

    if (!response.ok) {
      throw new Error(`fetchCitizenRequests HTTP error! status: ${response.status}`);
    }

  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  } 
 
}

//kane accept gia m in fianetai sto rescuer kai modify sto citizen offer
async function acceptOffer(taskId, lat, lng,item) {  //suntetagmenes toy polith
  console.log(`Task ID offer ${taskId},${lat},${lng},${item} accepted.`);
  type_flag=1; // an flag =1 einai offer

  let citizen_LatLng=[lat,lng];
  add_polyline_point(rescuer_id,citizen_LatLng,taskId,type_flag,item);  //pairnei kai to item

  
  const today = new Date();  //because the date format is different to mysql
  const formattedDate = formatDateToSQL(today);


  try { //kanei update to offer se accept kai vazei to oxhma toy rescuer.
    const response = await fetch('http://localhost:3000/update-offer-accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        rescuer:rescuer_id,
        rescuer_vehicle:rescuer_vehicle,
        date:formattedDate
      })
    });

    fetchCitizenOffers();  //meta to update se accept kane fetch ksana

    if (!response.ok) {
      throw new Error(`fetchCitizenOffers HTTP error! status: ${response.status}`);
    }

  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  } 
}


async function rejectOffer(taskId) {
  console.log(`Offer with Task ID ${taskId} rejected.`);

  try {
    const response = await fetch('http://localhost:3000/reject-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        offerId: taskId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    await fetchInformation();    //refresh ta markers
    

  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  }
}


async function rejectRequest(taskId) {
  console.log(`Request with Task ID ${taskId} rejected.`);

  try {
    const response = await fetch('http://localhost:3000/reject-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        offerId: taskId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    await fetchInformation();
    

  } catch (error) {
    console.error('There was an error with the fetch operation:', error);
  }
}


//den kanei update to rescuer id sta tasks otan patas to accept. mpainei to polyline toylaxiston twra.
async function add_polyline_point(rescuer_id, citizen_LatLng,task_id,type_flag,item) {

  if (!rescuerData[rescuer_id]) {
    console.error(`Rescuer ID ${rescuer_id} not found!`);
    return;
  }

  // checkarei ama exei parapanw apo 4 tasks me vash ta polylines toy rescuer.
  //ama exei diplo polyline den faintai sto map stin periptwsh poy exei 2 offer sto idio shmeio ktlp.\

  //max 4 lines
  if (rescuerData[rescuer_id].LatLngsPoints.length >= maxPolylines) {
    alert(`Rescuer with ID ${rescuer_id} cannot add more than ${maxPolylines -1 } tasks.`);
    return;
  }
  else{
    rescuerData[rescuer_id].LatLngsPoints.push(citizen_LatLng);
    rescuerData[rescuer_id].polyline.addLatLng(citizen_LatLng);
    
    if (type_flag===1){
      try { //offer task
        const response = await fetch('http://localhost:3000/post-offer_rescuer_tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rescuer_id: rescuer_id,
            citizen_lat: citizen_LatLng[0],  //post to lat
            citizen_lng: citizen_LatLng[1],  //post to lng
            task_id: task_id,
            item_name:item
          })
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
      } catch (error) {
        console.error('There was an error with the fetch operation:', error);
      }  
    }
    else{   //request task
      try {
        const response = await fetch('http://localhost:3000/post-request_rescuer_tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rescuer_id: rescuer_id,
            citizen_lat: citizen_LatLng[0],  //post to lat
            citizen_lng: citizen_LatLng[1],  //post to lng
            task_id: task_id,
            item_name:item
          })
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
      } catch (error) {
        console.error('There was an error with the fetch operation:', error);
      } 
    }
  } 
}


//distance between 2 different locations based on cords https://stackoverflow.com/a/21623206
function distance(lat1, lon1, lat2, lon2) {
  const r = 6371; // km
  const p = Math.PI / 180;

  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2
                + Math.cos(lat1 * p) * Math.cos(lat2 * p) *
                  (1 - Math.cos((lon2 - lon1) * p)) / 2;

  return 2 * r * Math.asin(Math.sqrt(a));
}

function formatDateToSQL(date) {  //epeudh exei sugkekrimeno format h mysql prepei etsi

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/*        -------------       FILTER SECTION      ------------------------          */

// function updateFilter() {
//   const requestStatus = [];
//   const offerStatus = [];

//   // Get filter values
//   if (document.getElementById('requestsInProgress').checked) requestStatus.push('In progress');
//   if (document.getElementById('acceptedRequests').checked) requestStatus.push('Accepted');
//   if (document.getElementById('offersInProgress').checked) offerStatus.push('In progress');
//   if (document.getElementById('acceptedOffers').checked) offerStatus.push('Accepted');

//   // Fetch the filtered markers
//   fetch('http://localhost:3000/api/getMarkers', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ requestStatus, offerStatus }),
//   })
//     .then(response => response.json())
//     .then(data => {
//       // Clear existing markers
//       clearMarkers();

//       // Add the filtered markers to the map
//       data.forEach(markerData => {
//         const marker = L.marker([markerData.latitude, markerData.longitude]);
//         marker.addTo(rescuer_map);
//         // You can also add any popup information based on `markerData`
//       });
//     })
//     .catch(err => console.error('Error fetching markers:', err));
// }


