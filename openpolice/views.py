from pyramid.response import Response
from pyramid.view import view_config

@view_config(route_name='home', renderer='base.mako')
def home(request):
    return {'project': 'openpolice'}