/// <reference path="../arcgis-js-api.d.ts"/>

import esri = require("esri");
import Map = require("esri/map");
import Point = require("esri/geometry/Point");
import Scalebar = require("esri/dijit/Scalebar");
import BasemapGallery = require("esri/dijit/BasemapGallery");
import Polygon = require("esri/geometry/Polygon");
import Draw = require("esri/toolbars/draw")
import Edit = require("esri/toolbars/edit");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import Graphic = require("esri/graphic");
import jsonUtils = require("esri/geometry/jsonUtils");
import Color = require("esri/Color");
//import Menu = require("esri/dijit/Menu");
//import MenuItem = require("dijit/MenuItem");
//import MenuSeperator = require("dijit/MenuSeparator");
export = MapController;

class MapController {
    map: Map;

    constructor(public mapDiv: string) {
    }

    start() {
        var point = new Point(-122.45, 37.75); // long, lat
       
        var mapOptions: esri.MapOptions = {};
        mapOptions.basemap = "topo";
        mapOptions.center = point;
        mapOptions.zoom = 12;

        this.map = new Map(this.mapDiv, mapOptions);

        this.addScaleBar();
        this.addBasemapGallery();
      
    }

    private addScaleBar() {
        var scalebar = new Scalebar({
            map: this.map,
            // "dual" displays both miles and kilmometers
            // "english" is the default, which displays miles
            // use "metric" for kilometers
            scalebarUnit: "dual"
        });
    }

    private addBasemapGallery() {
        //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: true,
            map: this.map
        }, "basemapGallery");
        basemapGallery.startup();
      
        basemapGallery.on("error", function (msg) {
            console.log("basemap gallery error:  ", msg);
        });
    }
}