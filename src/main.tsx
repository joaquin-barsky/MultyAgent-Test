import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AvatarGen from './AvatarGen'

const gen = import.meta.env.DEV && new URLSearchParams(location.search).get('gen') === 'avatars'

createRoot(document.getElementById('root')!).render(<StrictMode>{gen ? <AvatarGen /> : <App />}</StrictMode>)
