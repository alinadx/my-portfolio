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

    // 3. Reveal messages in order, without changing their reserved layout or scrolling.
    const conversation = document.querySelector('.conversation');
    const showAll = document.querySelector('[data-show-all]');
    let controller;
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
        pending.forEach(reveal);
        conversation?.querySelectorAll('.typing-indicator').forEach(indicator => indicator.remove());
        conversation?.querySelectorAll('.is-revealed').forEach(message => message.classList.remove('is-revealed'));
        conversation?.classList.remove('is-playing');
        if (conversation) conversation.dataset.animation = 'complete';
        // Keep the control in place so finishing doesn't shift the conversation.
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

    async function playConversation() {
        controller = new AbortController();
        const signal = controller.signal;
        const exchanges = [...conversation.querySelectorAll('.exchange')];
        conversation.classList.add('is-playing');
        conversation.dataset.animation = 'playing';
        exchanges.forEach(exchange => {
            conceal(exchange);
            exchange.querySelectorAll('.message--incoming, .message-avatar, .reply-group > .message-sender').forEach(conceal);
        });
        try {
            for (const exchange of exchanges) {
                if (signal.aborted) return;
                reveal(exchange);
                exchange.querySelector('.message--outgoing').classList.add('is-revealed');
                if (!await pause(150, signal)) return;
                const reply = exchange.querySelector('.reply-group');
                reveal(reply.querySelector('.message-sender'));
                const dots = document.createElement('div');
                dots.className = 'typing-indicator';
                dots.setAttribute('aria-hidden', 'true');
                for (let i = 0; i < 3; i++) dots.append(document.createElement('span'));
                reply.append(dots);
                if (!await pause(450, signal)) return;
                dots.remove();
                for (const message of reply.querySelectorAll('.message--incoming')) {
                    reveal(message);
                    if (!await pause(150, signal)) return;
                }
                reveal(reply.querySelector('.message-avatar'));
            }
        } finally {
            // Cancellation and unexpected errors must never leave content hidden.
            finishConversation();
        }
    }

    if (conversation) {
        showAll.hidden = false;
        showAll.addEventListener('click', finishConversation);
        reducedMotion.addEventListener('change', event => {
            if (event.matches) finishConversation();
        });
        window.addEventListener('beforeprint', finishConversation);
        window.addEventListener('pagehide', finishConversation);
        window.addEventListener('error', finishConversation, { once: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) finishConversation();
        });
        if (reducedMotion.matches || window.location.hash) {
            finishConversation();
        } else {
            playConversation().catch(finishConversation);
        }
    }
})();
