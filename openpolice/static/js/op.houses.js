(function ($, OP) {

    $.extend(OP.viewmodel, {
        housesLayer: null,
        policemen: []
    });

    $.extend(OP.view, {
    });

    OP.houses = {};
    $.extend(OP.houses, {
        init: function () {
            this.bindEvents();
            this.buildHousesLayer();
            this.updateHousesLayer();
        },


        bindEvents: function () {
            var context = this;

            OP.view.$document.on('/op/map/moveend', function () {
                context.updateHousesLayer();
            });
        },


        buildHousesLayer: function () {
            var viewmodel = OP.viewmodel;
            viewmodel.housesLayer = L.geoJson(null, {
                onEachFeature: this.bindFeatureEvents,
                style: this.setStyle
            }).addTo(viewmodel.map);
        },


        bindFeatureEvents: function (feature, layer) {
            layer.on('click', function (event) {
                var map = OP.viewmodel.map,
                    latlng = event.latlng,
                    policeman = OP.viewmodel.policemen[feature.properties.pm_id],
                    html = OP.templates['house-popup']({
                        policeman: policeman,
                        address: feature.properties.address
                    });
                map.panTo(latlng);
                map.openPopup(L.popup().setLatLng(latlng).setContent(html));
            });
        },


        setStyle: function (feature) {
            return {
                color: OP.viewmodel.policemen[feature.properties.pm_id].color,
                opacity: 1.0,
                weight: 3
            };
        },


        updateHousesLayer: function () {
            var viewmodel = OP.viewmodel;

            if (!this.validateMap(viewmodel.map)) {
                return false;
            }

            OP.view.$searchResults.empty().addClass('loader');
            viewmodel.housesLayer.clearLayers();
            viewmodel.policemen = [];
            this.ajaxGetHouses();
        },


        validateMap: function (map) {
            return map.getZoom() > 16;
        },


        ajaxGetHouses: function () {
            var context = this,
                url = document.url_root + 'houses';
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'box' : JSON.stringify(OP.viewmodel.map.getBounds())
                },
                dataType: 'json',
                success: function (data) {
                    var viewmodel = OP.viewmodel;
                    viewmodel.policemen = data.policemen;
                    context.setPolicemenColors();
                    viewmodel.housesLayer.addData(data.houses);
                    OP.view.$searchResults.empty().removeClass('loader');
                }
            });
        },


        setPolicemenColors: function () {
            var policemen = OP.viewmodel.policemen,
                policeman;

            for (policeman in policemen) {
                if (policemen.hasOwnProperty(policeman)) {
                    policemen[policeman]['color'] = this.getRandomColor();
                }
            }
        },


        getRandomColor: function () {
            return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
        }
    });
})(jQuery, OP);