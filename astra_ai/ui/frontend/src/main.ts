import {startWorkspaceSync,ownsVoice,acquireVoice,releaseVoice,voiceOwner} from './workspaceSync';
import {applicationControl} from './aegisWidgetProtocol';
import {notify,noticeScope,cue,confirmOwner} from './notifications';
import {notificationSoundEnabled,notificationTarget,newNoticeIds} from './conversation';
import {VoiceSessionState} from './voiceSession.mjs';
import {PresenceCapture} from './presenceCapture';
import {requestedResearchReady} from './taskNotices';
import {conversationInterrupt,conversationState,conversationMessage,conversationSnapshot,conversationLoad,conversationReplace,updateUiContext,uiSnapshot} from "./conversation";
import initMemoryWorkspace from './components/Memory/MemoryWorkspace.jsx';
/**
 * AEGIS — Main entry point.
 *
 * Wires together the orb visualization, WebSocket communication,
 * speech recognition, and audio playback into a single experience.
 */

import { createOrb, type OrbState, type OrbMood } from "./orb";
import { orbThemes, type OrbTheme } from "./orb-themes";
import { createGroqVoiceInput, createLiveVoiceInput, createAudioPlayer } from "./voice";
import { createSocket } from "./ws";
import { openSettings, checkFirstTimeSetup, registerOrbThemeChangedHandler } from "./settings";
import { initWidgets } from "./widgets";
import "./style.css";
import "./widget-appearance.css";
import { SoundWaveController } from "./sound-wave";

// ---------------------------------------------------------------------------
// DOM refs ──────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const statusEl = document.getElementById("status-text")!;
const errorEl = document.getElementById("error-text")!;
const badgeEl = document.getElementById("connection-badge") as HTMLDivElement | null;
const badgeLabelEl = badgeEl?.querySelector("#connection-label") as HTMLSpanElement | null;
const API_HOST = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// ---------------------------------------------------------------------------
// State machine & Audio Control
// ---------------------------------------------------------------------------

type State = "idle" | "listening" | "thinking" | "speaking";
let currentState: State = "idle";
let audioGeneration="", canceledGeneration="", heldGeneration="", pendingInterruptionGeneration="";
let userTranscript="", assistantTranscript="", userMessageId="", assistantMessageId="";
// Persist microphone mute state in localStorage
let isMuted = true;
const MIC_MUTE_KEY = "aegisai_mic_muted";

// Restore mute state from localStorage on load
localStorage.setItem(MIC_MUTE_KEY, "true");
let isAudioPlaying = false;  // Track if audio is currently being played
let activeVoiceProvider: "gemini_live" | "legacy" = "gemini_live";
const voiceSession=new VoiceSessionState();
let errorTimer: ReturnType<typeof setTimeout> | null = null;

function showError(msg: string) {
  notify({id:'error:'+msg+':'+Math.floor(Date.now()/60000),title:'Aegis needs attention',message:msg,event:'nova-open-dashboard'});
  errorEl.textContent = msg;
  errorEl.style.opacity = "1";
  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => {
    errorEl.style.opacity = "0";
  }, 4000);
}

let connectionWasReady=false,connectionLost=false;
function setConnected(ok: boolean): void {
  if(!ok&&connectionWasReady&&!connectionLost){connectionLost=true;notify({id:'connection-lost:'+Date.now(),title:'Reconnecting to Aegis',message:'Your conversation is preserved.',event:'nova-open-dashboard',silent:true});}
  if(ok&&connectionLost){connectionLost=false;notify({id:'connection-ready:'+Date.now(),title:'Aegis is connected',event:'nova-open-dashboard',silent:true});}
  if(ok)connectionWasReady=true;
  if (!badgeEl) return;
  badgeEl.classList.toggle("connected", ok);
  badgeEl.classList.toggle("disconnected", !ok);
  if (badgeLabelEl) {
    badgeLabelEl.textContent = ok ? "connected" : "reconnecting";
  }
}

function updateStatus(state: State) {
  const labels: Record<State, string> = {
    idle: isMuted ? "Click the microphone button to start talking" : "",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };
  statusEl.textContent = labels[state];
}

async function postClientLocation(coords: GeolocationCoordinates): Promise<void> {
  await fetch(`${API_HOST}/api/client/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    }),
  });
}

async function syncClientLocation(highAccuracy = false): Promise<void> {
  if (!("geolocation" in navigator)) {
    console.warn("[LOCATION] Browser geolocation is not available; backend will use IP fallback.");
    return;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15000 : 10000,
        maximumAge: highAccuracy ? 0 : 5 * 60 * 1000,
      });
    });
    await postClientLocation(position.coords);
    console.log(
      `[LOCATION] Synced browser coordinates: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
    );
  } catch (error) {
    console.warn("[LOCATION] Browser geolocation sync failed; backend will keep fallback location.", error);
  }
}

// ---------------------------------------------------------------------------
// Init components
// ---------------------------------------------------------------------------

const canvas = document.getElementById("orb-canvas") as HTMLCanvasElement;
const orb = createOrb(canvas);
const soundWave = new SoundWaveController("sound-wave");
soundWave.setMuted(isMuted);

const soundWaveEl = document.getElementById("sound-wave") as HTMLDivElement | null;
const transcriptionDots = document.createElement("div");
transcriptionDots.id = "transcription-dots";
transcriptionDots.className = "transcription-dots";
transcriptionDots.setAttribute("aria-hidden", "true");
for (let i = 0; i < 6; i++) {
  const dot = document.createElement("span");
  transcriptionDots.appendChild(dot);
}
document.body.appendChild(transcriptionDots);

function setTranscriptionVisual(active: boolean): void {
  transcriptionDots.classList.toggle("active", active);
  soundWaveEl?.classList.toggle("visual-hidden", active);
  if (active) {
    statusEl.textContent = "";
  }
}

const ORB_THEME_KEY = "aegisai_orb_theme";
const DEFAULT_ORB_THEME = "default";
let selectedOrbTheme = (localStorage.getItem(ORB_THEME_KEY) || DEFAULT_ORB_THEME).toString();

// Orb mood state: "neutral" | "good" | "warning" | "error"
let orbMood: OrbMood = "neutral";
orb.setMood(orbMood);

function applyOrbTheme(themeName: string) {
  const theme = orbThemes.find((t) => t.name === themeName) || orbThemes.find((t) => t.name === DEFAULT_ORB_THEME);
  if (!theme) return;
  selectedOrbTheme = theme.name;
  localStorage.setItem(ORB_THEME_KEY, selectedOrbTheme);
  orb.setThemeColor(theme.orbColor);
  document.documentElement.style.setProperty('--theme-color', theme.orbColor);
  console.log(`[ORB-THEME] Applied theme: ${theme.label} (${theme.orbColor})`);
}

