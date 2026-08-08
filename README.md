# Caja Bingo — 2 cajas

Aplicación web para un bingo con dos cajas accesibles desde cualquier celular.

## Caja 1
- Comida
- Bebestibles
- Cartones de Bingo

## Caja 2
- Cartones de Bingo
- Canje de Bingo

Todas las ventas registran medio de pago: efectivo o tarjeta.

## Sincronización
La aplicación usa Firebase Firestore para compartir las ventas entre celulares en tiempo real.

## Configuración
1. Crea un proyecto en Firebase.
2. Agrega una aplicación Web.
3. Copia la configuración en `firebase-config.js`.
4. Crea Firestore Database.
5. Configura las reglas de seguridad antes de usarla públicamente.
6. Sube estos archivos a GitHub Pages.

No uses reglas de Firestore abiertas permanentemente en producción.
