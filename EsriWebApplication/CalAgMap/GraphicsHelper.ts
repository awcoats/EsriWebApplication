import Menu = require("dijit/Menu");
import MenuItem = require("dijit/MenuItem");
import MenuSeparator = require("dijit/MenuSeparator");
import geometryJsonUtils = require("esri/geometry/jsonUtils");
import Edit = require("esri/toolbars/edit");
import Map = require("esri/map");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import Color = require("esri/Color");
import Graphic = require("esri/graphic");
import Point = require("esri/geometry/Point");
import dom = require("dojo/dom");
import BufferParameters = require("esri/tasks/BufferParameters");
//import GeometryService = require("esri/tasks/GeometryService");
import MapController = require("./MapController");
import normalizeUtils = require("esri/geometry/normalizeUtils");
import esriConfig = require("esri/config");
import array = require("dojo/_base/array");

export = GraphicsHelper;

class GraphicsHelper {
    map: Map
    mapController: MapController;
    // right click graphics editing toolbar
    editToolbar;
    ctxMenuForGraphics;
    ctxMenuForMap;
    selected;
    currentLocation;

    constructor(public mapController2: MapController) {
        this.map = mapController2.map;
        this.mapController = mapController2;

        //TODO - enable Geometry server.
        //esriConfig.defaults.geometryService = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
    }

    public createToolbarAndContextMenu() {

        // Create and setup editing tools
        this.editToolbar = new Edit(this.map);

        this.map.on("click", (evt) => {
         
            this.editToolbar.deactivate();
        });
        //this.editToolbar.on("draw-end", this.doBuffer);
        this.createMapMenu();
        this.createGraphicsMenu();
    }



    private createMapMenu() {
        // Creates right-click context menu for map
        this.ctxMenuForMap = new Menu({
            onOpen: (box) => {
                // Lets calculate the map coordinates where user right clicked.
                // We'll use this to create the graphic when the user clicks
                // on the menu item to "Add Point"
                this.currentLocation = this.getMapPointFromMenuPosition(box);
                this.editToolbar.deactivate();
            }
        });

        this.ctxMenuForMap.addChild(new MenuItem({
            label: "Add Point",
            onClick: (evt) => {
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
        //var container = dom.byId("mapContainer").get;
        this.ctxMenuForMap.bindDomNode(this.map.container);
    }
    private createGraphicsMenu() {
        // Creates right-click context menu for GRAPHICS
        this.ctxMenuForGraphics = new Menu({});
        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Edit",
            onClick: () => {
                if (this.selected.geometry.type !== "point") {
                    this.editToolbar.activate(Edit.EDIT_VERTICES, this.selected);
                } else {
                    alert("Not implemented");
                }
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Move",
            onClick: () => {
                this.editToolbar.activate(Edit.MOVE, this.selected);
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Rotate/Scale",
            onClick: () => {
                if (this.selected.geometry.type !== "point") {
                    this.editToolbar.activate(Edit.ROTATE | Edit.SCALE, this.selected);
                } else {
                    alert("Not implemented");
                }
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Style",
            onClick: () => {
                alert("Not implemented");
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuSeparator());

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Buffer",
            onClick: () => {
                //var graphics = this.map.graphics[0];
                //this.doBuffer(graphics);
            }
        }));

        this.ctxMenuForGraphics.addChild(new MenuSeparator());

        this.ctxMenuForGraphics.addChild(new MenuItem({
            label: "Delete",
            onClick: () => {
                this.map.graphics.remove(this.selected);
            }
        }));

        this.ctxMenuForGraphics.startup();

        this.map.graphics.on("mouse-over", (evt) => {
            // We'll use this "selected" graphic to enable editing tools
            // on this graphic when the user click on one of the tools
            // listed in the menu.
            this.selected = evt.graphic;

            // Let's bind to the graphic underneath the mouse cursor           
            this.ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
        });

        this.map.graphics.on("mouse-out", (evt) => {
            this.ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
        });
    }

    /*private doBuffer(evtObj) {
        //tb.deactivate();
        console.log("doBuffer");
        this.mapController.toolbar.deactivate();
        var geometry = evtObj.geometry, symbol;
        switch (geometry.type) {
            case "point":
                symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([0, 255, 0, 0.25]));
                break;
            case "polyline":
                symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
                break;
            case "polygon":
                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                break;
        }

        var graphic = new Graphic(geometry, symbol);
        this.map.graphics.add(graphic);

        //setup the buffer parameters
        var params = new BufferParameters();
        params.distances = [dom.byId("distance").value];
        params.outSpatialReference = this.map.spatialReference;
        params.unit = GeometryService[dom.byId("unit").value];
        //normalize the geometry 

        normalizeUtils.normalizeCentralMeridian([geometry]).then( (normalizedGeometries) =>{
            var normalizedGeometry = normalizedGeometries[0];
            if (normalizedGeometry.type === "polygon") {
                //if geometry is a polygon then simplify polygon.  This will make the user drawn polygon topologically correct.
                esriConfig.defaults.geometryService.simplify([normalizedGeometry],  (geometries)=> {
                    params.geometries = geometries;
                    esriConfig.defaults.geometryService.buffer(params, this.showBuffer);
                });
            } else {
                params.geometries = [normalizedGeometry];
                esriConfig.defaults.geometryService.buffer(params, this.showBuffer);
            }

        });
    }

    private showBuffer(bufferedGeometries) {
        var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0, 0.65]), 2
            ),
            new Color([255, 0, 0, 0.35])
        );

        array.forEach(bufferedGeometries, function (geometry) {
            var graphic = new Graphic(geometry, symbol);
            this.map.graphics.add(graphic);
        });
    }*/

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
}