// Example: Conversation mood logic
function setOrbMood(mood: OrbMood) {
  orbMood = mood;
  orb.setMood(mood);
}

// Connect to backend on port 8340, not to the Vite dev server
const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${wsProto}//${location.host}/ws/voice`;
const socket = createSocket(WS_URL);
startWorkspaceSync(socket);

const audioPlayer = createAudioPlayer();
orb.setAnalyser(audioPlayer.getAnalyser());
soundWave.setAIAnalyser(audioPlayer.getAnalyser());
window.addEventListener('nova-mic-analyser',e=>soundWave.setMicAnalyser((e as CustomEvent).detail));
applyOrbTheme(selectedOrbTheme);
window.addEventListener("themechange", ((event: CustomEvent) => {
  const detail = event.detail || {};
  const theme = detail.theme || {};
  if (theme.orb?.mode === "custom" && theme.orb?.preset) {
    applyOrbTheme(theme.orb.preset);
  }
  if (typeof detail.orbColor === "string") {
    orb.setThemeColor(detail.orbColor);
    document.documentElement.style.setProperty('--theme-color', detail.orbColor);
  }
}) as EventListener);
registerOrbThemeChangedHandler((themeName) => {
  applyOrbTheme(themeName);
});

function transition(newState: State) {
  if (newState === currentState) return;
  
  console.log(`🔄 [STATE] Transitioning: ${currentState} → ${newState}`);
  setTranscriptionVisual(false);
  currentState = newState;
  conversationState({state:newState});
  window.dispatchEvent(new CustomEvent("nova-ai-state", {detail:{state:newState}}));
  document.body.dataset.aiState = newState;
  orb.setState(newState as OrbState);
  updateStatus(newState);
  soundWave.setState(newState);

  // Capture lifetime follows the user's microphone, never visual turn state.
  // Pausing here used to reset VAD and discard the next utterance's first words.
  if (activeVoiceProvider === 'gemini_live') {
    if (!isMuted) voiceInput?.resume();
    return;
  }

  switch (newState) {
    case "idle":
      console.log("🔊 [STATE] Idle - Resuming microphone for next input");
      if (!isMuted && !isAudioPlaying) {
        voiceInput?.resume();
      }
      break;
    case "listening":
      console.log("🎤 [STATE] Listening - Microphone active and ready");
      if (!isMuted && !isAudioPlaying) {
        voiceInput?.resume();
      }
      break;
    case "thinking":
      console.log("🔇 [STATE] Thinking - PAUSING microphone (processing user input)");
      voiceInput?.pause();
      break;
    case "speaking":
      console.log("🔇 [STATE] Speaking - PAUSING microphone (AI audio playing)");
      voiceInput?.pause();
      break;
  }
}

// ---------------------------------------------------------------------------
// Voice input
// ---------------------------------------------------------------------------

let voiceInput: ReturnType<typeof createGroqVoiceInput>;
function setupLegacyVoiceInput() {
  voiceInput?.stop();
  voiceInput = createGroqVoiceInput(
    (text: string) => {
      if (isMuted) {
        console.log("[MIC-MUTE] Ignoring transcript while muted");
        return;
      }

      const cleaned = text.trim();
      if (!cleaned) {
        return;
      }


      socket.send({
        type: "transcript",
        text: cleaned,
        isFinal: true,
      });
      setTranscriptionVisual(false);
      transition("thinking");
    },
    (msg: string) => {
      showError(msg);
    },
    () => {
      if (!isMuted && !isAudioPlaying) {
        setTranscriptionVisual(false);
        transition("listening");
      }
    },
    () => {
      if (!isMuted && !isAudioPlaying) {
        setTranscriptionVisual(true);
      }
    },
    () => {
      setTranscriptionVisual(false);
    }
  );
}

function setupLiveVoiceInput() {
  voiceInput?.stop();
  voiceInput = createLiveVoiceInput(
    (pcm) => {
      // Keep capture alive while Aegis speaks so Gemini Live can detect barge-in.
      if (!isMuted && ownsVoice() && activeVoiceProvider === "gemini_live") {
        const framed=new Uint8Array(pcm.byteLength+8);framed.set([78,86,65,49]);new DataView(framed.buffer).setUint32(4,voiceOwner().generation,true);framed.set(new Uint8Array(pcm),8);
        socket.sendBinary(framed.buffer);
      }
    },
    (message) => showError(message),
    () => {
      window.dispatchEvent(new CustomEvent('nova-user-speaking',{detail:true}));
      const generation=isAudioPlaying?audioGeneration:'';
      let checkpoint=false;
      if(isAudioPlaying&&!isMuted){checkpoint=audioPlayer.holdPcm();heldGeneration=checkpoint?generation:'';canceledGeneration=audioGeneration;isAudioPlaying=false;transition('listening');}
      socket.send({type:'live_speech_start',generation,has_checkpoint:checkpoint});
    },
    (speechMs) => {window.dispatchEvent(new CustomEvent('nova-user-speaking',{detail:false}));socket.send({type:'live_speech_end',speech_ms:speechMs});},
    (pcm,end)=>audioPlayer.isPlaybackEcho(pcm,end)
  );
}

let voiceInteractionStarted=false;
function startPreferredVoiceSession(capture = !isMuted) {
  voiceInteractionStarted=true;
  voiceSession.begin();
  activeVoiceProvider = "gemini_live";
  setupLiveVoiceInput();
  socket.send({ type: "live_start", muted:isMuted, session_id:conversationSnapshot().sessionId });
  if(capture)voiceInput.start();
  transition(capture?"listening":"idle");
}

// ---------------------------------------------------------------------------
// Audio playback finished - Resume microphone
// ---------------------------------------------------------------------------

audioPlayer.onFinished(() => {
  console.log("🎵 [AUDIO-FINISHED] Playback complete");
  console.log("🔊 [AUDIO-FINISHED] Audio stream ended, marking playback flag as false");
  isAudioPlaying = false;
  // Gemini Live owns end-of-turn detection; resume immediately when the
  // browser playback queue drains instead of adding an artificial delay.
  console.log("🎤 [AUDIO-FINISHED] Transitioning immediately to listening");
  transition(isMuted?"idle":"listening");
  acknowledgeNotice();
});

