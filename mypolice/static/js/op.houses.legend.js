(function ($, OP) {

    $.extend(OP.viewmodel, {
        searcherCollapsed: false
    });

    $.extend(OP.view, {
        $legend: null,
        $symbols: null
    });

    OP.houses.legend = {};
    $.extend(OP.houses.legend, {

        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        setDomOptions: function () {
            var view = OP.view;

            view.$legend = $('#legend');
            view.$symbols = view.$legend.find('div.symbols');
        },


        bindEvents: function () {
            var context = this;

            OP.view.$legend.find('span.icon-collapse, div.title').off('click').on('click', function () {
                OP.viewmodel.searcherCollapsed = !OP.viewmodel.searcherCollapsed;
                OP.view.$body.toggleClass('searcher-collapsed', OP.viewmodel.searcherCollapsed);
            });

            OP.view.$document.on('/op/houses/updated', function () {
                context.buildLegend();
            });
        },


        buildLegend: function () {
            var $symbols = OP.view.$symbols,
                policemen = OP.viewmodel.policemen,
                policemenArray = [],
                policeman;

            for (policeman in policemen) {
                if (policemen.hasOwnProperty(policeman)) {
                    policemenArray.push({
                        name: policemen[policeman].name,
                        color: policemen[policeman].color
                    });
                }
            }

            $symbols.empty().append(OP.templates['policemen-symbols']({
                policemen: policemenArray
            }));

        }
    });
})(jQuery, OP);