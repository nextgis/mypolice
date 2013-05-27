var OP = {};

(function ($, OP) {
    OP.viewmodel = {};
    OP.view = {};

    $.extend(OP.viewmodel, {
        version: 0.1
    });
    $.extend(OP.view, {
        $document: null
    });

    OP.loader = {};
    $.extend(OP.loader, {


        init: function () {
            this.setDomOptions();
            this.initModules();
        },


        initModules: function () {
            try {
                OP.search.init();
                OP.map.init();
                OP.osm.geocoder.init();
            }
            catch (e) {
                alert(e);
            }
        },


        setDomOptions: function () {
            OP.view.$document = $(document);
        }
    });


    $(document).ready(function () {
        OP.loader.init();
    });
})(jQuery, OP);