window.addEventListener('nova-local-audio-reference',e=>{const d=(e as CustomEvent).detail;audioPlayer.addEchoReference(d.samples,d.sampleRate,d.capturedAt);});
window.addEventListener('nova-ai-playback-begin',()=>cue('voice','ai:'+audioGeneration));
const presenceCapture=new PresenceCapture(socket);
// One bounded, scoped notice surface. Reconnects do not replay chimes.
let workNoticeScope='',workNoticeBaseline=false;
const seenWorkNotices=new Set<string>();
function showWorkNotices(items:any[]){
 const snap=conversationSnapshot(),scope=snap.sessionId+':'+snap.guest;
 if(scope!==workNoticeScope){workNoticeScope=scope;noticeScope(scope);seenWorkNotices.clear();workNoticeBaseline=false;try{for(const id of JSON.parse(sessionStorage.getItem('nova-notice-seen:'+scope)||'[]'))seenWorkNotices.add(String(id));}catch{}}
 if(snap.guest)return;const fresh=newNoticeIds(items,seenWorkNotices);try{sessionStorage.setItem('nova-notice-seen:'+scope,JSON.stringify([...seenWorkNotices]));}catch{}
 const inboxOnly=!workNoticeBaseline,silent=inboxOnly||!notificationSoundEnabled();workNoticeBaseline=true;
 const freshIds=new Set(fresh.map(item=>String(item.id)));
 for(const item of items)notify(item.kind==='research'?{id:String(item.id),title:'Research ready',message:item.title?.replace(/^Research ready: /,''),kind:'research',event:'nova-open-research',target:{research_id:item.target},silent,inboxOnly:inboxOnly||!freshIds.has(String(item.id))}:{id:String(item.id),title:item.title||'Your task has an update',kind:item.kind,target:notificationTarget(item),silent,inboxOnly:inboxOnly||!freshIds.has(String(item.id))});
}
window.addEventListener('nova-conversation',()=>{const s=conversationSnapshot();noticeScope(s.sessionId+':'+s.guest);});
let noticePlaying='',noticeComplete='';
function acknowledgeNotice(){if(noticePlaying&&noticePlaying===noticeComplete&&!isAudioPlaying){socket.send({type:'notice_delivered',notice_id:noticePlaying});noticePlaying=noticeComplete='';}}
socket.onBinary((frame) => {
  if(frame.byteLength<8||new DataView(frame).getUint32(0)!==0x4e564131||new DataView(frame).getUint32(4,true)!==voiceOwner()?.generation)return;
  const pcm=frame.slice(8);
  if (!ownsVoice() || activeVoiceProvider !== "gemini_live" || audioGeneration && audioGeneration===canceledGeneration) return;
  if (!isAudioPlaying) {
    isAudioPlaying = true;
    transition("speaking");
  }
  void audioPlayer.enqueuePcm(pcm, 24000);
});

socket.onOpen(() => {
  voiceSession.reset();
  setConnected(true);
  conversationState({connected:true,status:""});socket.send({type:"ui_context",snapshot:uiSnapshot()});
  if (voiceInteractionStarted && ownsVoice()) startPreferredVoiceSession(!isMuted);
  else { transition("idle"); updateStatus("idle"); }
});

// ---------------------------------------------------------------------------
// WebSocket messages - Main handler
// ---------------------------------------------------------------------------

