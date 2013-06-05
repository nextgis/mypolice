var OP = {};

(function ($, OP) {
    OP.viewmodel = {};
    OP.view = {};

    $.extend(OP.viewmodel, {
        version: 0.1
    });
    $.extend(OP.view, {
        $document: null,
        $body: null
    });

    OP.loader = {};
    $.extend(OP.loader, {


        init: function () {
            this.setDomOptions();
            this.bindEvents();
            this.initModules();
        },


        initModules: function () {
            try {
                OP.search.init();
                OP.map.init();
                OP.houses.init();
                OP.houses.legend.init();
                OP.osm.geocoder.init();
            } catch (e) {
                alert(e);
            }
        },


        bindEvents: function () {
            OP.view.$document.on('keyup', function (e) {
                if (e.keyCode === 27) {
                    OP.view.$document.trigger('/op/escape');
                }
            });
        },


        setDomOptions: function () {
            OP.view.$document = $(document);
            OP.view.$body = $('body');
        }
    });


    $(document).ready(function () {
        OP.loader.init();
    });
})(jQuery, OP);
