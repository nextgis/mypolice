(function ($, OP) {

    $.extend(OP.viewmodel, {
    });

    $.extend(OP.view, {
        $searchResults: null
    });

    OP.search = {};
    $.extend(OP.search, {

        init: function () {
            this.setDomOptions();
            this.bindEvents();
        },


        bindEvents: function () {
            var context = this;

            $('#addressSearch input.address').off('keyup').on('keyup', function (e) {
                context.manageSearchInputs(e, this.value);
            });

            $("#addressSearchForm").submit(function (e) {
                e.preventDefault();
            });

            OP.view.$document.on('/op/search/clearSearchResults', function () {
                context.clearSearchResults();
            });

            OP.view.$document.on('/op/escape', function () {
                context.clearSearchResults();
            });
        },


        timeout: null,
        manageSearchInputs: function (event, searchValue) {
            var context = this,
                keycode = event.keyCode || event.which;

            if (keycode === 13) {
                this.search(searchValue, 'searchByEnter');
            }

            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            this.timeout = setTimeout(function () {
                clearTimeout(context.timeout);
                context.timeout = null;
                context.searchKeyHandler(event, searchValue);
            }, 1000);
        },


        isSearchResultsExist: false,
        searchKeyHandler: function (event, searchValue) {
            if (this.validateSearch(searchValue)) {
                this.search(searchValue, 'searchByChar');
            } else if (this.isSearchResultsExist) {
                this.clearSearchResults();
            }
        },


        clearSearchResults: function () {
            OP.view.$searchResults.empty();
            this.isSearchResultsExist = false;
        },


        validateSearch: function (searchValue) {
            if ($.trim(searchValue) === '') { return false; }
            if (searchValue.length < 4) { return false; }
            return true;
        },


        countSearchResultsVisible: 7,
        search: function (address, handler) {
            var context = this,
                matches;
            address = this.prepareSearch(address);
            OP.view.$searchResults.empty().addClass('loader');
            OP.view.$document.trigger('/op/osm/geocoder/direct', [address, function (result) {
                OP.view.$searchResults.removeClass('loader');
                matches = result.matches;
                context[handler](matches);
            }]);
        },


        searchByChar: function (matches) {
            var matchesCount = 0;
            if (matches) {
                matchesCount = matches.length;
                if (matchesCount > this.countSearchResultsVisible) {
                    matches = matches.slice(0, this.countSearchResultsVisible);
                }
            }
            this.buildSearchResults(matches);
            this.bindEventsAfterSearch(matchesCount);
        },


        searchByEnter: function (matches) {
            if (matches) {
                this.goToSearchedAddress(matches[0].lat, matches[0].lon);
            } else {
                this.buildSearchResults(null);
            }
        },


        buildSearchResults: function (matches) {
            OP.view.$searchResults.empty().append(OP.templates['search-item']({
                matches: matches
            }));
        },

        prepareSearch: function (address) {
            return 'Москва, ' + address;
        },


        bindEventsAfterSearch: function (matchesCount) {
            var context = this;

            if (matchesCount > 0) {
                OP.view.$searchResults.find('li.address').off('click').on('click', function (e) {
                    var $this = $(this);
                    context.goToSearchedAddress($this.data('lat'), $this.data('lng'));
                });
            } else {
                this.showNotFoundResults();
            }
        },


        goToSearchedAddress: function (lat, lng) {
            this.clearSearchResults();
            OP.viewmodel.map.closePopup();
            OP.view.$document.trigger('/op/map/setview', [lat, lng]);
        },


        showNotFoundResults: function () {
            OP.view.$searchResults.find('ul').delay(1000).fadeOut(1000);
        },


        setDomOptions: function () {
            OP.view.$searchResults = $('#searchResults');
        }
    });
})(jQuery, OP);