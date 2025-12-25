# Guia de Despliegue en Vercel

Para subir este proyecto a Vercel, sigue estos pasos:

## 1. Preparar el Repositorio
Asegúrate de que todos los cambios estén en GitHub:
```bash
git add .
git commit -m "Preparado para Vercel"
git push origin main
```

## 2. Configurar en Vercel
1. Ve a [Vercel](https://vercel.com/new).
2. Conecta tu cuenta de GitHub.
3. Importa el repositorio `VotoTrackFibsal`.
4. Vercel detectará automáticamente que es un proyecto **Vite**.

## 3. Variables de Entorno (Opcional)
Si en el futuro usas funciones de IA que requieran una clave, añade:
- `GEMINI_API_KEY`: Tu clave de Google AI Studio.

## 4. Desplegar
Haz clic en **Deploy** y ¡listo! Tu aplicación estará online en unos segundos.

---

### Notas de Configuración
- El archivo `vercel.json` ya está configurado para manejar las rutas de React correctamente.
- El comando de build es `npm run build`.
- El directorio de salida es `dist`.
