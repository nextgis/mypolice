(function ($, OP) {

    $.extend(OP.viewmodel, {
    });

    $.extend(OP.view, {
        $permalink: null,
        $fb_link: null
    });

    OP.permalink = {};
    $.extend(OP.permalink, {
        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            OP.view.$permalink = $('#permalink');
            OP.view.$fb_link = $('#rightPanel a.facebook');
        },


        bindEvents: function () {
            OP.view.$document.on('/op/permalink/update', function (event, latlng, zoom) {
                var view = OP.view,
                    url = document['url_root'] + '?lat=' + latlng.lat + '&lng=' + latlng.lng + '&z=' + zoom;
                view.$permalink.prop('href', url);
                view.$fb_link.prop('href', 'https://www.facebook.com/sharer/sharer.php?u=' + url);
            });
        }
    });
})(jQuery, OP);
