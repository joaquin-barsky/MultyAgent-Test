// solo desarrollo: ?rec deja la escena limpia para grabar videos (sin interfaz, todos trabajando, cámara libre)
export const REC = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('rec')
