/** Track the provider session separately from the microphone capture state. */
export class VoiceSessionState {
  state='idle';
  begin(){this.state='connecting';}
  reset(){this.state='idle';}
  receive(provider,state){
    if(provider==='none'||state==='error'||state==='idle'){this.reset();return;}
    if(provider==='gemini_live'&&state==='connecting')this.begin();
    else if(provider==='gemini_live'&&['listening','thinking','speaking'].includes(state))this.state='ready';
  }
  needsStart(){return this.state==='idle';}
}
