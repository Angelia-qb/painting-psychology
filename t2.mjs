import express from 'express';
import path from 'path';
const app=express();
const S='/home/angelia_58/.openclaw/workspace/data/painting-psychology/sessions';
app.get('/x/:id/:f',(req,res)=>{
  const p=path.join(S,req.params.id,req.params.f);
  res.sendFile(p,(err)=>{ if(err) console.log('sendFile err:',err.message,err.status); });
});
app.listen(8095,()=>console.log('up'));
