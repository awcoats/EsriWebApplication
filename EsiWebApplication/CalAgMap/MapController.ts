/// <reference path="../arcgis-js-api.d.ts"/>
/// <reference path="../dijit.d.ts"/>
/// <reference path="../dojo.d.ts"/>

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
import Button = require("dijit/form/Button");
import on = require("dojo/on");
import dom = require("dojo/dom");
//import Menu = require("esri/dijit/Menu");
//import MenuItem = require("dijit/MenuItem");
//import MenuSeperator = require("dijit/MenuSeparator");
export = MapController;

class MapController {
    map: Map;
    toolbar: Draw;

    constructor(public mapDiv: string) {
    }

    start() {
        var point = new Point(-122.45, 37.75); // long, lat
        var mapOptions: esri.MapOptions = {};
        mapOptions.basemap = "topo";
        mapOptions.center = point;
        mapOptions.zoom = 12;

        this.map = new Map(this.mapDiv, mapOptions);

        this.map.on("load", () => {
            this.addScaleBar();
            this.addBasemapGallery();
            this.createToolbar();
        });
    }



    private createToolbar() {
        this.toolbar = new Draw(this.map);
        this.toolbar.on("draw-end", (evt) => { this.addToMap(this.toolbar, evt) });

        on(dom.byId("info"), "click",  (evt)=> {
            if (evt.target.id === "info") {
                return;
            }
            var tool = evt.target.id.toLowerCase();
            this.map.disableMapNavigation();
            this.toolbar.activate(tool);
        });
    }

    private addToMap(toolbar,evt) {
        var symbol;
        toolbar.deactivate();
        this.map.showZoomSlider();
        switch (evt.geometry.type) {
            case "point":
            case "multipoint":
                symbol = new SimpleMarkerSymbol();
                break;
            case "polyline":
                symbol = new SimpleLineSymbol();
                break;
            default:
                symbol = new SimpleFillSymbol();
                break;
        }
        var graphic = new Graphic(evt.geometry, symbol);
        this.map.graphics.add(graphic);
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