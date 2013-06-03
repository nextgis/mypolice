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
                onEachFeature: this.bindFeatureEvents
            }).addTo(viewmodel.map);
        },


        bindFeatureEvents: function (feature, layer) {
            var policeman = OP.viewmodel.policemen[feature.properties.pm_id];
            layer.bindPopup(OP.templates['house-popup']({
                policeman: policeman
            }));

            layer.on('click', function () {
                this.openPopup();
            });
        },


        updateHousesLayer: function () {
            var viewmodel = OP.viewmodel;

            if (!this.validateMap(viewmodel.map)) {
                return false;
            }

            viewmodel.housesLayer.clearLayers();
            viewmodel.policemen = [];
            this.ajaxGetHouses();
        },


        validateMap: function (map) {
            return map.getZoom() > 16;
        },


        ajaxGetHouses: function () {
            var url = document.url_root + 'houses';
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
                    viewmodel.housesLayer.addData(data.houses);
                }
            });
        }
    });
})(jQuery, OP);