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

            OP.view.$document.on('/op/search/clearSearchResults', function () {
                context.clearSearchResults();
            });

            OP.view.$document.on('/op/escape', function () {
                context.clearSearchResults();
            });
        },


        searchInputHandler: [],
        manageSearchInputs: function (event, searchValue) {
            if (event.keyCode === 27) {
                this.clearSearchResults();
                this.searchInputHandler = [];
                this.isSearchResultsExist = false;
                return false;
            }
            var context = this;
            this.searchInputHandler.push([event, searchValue]);
            setTimeout(function () {
                var countInputHandlers = context.searchInputHandler.length;
                if (countInputHandlers > 1) {
                    context.searchInputHandler.splice(0, 1);
                } else if (countInputHandlers === 1) {
                    context.searchKeyHandler(context.searchInputHandler[0][0], context.searchInputHandler[0][1]);
                    context.searchInputHandler.splice(0, 1);
                }
            }, 1000);
        },


        isSearchResultsExist: false,
        searchKeyHandler: function (event, searchValue) {
            var keyCode = event.keyCode;
            if (keyCode === 13) {
                event.preventDefault();
            }
            if (this.validateSearch(searchValue)) {
                this.search(searchValue);
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
        search: function (address) {
            var context = this,
                matches,
                matchesCount = 0;
            OP.view.$searchResults.empty().addClass('loader');
            OP.view.$document.trigger('/op/osm/geocoder/direct', [address, function (result) {
                matches = result.matches;
                if (matches) {
                    matchesCount = result.matches.length;
                    if (matchesCount > context.countSearchResultsVisible) {
                        matches = matches.slice(0, context.countSearchResultsVisible);
                    }
                }
                OP.view.$searchResults.removeClass('loader');
                context.isSearchResultsExist = true;
                OP.view.$searchResults.append(OP.templates['search-item']({
                    matches: matches
                }));

                context.bindEventsAfterSearch(matchesCount);
            }]);
        },


        bindEventsAfterSearch: function (matchesCount) {
            var context = this;

            if (matchesCount > 0) {
                OP.view.$searchResults.find('li.address').off('click').on('click', function (e) {
                    var $this = $(this);
                    context.clearSearchResults();
                    OP.view.$document.trigger('/op/map/setview', [$this.data('lat'), $this.data('lng')]);
                });
            } else {
                OP.view.$searchResults.find('ul').delay(1000).fadeOut(1000);
            }
        },


        setDomOptions: function () {
            OP.view.$searchResults = $('#searchResults');
        }
    });
})(jQuery, OP);