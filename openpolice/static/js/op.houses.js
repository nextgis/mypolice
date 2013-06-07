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
                map.panBy([0, -100]);
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
                    var viewmodel = OP.viewmodel,
                        view = OP.view;
                    viewmodel.policemen = data.policemen;
                    viewmodel.housesLayer.clearLayers();
                    viewmodel.housesLayer.addData(data.houses);
                    view.$searchResults.empty().removeClass('loader');
                    view.$document.trigger('/op/houses/updated');
                }
            });
        }
    });
})(jQuery, OP);