socket.onMessage((msg) => {
  const type = msg.type as string;
  if(type==='conversation_switched'){if(msg.status==='ok'){const switchingId=String(msg.session_id);conversationReplace((Array.isArray(msg.messages)?msg.messages:[]).map((m:any)=>({id:m.id,role:m.role,text:m.content,status:m.status||'completed'})),switchingId);void conversationLoad(switchingId).catch(e=>showError(e.message)).finally(()=>conversationState({sessionSwitching:false,status:''}));}else{conversationState({sessionSwitching:false,status:String(msg.reason||'Conversation switch failed')});showError(String(msg.reason||'Conversation switch failed'));}if(!isMuted)voiceInput.resume();return;}
  if(type==='speaker_status'){const wasGuest=conversationSnapshot().guest;conversationState({guest:msg.guest===true,status:msg.state==='matched'?(msg.owner?'Main user confirmed · existing memories connected':'Speaker confirmed · separate memories'):'Guest conversation · speaker not confirmed'});if(msg.guest&&!wasGuest)conversationReplace([],conversationSnapshot().sessionId);if(!msg.guest&&wasGuest)void conversationLoad(conversationSnapshot().sessionId).catch(()=>{});return;}
  if(type==='status'&&msg.client_id){conversationState({clientId:String(msg.client_id)});socket.send({type:'conversation_attach',session_id:conversationSnapshot().sessionId});void conversationLoad(conversationSnapshot().sessionId).catch(()=>{});}
  if(type==='application_confirmation'){void confirmOwner(String(msg.title),String(msg.target),String(msg.revision)).then(confirmed=>socket.send({type:'widget_action_result',widget:'application_confirmation',request_id:msg.request_id,revision:msg.revision,confirmed,status:confirmed?'completed':'failed'}));return;}
  if(type==='application_control'){void applicationControl(msg).then(result=>socket.send({type:'widget_action_result',widget:'application',command:msg.action,request_id:msg.request_id,...result})).catch(e=>socket.send({type:'widget_action_result',widget:'application',request_id:msg.request_id,status:'failed',detail:e.message}));return;}
  if(type==='research_focus_ack'){conversationState({focusId:String(msg.research_id||''),focusRevision:Number(msg.selection_revision||0)});window.dispatchEvent(new CustomEvent('nova-research-focus-ack',{detail:msg}));return;}
  if(type==='research_page_created'){window.dispatchEvent(new CustomEvent('nova-research-page-created',{detail:msg}));return;}
  if(type==='research_continue'){window.dispatchEvent(new CustomEvent('nova-research-continue',{detail:msg}));return;}
  if(type==='research_refresh'){window.dispatchEvent(new CustomEvent('nova-research-refresh',{detail:msg}));return;}
  if(type==='research_ready'){window.dispatchEvent(new CustomEvent('nova-research-ready',{detail:msg}));return;}
  if(type==='memory_view_action'){window.dispatchEvent(new CustomEvent('nova-memory-view-action',{detail:msg}));return;}
  if(type==='jobs_snapshot'){conversationState({jobs:Array.isArray(msg.jobs)?msg.jobs as any:[]});return;}
  if(type==='job_progress'){
    const snap=conversationSnapshot(),jobs=[...snap.jobs],i=jobs.findIndex(j=>j.id===msg.job_id),previous=i>=0?jobs[i]:null;
    const sequence=Number(msg.sequence);if(previous&&Number.isFinite(sequence)&&sequence<=(previous.sequence||0))return;
    window.dispatchEvent(new Event('nova-library-changed'));
    if(msg.notification&&msg.research_id)requestedResearchReady(String(msg.job_id),String(msg.research_id));
    const row={id:String(msg.job_id),state:String(msg.state),completed:Number(msg.completed)||0,total:Number(msg.total)||0,sequence:Number.isFinite(sequence)?sequence:0,title:String(msg.title||previous?.title||'Task'),step:String(msg.step||previous?.step||'')};
    if(i>=0)jobs[i]=row;else jobs.unshift(row);conversationState({jobs});return;
  }
  if(type==='presence_start'){void presenceCapture.start(String(msg.notice_id));return;}
  if(type==='presence_stop'){presenceCapture.stop();return;}
  if(type==='presence_image_request'){presenceCapture.requestImage(String(msg.notice_id));return;}
  if(type==='presence_result'){presenceCapture.result(String(msg.state));return;}
  if(type==='operation_notices'){showWorkNotices(Array.isArray(msg.items)?msg.items:[]);window.dispatchEvent(new CustomEvent('nova-operation-notices',{detail:msg}));return;}
  if(type==='live_notice_begin'){noticePlaying=String(msg.notice_id);noticeComplete='';return;}
  if(type==='live_notice_complete'){noticeComplete=String(msg.notice_id);acknowledgeNotice();return;}
  if(type==='live_audio_generation'){audioGeneration=String(msg.generation||'');return;}
  if(type==='memory_globe_changed'){window.dispatchEvent(new CustomEvent('nova-memory-globe-changed',{detail:msg}));return;}
  if(type==='memory_activity'){window.dispatchEvent(new CustomEvent('nova-memory-activity',{detail:msg}));return;}
  if(type==='research_status'){conversationState({status:msg.phase==='searching'?'Searching current information…':msg.phase==='failed'?'Current-information search unavailable.':msg.phase==='waiting'?'Research is waiting to continue.':'',sources:Array.isArray(msg.sources)?msg.sources.map((s:any)=>({title:String(s.title||''),url:String(s.url||'')})):[]});window.dispatchEvent(new CustomEvent('nova-research-status',{detail:msg}));return;}

  if (type === "memory_changed") { window.dispatchEvent(new CustomEvent("nova-memory-changed", { detail: msg })); return; }

  if (type === "live_status") {
    const provider = String(msg.provider || "gemini_live");
    if(msg.model)conversationState({model:String(msg.model)});
    const liveState = String(msg.state || "idle");
    voiceSession.receive(provider,liveState);
    recoveryVoiceState = liveState;
    recoveryVoiceReason = String(msg.reason || 'AI voice session failed.');
    recoveryVoiceRetryable = msg.retryable !== false;
    if (badgeLabelEl && provider !== "none") {
      badgeLabelEl.textContent = provider === "legacy" ? "legacy fallback" : "Gemini Live";
    }
    if (provider === "legacy" && activeVoiceProvider !== "legacy") {
      activeVoiceProvider = "legacy";
      setupLegacyVoiceInput();
      if (!isMuted) voiceInput.start();
      showError("Gemini Live is unavailable; using legacy voice for this session.");
    } else if (provider === "gemini_live") {
      activeVoiceProvider = "gemini_live";
    }
    if (liveState === "connecting") transition("thinking");
    else if (liveState === "listening" && !isAudioPlaying && !memoryChatBusy) transition(isMuted ? "idle" : "listening");
    else if (liveState === "error") {
      const reason = String(msg.reason || 'No AI voice provider is available.');
      showError(reason);
      if (msg.retryable === true) recoverTransient(reason);
    }
  }

  else if (type === 'live_text_accepted') {
    memoryChatBusy=false;conversationState({textBusy:false,status:''});
    window.dispatchEvent(new CustomEvent('nova-chat-accepted',{detail:{request_id:msg.request_id}}));
  }
  else if (type === 'live_input_transcript') {
    audioPlayer.discardHeldPcm();heldGeneration=pendingInterruptionGeneration='';conversationState({status:''});
    userTranscript=String(msg.full_text||((userTranscript?userTranscript+' ':'')+String(msg.text||'')));
    userMessageId=String(msg.request_id||('user:'+String(msg.turn_id||'active')));
    if(userTranscript.trim())cue('voice','user:'+userMessageId);
    conversationMessage('user',userTranscript,msg.final?'completed':'streaming',userMessageId,String(msg.research_id||''),msg.context_cards as any[]);
  }
  else if (type === 'live_output_transcript') {
    assistantTranscript=String(msg.full_text||((assistantTranscript?assistantTranscript+' ':'')+String(msg.text||'')));
    assistantMessageId='reply:'+String(msg.turn_id||'active');
    conversationMessage('assistant',assistantTranscript,'streaming',assistantMessageId,String(msg.research_id||''));
  }
  else if (type === 'live_generation_complete') {
    const turn=String(msg.turn_id||'active');
    if(msg.input_text)conversationMessage('user',String(msg.input_text),'completed',String(msg.request_id||'user:'+turn),String(msg.research_id||''),msg.context_cards as any[]);
    if(msg.output_text)conversationMessage('assistant',String(msg.output_text),'completed','reply:'+turn,String(msg.research_id||''));
    if(!msg.reconciled&&(!msg.generation||String(msg.generation)===audioGeneration))audioPlayer.finishPcmTurn();
    userTranscript=assistantTranscript=userMessageId=assistantMessageId='';
    conversationState({textBusy:false});
  }
  else if (type === 'live_turn_complete') {
    // Storage acknowledgement belongs to its frozen turn, never the next input.
    if(msg.memory_status==='failed')conversationState({status:'Reply complete; history storage needs attention.'});
  }

  else if(type==='live_continuation_failed'){
    if(msg.session_id&&msg.session_id!==conversationSnapshot().sessionId)return;
    if(String(msg.generation||'')!==audioGeneration)return;
    audioPlayer.finishPcmTurn();conversationState({status:'Reply paused. Ask me to continue when ready.'});
  }
  else if(type==='live_interruption_unresolved'){
    if(msg.session_id&&msg.session_id!==conversationSnapshot().sessionId||pendingInterruptionGeneration!==String(msg.generation||''))return;
    pendingInterruptionGeneration='';
    if(heldGeneration===String(msg.generation||'')){audioPlayer.discardHeldPcm();heldGeneration='';}
    conversationState({status:'I didn’t catch any words. Please repeat when ready.'});
  }
  else if (type === 'live_interruption_recovered') {
    const recovered=String(msg.generation||'');
    if(msg.session_id&&msg.session_id!==conversationSnapshot().sessionId||pendingInterruptionGeneration!==recovered)return;
    pendingInterruptionGeneration='';
    const resumed=Boolean(recovered&&recovered===heldGeneration&&audioPlayer.resumeHeldPcm());
    audioPlayer.discardHeldPcm();heldGeneration='';
    if(msg.output_text)conversationMessage('assistant',String(msg.output_text),msg.continuing?'streaming':'completed','reply:'+String(msg.turn_id));
    if(resumed){audioGeneration=String(msg.next_generation||recovered);isAudioPlaying=true;transition('speaking');if(!msg.continuing)audioPlayer.finishPcmTurn();}
    conversationState({status:resumed||msg.continuing?'':'Reply is available above.'});
  }
  else if (type === "live_interrupted") {
    if(msg.session_id&&msg.session_id!==conversationSnapshot().sessionId)return;
    const canceled=String(msg.generation||audioGeneration);
    canceledGeneration=canceled;
    const id=msg.turn_id?'reply:'+String(msg.turn_id):assistantMessageId;
    const prior=conversationSnapshot().messages.find(item=>item.id===id);
    if(id&&(prior?.text||assistantTranscript))conversationMessage('assistant',prior?.text||assistantTranscript,'interrupted',id);
    // A delayed cancellation acknowledgement belongs to its old generation.
    // It cannot stop or clear input/output already arriving for the next one.
    if(!msg.duplicate&&(!msg.generation||canceled===audioGeneration||canceled===heldGeneration)){
      if(!msg.recoverable||canceled!==heldGeneration){audioPlayer.stop();heldGeneration='';}
      assistantTranscript=assistantMessageId='';
      if(msg.recoverable){pendingInterruptionGeneration=canceled;conversationState({status:'Checking interruption…'});}
      window.dispatchEvent(new CustomEvent('nova-memory-activity',{detail:{phase:'clear'}}));
      isAudioPlaying=false;
      if(!isMuted&&!conversationSnapshot().textBusy)transition('listening');
    }
  }

  else if (type === "live_error") {
    memoryChatBusy=false;conversationState({textBusy:false,status:'Live connection needs attention. Your draft is preserved.'});
    showError(String(msg.message || "Gemini Live error"));
    recoverTransient(String(msg.message || "Gemini Live error"));
  }

  else if (type === 'typed_transcript_status') {
    window.dispatchEvent(new CustomEvent('aegisTypedTranscriptStatus', { detail: {
      status: String(msg.status || 'failed'),
      request_id: String(msg.request_id || ''),
      source: String(msg.source || 'server'),
      message: String(msg.detail || ''),
    } }));
  }

  // =========================================================================
  // MICROPHONE CONTROL - Explicit disable/enable from backend
  // =========================================================================
  else if (type === "mic_control") {
    const action = msg.action as string;
    const reason = msg.reason as string;
    
    console.log(`🎙️ [MIC-CONTROL] Backend command: ${action.toUpperCase()}`);
    console.log(`   Reason: ${reason}`);
    
    if (action === "disable") {
      // Disable microphone - stop listening during audio playback
      console.log(`🔇 [MIC-CONTROL] Executing: pause microphone`);
      voiceInput.pause();
    } 
    else if (action === "enable") {
      // Re-enable microphone - start listening again
      if (!isAudioPlaying) {
        console.log(`🎤 [MIC-CONTROL] Executing: resume microphone`);
        voiceInput.resume();
      } else {
        console.log(`⏳ [MIC-CONTROL] Deferred: audio still playing, will resume on finish`);
      }
    }
  }

  // =========================================================================
  // TEXT RESPONSE - AI's text output (immediate)
  // =========================================================================
  else if (type === "response_text") {
    const text = msg.text as string;
    console.log(`📝 [RESPONSE-TEXT] Received AI response`);
    console.log(`   → "${text}"`);

    // Example: Mood logic based on AI response
    // If the AI response contains certain keywords, change orb color
    if (/thank|great|awesome|perfect|good|excellent|well done|nice/i.test(text)) {
      setOrbMood("good");
    } else if (/sorry|can't|not sure|don't understand|error|fail|problem|issue/i.test(text)) {
      setOrbMood("error");
    } else if (/maybe|hmm|not certain|try again|unclear|confused|difficult/i.test(text)) {
      setOrbMood("warning");
    } else {
      setOrbMood("neutral");
    }
  } else if (type === "live_transcript") {
    const text = msg.text as string;
    console.log(`📝 [LIVE-TRANSCRIPT] ${text}`);
    setOrbMood("neutral");
  }

  // =========================================================================
  // AUDIO RESPONSE - THE CRITICAL PART to prevent feedback
  // =========================================================================
  else if (type === "response_audio") {
    const audioData = msg.audio as string;
    
    if (audioData) {
      console.log(`🎵 [AUDIO-RESPONSE] Received audio data (${audioData.length} chars base64)`);
      console.log(`🔇 [AUDIO-RESPONSE] CRITICAL: Pausing microphone BEFORE audio playback`);
      
      // CRITICAL: Pause microphone FIRST before audio starts playing
      voiceInput.pause();
      
      // Mark that audio is now playing
      isAudioPlaying = true;
      console.log(`🟴 [AUDIO-RESPONSE] Audio playback flag SET`);
      
      // Transition to speaking state (which also pauses, but we did it explicitly above)
      if (currentState !== "speaking") {
        transition("speaking");
      }
      
      console.log(`▶️ [AUDIO-RESPONSE] Enqueueing audio for playback...`);
      audioPlayer.enqueue(audioData);
      console.log(`✅ [AUDIO-RESPONSE] Audio enqueued successfully`);
    } else {
      // No audio data received (TTS failed)
      console.warn(`⚠️ [AUDIO-RESPONSE] No audio data - returning to idle`);
      isAudioPlaying = false;
      transition("idle");
    }
  }

  // =========================================================================
  // WIDGET CONTROL - AI requests the UI to open/close/toggle a widget
  // =========================================================================
  else if (type === "widget_connection") {
    const widget = String(msg.widget || '');
    const status = String(msg.status || 'disconnected').toLowerCase();
    const controller = (window as any).aegisWidgetControl;
    if (!controller) {
      socket.send({
        type: 'widget_action_result', protocol_version: 2, widget,
        command: status === 'disconnected' ? 'disconnect' : 'connect',
        request_id: msg.request_id, status: 'failed',
        detail: 'Widget controller is not available in the frontend.',
      });
    } else {
      controller(status === 'disconnected' ? 'disconnect' : 'connection', widget, {
        protocol_version: 2,
        request_id: msg.request_id,
        status,
        connection_id: msg.connection_id,
        detail: msg.detail,
      });
      if (status !== 'disconnected' && msg.request_snapshot) {
        window.setTimeout(() => controller('snapshot', widget, {
          protocol_version: 2,
          request_id: msg.request_id,
          connection_id: msg.connection_id,
        }), 0);
      }
    }
  }

  else if (type === "widget_control") {
    const command = msg.command as string;
    const widget = msg.widget as string;

    console.log(`🧩 [WIDGET-CONTROL] ${command} ${widget}`);
    const { type: _type, widget: _widget, command: _command, arguments: commandArguments, payload: commandPayload, ...envelope } = msg;
    const widgetPayload = {
      ...envelope,
      ...(commandPayload && typeof commandPayload === 'object' ? commandPayload : {}),
      ...(commandArguments && typeof commandArguments === 'object' ? commandArguments : {}),
    };
    if (widget === "ui" && (window as any).aegisUiControl) {
      (window as any).aegisUiControl(command, widgetPayload);
    } else if ((window as any).aegisWidgetControl) {
      (window as any).aegisWidgetControl(command, widget, widgetPayload);
    } else {
      console.warn("⚠️ [WIDGET-CONTROL] No widget controller available");
      setTranscriptionVisual(false);
      socket.send({
        type: 'widget_action_result',
        widget,
        command,
        request_id: msg.request_id,
        status: 'failed',
        detail: 'Widget controller is not available in the frontend.',
      });
    }
  }

  else if (type === "widget_action_ack") {
    console.log(
      `[WIDGET-ACTION] Server acknowledged ${String(msg.widget)} ${String(msg.command)}: ${String(msg.status)}`
    );
  }

  // =========================================================================
  // STATUS UPDATES - Server state notifications
  // =========================================================================
  else if (type === "status") {
    const state = msg.state as string;
    const message = msg.message as string;
    
    console.log(`📊 [SERVER-STATUS] ${state}${message ? ': ' + message : ''}`);
    
    if (state === "thinking" && currentState !== "thinking") {
      transition("thinking");
    } 
    else if (state === "idle" && !isAudioPlaying) {
      transition("idle");
    }
  } 

  // =========================================================================
  // LEGACY FORMAT - Old message format (backward compatibility)
  // =========================================================================
  else if (type === "audio") {
    const audioData = msg.data as string;
    console.log(`🎵 [AUDIO-LEGACY] Received old format audio (${audioData ? `${audioData.length} chars` : "EMPTY"})`);
    
    if (audioData) {
      // Pause microphone before playing
      voiceInput.pause();
      isAudioPlaying = true;
      
      if (currentState !== "speaking") {
        transition("speaking");
      }
      audioPlayer.enqueue(audioData);
    } else {
      isAudioPlaying = false;
      transition("idle");
    }
    

  } 

  // =========================================================================
  // TEXT FALLBACK - When TTS completely fails
  // =========================================================================
  else if (type === "text") {

    isAudioPlaying = false;
    transition("idle");
  } 

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================
  else if (type === "error") {
    console.error(`❌ [ERROR] Server error:`, msg.message);
    showError(msg.message as string);
    isAudioPlaying = false;
    transition("idle");
  } 

  // =========================================================================
  // Unknown format
  // =========================================================================
  else {
    console.debug("[WS] Unknown message type:", type);
  }
});

