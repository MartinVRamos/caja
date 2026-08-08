import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), db=getFirestore(app);
const PRODUCTS=[
{name:"Empanadas de queso (5)",cat:"Comida",price:2000},
{name:"Papas fritas",cat:"Comida",price:2000},
{name:"Completo italiano",cat:"Comida",price:2000},
{name:"Sopaipilla",cat:"Comida",price:300},
{name:"Trozo de queque",cat:"Comida",price:1500},
{name:"Café",cat:"Bebestibles",price:1000},
{name:"Vaso de bebida",cat:"Bebestibles",price:500},
{name:"Vino navegado",cat:"Bebestibles",price:1500},
{name:"Té",cat:"Bebestibles",price:1000},
{name:"Cartón de Bingo",cat:"Bingo",price:2000}
];
const money=n=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
let box=0,pay="Efectivo",cart=[],sales=[],unsub=null;
const $=s=>document.querySelector(s);
function toast(t){$("#toast").textContent=t;$("#toast").style.display="block";setTimeout(()=>$("#toast").style.display="none",1800)}
function show(id){["home","cashier","admin"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}
function renderMenu(){let list=box===1?PRODUCTS:PRODUCTS.filter(p=>p.name==="Cartón de Bingo");$("#menu").innerHTML=list.map((p)=>`<button class="item" data-name="${p.name}"><b>${p.name}</b><small>${p.cat}</small><strong>${money(p.price)}</strong></button>`).join("");document.querySelectorAll(".item").forEach(b=>b.onclick=()=>{cart.push(PRODUCTS.find(p=>p.name===b.dataset.name));renderCart()})}
function renderCart(){let total=cart.reduce((s,p)=>s+p.price,0);$("#cartTotal").textContent=money(total);$("#sellBtn").disabled=!cart.length;$("#cart").innerHTML=cart.length?cart.map(p=>`<div class="cartrow"><span>${p.name}</span><b>${money(p.price)}</b></div>`).join(""):"<small>Venta vacía. Selecciona productos.</small>"}
function connect(){if(unsub)unsub();unsub=onSnapshot(query(collection(db,"ventas"),orderBy("createdAt","desc")),snap=>{sales=snap.docs.map(d=>({id:d.id,...d.data()}));renderAdmin()})}
async function register(){if(!cart.length)return;try{await addDoc(collection(db,"ventas"),{box,payment:pay,items:cart.map(p=>({name:p.name,price:p.price})),total:cart.reduce((s,p)=>s+p.price,0),createdAt:serverTimestamp()});toast("Venta registrada ✓");cart=[];renderCart()}catch(e){toast("No se pudo registrar la venta")}}
async function canje(){let code=$("#canjeCode").value.trim();if(!code)return;try{await addDoc(collection(db,"canjes"),{box,code,createdAt:serverTimestamp()});$("#canjeCode").value="";toast("Canje registrado ✓")}catch(e){toast("No se pudo registrar el canje")}}
function renderAdmin(){let total=sales.reduce((s,x)=>s+(x.total||0),0),cash=sales.filter(x=>x.payment==="Efectivo").reduce((s,x)=>s+x.total,0),card=total-cash,bingos=sales.reduce((s,x)=>s+(x.items||[]).filter(i=>i.name==="Cartón de Bingo").length,0);$("#stats").innerHTML=`<div class="stat"><span>Ventas totales</span><b>${money(total)}</b></div><div class="stat"><span>💵 Efectivo</span><b>${money(cash)}</b></div><div class="stat"><span>💳 Tarjeta</span><b>${money(card)}</b></div><div class="stat"><span>🎟️ Bingos vendidos</span><b>${bingos}</b></div>`;let counts={};sales.forEach(s=>(s.items||[]).forEach(i=>counts[i.name]=(counts[i.name]||0)+1));$("#productsStats").innerHTML=Object.entries(counts).map(([n,q])=>`<div class="row"><span>${n}</span><b>${q}</b></div>`).join("")||"<small>No hay ventas.</small>";$("#movements").innerHTML=sales.slice(0,12).map(s=>`<div class="row"><span>Caja ${s.box} · ${s.payment}<br><small>${(s.items||[]).map(i=>i.name).join(", ")}</small></span><b>${money(s.total||0)}</b></div>`).join("")||"<small>No hay movimientos.</small>"}
document.querySelectorAll(".box-card").forEach(b=>b.onclick=()=>{box=Number(b.dataset.box);$("#boxTitle").textContent=`Caja ${box}`;$("#boxSubtitle").textContent=box===1?"Comida + Bingos":"Bingos + Canjes";$("#canje").classList.toggle("hidden",box!==2);show("cashier");renderMenu();renderCart()});
$("#backBtn").onclick=()=>show("home");$("#adminBack").onclick=()=>show("home");$("#adminBtn").onclick=()=>show("admin");$("#sellBtn").onclick=register;$("#canjeBtn").onclick=canje;
document.querySelectorAll(".pay").forEach(b=>b.onclick=()=>{pay=b.dataset.pay;document.querySelectorAll(".pay").forEach(x=>x.classList.toggle("active",x===b))});
connect();renderAdmin();