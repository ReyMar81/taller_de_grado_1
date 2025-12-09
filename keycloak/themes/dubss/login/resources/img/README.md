# Logo DUBSS

Coloca aquí el logo oficial de DUBSS con el nombre **`logo.png`** o **`logo.svg`**

## Ubicación exacta:

```
keycloak/themes/dubss/login/resources/img/logo.png
```

## Recomendaciones:

- **Formato:** PNG con fondo transparente (recomendado) o SVG
- **Tamaño:** Mínimo 300x300 px (se redimensionará automáticamente)
- **Nombre:** Debe llamarse exactamente `logo.png` o `logo.svg`

## Después de agregar el logo:

1. Reinicia Keycloak:

   ```bash
   docker-compose restart keycloak
   ```

2. Limpia la caché del navegador (Ctrl+Shift+Delete)

3. El logo aparecerá en el círculo blanco del panel izquierdo

Si no tienes el logo aún, se mostrará una "D" roja como placeholder.
