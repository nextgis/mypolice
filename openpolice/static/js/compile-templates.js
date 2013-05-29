OP.templates = {};
OP.templates['search-item'] = Mustache.compile('<ul class="search-block"> {{#matches}} <li class="address" data-lat={{lat}} data-lng={{lon}}>{{display_name}}</li> {{/matches}} {{^matches}} <li class="empty-result">Адрес не найден</li> {{/matches}} </ul>');
