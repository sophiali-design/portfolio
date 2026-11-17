// GIFs that only play when scrolled into view (and restart each time).
(() => {
  const gifs = [...document.querySelectorAll("img.scroll-gif[data-gif]")];
  if (!gifs.length) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // keep the still frame
  const blobs = new Map();

  async function play(img) {
    const url = img.dataset.gif;
    try {
      if (!blobs.has(url)) blobs.set(url, fetch(url).then((r) => r.blob()));
      const blob = await blobs.get(url);
      if (!img.classList.contains("is-in-view")) return;
      if (img.dataset.objectUrl) URL.revokeObjectURL(img.dataset.objectUrl);
      const objectUrl = URL.createObjectURL(blob); // a fresh URL restarts the animation from frame one
      img.dataset.objectUrl = objectUrl;
      img.src = objectUrl;
    } catch {
      img.src = url;
    }
  }

  function stop(img) {
    if (!img.dataset.poster) return;
    img.src = img.dataset.poster;
    if (img.dataset.objectUrl) { URL.revokeObjectURL(img.dataset.objectUrl); delete img.dataset.objectUrl; }
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const img = entry.target;
      if (entry.isIntersecting && !img.classList.contains("is-in-view")) {
        img.classList.add("is-in-view");
        play(img);
      } else if (!entry.isIntersecting && img.classList.contains("is-in-view")) {
        img.classList.remove("is-in-view");
        stop(img);
      }
    }
  }, { threshold: 0.35 });

  gifs.forEach((img) => {
    img.dataset.poster = img.getAttribute("src");
    observer.observe(img);
  });
})();

// Full-colour videos with the same behaviour: play from the start when scrolled into view, stop when out.
(() => {
  const videos = [...document.querySelectorAll("video.scroll-video")];
  if (!videos.length) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // keep the still poster
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const v = entry.target;
      if (entry.isIntersecting) {
        if (v.paused) { try { v.currentTime = 0; } catch {} v.play().catch(() => {}); }
      } else if (!v.paused) {
        v.pause();
      }
    }
  }, { threshold: 0.35 });
  videos.forEach((v) => observer.observe(v));
})();

// TroShare demo: starts only when the viewer clicks play, with sound and controls.
(() => {
  const fig = document.querySelector(".troshare-demo");
  if (!fig) return;
  const video = fig.querySelector("video");
  const play = fig.querySelector(".troshare-play");
  const start = () => { fig.classList.add("is-playing"); video.controls = true; video.play().catch(() => {}); };
  play.addEventListener("click", start);
  video.addEventListener("click", () => { if (!fig.classList.contains("is-playing")) start(); });
  // pause when the project is closed or scrolled away
  new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && !video.paused) video.pause(); }), { threshold: 0 }).observe(video);
})();

// TroShare stats: count up when scrolled into view (replays each time the project opens)
(() => {
  const box = document.querySelector(".troshare-stats");
  if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  box.classList.add("js-anim");
  const nums = [...box.querySelectorAll("[data-count]")];
  const fmt = (n) => n.toLocaleString("en-US");
  nums.forEach((el) => (el.textContent = "1"));
  const run = () => {
    nums.forEach((el, i) => {
      const end = +el.dataset.count, dur = end > 100 ? 2200 : 1200, delay = i === 0 ? 650 : 950;
      el.textContent = "1";
      const t0 = performance.now() + delay;
      const tick = (now) => {
        const t = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        el.textContent = fmt(Math.max(1, Math.round(1 + (end - 1) * e)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };
  new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && !box.classList.contains("is-in")) { box.classList.add("is-in"); run(); }
    else if (!e.isIntersecting) { box.classList.remove("is-in"); nums.forEach((el) => (el.textContent = "1")); }
  }), { threshold: 0.35 }).observe(box);
})();
