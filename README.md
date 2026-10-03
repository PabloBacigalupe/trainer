# Trainer

Aplicación web (PWA, pensada para el móvil) para crear rutinas de entrenamiento y registrar
cada día los pesos, repeticiones y series de cada ejercicio. Inspirada en [Hevy](https://hevy.com/).

## Funcionalidades

- **Rutinas**: crea, edita, duplica y elimina rutinas con sus ejercicios, series, pesos y reps objetivo.
- **Registro de entrenamientos**: empieza una rutina o un entrenamiento vacío y marca cada serie al completarla.
  - Columna **«Anterior»** con lo que hiciste la última vez (toca para copiarlo).
  - Tipos de serie: normal, calentamiento (C), al fallo (F) y drop set (D).
  - **Temporizador de descanso** automático por ejercicio (±15 s, saltar, aviso sonoro y vibración).
  - Cronómetro, volumen y series en vivo; el entrenamiento se puede minimizar y continuar.
  - Al terminar, opción de actualizar la rutina con los valores del día.
- **Historial**: feed con todos los entrenamientos, detalle, edición y «guardar como rutina».
- **Récords personales** (mayor peso, 1RM estimado, mejor volumen por serie, más reps, mayor duración).
- **Biblioteca de ~80 ejercicios** filtrable por músculo y equipamiento, y ejercicios personalizados.
- **Estadísticas por ejercicio**: gráfico de progreso, récords e historial de sesiones.
- **Perfil**: gráfico semanal (duración, volumen, repeticiones), calendario de entrenamientos y totales.
- Exportar / importar los datos en JSON. Todo se guarda localmente en el navegador.

## Abrirla en el móvil

La app se publica automáticamente en **https://pablobacigalupe.github.io/trainer/** con cada push
(workflow `.github/workflows/deploy.yml`). Ábrela en el navegador del móvil y usa
«Añadir a pantalla de inicio» para tenerla como una app más.

Para activarlo la primera vez: en GitHub, *Settings → Pages → Build and deployment → Source:
GitHub Actions*, y vuelve a lanzar el workflow desde la pestaña *Actions*.

## Uso

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción en dist/
npm test          # tests unitarios
```

El build usa rutas relativas y `HashRouter`, así que `dist/` se puede publicar en cualquier
hosting estático (GitHub Pages, Netlify, etc.).
