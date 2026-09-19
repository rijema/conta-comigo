import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrandProvider } from './contexts/BrandContext.tsx'

const params = new URLSearchParams(window.location.search);
const requestedBrand = params.get("brand");
const brand =
  requestedBrand === "titia" || localStorage.getItem("brand") === "titia"
    ? "titia"
    : "autbot";

if (requestedBrand === "titia") {
  localStorage.setItem("brand", "titia");
}

document.body.dataset.brand = brand;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandProvider brand={brand}>
      <App />
    </BrandProvider>
  </StrictMode>,
)
