/* Progressive enhancement: the HTML remains the source of the page content. */
(() => {
    'use strict';

    // 1. Preferences and translations. Storage can be blocked without breaking the site.
    const root = document.documentElement;
    const languages = ['en', 'de', 'uk', 'ru'];
    const locales = { en: 'en-GB', de: 'de-DE', uk: 'uk-UA', ru: 'ru-RU' };
    const messages = window.PORTFOLIO_I18N || {};
    const read = key => {
        try { return localStorage.getItem(key); } catch { return null; }
    };
    const save = (key, value) => {
        try { localStorage.setItem(key, value); } catch { /* The in-memory choice still works. */ }
    };
    const hasTranslations = Boolean(messages.projects);
    let language = hasTranslations && languages.includes(read('portfolio-language')) ? read('portfolio-language') : 'en';
    let manualTheme = ['light', 'dark'].includes(read('portfolio-theme')) ? read('portfolio-theme') : null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // A shared clock keeps all nine tiles synchronized, including while settling.
    document.querySelectorAll('.projects-brand').forEach(brand => {
        let animations = [];
        let elapsed = 0;
        let previousTime;
        let frame;
        let stopAt = null;
        const applyTime = () => animations.forEach(animation => {
            animation.currentTime = elapsed;
        });
        const stop = () => {
            cancelAnimationFrame(frame);
            frame = undefined;
            previousTime = undefined;
        };
        const tick = time => {
            if (previousTime !== undefined) elapsed += time - previousTime;
            previousTime = time;
            if (stopAt !== null && elapsed >= stopAt) {
                elapsed = stopAt;
                applyTime();
                stop();
                return;
            }
            applyTime();
            frame = requestAnimationFrame(tick);
        };
        const start = () => {
            animations = Array.from(brand.querySelectorAll('.home-mark path'))
                .flatMap(path => path.getAnimations())
                .filter(animation => animation.animationName?.startsWith('home-tile-'));
            if (!animations.length || reducedMotion.matches) return;
            animations.forEach(animation => animation.pause());
            // Skip the stationary hold on re-entry; its end has the same grid layout.
            const step = Number(animations[0].effect.getTiming().duration) / 8;
            const progress = elapsed % step;
            if (progress >= step / 2) elapsed += step - progress;
            stopAt = null;
            applyTime();
            if (frame === undefined) frame = requestAnimationFrame(tick);
        };
        const settle = () => {
            if (!animations.length || frame === undefined) return;
            const step = Number(animations[0].effect.getTiming().duration) / 8;
            const progress = elapsed % step;
            stopAt = progress < step / 2 ? elapsed - progress + step / 2 : elapsed;
            if (stopAt === elapsed) stop();
        };
        brand.addEventListener('pointerenter', start);
        brand.addEventListener('pointerleave', settle);
        reducedMotion.addEventListener('change', () => {
            if (reducedMotion.matches) stop();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (stopAt !== null) {
                    elapsed = stopAt;
                    applyTime();
                }
                stop();
            } else if (brand.matches(':hover')) start();
        });
    });

    function translate(key) {
        const values = messages[key];
        return values?.[languages.indexOf(language)] || values?.[0];
    }

    function updateTime() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat(locales[language], {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
        });
        document.querySelectorAll('[data-current-time]').forEach(time => {
            time.dateTime = now.toISOString();
            time.textContent = formatter.format(now);
        });
        document.querySelectorAll('[data-current-year]').forEach(year => {
            year.textContent = String(now.getFullYear());
        });
        document.querySelectorAll('time[datetime]:not([data-current-time])').forEach(time => {
            if (!/^\d{4}-\d{2}$/.test(time.dateTime)) return;
            time.textContent = new Intl.DateTimeFormat(locales[language], {
                month: 'short', year: 'numeric', timeZone: 'UTC'
            }).format(new Date(time.dateTime + '-01T12:00:00Z'));
        });
    }

    // Shrink text-only bubbles to their longest rendered line plus padding.
    // Always measure at the original CSS width first, so resizing can grow them back.
    function fitMessageWidths() {
        const bubbles = [...document.querySelectorAll('.message')].filter(message =>
            message.classList.contains('message--outgoing') ||
            (message.classList.contains('message--incoming') &&
                [...message.children].every(child => child.tagName === 'P'))
        );
        bubbles.forEach(message => {
            message.classList.add('message--fit-text');
            message.style.removeProperty('width');
        });
        const widths = bubbles.map(message => {
            const surface = message.classList.contains('message--outgoing')
                ? message.querySelector('h3') : message;
            if (!surface) return null;
            const style = getComputedStyle(surface);
            const scale = surface.getBoundingClientRect().width / parseFloat(style.width) || 1;
            const paragraphs = surface === message ? [...message.children] : [surface];
            let longest = 0;
            for (const paragraph of paragraphs) {
                const range = document.createRange();
                range.selectNodeContents(paragraph);
                const lines = new Map();
                for (const rect of range.getClientRects()) {
                    const key = Math.round(rect.top);
                    const line = lines.get(key) || { left: rect.left, right: rect.right };
                    line.left = Math.min(line.left, rect.left);
                    line.right = Math.max(line.right, rect.right);
                    lines.set(key, line);
                }
                for (const line of lines.values()) longest = Math.max(longest, (line.right - line.left) / scale);
            }
            const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            return Math.min(parseFloat(getComputedStyle(message).width), Math.ceil(longest + padding) + 1);
        });
        bubbles.forEach((message, index) => {
            if (widths[index] > 0) message.style.width = widths[index] + 'px';
        });
    }

    let fitFrame;
    function scheduleMessageFit() {
        cancelAnimationFrame(fitFrame);
        fitFrame = requestAnimationFrame(fitMessageWidths);
    }
    window.addEventListener('resize', scheduleMessageFit);
    document.fonts?.ready.then(scheduleMessageFit);

    function applyLanguage(nextLanguage) {
        language = hasTranslations && languages.includes(nextLanguage) ? nextLanguage : 'en';
        root.lang = language;
        document.querySelectorAll('[data-i18n]').forEach(node => {
            const value = translate(node.dataset.i18n);
            if (value) node.textContent = value;
        });
        // Attribute translations are explicit: links, IDs, and markup cannot be overwritten.
        for (const attribute of ['aria-label', 'alt', 'content', 'title']) {
            document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(node => {
                const value = translate(node.getAttribute('data-i18n-' + attribute));
                if (value) node.setAttribute(attribute, value);
            });
        }
        document.querySelectorAll('[data-language]').forEach(select => { select.value = language; });
        updateTime();
        fitMessageWidths();
    }

    // 2. Theme controls share one state across every page.
    function applyTheme(theme) {
        root.dataset.theme = theme;
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.setAttribute('aria-checked', String(theme === 'dark'));
        });
        const color = document.querySelector('meta[name="theme-color"]');
        if (color) color.content = theme === 'dark' ? '#12111a' : '#ffffff';
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        button.hidden = false;
        button.addEventListener('click', () => {
            manualTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(manualTheme);
            save('portfolio-theme', manualTheme);
        });
    });
    document.querySelectorAll('[data-page-theme]').forEach(container => { container.hidden = false; });
    systemTheme.addEventListener('change', event => {
        if (!manualTheme) applyTheme(event.matches ? 'dark' : 'light');
    });
    applyTheme(manualTheme || (systemTheme.matches ? 'dark' : 'light'));

    applyLanguage(language);
    document.querySelectorAll('.language-control').forEach(control => { control.hidden = !hasTranslations; });
    document.querySelectorAll('.language-label').forEach(label => { label.hidden = hasTranslations; });
    document.querySelectorAll('[data-language]').forEach(select => {
        select.addEventListener('change', () => {
            finishConversation();
            applyLanguage(select.value);
            save('portfolio-language', language);
        });
    });
    window.addEventListener('storage', event => {
        if (event.key === 'portfolio-theme' || event.key === null) {
            manualTheme = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
            applyTheme(manualTheme || (systemTheme.matches ? 'dark' : 'light'));
        }
        if (event.key === 'portfolio-language' || event.key === null) {
            finishConversation();
            applyLanguage(event.newValue);
        }
    });
    window.setInterval(updateTime, 60_000);

    // Only intercept arrows when the row itself has focus, leaving links alone.
    document.querySelectorAll('.project-row').forEach(row => {
        row.addEventListener('keydown', event => {
            if (event.target !== row || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const step = row.firstElementChild?.getBoundingClientRect().width || row.clientWidth;
            const behavior = reducedMotion.matches ? 'auto' : 'smooth';
            if (event.key === 'Home' || event.key === 'End') {
                row.scrollTo({ left: event.key === 'Home' ? 0 : row.scrollWidth, behavior });
            } else {
                row.scrollBy({ left: (step + 28) * (event.key === 'ArrowLeft' ? -1 : 1), behavior });
            }
        });
    });

    // 3. Show typing dots for both sides as messages enter the viewport, without layout shifts.
    const conversation = document.querySelector('.conversation');
    const showAll = document.querySelector('[data-show-all]');
    const replyAvatars = new Map(
        Array.from(conversation?.querySelectorAll('.reply-group') || [], group =>
            [group, group.querySelector(':scope > .message-avatar')]
        ).filter(([, avatar]) => avatar)
    );
    let controller;
    let messageObserver;
    const pending = new Set();

    function conceal(node) {
        if (!node) return;
        node.classList.add('is-pending');
        node.inert = true;
        node.setAttribute('aria-hidden', 'true');
        pending.add(node);
    }

    function reveal(node) {
        if (!node) return;
        node.classList.remove('is-pending');
        node.inert = false;
        node.removeAttribute('aria-hidden');
        pending.delete(node);
        if (node.classList.contains('message')) node.classList.add('is-revealed');
    }

    function finishConversation() {
        controller?.abort();
        messageObserver?.disconnect();
        pending.forEach(reveal);
        replyAvatars.forEach((avatar, group) => {
            avatar.classList.remove('is-typing');
            avatar.hidden = false;
            group.append(avatar);
        });
        conversation?.querySelectorAll('.typing-indicator').forEach(indicator => indicator.remove());
        conversation?.querySelectorAll('.is-revealed').forEach(message => message.classList.remove('is-revealed'));
        conversation?.classList.remove('is-playing');
        if (conversation) conversation.dataset.animation = 'complete';
        markAllShown();
    }

    function markAllShown() {
        if (showAll) {
            showAll.disabled = true;
            showAll.setAttribute('data-i18n', 'allShown');
            showAll.textContent = translate('allShown') || 'All shown';
        }
    }

    function pause(milliseconds, signal) {
        return new Promise(resolve => {
            if (signal.aborted) return resolve(false);
            const timer = window.setTimeout(done, milliseconds);
            function done() {
                window.clearTimeout(timer);
                signal.removeEventListener('abort', done);
                resolve(!signal.aborted);
            }
            signal.addEventListener('abort', done, { once: true });
        });
    }

    function playConversation() {
        controller = new AbortController();
        const signal = controller.signal;
        const visible = new Set();
        const messages = new Map();
        let revealing = false;
        let activeTyping;
        conversation.classList.add('is-playing');
        conversation.dataset.animation = 'playing';
        replyAvatars.forEach(avatar => { avatar.hidden = true; });
        conversation.querySelectorAll('.reply-group > .message-sender').forEach(conceal);

        conversation.querySelectorAll('.message--outgoing, .message--incoming').forEach(message => {
            const slot = document.createElement('div');
            slot.className = 'message-slot';
            if (message.classList.contains('message--outgoing')) slot.classList.add('message-slot--outgoing');
            message.before(slot);
            slot.append(message);
            messages.set(slot, message);
            conceal(message);
        });

        function completeIfReady() {
            if (pending.size) return;
            messageObserver?.disconnect();
            conversation.dataset.animation = 'complete';
            conversation.classList.remove('is-playing');
            markAllShown();
        }

        function revealPassed() {
            if (signal.aborted || !pending.size) return;
            const passed = [...messages].filter(([slot, message]) =>
                pending.has(message) && slot.getBoundingClientRect().top < 0
            );
            const updatedReplies = new Set();
            passed.forEach(([slot, message]) => {
                if (activeTyping?.slot === slot) activeTyping.cancel();
                slot.querySelector('.typing-indicator')?.remove();
                reveal(message);
                message.classList.remove('is-revealed');
                visible.delete(slot);
                messageObserver?.unobserve(slot);
                const reply = message.closest('.reply-group');
                if (reply) {
                    reveal(reply.querySelector(':scope > .message-sender'));
                    updatedReplies.add(reply);
                }
            });
            updatedReplies.forEach(reply => {
                const avatar = replyAvatars.get(reply);
                if (!avatar) return;
                // Keep the avatar beside an answer currently being typed on screen.
                if (avatar.classList.contains('is-typing') &&
                    avatar.parentElement.querySelector('.message.is-pending')) return;
                avatar.hidden = false;
                avatar.classList.remove('is-typing');
                const lastShown = [...reply.querySelectorAll('.message--incoming:not(.is-pending)')].at(-1);
                const destination = reply.querySelector('.message--incoming.is-pending') ? lastShown?.parentElement : reply;
                destination?.append(avatar);
            });
            completeIfReady();
        }

        let scrollFrame;
        const checkScrollPosition = () => {
            if (scrollFrame !== undefined || signal.aborted || !pending.size) return;
            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = undefined;
                revealPassed();
            });
        };
        window.addEventListener('scroll', checkScrollPosition, { passive: true, signal });
        window.addEventListener('pageshow', checkScrollPosition, { signal });

        async function revealVisible() {
            if (revealing || signal.aborted) return;
            revealing = true;
            try {
                while (!signal.aborted) {
                    const next = [...messages].find(([slot, message]) => visible.has(slot) && pending.has(message));
                    if (!next) break;
                    const [slot, message] = next;
                    const dots = document.createElement('div');
                    dots.className = 'typing-indicator';
                    dots.setAttribute('aria-hidden', 'true');
                    for (let i = 0; i < 3; i++) dots.append(document.createElement('span'));
                    slot.append(dots);
                    const reply = message.closest('.reply-group');
                    reveal(reply?.querySelector(':scope > .message-sender'));
                    const avatar = replyAvatars.get(reply);
                    if (avatar) {
                        slot.append(avatar);
                        avatar.hidden = false;
                        avatar.classList.add('is-typing');
                    }
                    const typing = new AbortController();
                    const cancelTyping = () => typing.abort();
                    activeTyping = { slot, cancel: cancelTyping };
                    signal.addEventListener('abort', cancelTyping, { once: true });
                    // Replies already passed by the reader should not hold up visible ones.
                    if (slot.getBoundingClientRect().top >= 0) await pause(900, typing.signal);
                    signal.removeEventListener('abort', cancelTyping);
                    activeTyping = null;
                    dots.remove();
                    if (signal.aborted) return;
                    if (!pending.has(message)) continue;
                    reveal(message);
                    if (avatar) {
                        avatar.classList.remove('is-typing');
                        if (!reply.querySelector('.message--incoming.is-pending')) reply.append(avatar);
                    }
                    messageObserver.unobserve(slot);
                    visible.delete(slot);
                    if (!pending.size) {
                        completeIfReady();
                        break;
                    }
                    if (!await pause(120, signal)) return;
                }
            } catch {
                finishConversation();
            } finally {
                revealing = false;
            }
        }

        messageObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) visible.add(entry.target);
                else {
                    visible.delete(entry.target);
                    if (activeTyping?.slot === entry.target) activeTyping.cancel();
                }
            });
            revealPassed();
            void revealVisible();
        }, { rootMargin: '0px 0px -48px 0px', threshold: 0 });
        messages.forEach((message, slot) => messageObserver.observe(slot));
        revealPassed();
    }

    if (conversation) {
        if (showAll) {
            showAll.hidden = false;
            showAll.addEventListener('click', finishConversation);
        }
        reducedMotion.addEventListener('change', event => {
            if (event.matches) finishConversation();
        });
        window.addEventListener('beforeprint', finishConversation);
        window.addEventListener('pagehide', finishConversation);
        window.addEventListener('error', finishConversation, { once: true });
        if (reducedMotion.matches || !('IntersectionObserver' in window)) {
            finishConversation();
        } else {
            try { playConversation(); } catch { finishConversation(); }
        }
    }
})();
