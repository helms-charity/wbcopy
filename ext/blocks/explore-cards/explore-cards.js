import { div, span } from '../../scripts/dom-helpers.js';
import { processTags, getTaxonomy } from '../../scripts/utils.js';
import { CLASS_MAIN_HEADING } from '../../scripts/scripts.js';

const isMobile = window.matchMedia('(max-width: 767px)');

function createSlider(block) {
  const slider = block.querySelector('.explore-card-container');
  if (!slider || slider.classList.contains('explore-card-slider')) return;

  slider.classList.add('explore-card-slider');

  const itemList = [...block.querySelectorAll('.explore-card-slider > div')];
  const observerOptions = {
    rootMargin: '0px',
    threshold: 0.25,
  };

  slider.style.gridTemplateColumns = `repeat(${itemList.length}, 76%)`;

  const callBack = (entries) => {
    entries.forEach((entry) => {
      const { target } = entry;
      if (entry.intersectionRatio >= 0.25) {
        target.classList.remove('opacity');
        target.classList.add('active');
      } else {
        target.classList.remove('active');
        target.classList.add('opacity');
      }
    });
  };

  const observer = new IntersectionObserver(callBack, observerOptions);
  itemList.forEach((item) => observer.observe(item));
}

function destroySlider(block, buttonElementMobile) {
  const slider = block.querySelector('.explore-card-container');
  if (slider && slider.classList.contains('explore-card-slider')) {
    slider.classList.remove('explore-card-slider');
    slider.style.gridTemplateColumns = '';
  }
}

export default function decorate(block) {
  const isCardWithButton = block.classList.contains('card-with-button');
  let buttonElementMobile;

  if (isCardWithButton) {
    const [heading, button1, button2, ...cards] = [...block.children];
    const buttonsContainer = document.createElement('div');

    if (heading && button1 && button2) {
      const btn1 = button1.querySelector('.button-container');
      const btn2 = button2.querySelector('.button-container');
      const h2Element = heading.querySelector('h2');

      const button1Anchor = btn1?.querySelector('a');
      const button2Anchor = btn2?.querySelector('a');

      if (h2Element?.id) {
        if (button1Anchor) button1Anchor.setAttribute('aria-describedby', h2Element.id);
        if (button2Anchor) button2Anchor.setAttribute('aria-describedby', h2Element.id);
      }

      if (btn1) buttonsContainer.appendChild(btn1);
      if (btn2) buttonsContainer.appendChild(btn2);

      heading.appendChild(buttonsContainer);
      buttonElementMobile = buttonsContainer.cloneNode(true);

      button1.remove();
      button2.remove();
    }

    createCards(heading, cards);
  } else {
    const [heading, ...cards] = [...block.children];
    createCards(heading, cards);
  }

  function createCards(heading, cards) {
    if (!cards?.length) return;

    if (heading) heading.classList.add(CLASS_MAIN_HEADING);

    const cardsContainer = div({ class: 'explore-card-container' });

    cards.forEach(async (card) => {
      if (!card) return;

      const [imageContainer, altText, title, link, contentType, storyType, hammer] = card.children;
      card.classList.add('explore-card');

      imageContainer.querySelectorAll('p > picture').forEach((picture) => {
        const p = picture.parentElement;
        if (p && p.tagName === 'P') {
          p.replaceWith(picture); // removes <p>, keeps <picture>
        }
      });

      const imgElement = imageContainer?.querySelector('img');
       if (imgElement) {
                let alt = 'Default Alt';
                if(altText)
                {
                  alt = altText.textContent;
                }
                imgElement.setAttribute('alt', alt);
                imageContainer.className = 'card-img';
                altText.remove();

              }

      let anchorTag = null;
      if (link && title) {
        anchorTag = link.querySelector('a');
        if (anchorTag) {
          anchorTag.textContent = '';
          anchorTag.title = title.textContent;
          if (imageContainer) anchorTag.appendChild(imageContainer);
          anchorTag.className = 'card-link';
          title.className = 'card-title';
        }
      }

      const cardContent = div({ class: 'card-content' });

      const cType = contentType ? processTags(contentType.innerText, 'content-type') : null;
      if (['video', 'audio'].includes(cType)) {
        const cTypeIcon = div({ class: `card-icon icon-${cType}` });
        cardContent.append(cTypeIcon);
      }

      const STORY_TYPE = 'story-type';
      const storyDiv = div({ class: STORY_TYPE });

      if (hammer) {
        storyDiv.appendChild(span(hammer.textContent.trim()));
      }

      const sType = storyType ? await getTaxonomy(storyType.innerText, STORY_TYPE) : null;
      if (sType) {
        storyDiv.appendChild(span(sType));
      }

      cardContent.append(storyDiv);

      if (title) cardContent.append(title);

      card.textContent = '';
      if (anchorTag) {
        anchorTag.appendChild(cardContent);
        card.appendChild(anchorTag);
      }

      cardsContainer.append(card);
    });

    block.appendChild(cardsContainer);

    // Initial check
    if (isCardWithButton && isMobile.matches) {
      createSlider(block);
      if (buttonElementMobile) block.appendChild(buttonElementMobile);
    }

    // MatchMedia change listener
    isMobile.addEventListener('change', (event) => {
      if (event.matches && isCardWithButton) {
        createSlider(block);
        if (buttonElementMobile && !block.contains(buttonElementMobile)) {
          block.appendChild(buttonElementMobile);
        }
      } else {
        destroySlider(block, buttonElementMobile);
      }
    });

    // Fallback resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 767 && isCardWithButton) {
        createSlider(block);
        if (buttonElementMobile && !block.contains(buttonElementMobile)) {
          block.appendChild(buttonElementMobile);
        }
      } else {
        destroySlider(block, buttonElementMobile);
      }
    });
  }
}