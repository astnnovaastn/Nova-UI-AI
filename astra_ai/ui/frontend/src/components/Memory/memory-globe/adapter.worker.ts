import {buildGraph} from "./memoryAdapter";
self.onmessage=({data})=>{try{self.postMessage({generation:data.generation,graph:buildGraph(data.raw)});}catch{self.postMessage({generation:data.generation,error:"Memory graph could not be prepared"});}};
