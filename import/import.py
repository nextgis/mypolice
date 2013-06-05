# ----------------------------------------
# Read command line arguments
# ----------------------------------------
from optparse import OptionParser

parser = OptionParser()

parser.add_option("--d", dest="database")
parser.add_option("--h", dest="host")
parser.add_option("--u", dest="user")
parser.add_option("--p", dest="password")
parser.add_option("--s", dest="shp_file")
parser.add_option("--c", dest="csv_file")

(options, args) = parser.parse_args()


# ----------------------------------------
# Read shp data of houses
# ----------------------------------------
from my_shapefile import Reader

print 'Reading houses shp file...'
shp = Reader(options.shp_file)
count_shapes = len(shp.shapes())
records = shp.shapeRecords()
shapes = shp.shapes()


def record_to_house(record):
    records = record.record
    return {
        'osm_id': records[0],
        'building': records[1],
        'street': records[2],
        'suburb': records[3],
        'house_num': records[4],
        'name': records[5],
        'address': records[7],
        'geo': close_polygon(record.shape.points)
    }


def close_polygon(points):
    if not points[0] == points[-1]:
        points.append(points[0])
    return points


houses_by_policeman = dict()
for i in range(count_shapes - 1):
    record = records[i]
    house = record_to_house(record)
    policeman_id = record.record[6]
    if policeman_id:
        if not policeman_id in houses_by_policeman:
            houses_by_policeman[policeman_id] = []
        houses_by_policeman[policeman_id].append(house)


# ----------------------------------------
# Read csv data of policemen
# ----------------------------------------
def csv_row_to_policeman(row):
    return {
        'id': row[0],
        'name': row[1],
        'type': row[2],
        'rank': row[3],
        'phone': row[4],
        'url': row[5]
    }


import csv

print 'Reading policemen csv file...'
policemen = dict()
with open(options.csv_file, 'rb') as csv_file:
    reader = csv.reader(csv_file)
    for row in reader:
        policeman = csv_row_to_policeman(row)
        policemen[policeman['id']] = policeman


# ----------------------------------------
# Helper functions for sql import
# ----------------------------------------
def get_values(args):
    return "(" + ",".join(args) + ")"


def check_null(arg):
    return "'" + str(arg) + "'" if arg is not None else 'NULL'


# ----------------------------------------
# Import to postgresql
# ----------------------------------------

import random


def get_random_color():
    r = lambda: random.randint(0, 255)
    return '#%02X%02X%02X' % (r(), r(), r())


import psycopg2

print 'Starting import data into Postgresql database...\n\r'
conn = "dbname='{0}' host='{1}' user='{2}' password='{3}'". \
    format(options.database, options.host, options.user, options.password)
con = psycopg2.connect(conn)
cur = con.cursor()

sql_policemen = "INSERT INTO policemen(id, name, type, rank, phone, url, color) VALUES "
# sql_houses = "INSERT INTO houses(osm_id, building, street, suburb, house_num, name, address, geo, policeman_id) VALUES "
sql_houses = "INSERT INTO houses(osm_id, house_num, address, geo, policeman_id) VALUES "
policeman_id = 0
count_houses = 0
for k, policeman in policemen.iteritems():
    sql_policemen += get_values([
        check_null(policeman_id),
        check_null(policeman['name']),
        check_null(policeman['type']),
        check_null(policeman['rank']),
        check_null(policeman['phone']),
        check_null(policeman['url']),
        check_null(get_random_color())
    ]) + ","

    if policeman['id'] in houses_by_policeman:
        houses = houses_by_policeman[policeman['id']]
        for house in houses:
            sql_houses += get_values([
                check_null(house['osm_id']),
                # check_null(house['building']),
                # check_null(house['street']),
                # check_null(house['suburb']),
                check_null(house['house_num']),
                # check_null(house['name']),
                check_null(house['address']),
                "ST_GeomFromText('POLYGON((" + ','.join(
                    '{0} {1}'.format(point[0], point[1]) for point in house['geo']) + "))', 4326)",
                check_null(policeman_id)
            ]) + ","
            count_houses += 1
    policeman_id += 1

print 'Clearing data on policemen and houses tables...'
cur.execute('DELETE FROM houses;')
cur.execute('DELETE FROM policemen;')
con.commit()
print 'Clearing data has been successful!\n\r'

print 'Starting import %s policemen...' % len(policemen.keys())
cur.execute(sql_policemen[:-1] + ';')
con.commit()
print 'Import of policemen has been successful!\n\r'

print 'Starting import %s houses...' % count_houses
cur.execute(sql_houses[:-1] + ';')
con.commit()
print 'Import of houses has been successful!\n\r'

print 'Rebuilding indexes on policemen and houses tables'
cur.execute('REINDEX TABLE policemen;')
cur.execute('REINDEX TABLE houses;')
con.commit()
print 'Rebuild of indexes has been successful!\n\r'

print 'Creating spatial index...'
cur.execute('DROP INDEX IF EXISTS houses_spatial_index;')
cur.execute('CREATE INDEX houses_spatial_index ON houses USING GIST(geo);')
con.commit()
print 'Creation of spatial index has been successful!\n\r'

cur.close()

print 'All operations completed.'