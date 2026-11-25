const artworkDialog = document.querySelector(".artwork-dialog");
const artworkContent = artworkDialog.querySelector(".artwork-dialog-content");
let artworkIsClosing = false;

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
    button.addEventListener("click", () => {
        const card = button.closest(".artwork-card");
        const preview = card.querySelector("img, .artwork-placeholder").cloneNode(true);
        let artwork = preview;
        if (preview.tagName === "IMG") {
            preview.src = card.dataset.fullSrc || preview.src;
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

            const moveLens = (event) => {
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
                const zoom = 2.5;
                lens.hidden = false;
                lens.style.left = `${x + border}px`;
                lens.style.top = `${y + border}px`;
                lens.style.backgroundImage = `url("${preview.src}")`;
                lens.style.backgroundSize = `${width * zoom}px ${height * zoom}px`;
                lens.style.backgroundPosition = `${lens.offsetWidth / 2 - x * zoom}px ${lens.offsetHeight / 2 - y * zoom}px`;
            };
            imageWrap.addEventListener("pointermove", moveLens);
            imageWrap.addEventListener("pointerleave", () => { lens.hidden = true; });
            imageWrap.addEventListener("pointerup", (event) => {
                if (event.pointerType !== "mouse") lens.hidden = true;
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
