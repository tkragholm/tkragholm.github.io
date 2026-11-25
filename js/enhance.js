// Small repairs to the generated markup:
// - tabi's copy buttons are divs, so they get keyboard focus and Enter/Space;
// - code, tables and figures that scroll sideways become focusable regions,
//   so keyboard users can scroll them in every browser, and get the class
//   "scrolls" (and "at-end" once scrolled to the end) for a fade cue;
// - the first cell of each table body row becomes a row header;
// - code lines carry their indentation, and break only between names, for
//   wrapped lines on phones;
// - tables are labelled for the stacked phone layout;
// - a series part's "Part N of M" line moves above its title;
// - on phones the contents list starts collapsed.
(() => {
    for (const button of document.querySelectorAll('.copy-code')) {
        button.tabIndex = 0;
        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                button.click();
            }
        });
    }

    // Each code line's leading whitespace, for the hanging indent of wrapped
    // lines on phones.
    for (const line of document.querySelectorAll('pre code .giallo-l')) {
        const indent = line.textContent.match(/^ */)[0].length;
        if (indent > 0) line.style.setProperty('--indent', `${indent}ch`);
    }

    // On phones, where long code lines wrap:
    // - a line's leading spaces go into a span that the phone layout hides,
    //   and padding indents the line instead, so a line that does not fit
    //   never wraps after its indentation and leaves an empty first line;
    //   the spaces stay in the text, so copying keeps them;
    // - a line may break after "::", ".", "(" and ",", between names rather
    //   than inside one.
    if (window.matchMedia('(max-width: 600px)').matches) {
        const breakAfter = /(?:::|[.(,])$/;
        for (const line of document.querySelectorAll('pre code .giallo-l')) {
            let remaining = line.textContent.match(/^ */)[0].length;
            const texts = [];
            const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) texts.push(walker.currentNode);
            for (const node of texts) {
                if (remaining === 0) break;
                const lead = node.textContent.match(/^ */)[0].length;
                const take = Math.min(remaining, lead);
                if (take === 0) break;
                const indent = document.createElement('span');
                indent.className = 'code-indent';
                indent.textContent = node.textContent.slice(0, take);
                node.textContent = node.textContent.slice(take);
                node.before(indent);
                remaining -= take;
                if (node.textContent.length > 0) break;
            }
            for (const node of texts) {
                const parts = node.textContent.split(/(?<=::|[.(,])/);
                if (parts.length < 2) continue;
                const frag = document.createDocumentFragment();
                parts.forEach((part, i) => {
                    if (i > 0) frag.append(document.createElement('wbr'));
                    frag.append(part);
                });
                node.replaceWith(frag);
            }
            for (const token of line.querySelectorAll('span:not(.code-indent)')) {
                if (breakAfter.test(token.textContent) && token.nextSibling) {
                    token.after(document.createElement('wbr'));
                }
            }
        }
    }

    const scrollers = [
        ...document.querySelectorAll('.e-content pre code'),
        ...document.querySelectorAll('.e-content table'),
        ...document.querySelectorAll('.e-content figure.chart:not(.margin)'),
    ];
    const names = { TABLE: 'Table', FIGURE: 'Figure', CODE: 'Code' };
    // A code block's cue goes on its pre, which does not scroll itself.
    const cueTarget = (el) => (el.tagName === 'CODE' ? el.parentElement : el);
    const markEnd = (el) => {
        cueTarget(el).classList.toggle('at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };
    const markScrollable = () => {
        for (const el of scrollers) {
            const scrolls = el.scrollWidth > el.clientWidth + 1;
            cueTarget(el).classList.toggle('scrolls', scrolls);
            if (scrolls) {
                el.tabIndex = 0;
                if (el.tagName !== 'FIGURE') el.setAttribute('role', 'region');
                el.setAttribute('aria-label', `${names[el.tagName]}, scrolls sideways`);
                markEnd(el);
            } else if (el.hasAttribute('aria-label')) {
                el.removeAttribute('tabindex');
                el.removeAttribute('role');
                el.removeAttribute('aria-label');
            }
        }
    };
    for (const el of scrollers) {
        el.addEventListener('scroll', () => markEnd(el), { passive: true });
    }
    markScrollable();
    window.addEventListener('resize', markScrollable, { passive: true });

    const details = document.querySelector('article .toc-details');
    if (details && window.matchMedia('(max-width: 699px)').matches) {
        details.open = false;
    }

    // Phones show each table row as a block; label every data cell with its
    // column heading so the block still reads.
    for (const table of document.querySelectorAll('.e-content table, main > section.body table')) {
        const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
        if (heads.length === 0) continue;
        for (const row of table.querySelectorAll('tbody tr')) {
            [...row.children].forEach((cell, i) => {
                if (i > 0 && heads[i]) cell.dataset.label = heads[i];
            });
        }
        table.classList.add('stack');
    }

    // The "Part 2 of 4" line goes above the part's title, where a reader looks
    // first.
    const intro = document.querySelector('.series-page-intro');
    const title = document.querySelector('.article-title');
    if (intro && title) {
        intro.classList.add('series-kicker');
        title.before(intro);
    }

    for (const td of document.querySelectorAll('.e-content table tbody tr > td:first-child, main > section.body table tbody tr > td:first-child')) {
        const th = document.createElement('th');
        th.scope = 'row';
        th.innerHTML = td.innerHTML;
        td.replaceWith(th);
    }
    for (const th of document.querySelectorAll('.e-content table thead th')) {
        th.scope = 'col';
    }
})();