// ---------------------------------------------------------------------------
// Kick off
// ---------------------------------------------------------------------------

setConnected(false);
updateStatus("idle");

console.log(" [INIT] Starting Aegis AI Frontend Integration");
console.log(" [INIT] WebSocket URL:", WS_URL);
console.log(" [INIT] Creating orb visualization...");
console.log(" [INIT] Creating voice input system...");
console.log(" [INIT] Creating audio player...");

// Prepare capture once; enabling the microphone opens it on user interaction.
setupLiveVoiceInput();
transition("idle");

const enableAudio=document.createElement('button');
enableAudio.type='button';enableAudio.textContent='Enable Aegis audio';enableAudio.className='aegis-enable-audio';enableAudio.hidden=true;
enableAudio.setAttribute('aria-label','Enable spoken Aegis replies');document.body.appendChild(enableAudio);
enableAudio.addEventListener('click',()=>{void (audioPlayer.getAnalyser().context as AudioContext).resume().then(()=>{enableAudio.hidden=audioPlayer.getAnalyser().context.state==='running';}).catch(()=>{enableAudio.hidden=false;});});
// User activation resumes playback without requesting microphone permission.
function ensureAudioContext() {
  const ctx = audioPlayer.getAnalyser().context as AudioContext;
  if (ctx.state === "suspended") {
    console.log("🔊 [AUDIO] AudioContext suspended, resuming...");
    ctx.resume().then(()=>{enableAudio.hidden=ctx.state==='running';}).catch(()=>{enableAudio.hidden=false;});
    setTimeout(()=>{enableAudio.hidden=ctx.state==='running';},500);
  }
}
document.addEventListener("click", ensureAudioContext);
document.addEventListener("touchstart", ensureAudioContext);
document.addEventListener("keydown", ensureAudioContext, { once: true });

