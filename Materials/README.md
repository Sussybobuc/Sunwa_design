# Materials — media for the Sunwa Design website

This folder holds **real photos and videos** for the site. It's served publicly at `/materials/...`
(e.g. `Materials/Insurance.webp` → `https://<site>/materials/Insurance.webp`) with a 30-day browser
cache. Drop new media here; follow the checklist below so pages stay fast and light.

> The site is on Azure App Service (Free tier) and a lot of visitors are on mobile data. Heavy,
> unoptimized media is the #1 thing that makes a small site feel slow.

## Before you add an image
- **Format** — save as **WebP** (or **AVIF** for even smaller). Don't upload raw camera JPEG/PNG.
  Target: photos well under ~300 KB; decorative/thumbnail images much less.
- **Dimensions** — downscale to the size it's actually displayed at. A hero rarely needs to be wider
  than ~1920px; cards/thumbnails far less. Don't ship 4000px photos.
- **When used in a page**, always set **`width` and `height`** (or `aspect-ratio`) on the `<img>` so
  the layout doesn't jump while it loads.
- **Lazy-load** below-the-fold images: `loading="lazy" decoding="async"`. Keep the single most
  important above-the-fold image (the LCP/hero) eager (no `lazy`).
- For broad format safety or multiple sizes, use **`<picture>`** with an AVIF → WebP → JPEG fallback,
  and **`srcset` + `sizes`** so phones download a smaller file than desktops:
  ```html
  <picture>
    <source type="image/avif" srcset="/materials/foo-800.avif 800w, /materials/foo-1600.avif 1600w" sizes="(max-width:768px) 100vw, 800px">
    <source type="image/webp" srcset="/materials/foo-800.webp 800w, /materials/foo-1600.webp 1600w" sizes="(max-width:768px) 100vw, 800px">
    <img src="/materials/foo-1600.jpg" alt="…" width="1600" height="900" loading="lazy" decoding="async">
  </picture>
  ```

## Before you add a video
- Prefer **short clips**, **MP4 (H.264)**, reasonably compressed.
- Use **`preload="none"`** and a lightweight **`poster`** image so the video only downloads when the
  user plays it.
- **Don't autoplay** heavy video on mobile.
  ```html
  <video controls preload="none" poster="/materials/clip-poster.webp" width="1280" height="720">
    <source src="/materials/clip.mp4" type="video/mp4">
  </video>
  ```

## Caching / CDN
- `/materials` is already served with a long cache header (`maxAge: 30d`) — repeat visitors don't
  re-download unchanged files. If you replace a file, give it a **new filename** so browsers fetch the
  new version.
- **Later, if galleries get heavy:** front the App Service with **Azure Front Door / CDN** and serve
  media with a long, immutable cache. Not needed yet.

## Quick conversion tips
- `cwebp -q 80 input.jpg -o output.webp` (WebP) · `avifenc input.jpg output.avif` (AVIF)
- Or use Squoosh (squoosh.app) in the browser for one-off conversions.
