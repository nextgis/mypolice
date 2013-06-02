__author__ = 'karavanjo'

import json


def leaflet_box_to_WKT_polygon(leaflet_box):
    bbox = json.loads(leaflet_box)
    return 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
           (bbox['_southWest']['lng'], bbox['_southWest']['lat'], \
            bbox['_southWest']['lng'], bbox['_northEast']['lat'], \
            bbox['_northEast']['lng'], bbox['_northEast']['lat'], \
            bbox['_northEast']['lng'], bbox['_southWest']['lat'], \
            bbox['_southWest']['lng'], bbox['_southWest']['lat'])