// Try to resume audio context on load
ensureAudioContext();

console.log("✅ [INIT] Frontend initialization complete!");

// Initialize React widgets
initWidgets();

window.addEventListener('aegisWidgetActionResult', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  socket.send({
    type: 'widget_action_result',
    protocol_version: detail.protocol_version || 2,
    widget: detail.widget,
    command: detail.command,
    request_id: detail.request_id,
    status: detail.status,
    detail: detail.detail,
    provider: detail.provider,
    model: detail.model,
    backup_id: detail.backup_id,
    image_number: detail.image_number,
    selected_image_id: detail.selected_image_id,
    selected_image_number: detail.selected_image_number,
    selected_prompt: detail.selected_prompt,
    created_at: detail.created_at,
    current_view: detail.current_view,
    query: detail.query,
    match_count: detail.match_count,
    fallback_from: detail.fallback_from,
    error_code: detail.error_code,
    retry_after_seconds: detail.retry_after_seconds,
    data: detail.data,
    state_revision: detail.state_revision,
  });
});

window.addEventListener('aegisTypedTranscript', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  const text = String(detail.text || '').trim();
  const requestId = String(detail.request_id || '').trim();
  const publishStatus = (status: 'accepted' | 'busy' | 'failed', message: string) => {
    window.dispatchEvent(new CustomEvent('aegisTypedTranscriptStatus', { detail: {
      status,
      message,
      request_id: requestId,
      source: detail.source || 'typed_input',
    } }));
  };

  if (!text || !requestId) {
    publishStatus('failed', 'A search query and request ID are required.');
    return;
  }
  if (!socket.isConnected()) {
    publishStatus('failed', 'Aegis is offline. Reconnect and try again.');
    return;
  }
  if(voiceSession.needsStart())startPreferredVoiceSession(!isMuted);

  const source = String(detail.source || 'typed_input').toLowerCase();
  socket.send({
    // News needs the same structured retrieval pipeline as Search. Sending it
    // through Gemini Live skips the `show_news` result message entirely.
    type: source === 'news_widget' ? 'transcript' : 'live_text',
    text,
    display_query: String(detail.display_query || text),
    request_id: requestId,
    source,
    continuation: detail.continuation === true,
    research_id: String(detail.research_id || ''),
    isFinal: true,
  });
  setTranscriptionVisual(false);
  if (voiceInput) transition('thinking');
  publishStatus('accepted', 'Aegis accepted the live search.');
});

