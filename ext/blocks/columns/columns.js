import { div } from '../../scripts/dom-helpers.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Feature card variation
  if (block.classList.contains('columns-feature-card')) {
    const cards = [...block.firstElementChild.children];
    cards.forEach((card) => {
      const [_title, thumbnail, description, ...button] = [...card.children];
      const img = thumbnail?.querySelector('img');
      if (img) {
        if (!img.hasAttribute('alt') || img.alt.trim() === '') {
          img.alt = 'Default Alt';
        }

        if (img.src && img.src.trim() !== '' && !img.src.includes('error')) {
          thumbnail.classList.add('columns-feature-card-thumbnail');
        } else if (img.src.includes('error')) {
          thumbnail.classList.add('menulist-img');
        }
      }
      description?.classList.add('columns-feature-card-description');

      if (!description || button.length === 0) return;

      const cardContent = div({ class: 'columns-feature-card-content' }, description, ...button);
      card.appendChild(cardContent);

      moveInstrumentation(description, cardContent);

      const buttonContainer = div({ class: 'columns-feature-card-button-container' });
      const titleId = _title?.id || '';
      if (titleId) {
        buttonContainer.setAttribute('aria-labelledby', titleId);
      }
      buttonContainer.append(...button);
      cardContent.appendChild(buttonContainer);
    });
  }

  // List navigation card variation
  if (block.classList.contains('knowledge-card')) {
  const cards = [...block.firstElementChild.children];

  cards.forEach((card) => {
    card.classList.add('knowledge-item');

    const picture = card.querySelector('picture');
    if (!picture) return;

    card.classList.add('teaser');

    let thumbnail;
    let _title = null;
    let titleIndex = -1;
    const webtopic = [];
    const description = [];
    const button = [];

    const allChildren = [...card.children];

    // === Find title ===
    allChildren.forEach((el, idx) => {
      if (!_title && /^H[1-6]$/.test(el.tagName)) {
        _title = el;
        titleIndex = idx;
      }

      if (!_title && el.tagName === 'DIV' && el.getAttribute('data-aue-type') === 'richtext') {
        [...el.children].forEach((child) => {
          if (!_title && /^H[1-6]$/.test(child.tagName)) {
            _title = child;
            titleIndex = idx;
          }
        });
      }
    });

    allChildren.forEach((el, idx) => {
      if (el.tagName === 'P' && el.querySelector('picture')) {
        thumbnail = el;
      } else if (el.tagName === 'P' && idx < titleIndex) {
        webtopic.push(el);
      } else if (el.tagName === 'P' && el.querySelector('a') && !el.querySelector('h1, h2, h3, h4, h5, h6')) {
        button.push(el);
      } else if (el.tagName === 'P' && idx > titleIndex) {
        description.push(el);
      }
    });

    // ✅ Wrap picture with link if title contains <a>
    const link = _title?.querySelector('a')?.href;
    if (link && thumbnail && picture) {
      const wrapperLink = document.createElement('a');
      wrapperLink.href = link;
      wrapperLink.setAttribute('aria-hidden', 'true');
      wrapperLink.classList.add('teaser-img-link');

      picture.replaceWith(wrapperLink);
      wrapperLink.appendChild(picture);
    }

    thumbnail?.classList.add('cmp-image');
    _title?.classList.add('cmp-teaser__title');
    webtopic.forEach((el) => el.classList.add('cmp-webtopic'));
    description.forEach((el) => el.classList.add('cmp-teaser__description'));
    button.forEach((el) => el.classList.add('cmp-teaser__action-container'));

    if (!_title || description.length === 0 || button.length === 0) return;

    const cardTopContent = div({ class: 'cmp-teaser__content-wrapper' }, ...webtopic, _title, ...description);
    const cardContent = div({ class: 'cmp-teaser__content' }, cardTopContent, ...button);

    card.appendChild(cardContent);

    moveInstrumentation(_title, cardContent);
    webtopic.forEach((el) => moveInstrumentation(el, cardContent));
    description.forEach((el) => moveInstrumentation(el, cardContent));
    button.forEach((el) => moveInstrumentation(el, cardContent));
  });
}

  // News Banner Bottom Variation
  if (block.classList.contains('columns-news-banner-bottom')) {
    const childComponents = [...block.firstElementChild.children];
    childComponents.forEach((childComponent, index) => {
      const allChildren = [...childComponent.children];
      if (index === 0) {
        const contentWrapper = div({ class: 'columns-news-banner-bottom-left' });
        childComponent.appendChild(contentWrapper);
        allChildren.forEach((el) => {
          if (!/^H[1-6]$/.test(el.tagName)) {
            contentWrapper.appendChild(el);
            moveInstrumentation(el, contentWrapper);
          }
        });
      } else {
        childComponent.classList.add('columns-news-banner-bottom-right');
      }
    });
  }
}
