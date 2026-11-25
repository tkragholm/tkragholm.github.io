// Marks the contents links of the chapter being read, in the page's contents
// and in tabi's floating contents panel, and moves a thin progress bar at the
// top of the window. A chapter counts as being read once its heading has
// passed a quarter of the way down the window.
(() => {
    const links = new Map();
    for (const a of document.querySelectorAll('.toc-container a[href*="#"]')) {
        const id = decodeURIComponent(a.hash.slice(1));
        if (!links.has(id)) links.set(id, []);
        links.get(id).push(a);
    }
    if (links.size === 0) return;
    const headings = [...document.querySelectorAll('.e-content h2[id]')]
        .filter((h) => links.has(h.id));
    if (headings.length === 0) return;

    const bar = document.createElement('div');
    bar.id = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);

    let current = null;
    let queued = false;

    const update = () => {
        queued = false;
        // Progress through the text itself, so the bar is full where the text
        // ends rather than at the bottom of the footer.
        const text = document.querySelector('.e-content');
        const end = text ? text.getBoundingClientRect().bottom + window.scrollY - window.innerHeight : 0;
        const progress = end > 0 ? Math.min(1, Math.max(0, window.scrollY / end)) : 0;
        bar.style.setProperty('--progress', progress.toFixed(4));

        const line = window.innerHeight / 4;
        let active = null;
        for (const h of headings) {
            if (h.getBoundingClientRect().top > line) break;
            active = h;
        }
        const next = active ? links.get(active.id) : null;
        if (next === current) return;
        for (const a of current ?? []) {
            a.classList.remove('active');
            a.removeAttribute('aria-current');
        }
        for (const a of next ?? []) {
            a.classList.add('active');
            a.setAttribute('aria-current', 'location');
        }
        current = next;
    };

    const schedule = () => {
        if (!queued) {
            queued = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
})();
