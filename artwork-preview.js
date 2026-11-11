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
        if (preview.tagName === "IMG") {
            preview.src = card.dataset.fullSrc || preview.src;
            preview.removeAttribute("srcset");
        }
        const title = card.querySelector("h3").cloneNode(true);
        title.id = "artwork-preview-title";
        const details = Array.from(card.querySelectorAll(":scope > p"), (p) => p.cloneNode(true));
        const description = document.createElement("div");
        description.className = "artwork-dialog-description";
        description.append(title, ...details);
        artworkContent.replaceChildren(preview, description);
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
