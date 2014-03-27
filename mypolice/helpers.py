

def leaflet_box_to_WKT_polygon(leaflet_box):
    import json
    bbox = json.loads(leaflet_box)
    return 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
           (bbox['_southWest']['lng'], bbox['_southWest']['lat'], \
            bbox['_southWest']['lng'], bbox['_northEast']['lat'], \
            bbox['_northEast']['lng'], bbox['_northEast']['lat'], \
            bbox['_northEast']['lng'], bbox['_southWest']['lat'], \
            bbox['_southWest']['lng'], bbox['_southWest']['lat'])


def row2dict(row, columns):
    if not columns:
        columns = map(lambda column: column.name, row.__table__.columns)

    dict = {}
    for column in columns:
        dict[column] = getattr(row, column)
    return dict
