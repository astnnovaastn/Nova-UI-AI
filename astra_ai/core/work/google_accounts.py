"""Owner-scoped Google read adapters. No send, modify, draft creation or calendar writes."""
from __future__ import annotations
import base64
import ctypes
import hashlib
import json
import os
import secrets
import threading
import time
from pathlib import Path
from urllib.parse import urlencode, urlsplit
import requests

SCOPES = {'gmail':'https://www.googleapis.com/auth/gmail.readonly',
          'calendar':'https://www.googleapis.com/auth/calendar.events.readonly'}

class AccountError(ValueError):
    pass


def owner_key(context):
    if context.get('guest') or not context.get('profile_id'):
        raise AccountError('owner_profile_required')
    return hashlib.sha256(json.dumps([context.get('client_id',''),context['profile_id']],separators=(',',':')).encode()).hexdigest()


class TokenVault:
    """Windows user-bound encryption; other hosts require a separately supplied Fernet key."""
    def __init__(self,root,settings):
        self.root=Path(root)/'google-accounts'
        self.key=settings('AEGIS_ACCOUNT_ENCRYPTION_KEY')

    @property
    def available(self):
        if os.name=='nt':return True
        if not self.key:return False
        try:
            from cryptography.fernet import Fernet
            Fernet(self.key.encode())
            return True
        except (ImportError,ValueError):return False

    def _crypt(self,data,decrypt=False):
        if os.name=='nt':
            class Blob(ctypes.Structure):
                _fields_=[('size',ctypes.c_ulong),('data',ctypes.POINTER(ctypes.c_ubyte))]
            buffer=ctypes.create_string_buffer(data)
            source=Blob(len(data),ctypes.cast(buffer,ctypes.POINTER(ctypes.c_ubyte)))
            target=Blob()
            fn=ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
            fn.argtypes=[ctypes.POINTER(Blob),ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_ulong,ctypes.POINTER(Blob)]
            fn.restype=ctypes.c_int
            if not fn(ctypes.byref(source),None,None,None,None,1,ctypes.byref(target)):
                raise AccountError('credential_vault_unavailable')
            try:return ctypes.string_at(target.data,target.size)
            finally:
                free=ctypes.windll.kernel32.LocalFree
                free.argtypes=[ctypes.c_void_p];free.restype=ctypes.c_void_p
                free(ctypes.cast(target.data,ctypes.c_void_p))
        from cryptography.fernet import Fernet
        cipher=Fernet(self.key.encode())
        return cipher.decrypt(data) if decrypt else cipher.encrypt(data)

    def get(self,key):
        path=self.root/(key+'.enc')
        if not path.exists():return None
        try:return json.loads(self._crypt(path.read_bytes(),True))
        except Exception:raise AccountError('credential_vault_unavailable') from None

    def put(self,key,value):
        if not self.available:raise AccountError('credential_vault_unavailable')
        self.root.mkdir(parents=True,exist_ok=True)
        target=self.root/(key+'.enc');temporary=target.with_suffix('.'+secrets.token_hex(6)+'.tmp')
        temporary.write_bytes(self._crypt(json.dumps(value).encode()))
        os.replace(temporary,target)

    def delete(self,key):
        (self.root/(key+'.enc')).unlink(missing_ok=True)


