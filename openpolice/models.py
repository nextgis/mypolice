from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    String
)

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    relationship,
    )


from geoalchemy import (
    GeometryColumn,
    Geometry,
)

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


class Policeman(Base):
    __tablename__ = 'policemen'

    id = Column(Integer, primary_key=True)
    name = Column(Text, index=True)
    type = Column(Text, index=True)
    rank = Column(Text, index=True)
    phone = Column(Text, index=True)
    url = Column(Text, index=True)
    color = Column(String(7), index=True)


class House(Base):
    __tablename__ = 'houses'

    osm_id = Column(Integer, primary_key=True)
    building = Column(Text, index=True)
    street = Column(Text, index=True)
    suburb = Column(Text, index=True)
    house_num = Column(Text, index=True)
    name = Column(Text, index=True)
    address = Column(Text, index=True)
    geo = GeometryColumn(Geometry(2, 4326, bounding_box='(xmin=34, ymin=54, xmax=40, ymax=58)'), nullable=False)
    policeman = relationship('Policeman')
    policeman_id = Column(Integer, ForeignKey('policemen.id'), nullable=True)