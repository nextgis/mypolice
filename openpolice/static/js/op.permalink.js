(function ($, OP) {

    $.extend(OP.viewmodel, {
    });

    $.extend(OP.view, {
        $permalink: null
    });

    OP.permalink = {};
    $.extend(OP.permalink, {
        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            OP.view.$permalink = $('#permalink');
        },


        bindEvents: function () {
            OP.view.$document.on('/op/permalink/update', function (event, latlng, zoom) {
                OP.view.$permalink.prop("href", document['url_root'] +
                    '?lat=' + latlng.lat +
                    '&lng=' + latlng.lng +
                    '&z=' + zoom);
            });
        }
    });
})(jQuery, OP);
