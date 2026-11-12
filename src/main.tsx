import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AvatarGen from './AvatarGen'
import { REC } from './sim/rec'

const gen = import.meta.env.DEV && new URLSearchParams(location.search).get('gen') === 'avatars'
if (REC) document.documentElement.classList.add('rec')

createRoot(document.getElementById('root')!).render(<StrictMode>{gen ? <AvatarGen /> : <App />}</StrictMode>)
