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

### Heavy videos (≈100 MB+) — DON'T self-host them here
The site runs on **Azure App Service Free tier**. Serving a 100 MB+ MP4 from `/materials` will be slow,
burn the tier's bandwidth, and can't adapt quality to the viewer's connection. **Host big videos on
YouTube or Vimeo** and embed them. Upload the file there, then embed with a **lightweight click-to-load
facade** — show only a poster image + play button; the heavy player iframe loads *after* the user clicks,
so the page stays fast and nothing downloads until someone actually watches.

```html
<!-- Facade: poster loads instantly; clicking swaps in the YouTube/Vimeo iframe -->
<div class="video-embed" data-video-embed
     data-src="https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=1"
     style="position:relative;aspect-ratio:16/9;max-width:100%;cursor:pointer">
  <img src="/materials/clip-poster.webp" alt="Xem video giới thiệu"
       width="1280" height="720" loading="lazy" decoding="async"
       style="width:100%;height:100%;object-fit:cover">
  <button type="button" aria-label="Phát video"
          style="position:absolute;inset:0;margin:auto;width:68px;height:48px;border:0;border-radius:12px;background:rgba(0,0,0,.6);color:#fff;font-size:22px">▶</button>
</div>
<script>
  document.querySelectorAll('[data-video-embed]').forEach(function (box) {
    box.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.dataset.src;
      f.title = 'Video';
      f.allow = 'accelerated-motion; autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      box.innerHTML = '';
      box.appendChild(f);
    }, { once: true });
  });
</script>
```
- Use `youtube-nocookie.com` (privacy) or Vimeo's `player.vimeo.com/video/ID` embed URL.
- For a real page we'd move that inline `<script>` into a small init in `js/main.js` and the styles into
  `css/tailwind.css` (custom class names only — never Tailwind utility names in raw CSS) rather than
  inline. Ask before wiring it in so it stays consistent with the rest of the site.

### Short clips only — self-hosting is OK if the file is small
- Prefer **short clips**, **MP4 (H.264)**, hard-compressed (lower bitrate/resolution).
- Use **`preload="none"`** and a lightweight **`poster`** image so the video only downloads when the
  user plays it.
- **Don't autoplay** video on mobile.
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
