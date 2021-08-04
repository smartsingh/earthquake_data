// url for earthquakes
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson";

// grabs earthquake points
d3.json(queryUrl, function(data) {
  // sends earthquakes to get built
  createQuakes(data.features);
});

function createQuakes(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {

    layer.bindPopup("<h3>" + feature.properties.mag + " Magnitude Earthquake at " + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
    };

  //colors created by ColorBrewer, scale logic derived from http://www.geo.mtu.edu/UPSeis/magnitude.html
  function colorGradient(mag){
    return  mag > 7.5 ? '#a50026' : 
            mag > 7.0 ? '#d73027' : //major earthquake, serious damage
            mag > 6.5 ? '#f46d43' :
            mag > 6.0 ? '#fdae61' :
            mag > 5.5 ? '#fee08b' : //slight damage to buildings
            mag > 5.0 ? '#ffffbf' :
            mag > 4.5 ? '#d9ef8b' :
            mag > 4.0 ? '#a6d96a' :
            mag > 3.5 ? '#66bd63' :
            mag > 3.0 ? '#1a9850' : //felt, but only minor damage
                        '#006837' ;
    }

  // Create a GeoJSON layer containing the features array on the earthquakeData object and styling it
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature, 
    pointToLayer: function(feature, latlng){
        return L.circleMarker(latlng, {
            radius: Math.pow(1.8, feature.properties.mag), //use powers of 1.8 so that circles are appropriately bigger at bigger magnitudes
            fillColor: colorGradient(feature.properties.mag),
            fillOpacity: 0.8,
            stroke: 0
        });
    }
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  var streetMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
  });

  var satelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/satellite-v9",
    accessToken: API_KEY
  });

  var outdoorMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/outdoors-v11",
    accessToken: API_KEY
  });

  var navMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/navigation-day-v1",
    accessToken: API_KEY
  });
  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite Map": streetMap,
    "Satellite Map": satelliteMap,
    "Outdoors Map": outdoorMap,
    "Navigate Map": navMap
  };

  // url for tectonic plates
  var platesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

  var plates = new L.LayerGroup()

  // grabs plates
  d3.json(platesUrl, function(data) {
    L.geoJSON(data, {
      style: {
        fillOpacity:0
      },
      panes: "lines"
    }).addTo(plates);
  });

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": plates
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
        30, -104.0059
    ],
    zoom: 4,
    layers: [streetMap, earthquakes]
  });

  myMap.on('click', function(event){
            myMap.fitBounds(event.target.getBounds());
        }
);

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend");
    var limits = [3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5];
    var colors = ['#006837','#1a9850','#66bd63','#a6d96a','#d9ef8b','#ffffbf','#fee08b','#fdae61','#f46d43','#d73027','#a50026'];
    var labels = [];

    // Add min & max
    var legendInfo = "<h1>Earthquake Magnitude</h1>" +
      "<div class=\"labels\">" +
        "<div class=\"min\">" + limits[0] + "</div>" +
        "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
      "</div>";

    div.innerHTML = legendInfo;

    limits.forEach(function(limit, index) {
      labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };

  legend.addTo(myMap);

}
