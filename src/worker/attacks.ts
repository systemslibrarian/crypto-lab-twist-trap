import {XService} from '../service/xonly';
import {FullService} from '../service/full';
import {twistAttack} from '../attack/twist';
import {invalidAttack} from '../attack/invalid';
self.onmessage=(event:MessageEvent<{mode:'twist'|'invalid';alpha:bigint;validate:boolean}>)=>{
 try{
  const {mode,alpha,validate}=event.data;
  if(mode==='twist'){
   const service=new XService(alpha,validate);
   const answer=twistAttack(u=>service.query(u),service.publicKey);
   self.postMessage({answer,publicKey:service.publicKey});
  }else{
   const service=new FullService(alpha,validate);
   const answer=invalidAttack(p=>service.query(p),service.publicKey);
   self.postMessage({answer,publicKey:service.publicKey});
  }
 }catch(error){self.postMessage({error:String(error)})}
};
