import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AvatarGen from './AvatarGen'
import { REC } from './sim/rec'

const gen = import.meta.env.DEV && new URLSearchParams(location.search).get('gen') === 'avatars'
if (REC) document.documentElement.classList.add('rec')
// ?rec&set=…: decorados del video orik-05-opinan (solo desarrollo, se carga aparte y no entra en la demo)
const SET = REC && new URLSearchParams(location.search).get('set')
const Sets = lazy(() => import('./rec/Sets'))

createRoot(document.getElementById('root')!).render(<StrictMode>{SET ? <Sets /> : gen ? <AvatarGen /> : <App />}</StrictMode>)
