import requests
from oauth_hook import OAuthHook

# NOTE: Python does not properly escape the OAuth signature.  This test case can not be used reliably
# until this is fixed.
# Example: 
#  [2014-04-28 22:24:02.402] [TRACE] authenticator - Hash	HG%2Fe1efz%2FcRdArimdeDPFFx0lek%3D
#  [2014-04-28 22:24:02.402] [TRACE] authenticator - Sig	HG/e1efz/cRdArimdeDPFFx0lek%3D
#
# Note that the python version does not escape the / characters.  By RFC, those should be escaped.

consumer_key = 'python-test-key'
consumer_key_file = open('../../keys/8008/8080/' + consumer_key, 'r')
consumer_secret = consumer_key_file.read()

request = requests.Request('GET', 'http://localhost:8008/job/5654546d')
oauth_hook = OAuthHook('','', consumer_key, consumer_secret, True)
request = oauth_hook(request)
prepared = request.prepare()
session = requests.session()
response = session.send(prepared)
print response.content