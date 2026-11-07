/**
 * Kingdom Robux — Velani + TikTok Events API
 * Deploy this file in the existing Cloudflare Worker after setting secrets:
 * VELANI_API_KEY, VELANI_WEBHOOK_SECRET, TOKEN_DE_ACESSO_DO_TIKTOK
 * KV: PURCHASE_EVENTS. Optional: ORIGEM_PERMITIDA, VELANI_POSTBACK_URL.
 */
const BASE = "https://api.velanipagamentos.com.br/api/v1/api-gateway";
const PIXEL = "DBKG3UJC77U24SKT8ADG";
const WORKER_WEBHOOK = "https://flevopay-api.lcfferr57.workers.dev/api/velani-webhook";
const clean = (v, max=300) => String(v ?? "").trim().slice(0,max);
const approved = s => clean(s).toLowerCase() === "paid";
const cors = origin => ({"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin"});
function allowedOrigin(req,env) {
 const origins=clean(env.ORIGEM_PERMITIDA||"*",2000).split(",").map(x=>x.trim());
 const origin=req.headers.get("Origin")||"";
 return origins.includes("*")?"*":origins.includes(origin)?origin:"null";
}
function reply(data,status,origin){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json",...cors(origin)}})}
async function api(env,path,options={}){
 if(!env.VELANI_API_KEY)throw Error("VELANI_API_KEY nao configurada");
 const res=await fetch(BASE+path,{...options,headers:{"x-api-key":env.VELANI_API_KEY,"Content-Type":"application/json","Accept":"application/json",...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||data.success===false)throw Error(clean(data.error?.message||data.message||"Erro na API Velani"));
 return data.data;
}
async function order(env,reference){
 const raw=await env.PURCHASE_EVENTS?.get("order:"+reference);
 if(!raw)return null;
 try{return JSON.parse(raw)}catch{return null}
}
async function transaction(env,reference){
 const saved=await order(env,reference);
 if(!saved?.transactionId)return null;
 const t=await api(env,"/v1/transactions/"+encodeURIComponent(saved.transactionId));
 if(t?.id!==saved.transactionId||t?.externalId!==reference)return null;
 return t;
}
async function create(req,env,origin){
 if(!env.PURCHASE_EVENTS)return reply({success:false,message:"KV PURCHASE_EVENTS nao configurado"},500,origin);
 const b=await req.json().catch(()=>null);
 if(!b||typeof b!=="object")return reply({success:false,message:"JSON invalido"},400,origin);
 const email=clean(b.email,254).toLowerCase(),username=clean(b.username||b.robloxUsername||b.user,100);
 const amount=Number(b.amount),cents=Math.round(amount*100);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!username||!Number.isFinite(amount)||cents<100)
   return reply({success:false,message:"E-mail, usuario ou valor invalido"},400,origin);
 const reference="KING-"+crypto.randomUUID();
 const description=clean(b.description||b.product||"Compra Robux",200);
 const customer={name:username,email};
 const phone=clean(env.VELANI_CUSTOMER_PHONE,30);
 const doc=clean(env.VELANI_CUSTOMER_DOCUMENT,30).replace(/\D/g,"");
 if(phone)customer.phone=phone;
 if(doc)customer.document={type:doc.length===14?"cnpj":"cpf",number:doc};
 const payload={amount:cents,paymentMethod:"pix",customer,description,externalId:reference,
  postbackUrl:env.VELANI_POSTBACK_URL||WORKER_WEBHOOK};
 const t=await api(env,"/v1/transactions",{method:"POST",headers:{"x-idempotency-key":reference},body:JSON.stringify(payload)});
 if(!t?.id||!t?.pixQrCode)return reply({success:false,message:"Velani nao retornou Pix valido"},502,origin);
 await env.PURCHASE_EVENTS.put("order:"+reference,JSON.stringify({transactionId:t.id,amount:Number((cents/100).toFixed(2)),email,description,createdAt:Date.now()}),{expirationTtl:2592000});
 return reply({success:true,paymentId:reference,reference,transactionId:t.id,copyPaste:t.pixQrCode,pixCode:t.pixQrCode,qrcodeUrl:t.pixQrCodeImage||"",qrCodeUrl:t.pixQrCodeImage||"",status:clean(t.status||"pending").toUpperCase(),expiresAt:t.expiresAt||null},200,origin);
}
async function status(req,env,origin){
 const reference=clean(new URL(req.url).searchParams.get("paymentId")||new URL(req.url).searchParams.get("reference"),160);
 if(!reference)return reply({success:false,message:"paymentId obrigatorio"},400,origin);
 const t=await transaction(env,reference);
 if(!t)return reply({success:true,paymentId:reference,status:"NOT_FOUND",paid:false},200,origin);
 return reply({success:true,paymentId:reference,reference,transactionId:t.id,status:clean(t.status).toUpperCase(),paid:approved(t.status)},200,origin);
}
async function hash(s){
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(clean(s).toLowerCase()));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function purchase(env,reference,extras={}){
 const t=await transaction(env,reference);
 if(!t)return {sent:false,reason:"TRANSACTION_NOT_FOUND"};
 if(!approved(t.status))return {sent:false,reason:"PAYMENT_NOT_APPROVED",status:t.status};
 if(!env.PURCHASE_EVENTS)return {sent:false,reason:"KV_NOT_CONFIGURED"};
 const token=env.TOKEN_DE_ACESSO_DO_TIKTOK||env.TIKTOK_ACCESS_TOKEN;
 if(!token)return {sent:false,reason:"TIKTOK_TOKEN_NOT_CONFIGURED"};
 const o=await order(env,reference);
 if(!o||Math.round(o.amount*100)!==Number(t.amount))return {sent:false,reason:"AMOUNT_MISMATCH"};
 if(await env.PURCHASE_EVENTS.get("purchase:"+reference))return {sent:false,reason:"ALREADY_SENT"};
 const eventId="purchase_"+reference;
 const user={email:await hash(o.email)};
 if(extras.ip)user.ip=clean(extras.ip,100);
 if(extras.user_agent)user.user_agent=clean(extras.user_agent,500);
 const event={event:"Purchase",event_time:Math.floor(Date.now()/1000),event_id:eventId,user,
 page:{url:clean(extras.page_url||"https://kingdom-robux.shop",2000)},
 properties:{currency:"BRL",value:o.amount,content_type:"product",description:o.description,
 contents:[{content_id:reference,content_name:o.description,quantity:1,price:o.amount}],order_id:reference}};
 const payload={event_source:"web",event_source_id:PIXEL,data:[event]};
 if(env.TIKTOK_TEST_EVENT_CODE)payload.test_event_code=env.TIKTOK_TEST_EVENT_CODE;
 const response=await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/",{method:"POST",headers:{"Access-Token":token,"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||Number(data.code)!==0)return {sent:false,reason:"TIKTOK_API_ERROR",tiktokCode:data.code??null};
 await env.PURCHASE_EVENTS.put("purchase:"+reference,JSON.stringify({eventId,sentAt:Date.now(),apiVersion:"2.0",event:"Purchase",requestId:data.request_id||null,tiktokCode:0}),{expirationTtl:7776000});
 return {sent:true,eventId};
}
function constantTime(a,b){
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
async function validSignature(data,signature,secret){
 if(!secret||!signature||!data)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(JSON.stringify(data)));
 const hex=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
 return constantTime(hex,clean(signature,128).toLowerCase());
}
async function webhook(req,env,origin){
 const body=await req.json().catch(()=>null);
 if(!body||!await validSignature(body.data,body.signature,env.VELANI_WEBHOOK_SECRET))
  return reply({success:false,message:"Assinatura invalida"},401,origin);
 if(body.event!=="transaction.paid")return reply({success:true,received:true},200,origin);
 const reference=clean(body.data?.externalId,160);
 const o=await order(env,reference);
 if(!o||o.transactionId!==body.data?.id)return reply({success:false,message:"Transacao nao reconhecida"},422,origin);
 const result=await purchase(env,reference);
 const retry=["TIKTOK_API_ERROR","TIKTOK_TOKEN_NOT_CONFIGURED","KV_NOT_CONFIGURED"].includes(result.reason);
 return reply({success:!retry,received:true,...result},retry?503:200,origin);
}
export default {async fetch(req,env){
 const origin=allowedOrigin(req,env);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(origin==="null"&&req.headers.get("Origin"))return reply({success:false,message:"Origem nao permitida"},403,origin);
 const path=new URL(req.url).pathname;
 try{
 if(req.method==="POST"&&path==="/api/create-pix")return await create(req,env,origin);
 if(req.method==="GET"&&path==="/api/status-pix")return await status(req,env,origin);
 if(req.method==="POST"&&path==="/api/tiktok-purchase"){
 const b=await req.json().catch(()=>null),ref=clean(b?.paymentId||b?.order_id,160);
 if(!ref)return reply({success:false,message:"paymentId obrigatorio"},400,origin);
 return reply({success:true,...await purchase(env,ref,{ip:req.headers.get("CF-Connecting-IP"),user_agent:req.headers.get("User-Agent"),page_url:b.page_url})},200,origin);
 }
 if(req.method==="POST"&&path==="/api/velani-webhook")return await webhook(req,env,origin);
 return reply({success:false,message:"Rota nao encontrada"},404,origin);
 }catch(e){console.error("Worker error",e?.message);return reply({success:false,message:"Erro na integracao de pagamentos"},502,origin)}
}};