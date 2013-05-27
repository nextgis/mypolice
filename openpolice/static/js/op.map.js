(function ($, OP) {

    $.extend(OP.viewmodel, {
        map: null
    });

    $.extend(OP.view, {
        $map: null
    });

    OP.map = {};
    $.extend(OP.map, {
        defaultExtent: {
            latlng: new L.LatLng(55.742, 37.658),
            zoom: 14
        },

        init: function () {
            this.buildMap();
            this.buildOsmTileLayer();
        },


        buildMap: function () {
            var viewmodel = OP.viewmodel,
                lastExtent = this.getLastExtent();

            OP.view.$map = $('#map');
            viewmodel.map = new L.Map('map');

            L.control.scale().addTo(viewmodel.map);

            if (lastExtent) {
                viewmodel.map.setView(lastExtent.latlng, lastExtent.zoom);
            } else {
                viewmodel.map.setView(this.defaultExtent.latlng, this.defaultExtent.zoom);
                this.setLastExtent(this.defaultExtent.latlng, this.defaultExtent.zoom);
            }
        },


        buildOsmTileLayer: function () {
            this.addTileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                '© OpenStreetMap contributors', 8, 18);
        },


        addTileLayer: function (url, attribution, minZoom, maxZoom) {
            var layer = new L.TileLayer(url, {minZoom: minZoom, maxZoom: maxZoom, attribution: attribution});
            OP.viewmodel.map.addLayer(layer, true);
        },


        getLastExtent: function () {
            var lat = parseFloat($.cookie('map.lat'), 10),
                lng = parseFloat($.cookie('map.lng'), 10),
                zoom = parseInt($.cookie('map.zoom'), 10);
            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            } else {
                return null;
            }
        },


        setLastExtent: function (latLng, zoom) {
            $.cookie('map.lat', latLng.lat, { expires: 7, path: '/' });
            $.cookie('map.lng', latLng.lng, { expires: 7, path: '/' });
            $.cookie('map.zoom', zoom, { expires: 7, path: '/' });
        }
    });
})(jQuery, OP);