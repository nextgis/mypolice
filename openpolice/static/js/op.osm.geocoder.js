(function ($, OP) {

    $.extend(OP.viewmodel, {
    });

    $.extend(OP.view, {
    });

    OP.osm = {};
    OP.osm.geocoder = {};
    $.extend(OP.osm.geocoder, {

        init: function () {
            this.bindEvents();
        },


        bindEvents: function () {
            var context = this;

            OP.view.$document.on('/op/osm/geocoder/direct', function (event, geocodingSearch, callback) {
                context.directGeocode(geocodingSearch, callback);
            });
        },


        directGeocode: function (geocodingSearch, callback) {
            $.getJSON('http://beta.openstreetmap.ru/api/search?q=' + geocodingSearch, function (result) {
                callback(result);
            });
        }
    });
})(jQuery, OP);