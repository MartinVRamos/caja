import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } 
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PRODUCTS = [
  { name: "Empanadas de queso (5)", cat: "Comida", price: 2000 },
  { name: "Papas fritas", cat: "Comida", price: 2000 },
  { name: "Completo italiano", cat: "Comida", price: 2000 },
  { name: "Sopaipilla", cat: "Comida", price: 300 },
  { name: "Trozo de queque", cat: "Comida", price: 1500 },
  { name: "Café", cat: "Bebestibles", price: 1000 },
  { name: "Vaso de bebida", cat: "Bebestibles", price: 500 },
  { name: "Vino navegado", cat: "Bebestibles", price: 1500 },
  { name: "Té", cat: "Bebestibles", price: 1000 },
  { name: "Cartón de Bingo", cat: "Bingo", price: 2000 }
];
const money = n =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(n);
let box = 0;
let pay = "Efectivo";
let cart = [];
let sales = [];
let unsub = null;
const $ = s => document.querySelector(s);
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  setTimeout(() => {
    $("#toast").style.display = "none";
  }, 1800);
}
function show(id) {
  ["home", "cashier", "admin"].forEach(x => {
    $("#" + x).classList.toggle("hidden", x !== id);
  });
}
/* =========================
   MENÚ
========================= */
function renderMenu() {
  let list;
  if (box === 1) {
    list = PRODUCTS;
  } else {
    list = PRODUCTS.filter(p => p.name === "Cartón de Bingo");
  }
  const comida = list.filter(p => p.cat === "Comida");
  const bebidas = list.filter(p => p.cat === "Bebestibles");
  const bingo = list.filter(p => p.cat === "Bingo");
  let html = "";
  if (comida.length) {
    html += `
      <div class="menu-section">
        <h3>🍔 Comida</h3>
        <div class="menu">
          ${renderProducts(comida)}
        </div>
      </div>
    `;
  }
  if (bebidas.length) {
    html += `
      <div class="menu-section">
        <h3>🥤 Bebestibles</h3>
        <div class="menu">
          ${renderProducts(bebidas)}
        </div>
      </div>
    `;
  }
  if (bingo.length) {
    html += `
      <div class="menu-section">
        <h3>🎟️ Bingo</h3>
        <div class="menu">
          ${renderProducts(bingo)}
        </div>
      </div>
    `;
  }
  $("#menu").innerHTML = html;
  document.querySelectorAll(".item").forEach(button => {
    button.onclick = () => {
      const product = PRODUCTS.find(
        p => p.name === button.dataset.name
      );
      cart.push(product);
      renderCart();
    };
  });
}
function renderProducts(products) {
  return products.map(p => `
    <button class="item" data-name="${p.name}">
      <b>${p.name}</b>
      <strong>${money(p.price)}</strong>
    </button>
  `).join("");
}
/* =========================
   CARRITO
========================= */
function renderCart() {
  const total = cart.reduce(
    (sum, product) => sum + product.price,
    0
  );
  $("#cartTotal").textContent = money(total);
  $("#sellBtn").disabled = cart.length === 0;
  if (!cart.length) {
    $("#cart").innerHTML = `
      <small>Venta vacía. Selecciona productos.</small>
    `;
    return;
  }
  $("#cart").innerHTML = cart.map((product, index) => `
    <div class="cartrow">
      <span>${product.name}</span>
      <b>${money(product.price)}</b>
      <button
        class="remove-item"
        data-index="${index}"
        title="Eliminar"
      >
        🗑️
      </button>
    </div>
  `).join("");
  document.querySelectorAll(".remove-item").forEach(button => {
    button.onclick = () => {
      const index = Number(button.dataset.index);
      cart.splice(index, 1);
      renderCart();
    };
  });
}
/* =========================
   REGISTRAR VENTA
========================= */
async function register() {
  if (!cart.length) return;
  try {
    await addDoc(collection(db, "ventas"), {
      box,
      payment: pay,
      items: cart.map(product => ({
        name: product.name,
        price: product.price
      })),
      total: cart.reduce(
        (sum, product) => sum + product.price,
        0
      ),
      createdAt: serverTimestamp()
    });
    toast("Venta registrada ✓");
    // LIMPIAR CARRITO AUTOMÁTICAMENTE
    cart = [];
    renderCart();
  } catch (e) {
    console.error(e);
    toast("No se pudo registrar la venta");
  }
}
/* =========================
   CANJE
========================= */
async function canje() {
  const code = $("#canjeCode").value.trim();
  if (!code) return;
  try {
    await addDoc(collection(db, "canjes"), {
      box,
      code,
      createdAt: serverTimestamp()
    });
    $("#canjeCode").value = "";
    toast("Canje registrado ✓");
  } catch (e) {
    console.error(e);
    toast("No se pudo registrar el canje");
  }
}
/* =========================
   ADMINISTRACIÓN
========================= */
function renderAdmin() {
  const total = sales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const cash = sales
    .filter(sale => sale.payment === "Efectivo")
    .reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
  const card = total - cash;
  const bingos = sales.reduce(
    (sum, sale) =>
      sum +
      (sale.items || []).filter(
        item => item.name === "Cartón de Bingo"
      ).length,
    0
  );
  $("#stats").innerHTML = `
    <div class="stat">
      <span>Ventas totales</span>
      <b>${money(total)}</b>
    </div>
    <div class="stat">
      <span>💵 Efectivo</span>
      <b>${money(cash)}</b>
    </div>
    <div class="stat">
      <span>💳 Tarjeta</span>
      <b>${money(card)}</b>
    </div>
    <div class="stat">
      <span>🎟️ Bingos vendidos</span>
      <b>${bingos}</b>
    </div>
  `;
  let counts = {};
  sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      counts[item.name] =
        (counts[item.name] || 0) + 1;
    });
  });
  $("#productsStats").innerHTML =
    Object.entries(counts)
      .map(([name, quantity]) => `
        <div class="row">
          <span>${name}</span>
          <b>${quantity}</b>
        </div>
      `)
      .join("")
    || "<small>No hay ventas.</small>";
  $("#movements").innerHTML =
    sales
      .slice(0, 12)
      .map(sale => `
        <div class="row">
          <span>
            Caja ${sale.box} · ${sale.payment}
            <br>
            <small>
              ${(sale.items || [])
                .map(item => item.name)
                .join(", ")}
            </small>
          </span>
          <b>${money(sale.total || 0)}</b>
        </div>
      `)
      .join("")
    || "<small>No hay movimientos.</small>";
}
/* =========================
   CONEXIÓN FIREBASE
========================= */
function connect() {
  if (unsub) unsub();
  unsub = onSnapshot(
    query(
      collection(db, "ventas"),
      orderBy("createdAt", "desc")
    ),
    snap => {
      sales = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderAdmin();
    }
  );
}
/* =========================
   SELECCIÓN DE CAJA
========================= */
document.querySelectorAll(".box-card").forEach(button => {
  button.onclick = () => {
    box = Number(button.dataset.box);
    $("#boxTitle").textContent =
      `Caja ${box}`;
    $("#boxSubtitle").textContent =
      box === 1
        ? "Comida + Bingos"
        : "Bingos + Canjes";
    $("#canje").classList.toggle(
      "hidden",
      box !== 2
    );
    // IMPORTANTE:
    // Cada vez que entramos a una caja
    // comenzamos con carrito vacío.
    cart = [];
    show("cashier");
    renderMenu();
    renderCart();
  };
});
/* =========================
   BOTONES
========================= */
$("#backBtn").onclick = () => {
  cart = [];
  renderCart();
  show("home");
};
$("#adminBack").onclick = () =>
  show("home");
$("#adminBtn").onclick = () =>
  show("admin");
$("#sellBtn").onclick = register;
$("#canjeBtn").onclick = canje;
/* =========================
   FORMA DE PAGO
========================= */
document.querySelectorAll(".pay").forEach(button => {
  button.onclick = () => {
    pay = button.dataset.pay;
    document
      .querySelectorAll(".pay")
      .forEach(item =>
        item.classList.toggle(
          "active",
          item === button
        )
      );
  };
});
/* =========================
   INICIO
========================= */
connect();
renderAdmin();
