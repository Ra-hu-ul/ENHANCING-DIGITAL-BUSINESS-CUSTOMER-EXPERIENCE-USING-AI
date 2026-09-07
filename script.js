const $ = s => document.querySelector(s);
const messages = $("#messages");
let state = JSON.parse(localStorage.getItem("shopassist_state") || '{"messages":0,"anger":0,"escalations":0,"helpful":0}');
let context = { lastIntent: null };

// The dissertation describes a simple prototype that demonstrates basic AI functions,
// including recognising simple customer intentions and angry customers. This prototype
// therefore uses transparent, reproducible intent/sentiment rules rather than claiming
// production-level generative AI.
const intents = [
  {name:"greeting", keys:["hello","hi","hey","good morning","good afternoon"], answer:"Hello! I’m ShopAssist. I can help with products, orders, returns and customer support. What would you like help with?"},
  {name:"order", keys:["track","tracking","where is my order","order status","delivery","order"], answer:"I can help with order tracking. For this demonstration, open Orders and try SA-1001 or SA-1002. No real customer/order data is used."},
  {name:"returns", keys:["return","refund","exchange","send back"], answer:"I can provide general returns guidance. The exact policy belongs to the retailer; a production system would securely check eligibility and then guide the customer without requesting unnecessary sensitive information."},
  {name:"product", keys:["product","recommend","recommendation","choose","buy","which one","compare","feature"], answer:"I can provide basic product guidance using the demonstration products and their stated features. Open Product Assistant to compare them."},
  {name:"human", keys:["human","agent","person","representative","speak to someone","escalate"], answer:"Of course. Complex, sensitive, emotional or uncertain cases should be escalated to human support. I can guide you to that next step."},
  {name:"privacy", keys:["privacy","data","personal information","security","safe","confidential"], answer:"Trust is important in AI customer service. This prototype does not request, store or process sensitive personal information. A production system should use clear privacy, security and transparency controls."},
  {name:"speed", keys:["fast","speed","quick","wait","response time","slow"], answer:"AI chatbots can provide rapid responses and continuous availability. This prototype uses a short simulated processing delay to demonstrate response speed."},
  {name:"thanks", keys:["thank","thanks","thank you"], answer:"You’re welcome! If you need anything else, I’m here to help."}
];
const angerWords = ["angry","furious","terrible","worst","hate","useless","ridiculous","scam","disgusted","annoyed","frustrated","complaint","awful","not happy","very upset"];