class GoogleAccounts:
    def __init__(self,root,settings,transport=None,vault=None,clock=time.time):
        self.settings=settings;self.http=transport or requests.Session()
        self.vault=vault or TokenVault(root,settings);self.clock=clock
        self.pending={};self.generations={};self.lock=threading.RLock()

    def _config(self):
        client=self.settings('AEGIS_GOOGLE_CLIENT_ID')
        secret=self.settings('AEGIS_GOOGLE_CLIENT_SECRET')
        redirect=self.settings('AEGIS_GOOGLE_REDIRECT_URI')
        parts=urlsplit(redirect or '')
        valid=parts.scheme=='https' or parts.scheme=='http' and parts.hostname in ('127.0.0.1','localhost','::1')
        if not(client and secret and valid and parts.path=='/api/work/google/callback') or parts.query or parts.fragment or parts.username:
            raise AccountError('google_oauth_not_configured')
        if not self.vault.available:raise AccountError('credential_vault_unavailable')
        return client,secret,redirect

    def status(self,context):
        key=owner_key(context)
        try:self._config();configured=True
        except AccountError:configured=False
        try:token=self.vault.get(key) if configured else None
        except AccountError:token=None
        scopes=set((token or {}).get('scope','').split())
        return {'configured':configured,'connected':bool(token),
                'services':[name for name,scope in SCOPES.items() if scope in scopes],
                'scope':'Read-only Gmail and Google Calendar. No sending, deletion or event writes.'}

    def begin(self,context,services):
        key=owner_key(context);client,_,redirect=self._config()
        if not isinstance(services,list) or not services or any(s not in SCOPES for s in services):
            raise AccountError('invalid_google_services')
        state=secrets.token_urlsafe(32);verifier=secrets.token_urlsafe(64)
        challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
        with self.lock:
            self.pending={s:v for s,v in self.pending.items() if v['expires']>self.clock() and v['owner']!=key}
            if len(self.pending)>=100:raise AccountError('too_many_pending_authorizations')
            scopes=[SCOPES[s] for s in dict.fromkeys(services)]
            generation=self.generations.get(key,0)+1;self.generations[key]=generation
            self.pending[state]={'owner':key,'expires':self.clock()+600,'verifier':verifier,'scopes':scopes,'generation':generation}
        query=dict(client_id=client,redirect_uri=redirect,response_type='code',scope=' '.join(scopes),
                   state=state,access_type='offline',prompt='consent',code_challenge=challenge,code_challenge_method='S256')
        return {'authorization_url':'https://accounts.google.com/o/oauth2/v2/auth?'+urlencode(query)}

    def _json(self,response):
        if response.status_code!=200:raise AccountError('google_authorization_required' if response.status_code in (400,401,403) else 'google_unavailable')
        try:data=response.json()
        except ValueError:raise AccountError('google_invalid_response') from None
        if not isinstance(data,dict):raise AccountError('google_invalid_response')
        return data

    def complete(self,state,code):
        client,secret,redirect=self._config()
        with self.lock:pending=self.pending.pop(state,None)
        if not pending or pending['expires']<self.clock() or not code:raise AccountError('invalid_or_expired_oauth_state')
        try:
            token=self._json(self.http.post('https://oauth2.googleapis.com/token',data=dict(
                client_id=client,client_secret=secret,redirect_uri=redirect,grant_type='authorization_code',
                code=code,code_verifier=pending['verifier']),timeout=15,allow_redirects=False))
        except requests.RequestException:raise AccountError('google_unavailable') from None
        granted=set(token.get('scope','').split())
        if not token.get('access_token') or not granted or not granted<=set(pending['scopes']):
            raise AccountError('unexpected_google_scopes')
        token['expires_at']=self.clock()+float(token.get('expires_in',3600))
        with self.lock:
            if self.generations.get(pending['owner'])!=pending['generation']:raise AccountError('authorization_cancelled')
            self.vault.put(pending['owner'],token)

    def disconnect(self,context):
        key=owner_key(context)
        with self.lock:
            self.generations[key]=self.generations.get(key,0)+1
            self.pending={s:v for s,v in self.pending.items() if v['owner']!=key}
            self.vault.delete(key)
        return {'connected':False}

    def _token(self,context,service):
        key=owner_key(context);client,secret,_=self._config()
        with self.lock:
            token=self.vault.get(key)
            if not token or SCOPES[service] not in token.get('scope','').split():raise AccountError('google_authorization_required')
            if token.get('expires_at',0)<self.clock()+60:
                if not token.get('refresh_token'):raise AccountError('google_authorization_required')
                try:new=self._json(self.http.post('https://oauth2.googleapis.com/token',data=dict(
                    client_id=client,client_secret=secret,refresh_token=token['refresh_token'],grant_type='refresh_token'),
                    timeout=15,allow_redirects=False))
                except requests.RequestException:raise AccountError('google_unavailable') from None
                if not new.get('access_token'):raise AccountError('google_authorization_required')
                if 'scope' in new and (not set(new['scope'].split())<=set(token['scope'].split()) or SCOPES[service] not in new['scope'].split()):
                    raise AccountError('unexpected_google_scopes')
                token={**token,**new,'expires_at':self.clock()+float(new.get('expires_in',3600))}
                self.vault.put(key,token)
            return token['access_token']

    def _get(self,context,service,path,params):
        # Callers select fixed API paths; model/user input is never a destination host.
        token=self._token(context,service)
        origin='https://gmail.googleapis.com/gmail/v1/users/me/' if service=='gmail' else 'https://www.googleapis.com/calendar/v3/'
        try:return self._json(self.http.get(origin+path,params=params,headers={'Authorization':'Bearer '+token},timeout=15,allow_redirects=False))
        except requests.RequestException:raise AccountError('google_unavailable') from None

    def messages(self,context,query='',limit=20):
        limit=max(1,min(50,int(limit)))
        listing=self._get(context,'gmail','messages',{'q':str(query)[:500],'maxResults':limit})
        messages=[]
        for row in listing.get('messages',[])[:limit]:
            identifier=str(row.get('id',''))
            if not identifier or not all(c in '0123456789abcdefABCDEF' for c in identifier):continue
            item=self._get(context,'gmail','messages/'+identifier,{'format':'metadata','metadataHeaders':['Subject','From','Date']})
            headers={h.get('name','').lower():h.get('value','') for h in item.get('payload',{}).get('headers',[])}
            messages.append({'id':identifier,'thread_id':item.get('threadId'),'subject':headers.get('subject','(No subject)'),
                             'from':headers.get('from',''),'date':headers.get('date',''),'snippet':item.get('snippet',''),
                             'url':'https://mail.google.com/mail/u/0/#inbox/'+identifier})
        return {'items':messages,'has_more':bool(listing.get('nextPageToken')),'source':'gmail','read_only':True}

    def events(self,context,start,end,limit=100):
        from datetime import datetime
        try:
            a=datetime.fromisoformat(start.replace('Z','+00:00'));b=datetime.fromisoformat(end.replace('Z','+00:00'))
            if not a.tzinfo or not b.tzinfo or not 0<(b-a).total_seconds()<=366*86400:raise ValueError()
        except (ValueError,AttributeError):raise AccountError('invalid_calendar_range') from None
        result=self._get(context,'calendar','calendars/primary/events',{'timeMin':start,'timeMax':end,'singleEvents':'true','orderBy':'startTime','maxResults':max(1,min(250,int(limit)))})
        return {'items':[{k:v for k,v in row.items() if k in ('id','summary','start','end','location','status','htmlLink','description')}
                         for row in result.get('items',[])],'has_more':bool(result.get('nextPageToken')),'source':'google-calendar','read_only':True}
