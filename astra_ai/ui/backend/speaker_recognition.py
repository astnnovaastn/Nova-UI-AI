"""Optional, local ECAPA speaker matching. Audio and guest fingerprints are ephemeral."""
import asyncio,base64,ctypes,json,os,threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from astra_ai.memory.shared_memory import atomic,read
class Blob(ctypes.Structure):_fields_=[('cbData',ctypes.c_ulong),('pbData',ctypes.POINTER(ctypes.c_ubyte))]
def protect(data,decrypt=False):
 if os.name!='nt':raise RuntimeError('Windows DPAPI is required; fingerprints were not saved')
 source=ctypes.create_string_buffer(data);a=Blob(len(data),ctypes.cast(source,ctypes.POINTER(ctypes.c_ubyte)));b=Blob()
 api=ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
 if not api(ctypes.byref(a),None,None,None,None,1,ctypes.byref(b)):raise ctypes.WinError()
 try:return ctypes.string_at(b.pbData,b.cbData)
 finally:ctypes.windll.kernel32.LocalFree(b.pbData)
def calibrated_threshold(vectors):
 """Use the same median-of-enrollment comparisons as live matching."""
 import numpy as np
 if len(vectors)!=3:raise ValueError('Three valid enrollment fingerprints are required')
 return max(.65,min(.85,min(float(np.median([np.dot(a,b) for b in vectors])) for a in vectors)-.08))

