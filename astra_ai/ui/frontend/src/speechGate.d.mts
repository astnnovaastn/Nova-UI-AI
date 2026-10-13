export class SpeechGate {constructor(options:{onFrame:(data:ArrayBuffer)=>void;onStart?:()=>void;onEnd?:()=>void;rate?:number});reset():void;push(pcm:Int16Array,probability:number):void;}
