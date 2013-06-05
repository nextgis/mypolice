/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (obj) {
    return Object_toString.call(obj) === '[object Array]';
  };

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      this.tail = this.tail.substring(match[0].length);
      this.pos += match[0].length;
      return match[0];
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var match, pos = this.tail.search(re);

    switch (pos) {
    case -1:
      match = this.tail;
      this.pos += this.tail.length;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, pos);
      this.tail = this.tail.substring(pos);
      this.pos += pos;
    }

    return match;
  };

  function Context(view, parent) {
    this.view = view || {};
    this.parent = parent;
    this._cache = {};
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value = this._cache[name];

    if (!value) {
      if (name == '.') {
        value = this.view;
      } else {
        var context = this;

        while (context) {
          if (name.indexOf('.') > 0) {
            value = context.view;
            var names = name.split('.'), i = 0;
            while (value && i < names.length) {
              value = value[names[i++]];
            }
          } else {
            value = context.view[name];
          }

          if (value != null) break;

          context = context.parent;
        }
      }

      this._cache[name] = value;
    }

    if (typeof value === 'function') value = value.call(this.view);

    return value;
  };

  function Writer() {
    this.clearCache();
  }

  Writer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Writer.prototype.compile = function (template, tags) {
    var fn = this._cache[template];

    if (!fn) {
      var tokens = mustache.parse(template, tags);
      fn = this._cache[template] = this.compileTokens(tokens, template);
    }

    return fn;
  };

  Writer.prototype.compilePartial = function (name, template, tags) {
    var fn = this.compile(template, tags);
    this._partialCache[name] = fn;
    return fn;
  };

  Writer.prototype.getPartial = function (name) {
    if (!(name in this._partialCache) && this._loadPartial) {
      this.compilePartial(name, this._loadPartial(name));
    }

    return this._partialCache[name];
  };

  Writer.prototype.compileTokens = function (tokens, template) {
    var self = this;
    return function (view, partials) {
      if (partials) {
        if (typeof partials === 'function') {
          self._loadPartial = partials;
        } else {
          for (var name in partials) {
            self.compilePartial(name, partials[name]);
          }
        }
      }

      return renderTokens(tokens, self, Context.make(view), template);
    };
  };

  Writer.prototype.render = function (template, view, partials) {
    return this.compile(template)(view, partials);
  };

  /**
   * Low-level function that renders the given `tokens` using the given `writer`
   * and `context`. The `template` string is only needed for templates that use
   * higher-order sections to extract the portion of the original template that
   * was contained in that section.
   */
  function renderTokens(tokens, writer, context, template) {
    var buffer = '';

    var token, tokenValue, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      tokenValue = token[1];

      switch (token[0]) {
      case '#':
        value = context.lookup(tokenValue);

        if (typeof value === 'object') {
          if (isArray(value)) {
            for (var j = 0, jlen = value.length; j < jlen; ++j) {
              buffer += renderTokens(token[4], writer, context.push(value[j]), template);
            }
          } else if (value) {
            buffer += renderTokens(token[4], writer, context.push(value), template);
          }
        } else if (typeof value === 'function') {
          var text = template == null ? null : template.slice(token[3], token[5]);
          value = value.call(context.view, text, function (template) {
            return writer.render(template, context);
          });
          if (value != null) buffer += value;
        } else if (value) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '^':
        value = context.lookup(tokenValue);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '>':
        value = writer.getPartial(tokenValue);
        if (typeof value === 'function') buffer += value(context);
        break;
      case '&':
        value = context.lookup(tokenValue);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(tokenValue);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += tokenValue;
        break;
      }
    }

    return buffer;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];

    var token;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      switch (token[0]) {
      case '#':
      case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;
      case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;
      default:
        collector.push(token);
      }
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          lastToken = token;
          squashedTokens.push(token);
        }
      }
    }

    return squashedTokens;
  }

  function escapeTags(tags) {
    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  function parseTemplate(template, tags) {
    template = template || '';
    tags = tags || mustache.tags;

    if (typeof tags === 'string') tags = tags.split(spaceRe);
    if (tags.length !== 2) throw new Error('Invalid tags: ' + tags.join(', '));

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr == '\n') stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) throw new Error('Unclosed tag at ' + scanner.pos);

      token = [type, value, start, scanner.pos];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        if (sections.length === 0) throw new Error('Unopened section "' + value + '" at ' + start);
        var openSection = sections.pop();
        if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tags = value.split(spaceRe);
        if (tags.length !== 2) throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
        tagRes = escapeTags(tags);
      }
    }

    // Make sure there are no open sections when we're done.
    var openSection = sections.pop();
    if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    tokens = squashTokens(tokens);

    return nestTokens(tokens);
  }

  mustache.name = "mustache.js";
  mustache.version = "0.7.2";
  mustache.tags = ["{{", "}}"];

  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  mustache.parse = parseTemplate;

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // All Mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates and partials in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Compiles the given `template` to a reusable function using the default
   * writer.
   */
  mustache.compile = function (template, tags) {
    return defaultWriter.compile(template, tags);
  };

  /**
   * Compiles the partial with the given `name` and `template` to a reusable
   * function using the default writer.
   */
  mustache.compilePartial = function (name, template, tags) {
    return defaultWriter.compilePartial(name, template, tags);
  };

  /**
   * Compiles the given array of tokens (the output of a parse) to a reusable
   * function using the default writer.
   */
  mustache.compileTokens = function (tokens, template) {
    return defaultWriter.compileTokens(tokens, template);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

}));
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
            this.bindEvents();
            this.initModules();
        },


        initModules: function () {
            try {
                OP.search.init();
                OP.map.init();
                OP.houses.init();
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
        }
    });


    $(document).ready(function () {
        OP.loader.init();
    });
})(jQuery, OP);
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
})(jQuery, OP);(function ($, OP) {

    $.extend(OP.viewmodel, {
        map: null
    });

    $.extend(OP.view, {
        $map: null
    });

    OP.map = {};
    $.extend(OP.map, {

        defaultExtent: {
            latlng: new L.LatLng(55.742, 37.658),
            zoom: 17
        },


        init: function () {
            this.buildMap();
            this.buildOsmTileLayer();
            this.bindEvents();
        },


        buildMap: function () {
            var viewmodel = OP.viewmodel,
                lastExtent = this.getLastExtent();

            OP.view.$map = $('#map');
            viewmodel.map = new L.Map('map', {'minZoom': 17});

            L.control.scale().addTo(viewmodel.map);

            if (lastExtent) {
                viewmodel.map.setView(lastExtent.latlng, lastExtent.zoom);
            } else {
                viewmodel.map.setView(this.defaultExtent.latlng, this.defaultExtent.zoom);
                this.setLastExtent(this.defaultExtent.latlng, this.defaultExtent.zoom);
            }
        },


        buildOsmTileLayer: function () {
            this.addTileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                '© OpenStreetMap contributors', 8, 18);
        },


        addTileLayer: function (url, attribution, minZoom, maxZoom) {
            var layer = new L.TileLayer(url, {minZoom: minZoom, maxZoom: maxZoom, attribution: attribution});
            OP.viewmodel.map.addLayer(layer, true);
        },


        getLastExtent: function () {
            var lat = parseFloat($.cookie('map.lat'), 10),
                lng = parseFloat($.cookie('map.lng'), 10),
                zoom = parseInt($.cookie('map.zoom'), 10);
            if (lat && lng && zoom) {
                return {'latlng': new L.LatLng(lat, lng), 'zoom': zoom};
            } else {
                return null;
            }
        },


        setLastExtent: function (latLng, zoom) {
            $.cookie('map.lat', latLng.lat, { expires: 7, path: '/' });
            $.cookie('map.lng', latLng.lng, { expires: 7, path: '/' });
            $.cookie('map.zoom', zoom, { expires: 7, path: '/' });
        },


        bindEvents: function () {
            var context = this;

            OP.viewmodel.map.on('moveend', function () {
                var map = OP.viewmodel.map;
                context.setLastExtent(map.getCenter(), map.getZoom());
                OP.view.$document.trigger('/op/map/moveend');
            });

            OP.view.$document.on('/op/map/setview', function (event, lat, lng, zoom) {
                if (!zoom) { zoom = 18; }
                OP.viewmodel.map.setView(new L.LatLng(lat, lng), 18);
                $('#target').show().delay(1000).fadeOut(1000);
            });

            OP.viewmodel.map.on('click', function () {
                OP.view.$document.trigger('/op/search/clearSearchResults');
            });
        }
    });
})(jQuery, OP);(function ($, OP) {

    $.extend(OP.viewmodel, {
        housesLayer: null,
        policemen: []
    });

    $.extend(OP.view, {
    });

    OP.houses = {};
    $.extend(OP.houses, {
        init: function () {
            this.bindEvents();
            this.buildHousesLayer();
            this.updateHousesLayer();
        },


        bindEvents: function () {
            var context = this;

            OP.view.$document.on('/op/map/moveend', function () {
                context.updateHousesLayer();
            });
        },


        buildHousesLayer: function () {
            var viewmodel = OP.viewmodel;
            viewmodel.housesLayer = L.geoJson(null, {
                onEachFeature: this.bindFeatureEvents,
                style: this.setStyle
            }).addTo(viewmodel.map);
        },


        bindFeatureEvents: function (feature, layer) {
            layer.on('click', function (event) {
                var map = OP.viewmodel.map,
                    latlng = event.latlng,
                    policeman = OP.viewmodel.policemen[feature.properties.pm_id],
                    html = OP.templates['house-popup']({
                        policeman: policeman,
                        address: feature.properties.address
                    });
                map.panTo(latlng);
                map.openPopup(L.popup().setLatLng(latlng).setContent(html));
            });
        },


        setStyle: function (feature) {
            return {
                color: OP.viewmodel.policemen[feature.properties.pm_id].color,
                opacity: 1.0,
                weight: 3
            };
        },


        updateHousesLayer: function () {
            var viewmodel = OP.viewmodel;

            if (!this.validateMap(viewmodel.map)) {
                return false;
            }

            OP.view.$searchResults.empty().addClass('loader');
            viewmodel.housesLayer.clearLayers();
            viewmodel.policemen = [];
            this.ajaxGetHouses();
        },


        validateMap: function (map) {
            return map.getZoom() > 16;
        },


        ajaxGetHouses: function () {
            var context = this,
                url = document.url_root + 'houses';
            $.ajax({
                type: "GET",
                url: url,
                data: {
                    'box' : JSON.stringify(OP.viewmodel.map.getBounds())
                },
                dataType: 'json',
                success: function (data) {
                    var viewmodel = OP.viewmodel;
                    viewmodel.policemen = data.policemen;
                    viewmodel.housesLayer.addData(data.houses);
                    OP.view.$searchResults.empty().removeClass('loader');
                }
            });
        }
    });
})(jQuery, OP);(function ($, OP) {

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
})(jQuery, OP);OP.templates = {};
OP.templates['search-item'] = Mustache.compile('<ul class="search-block"> {{#matches}} <li class="address" data-lat={{lat}} data-lng={{lon}}>{{display_name}}</li> {{/matches}} {{^matches}} <li class="empty-result">Адрес не найден</li> {{/matches}} </ul>');
OP.templates['house-popup'] = Mustache.compile('<table id="popup" class="table table-striped"> <tr> <td>ФИО</td> <td>{{policeman.name}}</td> </tr> <tr> <td>Должность</td> <td>{{policeman.type}}</td> </tr> <tr> <td>Звание</td> <td>{{policeman.rank}}</td> </tr> <tr> <td>Телефон</td> <td>{{policeman.phone}}</td> </tr> <tr> <td>Ссылка</td> <td><a title="Страница полицейского на 112.ru" href="{{policeman.url}}" target="_blank">112.ru</a></td> </tr> <tr> <td>Адрес</td> <td>{{address}}</td> </tr> </table>');