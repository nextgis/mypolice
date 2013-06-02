__author__ = 'karavanjo'

from pyramid.view import view_config
from pyramid.response import Response
from models import DBSession, House, Policeman
from helpers import leaflet_box_to_WKT_polygon
from geojson import Feature, FeatureCollection, dumps
import json
from shapely.wkb import loads


@view_config(route_name='houses', request_method='GET')
def get_houses(context, request):
    box = leaflet_box_to_WKT_polygon(request.params.getall('box')[0])

    session = DBSession()
    houses_in_box = session.query(House) \
        .filter(House.geo.within(box)) \
        .join(House.policeman) \
        .all()

    houses = []
    policemen = dict()
    for house in houses_in_box:
        geometry = loads(str(house.geo.geom_wkb))
        feature = Feature(
            id=house.osm_id,
            geometry=geometry,
            properties={
                'address': house.address,
                'pm_id': house.policeman_id
            }
        )
        houses.append(feature)

        policeman = house.policeman
        if not policeman.id in policemen:
            policemen[policeman.id] = {
                'id': policeman.id,
                'name': policeman.name,
                'type': policeman.type,
                'rank': policeman.rank,
                'phone': policeman.phone,
                'url': policeman.url
            }

    result = {
        'houses': json.loads(dumps(FeatureCollection(houses))),
        'policemen': policemen
    }

    return Response(json.dumps(result))