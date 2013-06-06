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
            var url = 'http://beta.openstreetmap.ru/api/search?callback=?&q=' + geocodingSearch;
            $.ajax({
                type: 'GET',
                url: url,
                async: false,
                jsonpCallback: 'jsonCallback',
                contentType: "application/json",
                dataType: 'jsonp',
                success: function (result) {
                    callback(result);
                }
            });
        }
    });
})(jQuery, OP);