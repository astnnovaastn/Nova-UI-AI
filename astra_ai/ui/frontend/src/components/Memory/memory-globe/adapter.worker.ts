import {buildGraph} from "./memoryAdapter";
import {GlobeEngine} from './globeEngine';
self.onmessage=({data})=>{try{const graph=buildGraph(data.raw);graph.layout=GlobeEngine.prepare(graph);self.postMessage({generation:data.generation,graph});}catch{self.postMessage({generation:data.generation,error:"Memory graph could not be prepared"});}};
