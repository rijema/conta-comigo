import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrandProvider } from './contexts/BrandContext.tsx'

const brand = localStorage.getItem("brand") === "titia" ? "titia" : "autbot";
document.body.dataset.brand = brand;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandProvider brand={brand}>
      <App />
    </BrandProvider>
  </StrictMode>,
)
