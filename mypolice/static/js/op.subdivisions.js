(function ($, OP) {

    $.extend(OP.viewmodel, {
        subdivisionsLayer: null,
        subdivisions: null
    });

    $.extend(OP.view, {
    });

    OP.subdivisions = {};
    $.extend(OP.subdivisions, {


        init: function () {
            this.buildSubdivisionsLayer();
            this.bindEvents();
        },


        buildSubdivisionsLayer: function () {
            var viewmodel = OP.viewmodel;
            viewmodel.subdivisionsLayer = L.layerGroup().addTo(viewmodel.map);
        },


        bindEvents: function () {
            var context = this;

            OP.view.$document.on('/op/subdivisions/update', function (event, subdivisions) {
                context.updateSubdivisions(subdivisions);
            });
        },


        updateSubdivisions: function (subdivisions) {
            var viewmodel = OP.viewmodel,
                subdivisionId,
                subdivision,
                latlng,
                marker,
                html,
                map;
            viewmodel.subdivisions = subdivisions;
            viewmodel.subdivisionsLayer.clearLayers();
            for (subdivisionId in subdivisions) {
                if (subdivisions.hasOwnProperty(subdivisionId)) {
                    latlng = [subdivisions[subdivisionId].geo.coordinates[1],
                        subdivisions[subdivisionId].geo.coordinates[0]];
                    marker = L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'subdivision',
                            iconSize: [32, 32]
                        })
                    }).on('click', function (event) {
                        latlng = this.getLatLng();
                        html = OP.templates['subdivision-popup']({
                            subdivision: OP.viewmodel.subdivisions[this.id]
                        });
                        map = OP.viewmodel.map;
                        map.panTo(latlng);
                        map.openPopup(L.popup().setLatLng(latlng).setContent(html));
                        map.panBy([0, -100]);
                    });
                    marker.id = subdivisionId;
                    marker.addTo(OP.viewmodel.map);
                }
            }
        }
    });
})(jQuery, OP);