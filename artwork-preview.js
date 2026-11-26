const artworkDialog = document.querySelector(".artwork-dialog");
const artworkContent = artworkDialog.querySelector(".artwork-dialog-content");
let artworkIsClosing = false;
const originalImages = new Map();

// Fetch and decode only the artwork the visitor is about to open.
const loadOriginal = (source) => {
    if (!originalImages.has(source)) {
        const image = new Image();
        image.decoding = "async";
        const ready = new Promise((resolve, reject) => {
            image.onload = async () => {
                try {
                    await image.decode();
                    resolve(image);
                } catch (error) { reject(error); }
            };
            image.onerror = reject;
            image.src = source;
        }).catch((error) => {
            originalImages.delete(source);
            throw error;
        });
        originalImages.set(source, ready);
    }
    return originalImages.get(source);
};

const closeArtwork = () => {
    if (!artworkDialog.open || artworkIsClosing) return;
    artworkIsClosing = true;
    artworkDialog.classList.add("is-closing");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
        artworkDialog.close();
        artworkDialog.classList.remove("is-closing");
        artworkIsClosing = false;
    }, reducedMotion ? 0 : 250);
};

document.querySelectorAll(".artwork-open").forEach((button) => {
    const card = button.closest(".artwork-card");
    const thumbnail = card.querySelector("img, .artwork-placeholder");
    const fullSource = thumbnail.dataset.fullSrc || card.dataset.fullSrc || thumbnail.src;
    let preloadTimer;
    const warmOriginal = () => {
        if (fullSource) loadOriginal(fullSource).catch(() => {});
    };
    button.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") preloadTimer = setTimeout(warmOriginal, 200);
    });
    button.addEventListener("pointerleave", () => clearTimeout(preloadTimer));
    button.addEventListener("focus", warmOriginal);
    button.addEventListener("click", () => {
        clearTimeout(preloadTimer);
        const preview = thumbnail.cloneNode(true);
        let artwork = preview;
        if (preview.tagName === "IMG") {
            preview.removeAttribute("srcset");
            preview.removeAttribute("loading");
            preview.className = "artwork-dialog-image";
            const imageWrap = document.createElement("div");
            imageWrap.className = "artwork-dialog-image-wrap";
            const lens = document.createElement("div");
            lens.className = "artwork-magnifier";
            lens.hidden = true;
            imageWrap.append(preview, lens);
            artwork = imageWrap;
            let original = null;
            let lastPointer = null;
            let resetTouchZoom = () => {};
            const touchZoom = navigator.maxTouchPoints > 0;
            if (touchZoom) {
                imageWrap.classList.add("has-touch-zoom");
                const pointers = new Map();
                let scale = 1, offsetX = 0, offsetY = 0;
                let gesture = null;
                resetTouchZoom = () => {
                    scale = 1;
                    offsetX = offsetY = 0;
                    pointers.clear();
                    gesture = null;
                    preview.style.transform = "";
                    imageWrap.classList.remove("has-touch-zoom");
                };
                const measure = () => {
                    const points = [...pointers.values()];
                    const a = points[0], b = points[1] || a;
                    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
                        distance: Math.hypot(a.x - b.x, a.y - b.y) };
                };
                const startGesture = () => {
                    gesture = pointers.size ? { ...measure(), scale, offsetX, offsetY } : null;
                };
                imageWrap.addEventListener("pointerdown", (event) => {
                    if (event.pointerType === "mouse") return;
                    imageWrap.classList.add("has-touch-zoom");
                    lens.hidden = true;
                    lastPointer = null;
                    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
                    imageWrap.setPointerCapture(event.pointerId);
                    startGesture();
                });
                imageWrap.addEventListener("pointermove", (event) => {
                    if (!pointers.has(event.pointerId) || !gesture) return;
                    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
                    const current = measure();
                    const bounds = imageWrap.getBoundingClientRect();
                    const limit = original ? Math.max(1, Math.min(4,
                        original.naturalWidth / preview.clientWidth,
                        original.naturalHeight / preview.clientHeight)) : 1;
                    scale = Math.min(limit, Math.max(1, gesture.distance > 0
                        ? gesture.scale * current.distance / gesture.distance : gesture.scale));
                    const ratio = scale / gesture.scale;
                    offsetX = current.x - bounds.left - (gesture.x - bounds.left - gesture.offsetX) * ratio;
                    offsetY = current.y - bounds.top - (gesture.y - bounds.top - gesture.offsetY) * ratio;
                    offsetX = Math.min(0, Math.max(bounds.width * (1 - scale), offsetX));
                    offsetY = Math.min(0, Math.max(bounds.height * (1 - scale), offsetY));
                    preview.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                });
                const release = (event) => {
                    pointers.delete(event.pointerId);
                    startGesture();
                };
                imageWrap.addEventListener("pointerup", release);
                imageWrap.addEventListener("pointercancel", release);
                imageWrap.addEventListener("lostpointercapture", release);
            }
            imageWrap.setAttribute("aria-busy", "true");
            imageWrap.classList.add("is-loading");

            const moveLens = (event) => {
                // Browsers report both a trackpad and a mouse as a mouse pointer.
                if (event.pointerType !== "mouse") return;
                if (touchZoom) resetTouchZoom();
                lastPointer = { clientX: event.clientX, clientY: event.clientY, pointerType: "mouse" };
                if (!original) return;
                const bounds = preview.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;
                const border = parseFloat(getComputedStyle(preview).borderLeftWidth);
                const width = bounds.width - border * 2;
                const height = bounds.height - border * 2;
                const x = event.clientX - bounds.left - border;
                const y = event.clientY - bounds.top - border;
                if (x < 0 || y < 0 || x > width || y > height) {
                    lens.hidden = true;
                    return;
                }
                // Magnify in CSS pixels: Retina density must not cancel the zoom.
                // Stop at the source dimensions rather than enlarging it indefinitely.
                const zoom = Math.min(2.5, Math.max(1,
                    Math.min(original.naturalWidth / width, original.naturalHeight / height)));
                lens.hidden = false;
                lens.style.left = `${x + border}px`;
                lens.style.top = `${y + border}px`;
                lens.style.backgroundSize = `${width * zoom}px ${height * zoom}px`;
                lens.style.backgroundPosition = `${lens.offsetWidth / 2 - x * zoom}px ${lens.offsetHeight / 2 - y * zoom}px`;
            };
            imageWrap.addEventListener("pointermove", moveLens);
            imageWrap.addEventListener("pointerdown", moveLens);
            imageWrap.addEventListener("pointerleave", () => { lens.hidden = true; lastPointer = null; });
            imageWrap.addEventListener("pointercancel", () => { lens.hidden = true; lastPointer = null; });
            imageWrap.addEventListener("pointerup", (event) => {
                if (event.pointerType !== "mouse") { lens.hidden = true; lastPointer = null; }
            });
            loadOriginal(fullSource).then((image) => {
                if (!preview.isConnected) return;
                original = image;
                preview.src = image.src;
                lens.style.backgroundImage = `url("${image.src}")`;
                if (lastPointer) requestAnimationFrame(() => {
                    if (lastPointer && preview.isConnected) moveLens(lastPointer);
                });
            }).catch(() => {
                // Keep the lightweight preview if the original cannot be fetched.
            }).finally(() => {
                imageWrap.setAttribute("aria-busy", "false");
                imageWrap.classList.remove("is-loading");
            });
        }
        const title = card.querySelector("h3").cloneNode(true);
        title.id = "artwork-preview-title";
        const details = Array.from(card.querySelectorAll(":scope > p"), (p) => p.cloneNode(true));
        const description = document.createElement("div");
        description.className = "artwork-dialog-description";
        description.append(title, ...details);
        artworkContent.replaceChildren(artwork, description);
        artworkDialog.showModal();
    });
});

artworkDialog.querySelector(".artwork-dialog-close").addEventListener("click", closeArtwork);
artworkDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeArtwork();
});
artworkDialog.addEventListener("click", (event) => {
    if (event.target !== artworkDialog) return;
    const bounds = artworkDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) closeArtwork();
});
