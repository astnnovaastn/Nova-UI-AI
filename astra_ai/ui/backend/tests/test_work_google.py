"""Google integration is exercised entirely with fake transport and encrypted fixture tokens."""
from urllib.parse import urlsplit,parse_qs
from types import SimpleNamespace
import pytest
from astra_ai.core.work.google_accounts import GoogleAccounts,TokenVault,AccountError,SCOPES,owner_key

OWNER={'client_id':'local','profile_id':'one'}
OTHER={'client_id':'local','profile_id':'two'}
SETTINGS={'AEGIS_GOOGLE_CLIENT_ID':'fixture-client','AEGIS_GOOGLE_CLIENT_SECRET':'fixture-secret',
          'AEGIS_GOOGLE_REDIRECT_URI':'http://127.0.0.1:8000/api/work/google/callback'}

class Vault:
    available=True
    def __init__(self):self.values={}
    def get(self,key):return self.values.get(key)
    def put(self,key,value):self.values[key]=value
    def delete(self,key):self.values.pop(key,None)

class Transport:
    def __init__(self):self.calls=[];self.response={};self.on_post=None
    def post(self,url,**kwargs):
        self.calls.append(('post',url,kwargs))
        if self.on_post:self.on_post()
        return SimpleNamespace(status_code=200,json=lambda:self.response)
    def get(self,url,**kwargs):
        self.calls.append(('get',url,kwargs))
        if url.endswith('/messages'):
            result={'messages':[{'id':'abc123'}],'nextPageToken':'next'}
        elif '/messages/' in url:
            result={'threadId':'abc','snippet':'Fixture summary','payload':{'headers':[{'name':'Subject','value':'Fixture meeting'}]}}
        else:
            result={'items':[{'id':'event1','summary':'Fixture event','start':{'date':'2026-11-16'},'description':'Fixture','attendees':[{'email':'private@example.org'}]}]}
        return SimpleNamespace(status_code=200,json=lambda:result)

@pytest.fixture
def account(tmp_path):
    http=Transport();vault=Vault()
    value=GoogleAccounts(tmp_path,lambda name:SETTINGS.get(name,''),http,vault,clock=lambda:1000)
    http.response={'access_token':'fixture-access','refresh_token':'fixture-refresh','scope':' '.join(SCOPES.values()),'expires_in':3600}
    return value,http,vault

def authorize(account,services=None):
    value,http,vault=account
    url=value.begin(OWNER,services or ['gmail','calendar'])['authorization_url']
    query=parse_qs(urlsplit(url).query)
    value.complete(query['state'][0],'fixture-code')
    return query

def test_pkce_one_time_state_and_owner_isolation(account):
    query=authorize(account)
    value,http,vault=account
    assert query['code_challenge_method']==['S256']
    assert value.status(OWNER)['connected']
    assert not value.status(OTHER)['connected']
    assert 'access_token' not in str(value.status(OWNER))
    assert http.calls[0][2]['allow_redirects'] is False
    assert http.calls[0][2]['data']['code_verifier']
    with pytest.raises(AccountError):value.complete(query['state'][0],'again')
    with pytest.raises(AccountError):value.messages(OTHER)

def test_expired_denied_and_unrequested_scopes(account):
    value,http,_=account
    state=parse_qs(urlsplit(value.begin(OWNER,['gmail'])['authorization_url']).query)['state'][0]
    with pytest.raises(AccountError,match='unexpected_google_scopes'):value.complete(state,'code')
    state=parse_qs(urlsplit(value.begin(OWNER,['gmail'])['authorization_url']).query)['state'][0]
    value.clock=lambda:2000
    with pytest.raises(AccountError,match='expired'):value.complete(state,'code')
    with pytest.raises(AccountError):value.begin({'guest':True},['gmail'])

def test_disconnect_cancels_inflight_authorization(account):
    value,http,_=account
    http.on_post=lambda:value.disconnect(OWNER)
    with pytest.raises(AccountError,match='cancelled'):authorize(account)
    assert not value.status(OWNER)['connected']