window.addEventListener('aegisWidgetTelemetry', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  if (detail.type !== 'widget_telemetry' || detail.protocol_version !== 2) return;
  socket.send(detail);
});

window.addEventListener('aegisWidgetConnectionRequest', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  if (detail.action !== 'disconnect' && detail.action !== 'connect') return;
  socket.send({
    type: 'widget_connection_request',
    protocol_version: 2,
    action: detail.action,
    widget: detail.widget,
    connection_id: detail.connection_id,
  });
});

// Listen for widget open/close events to reposition the orb
window.addEventListener('orbWidgetStateChange', (ev: Event) => {
  try {
    const detail = (ev as CustomEvent).detail || {};
    const hasAny = !!detail.hasAnyWidgetOpen;
    orb.setPosition(hasAny ? 'right' : 'center');

    if (soundWaveEl) {
      soundWaveEl.classList.toggle("shifted-right", hasAny);
    }
    transcriptionDots.classList.toggle("shifted-right", hasAny);
    statusEl.classList.toggle("shifted-right", hasAny);
  } catch (e) {
    console.warn('[ORB-EVENT] Failed to handle orbWidgetStateChange', e);
  }
});

// ---------------------------------------------------------------------------
// UI Controls
// ---------------------------------------------------------------------------

const btnMute = document.getElementById("btn-mute")!;
btnMute.title = isMuted ? "Start voice chat" : "Mute microphone";
btnMute.setAttribute("aria-label", btnMute.title);
const btnMenu = document.getElementById("btn-menu")!;
const menuDropdown = document.getElementById("menu-dropdown")!;
const btnRestart = document.getElementById("btn-restart")!;

btnMute.addEventListener("click", async (e) => {
  e.stopPropagation();
  if(isMuted && !await acquireVoice(socket)){showError("Voice active in "+(voiceOwner()?.label||"another window")+". Stop it there before starting here.");return;}
  isMuted = !isMuted;
  if(isMuted)releaseVoice(socket);
  btnMute.title = isMuted ? "Start voice chat" : "Mute microphone";
  btnMute.setAttribute("aria-label", btnMute.title);
  localStorage.setItem(MIC_MUTE_KEY, isMuted ? "true" : "false");
  btnMute.classList.toggle("muted", isMuted);
  soundWave.setMuted(isMuted);
  conversationState({muted:isMuted});
  socket.send({type:'mic_state',muted:isMuted});
  if (isMuted) {
    if (voiceInput) voiceInput.stop();
    if(!isAudioPlaying)transition("idle");
  } else if(activeVoiceProvider==="gemini_live"&&!voiceSession.needsStart()){
    voiceInput.start();transition(isAudioPlaying?"speaking":"listening");
  } else {
    startPreferredVoiceSession();
  }
});

// On load, update mute button UI and enforce mute state
if (isMuted) {
  btnMute.classList.add("muted");
  // Do not start voice input if muted
  transition("idle");
} else {
  btnMute.classList.remove("muted");
}

btnMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", () => {
  menuDropdown.style.display = "none";
});

let runtimeOperation: Promise<void> | null = null;
let recoveryVoiceState = 'idle';
let recoveryVoiceReason = '';
let recoveryVoiceRetryable = true;
let autoRecoveryUsed = false;
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function runtimeRequest(path: string, method = 'GET') {
  const response = await fetch(`/api/runtime/${path}`, { method, headers: { 'X-Nova-Control': '1' }, signal: AbortSignal.timeout(5000) });
  const result = await response.json().catch(() => ({ error: 'Runtime controller unavailable. Start Nova with start_nova_ai.ps1.' }));
  if (!response.ok) throw new Error(result.error || 'Runtime controller unavailable. Start Nova with its launcher.');
  return result;
}
async function waitForRuntime() {
  const deadline = Date.now() + 55000;
  while (Date.now() < deadline) {
    const result = await runtimeRequest('status');
    if (result.state === 'failed') throw new Error(result.error || 'Backend startup failed.');
    if (result.state === 'ready' && result.healthy) return;
    await delay(350);
  }
  throw new Error('Backend readiness timed out. Check the backend logs.');
}
async function recoverRuntime(forceRestart = false) {
  if (runtimeOperation) return runtimeOperation;
  runtimeOperation = (async () => {
    statusEl.textContent = forceRestart ? 'restarting backend…' : 'recovering connection…';
    audioPlayer.stop(); isAudioPlaying = false;
    await runtimeRequest(forceRestart ? 'restart' : 'recover', 'POST');
    await waitForRuntime();
    const connectSession = async () => {
      recoveryVoiceState = 'connecting';
      socket.reconnect();
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline) {
        if (socket.isConnected() && (isMuted || recoveryVoiceState === 'listening')) return;
        if (!isMuted && recoveryVoiceState === 'error') throw new Error(recoveryVoiceReason);
        await delay(100);
      }
      throw new Error('The AI connection could not be restored.');
    };
    // A failed voice reconnect must not kill healthy research/document workers.
    // Explicit Restart remains available; recover only restarts an unhealthy backend.
    await connectSession();
    statusEl.textContent = isMuted ? 'muted' : 'listening';
  })().catch(error => { showError(error.message); statusEl.textContent = 'recovery failed'; }).finally(() => { runtimeOperation = null; });
  return runtimeOperation;
}
function recoverTransient(message: string) {
  if (/api.?key|auth|permission|credential|quota|rate.?limit|429|401|403|invalid|billing/i.test(message)) return;
  if (autoRecoveryUsed || runtimeOperation) return;
  autoRecoveryUsed = true;
  void recoverRuntime();
}
socket.onClose(() => {
  isMuted=true;conversationState({muted:true});
  voiceSession.reset();
  voiceInput?.stop();
  setConnected(false); conversationState({sessionSwitching:false,connected:false,status:"Reconnecting…"});canceledGeneration=audioGeneration;heldGeneration=pendingInterruptionGeneration='';window.dispatchEvent(new CustomEvent("nova-memory-activity",{detail:{phase:"clear"}})); audioPlayer.stop(); isAudioPlaying = false;
  statusEl.textContent = 'reconnecting…';
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(() => { if (!socket.isConnected()) recoverTransient('connection unavailable'); }, 2500);
});
socket.onOpen(() => {
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = null;
});
btnRestart.addEventListener('click', e => {
  e.stopPropagation(); menuDropdown.style.display = 'none';
  void recoverRuntime(true);
});
document.getElementById('btn-fix-self')?.addEventListener('click', e => {
  e.stopPropagation(); menuDropdown.style.display = 'none';
  autoRecoveryUsed = false; void recoverRuntime();
});