function save(){ localStorage.setItem("shopassist_state", JSON.stringify(state)); updateMetrics(); }
function updateMetrics(){
  ["messages","anger","escalations","helpful"].forEach(k=>{
    const id="metric"+k.charAt(0).toUpperCase()+k.slice(1), el=$("#"+id); if(el) el.textContent=state[k];
  });
}
function add(text, sender="bot", rating=false){
  const row=document.createElement("div"); row.className="message "+sender;
  const b=document.createElement("div"); b.className="bubble";
  const content=document.createElement("div"); content.textContent=text; b.appendChild(content);
  if(sender==="bot" && rating){
    const actions=document.createElement("div"); actions.style.cssText="margin-top:8px;font-size:11px;color:#64748b";
    actions.innerHTML='<button data-rate="yes" style="border:0;background:none;cursor:pointer">👍 Helpful</button> <button data-rate="no" style="border:0;background:none;cursor:pointer">👎 Not helpful</button>';
    actions.querySelectorAll("button").forEach(x=>x.onclick=()=>{ if(x.dataset.rate==="yes") state.helpful++; save(); actions.textContent="Thanks for the feedback."; });
    b.appendChild(actions);
  }
  row.appendChild(b); messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
}
function typing(cb){
  const row=document.createElement("div"); row.className="message bot typing"; row.id="typing";
  row.innerHTML='<div class="bubble">ShopAssist is thinking…</div>'; messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
  setTimeout(()=>{row.remove();cb();},350);
}
function normalise(text){ return text.toLowerCase().replace(/[^a-z0-9\s?']/g," ").replace(/\s+/g," ").trim(); }
function scoreIntent(text){
  const t=normalise(text); const tokens=new Set(t.split(" ")); let best=null;
  intents.forEach(intent=>{
    let score=0;
    intent.keys.forEach(k=>{
      const key=normalise(k);
      if(t.includes(key)) score += key.includes(" ") ? 3 : 1;
      if(tokens.has(key)) score += 1;
    });
    if(score && (!best || score>best.score)) best={intent,score};
  });
  return best;
}
function detectAnger(text){
  const t=normalise(text); const hits=angerWords.filter(w=>t.includes(normalise(w)));
  return {detected:hits.length>0, hits};
}
function answer(text){
  state.messages++;
  const sentiment=detectAnger(text);
  const match=scoreIntent(text);
  context.lastIntent=match ? match.intent.name : null;
  if(sentiment.detected){
    state.anger++; state.escalations++; save();
    add("I’m sorry you’re having a frustrating experience. I understand that the issue is important. I can help with the basic customer-support process, but a complaint or emotionally sensitive case should be escalated to human support.\n\nPrototype detection: frustrated/angry language recognised ("+sentiment.hits.join(", ")+").", "bot", true);
    return;
  }
  if(match && match.intent.name==="human") state.escalations++;
  save();
  add(match ? match.intent.answer : "I’m not completely sure what you need. I can help with order tracking, returns, product guidance, privacy, response speed or human support. You can also use the quick-action buttons.", "bot", true);
}
function send(text){ if(!text.trim()) return; add(text.trim(),"user"); typing(()=>answer(text)); }

$("#chatForm").onsubmit=e=>{e.preventDefault(); const t=$("#userInput").value; $("#userInput").value=""; send(t);};
$("#clearBtn").onclick=()=>{messages.innerHTML=""; context={lastIntent:null}; add("Hello! I’m ShopAssist. This is a B2C e-commerce research prototype demonstrating basic customer interaction, intention recognition and frustration recognition. How can I help?");};

const quick=["Track my order","What is your returns policy?","Help me choose a product","I want human support","I have a privacy concern","The response is too slow"];
$("#quick").innerHTML=quick.map(x=>`<button type="button">${x}</button>`).join("");
$("#quick").querySelectorAll("button").forEach(b=>b.onclick=()=>send(b.textContent));

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active")); $("#"+b.dataset.view+"View").classList.add("active"); updateMetrics();
});

const orders={"SA-1001":{status:"Dispatched",eta:"Tomorrow"},"SA-1002":{status:"Out for delivery",eta:"Today"}};
$("#trackBtn").onclick=()=>{
  const id=$("#orderInput").value.trim().toUpperCase(), o=orders[id];
  $("#orderResult").innerHTML=o ? `<div class="order-card"><b>${id}</b><br>Status: ${o.status}<br>Estimated delivery: ${o.eta}<br><span>Demonstration order only — no real customer data.</span></div>` : '<div class="order-card">Demo order not found. Try SA-1001 or SA-1002.</div>';
};

const products=[
 {icon:"🎧",name:"AudioPro Headphones",tag:"Best for travel",price:"£79",features:["Noise reduction","Wireless","Long battery"]},
 {icon:"⌚",name:"FitTrack Watch",tag:"Best for activity",price:"£99",features:["Activity tracking","Water resistant","Smart notifications"]},
 {icon:"💻",name:"WorkLite Laptop",tag:"Best for work",price:"£699",features:["16GB memory","Fast SSD","Full HD display"]}
];
$("#productCards").innerHTML=products.map(p=>`<article class="product"><div class="icon">${p.icon}</div><span class="tag">${p.tag}</span><h3>${p.name}</h3><b>${p.price}</b><ul class="features">${p.features.map(f=>`<li>${f}</li>`).join("")}</ul><button type="button" onclick="send('Tell me about ${p.name}')">Ask chatbot</button></article>`).join("");

updateMetrics();
add("Hello! I’m ShopAssist. This is a B2C e-commerce research prototype. I can demonstrate basic customer interaction, simple intention recognition, frustration recognition, trust/privacy guidance and human escalation. How can I help?");
