<!doctype html>
<html>

<head>
    <title>Найди участкового</title>
    <meta charset="utf-8"/>

    <link rel="shortcut icon" href="${request.static_url('openpolice:static/favicon.ico')}"/>

    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.css"/>
    <!--[if lte IE 8]>
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.ie.css" />
    <![endif]-->

    <script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
    <script src="http://cdn.leafletjs.com/leaflet-0.5.1/leaflet.js"></script>

    ##    <link rel="stylesheet" href="${request.static_url('openpolice:static/build/op.css')}" />

    <link rel="stylesheet" href="${request.static_url('openpolice:static/frameworks/bootstrap/css/bootstrap.css')}"/>
    <link rel="stylesheet" href="${request.static_url('openpolice:static/css/main.css')}"/>

    ##    <script src="${request.static_url('openpolice:static/build/op.js')}"></script>

    <script src="${request.static_url('openpolice:static/frameworks/mustache/mustache.js')}"></script>
    <script src="${request.static_url('openpolice:static/frameworks/cookies/jquery.cookie.js')}"></script>
    <script src="${request.static_url('openpolice:static/js/op.loader.js')}"></script>
    <script src="${request.static_url('openpolice:static/js/compile-templates.js')}"></script>
    <script src="${request.static_url('openpolice:static/js/op.search.js')}"></script>
    <script src="${request.static_url('openpolice:static/js/op.map.js')}"></script>
    <script src="${request.static_url('openpolice:static/js/op.osm.geocoder.js')}"></script>

</head>

<body>
<div id="target"></div>
<div id="addressSearch">
    <form class="form-search search-block">
        <div class="title">Найди своего участкового по адресу</div>
        <input class="address" type="text" placeholder="Например, Москва ул. Пушкина 205"/>
        <input class="find btn" type="button" value="" title="Найти свой адрес"/>
    </form>
    <div id="searchResults"></div>
</div>
<div id="map">

</div>
</body>

</html>