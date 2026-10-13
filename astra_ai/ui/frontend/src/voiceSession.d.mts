export class VoiceSessionState { state:'idle'|'connecting'|'ready'; begin():void;reset():void;receive(provider:string,state:string):void;needsStart():boolean; }
