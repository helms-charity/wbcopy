import { div, p, h2, a, picture, source, img } from '../../scripts/dom-helpers.js';
import { isAuthoring, enforceSingleReferenceLimit } from '../../scripts/reference-limiter.js';

if (isAuthoring()) {
  enforceSingleReferenceLimit('image');
}

export default function decorate(block) {
  const [imageWrapper, altTextEl, hammerEl, titleEl, titlelinkEl, descEl, playIconEl] = [...block.children];

  let imageEl;
  const altText = altTextEl?.textContent.trim() || 'banner';
  const hammerText = hammerEl?.textContent.trim() || '';
  const titleText = titleEl?.textContent.trim() || '';
  const titlelink = titlelinkEl?.textContent.trim() || '';
  const descText = descEl?.innerHTML || '';
  const playIcon = playIconEl?.textContent.trim() === 'true';

  const pictureEl = imageWrapper.querySelector('picture');
  const linkEl = imageWrapper.querySelector('a');

  if (pictureEl) {
    const imgEl = pictureEl.querySelector('img');
    if (imgEl) {
      imgEl.setAttribute('alt', altText);
      imgEl.setAttribute('title', altText);
    }
    imageEl = pictureEl;
  } else if (linkEl) {
    const imageUrl = linkEl.href;

    imageEl = picture({},
      source({ media: '(min-width: 600px)', type: 'image/webp', srcset: imageUrl }),
      source({ type: 'image/webp', srcset: imageUrl }),
      source({ media: '(min-width: 600px)', srcset: imageUrl }),
      img({
        loading: 'eager',
        alt: altText,
        title: altText,
        src: imageUrl,
        width: '460',
        height: '460'
      })
    );
  }

  block.textContent = '';

  const descriptionContainer = p({ class: 'cmp-teaser__description' });
  descriptionContainer.innerHTML = descText;

  const titleTag = h2({ class: 'cmp-teaser__title-text' }, titleText);

  const titleLinkWrapper = titlelink
    ? a({ href: titlelink, class: 'cmp-teaser__title-link' }, titleTag)
    : titleTag;

  const imageLinkWrapper = titlelink && imageEl
    ? a({ href: titlelink, class: 'cmp-teaser__image-link' }, imageEl)
    : imageEl;

  const titleContainer = div({ class: 'cmp-teaser__title' }, titleLinkWrapper);

  const wrappedContent = div({ class: 'teaser-content-wrapper' },
    p({ class: 'cmp-teaser__pertitle' }, hammerText),
    titleContainer,
    descriptionContainer
  );

  const firstContainer = div({ class: 'first-container' }, wrappedContent);

  const secondContainer = div({ class: 'second-container' },
    div({ class: 'news-banner-img' }, imageLinkWrapper)
  );

  const sectionsContainer = div({ class: 'sections-container' },
    firstContainer,
    secondContainer
  );

  block.append(sectionsContainer);
  if (playIcon) { 
    const buttonContainers = block.querySelectorAll('p.button-container a');
    buttonContainers.forEach((btn) => {
      btn.insertAdjacentHTML('afterbegin', '<i class="lp lp-play"></i>');
    });
  }
}