// Settings button
const btnSettings = document.getElementById("btn-settings")!;
btnSettings.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
  openSettings();
});

(window as any).aegisUiControl = (command: string, payload: Record<string, unknown> = {}) => {
  const normalized = String(command || "").trim().toLowerCase();
  let status = "completed";
  let detail = `UI command ${normalized} completed.`;
  try {
    if (normalized === "mute" && !isMuted) btnMute.click();
    else if (normalized === "unmute" && isMuted) btnMute.click();
    else if (normalized === "open_menu") menuDropdown.style.display = "block";
    else if (normalized === "close_menu") menuDropdown.style.display = "none";
    else if (normalized === "open_settings") openSettings();
    else if (normalized === "restart") throw new Error("Restart must be confirmed and executed by the backend.");
    else if (!["mute", "unmute", "open_menu", "close_menu", "open_settings"].includes(normalized)) {
      throw new Error(`Unsupported UI command: ${normalized}`);
    }
  } catch (error) {
    status = "failed";
    detail = error instanceof Error ? error.message : String(error);
  }
  socket.send({
    type: "widget_action_result",
    widget: "ui",
    command: normalized,
    request_id: payload.request_id,
    status,
    detail,
  });
};

// First-time setup detection — check after a short delay for server readiness
setTimeout(() => {
  checkFirstTimeSetup();
}, 2000);




initMemoryWorkspace({getAnalyser: () => audioPlayer.getAnalyser()});
void import('./components/Research/ResearchWorkspace').then(m=>m.default());

// Component-owned, allowlisted UI state; no credential or document scraping.
window.addEventListener('nova-ui-context',()=>{socket.send({type:'ui_context',snapshot:uiSnapshot()});});
window.addEventListener('orbWidgetStateChange',(event:Event)=>{const d=(event as CustomEvent).detail||{};updateUiContext({widgets:Object.entries(d).filter(([,v])=>v===true).map(([k])=>k).slice(0,12)});});
window.addEventListener('nova-chat-microphone',()=>btnMute.click());
let memoryChatBusy=false;
let chatAbort:AbortController|null=null;
window.addEventListener('nova-chat-cancel',()=>{audioPlayer.stop();heldGeneration=pendingInterruptionGeneration='';isAudioPlaying=false;socket.send({type:'live_text_suspend'});conversationState({textBusy:false,status:'Reply interrupted; tasks remain active.'});});
window.addEventListener('nova-research-result',(event:Event)=>socket.send({type:'widget_action_result',...(event as CustomEvent).detail,widget:'application'}));
window.addEventListener('nova-memory-view-result',(event:Event)=>{socket.send({type:'widget_action_result',...(event as CustomEvent).detail,widget:'memory'});});
window.addEventListener('nova-job-cancel',async(event:Event)=>{const id=String((event as CustomEvent).detail?.job_id||'');if(id){const headers={'X-Nova-Client':conversationSnapshot().clientId};await fetch('/api/jobs/'+encodeURIComponent(id)+'/cancel',{method:'POST',headers});const r=await fetch('/api/jobs',{headers});if(r.ok){const data=await r.json();conversationState({jobs:data.jobs||[]});}}});

window.addEventListener('nova-chat-send',async(event:Event)=>{
 const d=(event as CustomEvent).detail||{},text=String(d.text||'').trim();
 if(!text||memoryChatBusy||conversationSnapshot().sessionSwitching)return;
 if(!socket.isConnected()){conversationState({status:'Aegis is offline. Your draft is preserved.'});return;}
 canceledGeneration=audioGeneration;heldGeneration=pendingInterruptionGeneration='';audioPlayer.stop();isAudioPlaying=false;
 if(voiceSession.needsStart())startPreferredVoiceSession(!isMuted);
 memoryChatBusy=true;
 const selected=String(d.research_id||''),revision=Number(d.selection_revision||0);
 socket.send({type:'ui_context',snapshot:uiSnapshot()});
 const focused=()=>conversationSnapshot().focusId===selected&&conversationSnapshot().focusRevision===revision;
 if(!focused())await new Promise<void>(resolve=>{const check=()=>{if(focused())done();};const done=()=>{clearTimeout(timer);window.removeEventListener('nova-research-focus-ack',check);resolve();};const timer=setTimeout(done,7000);window.addEventListener('nova-research-focus-ack',check);check();});
 if(!focused()||String(uiSnapshot().view==='research'?uiSnapshot().research_id||'':'')!==selected){memoryChatBusy=false;conversationState({status:'The selected conversation is still opening. Your message draft is preserved.'});return;}
 conversationState({state:'thinking',status:'',textBusy:true,sources:[]});
 conversationMessage('user',text,'sending',d.request_id);
 socket.send({type:'ui_context',snapshot:uiSnapshot()});
 socket.send({type:'live_text',text,request_id:d.request_id,session_id:conversationSnapshot().sessionId,source:'typed_input',research_id:d.research_id||'',selection_revision:revision,active_selection_id:d.active_selection_id||''});
});

window.addEventListener('nova-conversation-switch',((e:CustomEvent)=>{if(conversationSnapshot().textBusy||conversationSnapshot().sessionSwitching||!conversationSnapshot().connected)return;conversationState({sessionSwitching:true,status:'Opening conversation…'});conversationInterrupt();audioPlayer.stop();heldGeneration=pendingInterruptionGeneration='';isAudioPlaying=false;voiceInput?.pause();userTranscript=assistantTranscript=userMessageId=assistantMessageId='';socket.send({type:'conversation_switch',session_id:e.detail.session_id});}) as EventListener);

window.addEventListener('nova-voice-enrollment',((e:CustomEvent)=>{if(e.detail.active){canceledGeneration=audioGeneration;audioPlayer.stop();voiceInput?.pause();socket.send({type:'live_text_suspend'});}else if(!isMuted){socket.send({type:'live_text_resume'});voiceInput?.resume();}}) as EventListener);

window.addEventListener('nova-voice-lease-lost',()=>{isMuted=true;voiceInput?.stop();audioPlayer.stop();isAudioPlaying=false;voiceSession.reset();conversationState({muted:true});btnMute.classList.add('muted');btnMute.title='Start voice chat';btnMute.setAttribute('aria-label',btnMute.title);soundWave.setMuted(true);});

if(import.meta.hot)import.meta.hot.dispose(()=>socket.close());
