document.querySelectorAll(".project-row").forEach((row) => {
    const cards = Array.from(row.children);
    let cardsFrame;
    let hoveredCard;

    row.addEventListener("pointerover", (event) => {
        if (event.pointerType === "touch") return;
        const card = event.target.closest("li");
        if (!card || !row.contains(card) || card === hoveredCard) return;
        hoveredCard?.classList.remove("is-pointer-hover");
        hoveredCard = card;
        hoveredCard.classList.add("is-pointer-hover");
    });
    row.addEventListener("pointerout", (event) => {
        if (event.pointerType === "touch" || !hoveredCard) return;
        if (event.relatedTarget && hoveredCard.contains(event.relatedTarget)) return;
        hoveredCard.classList.remove("is-pointer-hover");
        hoveredCard = undefined;
    });

    const updateCards = () => {
        cardsFrame = undefined;
        const bounds = row.getBoundingClientRect();
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const visibleWidth = Math.max(0, Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left));
            const visibleRatio = rect.width ? visibleWidth / rect.width : 1;
            const cardOpacity = 0.3 + 0.7 * Math.min(1, visibleRatio / 0.95);
            card.style.setProperty("--card-opacity", cardOpacity);
        });
    };

    const scheduleCardsUpdate = () => {
        if (cardsFrame === undefined) cardsFrame = requestAnimationFrame(updateCards);
    };

    new ResizeObserver(scheduleCardsUpdate).observe(row);
    updateCards();

    let hideTimer;
    let animationFrame;
    let opacity = 0;
    let targetOpacity = 0;

    const fadeTo = (target, duration) => {
        if (target === targetOpacity) return;
        targetOpacity = target;
        cancelAnimationFrame(animationFrame);
        const initialOpacity = opacity;
        const startedAt = performance.now();
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const update = (now) => {
            const progress = reducedMotion ? 1 : Math.min((now - startedAt) / duration, 1);
            const eased = progress * progress * (3 - 2 * progress);
            opacity = initialOpacity + (target - initialOpacity) * eased;
            row.style.setProperty("--scrollbar-opacity", opacity);
            if (progress < 1) animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
    };

    row.addEventListener("scroll", () => {
        scheduleCardsUpdate();
        fadeTo(1, 250);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            fadeTo(0, 400);
        }, 1500);
    }, { passive: true });
});