def test_reads_are_bounded_metadata_only_and_never_write(account):
    authorize(account)
    value,http,_=account
    messages=value.messages(OWNER,'is:unread',1000)
    assert messages['has_more'] and messages['items'][0]['subject']=='Fixture meeting'
    assert http.calls[-2][2]['params']['maxResults']==50
    assert http.calls[-1][2]['params']['format']=='metadata'
    events=value.events(OWNER,'2026-11-16T00:00:00Z','2026-11-17T00:00:00Z')
    assert 'attendees' not in events['items'][0]
    assert all(c[0]=='get' for c in http.calls[1:])
    with pytest.raises(AccountError):value.events(OWNER,'2026-11-17','2026-11-16')

def test_refresh_preserves_readonly_scope_and_disconnect(account):
    authorize(account)
    value,http,vault=account
    vault.values[owner_key(OWNER)]['expires_at']=0
    http.response={'access_token':'refreshed','expires_in':3600}
    value.messages(OWNER)
    assert http.calls[-1][2]['headers']['Authorization']=='Bearer refreshed'
    value.disconnect(OWNER)
    assert not value.status(OWNER)['connected']
    with pytest.raises(AccountError):value.messages(OWNER)

def test_real_vault_fixture_roundtrip_is_not_plaintext(tmp_path):
    vault=TokenVault(tmp_path,lambda _: '')
    if not vault.available:pytest.skip('OS encryption not available')
    key=owner_key(OWNER)
    vault.put(key,{'access_token':'not-a-real-token'})
    assert vault.get(key)=={'access_token':'not-a-real-token'}
    assert b'not-a-real-token' not in (vault.root/(key+'.enc')).read_bytes()
    vault.delete(key)
    assert vault.get(key) is None

def test_unconfigured_and_insecure_callback_are_truthful(tmp_path):
    for redirect in ('http://example.org/api/work/google/callback','https://example.org/wrong','https://user@example.org/api/work/google/callback'):
        config={**SETTINGS,'AEGIS_GOOGLE_REDIRECT_URI':redirect}
        value=GoogleAccounts(tmp_path,config.get,vault=Vault())
        assert not value.status(OWNER)['configured']
        with pytest.raises(AccountError):value.begin(OWNER,['calendar'])

def test_routes_require_owner_and_have_no_write_actions(account):
    from fastapi import FastAPI,HTTPException
    from fastapi.testclient import TestClient
    from unittest.mock import patch
    from astra_ai.ui.backend.api.work_google import install
    app=FastAPI()
    def owner(request):
        if request.headers.get('x-owner')!='yes':raise HTTPException(403,'Owner required')
    with patch('astra_ai.ui.backend.api.work_google.GoogleAccounts',return_value=account[0]):
        install(app,context_for=lambda request:OWNER,owner_only=owner,
                orchestrator=lambda:SimpleNamespace(store=SimpleNamespace(root='unused'),settings=SETTINGS.get))
        client=TestClient(app)
        assert client.get('/api/work/google').status_code==403
        assert client.get('/api/work/google',headers={'x-owner':'yes'}).json()['configured']
        assert client.post('/api/work/google/messages',headers={'x-owner':'yes'}).status_code==405
        assert client.post('/api/work/google/events',headers={'x-owner':'yes'}).status_code==405
        assert client.get('/api/work/google/callback?state=invalid&code=secret').status_code==400
        assert 'secret' not in client.get('/api/work/google/callback?code=secret').text


def test_oauth_access_log_redacts_code_and_state():
    import logging
    from astra_ai.ui.backend.api.work_google import OAuthAccessFilter
    record=logging.LogRecord('uvicorn.access',20,'',1,'%s %s %s',('GET','/api/work/google/callback?code=private&state=private',200),None)
    assert OAuthAccessFilter().filter(record)
    assert 'private' not in record.getMessage()

