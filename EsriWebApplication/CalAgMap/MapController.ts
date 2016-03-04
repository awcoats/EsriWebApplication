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
import HomeButton = require("esri/dijit/HomeButton");
import LocateButton = require("esri/dijit/LocateButton");
import Menu = require("dijit/Menu");
import MenuItem = require("dijit/MenuItem");
import MenuSeparator = require("dijit/MenuSeparator");
import geometryJsonUtils = require("esri/geometry/jsonUtils");

export = MapController;

class MapController {
    map: Map;
    toolbar: Draw;
    fillSymbol: SimpleFillSymbol;

    // right click graphics editing toolbar
    editToolbar;
    ctxMenuForGraphics;
    ctxMenuForMap;
    selected;
    currentLocation;
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
            this.createToolbarAndContextMenu();
        });

        var basemap = new OpenStreetMapLayer();
        //http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer

        this.map.addLayer(basemap);
        this.addHomeButton();
        var geoLocate = new LocateButton({
            map: this.map
        }, "LocateButton");
        geoLocate.startup();

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
        this.createGraphicsToolbar();

       

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
    private createToolbarAndContextMenu() {

        // Create and setup editing tools
        this.editToolbar = new Edit(this.map);

        this.map.on("click",  (evt)=> {
            this.editToolbar.deactivate();
        });
        this.createMapMenu();
        this.createGraphicsMenu();
    }



    private createMapMenu() {
        // Creates right-click context menu for map
        this.ctxMenuForMap = new Menu({
            onOpen:  (box)=> {
                // Lets calculate the map coordinates where user right clicked.
                // We'll use this to create the graphic when the user clicks
                // on the menu item to "Add Point"
                this.currentLocation =this.getMapPointFromMenuPosition(box);
                this.editToolbar.deactivate();
            }
        });

        this.ctxMenuForMap.addChild(new MenuItem({
            label: "Add Point",
            onClick: (evt)=> {
                var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_SQUARE,
                    30,
                    new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SOLID,
                        new Color([200, 235, 254, 0.9]),
                        2
                    ), new Color([200, 235, 254, 0.5]));
                var graphic = new Graphic(geometryJsonUtils.fromJson(this.currentLocation.toJson()), symbol);
                this.map.graphics.add(graphic);
            }
        }));

        this.ctxMenuForMap.startup();
        this.ctxMenuForMap.bindDomNode(this.map);
    }
    private createGraphicsMenu() {
        // Creates right-click context menu for GRAPHICS
        this.ctxMenuForGraphics = new Menu({});
        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Edit",
            onClick:  () =>{
                if (this.selected.geometry.type !== "point") {
                    this.editToolbar.activate(Edit.EDIT_VERTICES, this.selected);
                } else {
                    alert("Not implemented");
                }
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Move",
            onClick:  ()=> {
                this.editToolbar.activate(Edit.MOVE, this.selected);
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Rotate/Scale",
            onClick: ()=> {
                if (this.selected.geometry.type !== "point") {
                    this.editToolbar.activate(Edit.ROTATE | Edit.SCALE, this.selected);
                } else {
                    alert("Not implemented");
                }
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Style",
            onClick: () =>{
                alert("Not implemented");
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuSeparator());
        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Delete",
            onClick:  ()=> {
                this.map.graphics.remove(this.selected);
            }
        }));

        this.ctxMenuForGraphics.startup();

        this.map.graphics.on("mouse-over",  (evt)=> {
            // We'll use this "selected" graphic to enable editing tools
            // on this graphic when the user click on one of the tools
            // listed in the menu.
            this.selected = evt.graphic;

            // Let's bind to the graphic underneath the mouse cursor           
            this.ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
        });

        this.map.graphics.on("mouse-out",  (evt) =>{
            this.ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
        });
    }

    // Helper Methods
    private getMapPointFromMenuPosition(box) {
        var x = box.x, y = box.y;
        switch (box.corner) {
            case "TR":
                x += box.w;
                break;
            case "BL":
                y += box.h;
                break;
            case "BR":
                x += box.w;
                y += box.h;
                break;
        }

        var screenPoint = new Point(x - this.map.position.x, y - this.map.position.y);
        return this.map.toMap(screenPoint);
    }
    private addHomeButton() {
        var home = new HomeButton({
            map: this.map
        }, "HomeButton");
        home.startup();
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


    private createGraphicsToolbar() {
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
       
        var myButton = new Button({
            label: "Clear",
            onClick:  () =>{
                this.map.graphics.clear();
            }
        }, dom.byId("ClearGraphics")).startup();
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