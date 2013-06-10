__author__ = 'karavanjo'

from pyramid.view import view_config
from pyramid.response import Response
from models import DBSession, House, Subdivision
from helpers import leaflet_box_to_WKT_polygon, row2dict
from geojson import Feature, FeatureCollection, dumps
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
                'url': policeman.url,
                'photo_url': policeman.photo_url,
                'color': policeman.color
            }

    subdivisions_in_box = session.query(Subdivision) \
        .filter(Subdivision.geo.within(box)) \
        .all()

    subdivisions = {}
    for subdivision_in_box in subdivisions_in_box:
        subdivision = row2dict(subdivision_in_box, ['id', 'name', 'phone', 'address', 'hours', 'url'])
        subdivision['geo'] = loads(str(subdivision_in_box.geo.geom_wkb))
        subdivisions[subdivision['id']] = subdivision

    result = {
        'houses': FeatureCollection(houses),
        'policemen': policemen,
        'subdivisions': subdivisions
    }

    return Response(dumps(result))