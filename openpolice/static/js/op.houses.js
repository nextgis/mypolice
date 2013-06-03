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
                onEachFeature: this.bindFeatureEvents,
                style: this.setStyle
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
            return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1,6);
        }
    });
})(jQuery, OP);