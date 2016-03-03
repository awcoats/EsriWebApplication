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
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import Graphic = require("esri/graphic");
import jsonUtils = require("esri/geometry/jsonUtils");
import Color = require("esri/Color");
import Button = require("dijit/form/Button");
import on = require("dojo/on");
import dom = require("dojo/dom");
import registry = require("dijit/registry");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Legend = require("esri/dijit/Legend");
import LayerList = require("esri/dijit/LayerList");
import arrayUtils = require("dojo/_base/array");
import PopupTemplate = require("esri/dijit/PopupTemplate");
import parser = require("dojo/parser");
import CalAgPrinting = require("CalAgPrinting");
import Measurement = require("esri/dijit/Measurement");
import ColorPicker = require("esri/dijit/ColorPicker");
import SymbolStyler = require("esri/dijit/SymbolStyler");
import OpenStreetMapLayer = require("esri/layers/OpenStreetMapLayer");
import HorizontalSlider = require("dijit/form/HorizontalSlider");

export = MapController;

class MapController {
    map: Map;
    toolbar: Draw;
    fillSymbol: SimpleFillSymbol;

    constructor(public mapDiv: string) {
    }

    start() {
        // required to make the dojo-type tags to be transformed for the window/ floating toolbar
        var root = document.getElementById("toolbox");
        parser.parse(root, {});
       
        console.log("MapController.start()");
        var point = new Point(-121.3719172, 37.9730027); // long, lat
        var mapOptions: esri.MapOptions = {};
        mapOptions.basemap = "gray";
        mapOptions.center = point;
        mapOptions.zoom = 6;

       
        this.map = new Map(this.mapDiv, mapOptions);

        this.map.on("load", () => {
            console.log("map loaded");
            var pFP = registry.byId("testFloatingPane");
            //pFP.show();
            //dom.byId("testFloatingPane").attr("display","inline");
        });

        var basemap = new OpenStreetMapLayer();
        //http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer

        this.map.addLayer(basemap);

        var featureLayer = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ["*"]
        });
        //var featureLayer = new FeatureLayer("http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/fbTrim/FeatureServer/0", {
        //    mode: FeatureLayer.MODE_ONDEMAND,
        //    outFields: ["*"]
        //});

        this.map.addLayer(featureLayer);

        this.addScaleBar();
        this.addBasemapGallery();
        this.createToolbar();

       

        //this.fillSymbol = new SimpleFillSymbol();
        //this.fillSymbol.style = SimpleFillSymbol.STYLE_SOLID;
        //this.fillSymbol.setColor(new Color([255, 255, 0, 0.5]));
        //var renderer = new SimpleRenderer(this.fillSymbol);
        //featureLayer.setRenderer(renderer);

        this.addLayerList();
        
        this.addLegend(featureLayer);

        //var measurement = new Measurement({
        //    map: this.map
        //}, dom.byId("measurementDiv"));
        //measurement.startup();
      
        this.addLayerColorPicker(featureLayer);
      
    }

    private addLayerColorPicker(featureLayer: FeatureLayer) {
    var myButton = new Button({
            label: "Apply",
            onClick: function () {
              
            }
        }, dom.byId("symbolStylerApply")).startup();
        
        //var colorPicker = new ColorPicker({
        //    required: false, color: new Color("red"), colorsPerRow: 10, palette: null, recentColors: [], showRecentColors: false, showTransparencySlider: true

        //}, "fillColorDiv");
        //colorPicker.on("color-change", (evt) => {
        //    this.fillSymbol.setColor(evt.target.color);
        //    var renderer = new SimpleRenderer(this.fillSymbol);
        //    featureLayer.setRenderer(renderer);
        //    featureLayer.redraw();
        //});
        //colorPicker.startup();

        //var colorPicker2 = new ColorPicker({
        //    required: false, color: new Color("red"), colorsPerRow: 10, palette:null, recentColors: [], showRecentColors: false, showTransparencySlider: true
        //}, "outlineColorDiv");
        //colorPicker2.on("color-change", (evt) => {
        //    var lineSymbol = new SimpleLineSymbol();
        //    lineSymbol.setColor(evt.target.color);
        //    this.fillSymbol.setOutline(lineSymbol);
        //    var renderer = new SimpleRenderer(this.fillSymbol);
        //    featureLayer.setRenderer(renderer);
        //    featureLayer.redraw();
        //});
        //colorPicker2.startup();

    }

    private addLegend(featureLayer) {
        var layer = featureLayer;
        var layerInfo = [{ layer: layer, title: 'States' }];

        if (layerInfo.length > 0) {
            var legendDijit = new Legend({
                map: this.map,
                layerInfos: layerInfo
            }, "legendDiv");
            legendDijit.startup();
        }
    }


    private addLayerList() {
        var myWidget = new LayerList({
            map: this.map,
            layers: this.map.getLayersVisibleAtScale()
        }, "layerList");
        myWidget.startup()
    }


    private createToolbar() {
        this.toolbar = new Draw(this.map);
        this.toolbar.on("draw-end", (evt) => { this.addToMap(this.toolbar, evt) });

        on(dom.byId("info"), "click", (evt) => {
            if (evt.target.id === "info") {
                return;
            }
            var tool = evt.target.id.toLowerCase();
            this.map.disableMapNavigation();
            this.toolbar.activate(tool);
        });
    }

    private addToMap(toolbar, evt) {
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

        var slider = new HorizontalSlider({
            name: "slider",
            value: 1,
            minimum: 0,
            maximum: 1,
            showButtons: true,
            intermediateChanges: true,
            onChange: (value) => {
                //TODO: remove hard coding of this layer
                var layer = this.map.getLayer("layer2").setOpacity(value);
            }
        }, dom.byId("opacitySlider"));
        slider.startup();
    }
}