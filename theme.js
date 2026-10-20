/* Run before the stylesheet to apply the saved theme before the first paint. */
(() => {
    let theme;
    try {
        theme = localStorage.getItem('portfolio-theme');
    } catch {
        // Private browsing or blocked storage still gets a working theme.
    }
    if (theme !== 'light' && theme !== 'dark') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
})();
