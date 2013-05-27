(function ($, OP) {

    $.extend(OP.viewmodel, {
    });

    $.extend(OP.view, {

    });

    OP.search = {};
    $.extend(OP.search, {
        init: function () {
            this.bindEvents();
        },


        bindEvents: function () {
            var context = this;

            $('#addressSearch input.address').off('keyup').on('keyup', function (e) {
                if ($.trim(this.value) === '') {
                    return false;
                }
                var address = $(this).val();
                if (address.length > 3) {
                    OP.view.$document.trigger('/op/osm/geocoder/direct', [address, function (result) {
                        alert(result);
                    }]);
                }
            });
        },


        setDomOptions: function () {

        }
    });
})(jQuery, OP);