class SpeakerRecognition:
 def __init__(self,path):
  self.path=Path(path);self.pool=ThreadPoolExecutor(max_workers=1,thread_name_prefix='local-speaker');self.model=None;self.error='';self.lock=threading.RLock()
 def profiles(self,d):
  profiles=dict(d.get('profiles',{}))
  if not profiles and d.get('fingerprint'):profiles['owner']={'id':'owner','name':'Main user','owner':True,'fingerprint':d['fingerprint']}
  return profiles
 def status(self):
  d=read(self.path,{});profiles=self.profiles(d)
  return {'status':'ok','enabled':bool(d.get('enabled')) and bool(profiles),'enrolled':bool(profiles),'model_ready':self.model is not None,'error':self.error,'audio_retained':False,'profiles':[{k:p.get(k) for k in ('id','name','owner')} for p in profiles.values()]}
 def setting(self,enabled=None,delete=False,profile_id=''):
  with self.lock:
   d=read(self.path,{})
   if delete:
    if profile_id:
     profiles=self.profiles(d);profiles.pop(profile_id,None);d['profiles']=profiles;d.pop('fingerprint',None)
     if not profiles:d['enabled']=False
    else:d={}
   elif enabled is not None:
    if enabled and not self.profiles(d):return {**self.status(),'status':'rejected','reason':'Enroll the main user first.'}
    d['enabled']=bool(enabled)
   atomic(self.path,d);return self.status()
 def load_model(self):
  if self.model is not None:return
  try:
   import torch
   from huggingface_hub import HfApi
   import urllib.request,hashlib
   from speechbrain.inference.speaker import EncoderClassifier
   from speechbrain.utils.fetching import LocalStrategy
   torch.set_num_threads(1)
   root=self.path.parent/'speaker-model';root.mkdir(parents=True,exist_ok=True)
   manifest=read(root/'manifest.json',{});revision=manifest.get('revision') or HfApi().model_info('speechbrain/spkrec-ecapa-voxceleb').sha
   snapshot=root/'weights';snapshot.mkdir(exist_ok=True);checksums={}
   for name in ['hyperparams.yaml','embedding_model.ckpt','mean_var_norm_emb.ckpt','classifier.ckpt','label_encoder.txt']:
    file=snapshot/name
    if not file.exists():
     with urllib.request.urlopen(f'https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb/resolve/{revision}/{name}',timeout=60) as response:
      data=response.read(128*1024*1024)
     temp=file.with_suffix('.pending');temp.write_bytes(data);os.replace(temp,file)
    checksums[name]=hashlib.sha256(file.read_bytes()).hexdigest()
    if manifest.get('sha256',{}).get(name) and checksums[name]!=manifest['sha256'][name]:raise ValueError('Speaker model checksum mismatch')
   (snapshot/"custom.py").write_text("# This model uses built-in SpeechBrain modules only.\n",encoding="utf-8")
   snapshot=str(snapshot.resolve())
   self.model=EncoderClassifier.from_hparams(source=snapshot,savedir=str(root/'loaded'),run_opts={'device':'cpu'},local_strategy=LocalStrategy.COPY,overrides={'pretrained_path':snapshot})
   atomic(root/'manifest.json',{'model':'speechbrain/spkrec-ecapa-voxceleb','revision':revision,'sha256':checksums});self.error=''
  except Exception as exc:self.error='Local speaker model unavailable: '+type(exc).__name__;raise
 def embedding(self,pcm):
  import numpy as np,torch
  if not 32000<=len(pcm)<=32000*12:raise ValueError('Provide 1–12 seconds of speech')
  self.load_model();wave=np.frombuffer(pcm,dtype='<i2').astype('float32')/32768
  if np.sqrt(np.mean(wave**2))<.003:raise ValueError('Speech sample is too quiet')
  with torch.inference_mode():v=self.model.encode_batch(torch.from_numpy(wave).unsqueeze(0)).squeeze().cpu().numpy()
  return v/(np.linalg.norm(v)+1e-9)
 async def prepare(self):
  loop=asyncio.get_running_loop()
  try:await loop.run_in_executor(self.pool,self.load_model)
  except Exception:pass
  return self.status()
 async def enroll(self,samples,profile_id="",name=""):
  import re,uuid
  if profile_id and not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}",profile_id):return {"status":"rejected","reason":"invalid_profile_id"}
  if len(str(name))>60:return {"status":"rejected","reason":"invalid_profile_name"}
  if not isinstance(samples,list) or len(samples)!=3 or any(not isinstance(s,str) or len(s)>512000 for s in samples):return {'status':'rejected','reason':'three_samples_required'}
  def run():
   import numpy as np
   buffers=[base64.b64decode(s,validate=True) for s in samples]
   vectors=[self.embedding(b) for b in buffers]
   if min(float(np.dot(a,b)) for i,a in enumerate(vectors) for b in vectors[i+1:])<.55:raise ValueError('Samples do not consistently match one speaker. Retry in a quiet room.')
   v=np.mean(vectors,axis=0);v/=np.linalg.norm(v)+1e-9
   threshold=calibrated_threshold(vectors)
   data=protect(json.dumps({'vectors':[x.tolist() for x in vectors],'threshold':threshold}).encode())
   with self.lock:
    d=read(self.path,{});profiles=self.profiles(d);pid=profile_id or 'owner'
    if not profiles:pid='owner'
    profiles[pid]={'id':pid,'name':name.strip() or ('Main user' if pid=='owner' else 'Additional speaker'),'owner':pid=='owner','fingerprint':base64.b64encode(data).decode()}
    atomic(self.path,{'enabled':True,'profiles':profiles,'version':2})
   return {**self.status(),'status':'saved','profile_id':pid}
  try:return await asyncio.get_running_loop().run_in_executor(self.pool,run)
  except Exception as exc:return {'status':'failed','reason':str(exc) if isinstance(exc,ValueError) else self.error or 'Voice enrollment could not be saved'}
 async def classify(self,pcm):
  if not self.status()['enabled']:return {'state':'disabled'}
  def run():
   import numpy as np
   d=read(self.path,{})
   profiles=self.profiles(d)
   if not profiles:return {'state':'uncertain','reason':'not_enrolled'}
   windows=[pcm]
   if len(pcm)>=64000:
    midpoint=(len(pcm)//4)*2;windows=[pcm,pcm[:midpoint],pcm[midpoint:]]
   embeddings=[self.embedding(window) for window in windows];ranked=[]
   for pid,profile in profiles.items():
    saved=json.loads(protect(base64.b64decode(profile['fingerprint']),True));scores=[];spreads=[]
    for v in embeddings:
     current=[float(np.dot(v,np.asarray(x))) for x in saved['vectors']];scores.append(float(np.median(current)));spreads.append(max(current)-min(current))
    # Older profiles calibrated against the mean, while matching uses medians.
    # Recalibrate from the existing encrypted samples without re-enrollment.
    reference_vectors=[np.asarray(x) for x in saved['vectors']]
    profile_threshold=min(saved['threshold'],calibrated_threshold(reference_vectors))
    # Natural differences between enrollment sentences also affect score spread.
    spread_limit=max(.2,min(.45,max(float(np.ptp([np.dot(a,b) for b in reference_vectors])) for a in reference_vectors)+.05))
    threshold=profile_threshold+(.08 if len(windows)==1 else 0)
    # Verify the complete utterance first; short corroborating windows naturally
    # score lower than their parent and must not veto a clear full-speech match.
    corroborated=len(scores)==1 or min(scores[1:])>=threshold-.15 and max(scores[1:])-min(scores[1:])<.2
    confident=scores[0]>=threshold and max(spreads)<=spread_limit and corroborated
    ranked.append((scores[0],pid,profile,confident,profile_threshold))
   ranked.sort(key=lambda x:x[0],reverse=True);score,pid,profile,confident,threshold=ranked[0]
   ambiguous=len(ranked)>1 and score-ranked[1][0]<.08
   state='matched' if confident and not ambiguous else 'unknown' if score<threshold-.12 else 'uncertain'
   current=read(self.path,{})
   if not current.get('enabled') or self.profiles(current)!=profiles:return {'state':'uncertain','reason':'profile_changed'}
   return {'state':state,'confidence':round(score,3),'windows':len(windows),'profile_id':pid if state=='matched' else '', 'owner':bool(profile.get('owner')) if state=='matched' else False}
  try:return await asyncio.get_running_loop().run_in_executor(self.pool,run)
  except Exception:return {'state':'uncertain','reason':self.error or 'speaker_unavailable'}
