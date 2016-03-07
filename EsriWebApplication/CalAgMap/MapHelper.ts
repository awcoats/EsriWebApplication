import HomeButton = require("esri/dijit/HomeButton");
import LocateButton = require("esri/dijit/LocateButton");
import Scalebar = require("esri/dijit/Scalebar");

import Map = require("esri/map");

export = MapHelper;

class MapHelper {


    constructor(public map: Map) {

    }

    addHomeButton() {
        var home = new HomeButton({
            map: this.map
        }, "HomeButton");
        home.startup();
    }

    addLocateButton() {
        var geoLocate = new LocateButton({
            map: this.map
        }, "LocateButton");
        geoLocate.startup();
    }

    addScaleBar() {
        var scalebar = new Scalebar({
            map: this.map,
            // "dual" displays both miles and kilmometers
            // "english" is the default, which displays miles
            // use "metric" for kilometers
            scalebarUnit: "dual"
        });
    }
}