import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VoiceSessionState} from './voiceSession.mjs';
test('first microphone enable opens a provider session even when Gemini is the default',()=>{const s=new VoiceSessionState();assert.equal(s.needsStart(),true);s.begin();assert.equal(s.needsStart(),false);});
test('muting and unmuting an established session never request a second connection',()=>{const s=new VoiceSessionState();s.begin();s.receive('gemini_live','listening');assert.equal(s.state,'ready');assert.equal(s.needsStart(),false);s.receive('gemini_live','speaking');assert.equal(s.needsStart(),false);});
test('failure, session closure and reconnect require fresh voice startup',()=>{const s=new VoiceSessionState();for(const [provider,state] of [['gemini_live','error'],['none','idle']]){s.receive('gemini_live','listening');s.receive(provider,state);assert.equal(s.needsStart(),true);}s.receive('gemini_live','listening');s.reset();assert.equal(s.needsStart(),true);});
