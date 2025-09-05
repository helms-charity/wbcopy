import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createSlider from '../../scripts/slider.js';
import { isAuthoring} from '../../scripts/reference-limiter.js';


export default function decorate(block) {

  const isBottomCarousel = block.classList.contains('carousel-with-button');

  let i = 0;
  const slider = document.createElement('ul');
  // Only create leftContent when we actually need it
  const leftContent = document.createElement('div');
  const buttonMobileElement = document.createElement('div');
  let h2Element;

  [...block.children].forEach((row) => {
    if (i > 1) {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);

      [...li.children].forEach((div) => {
        div.className = (div.children.length === 1 && div.querySelector('picture'))
          ? 'cards-card-image'
          : 'cards-card-body';
      });
      slider.append(li);
    } else {
        const contentEl = row;
        if (contentEl) {
          if(contentEl.id)
          {
             h2Element = contentEl.id;
          }
          const button = contentEl.querySelector('a.button, button');
          if (button) {
               button.setAttribute('aria-describedby', h2Element);
               buttonMobileElement.appendChild(button.cloneNode(true));
          }

          // Append the rest of the content to leftContent
          leftContent.append(contentEl);
        }

        leftContent.className = isBottomCarousel ? 'main-heading' : 'default-content-wrapper';
      }
    i += 1;
  });

  // Optimise pictures
  slider.querySelectorAll('picture > img').forEach((img) => {
    let alt = img.alt;
    if(!alt)
    {
        alt = 'Default Alt';
    }
    if (!img.src.includes("delivery-")) {
    const optimizedPic = createOptimizedPicture(img.src, alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
    }
  });

  /* ---------- extra wrapping only for bottom carousel ---------- */
  if (isBottomCarousel) {
    slider.querySelectorAll('li').forEach((li) => {
      const imgDiv  = li.querySelector('.cards-card-image');
      const bodyDiv = li.querySelector('.cards-card-body');
      const oldLink = bodyDiv?.querySelector('a');
      if (!imgDiv || !bodyDiv || !oldLink) return;

      const a = document.createElement('a');
      a.href = oldLink.href;
      a.title = oldLink.title;
      moveInstrumentation(oldLink, a);

      const newBody = document.createElement('div');
      newBody.className = 'cards-card-body';
      const p = document.createElement('p');
      p.className = 'button-container';
      p.textContent = oldLink.textContent;
      newBody.appendChild(p);

      a.append(imgDiv, newBody);
      li.textContent = '';
      li.appendChild(a);
    });
  }
  /* ------------------------------------------------------------- */

  // Replace original block content
  block.textContent = '';
  if(!isBottomCarousel)
  {
      if (leftContent) {
        block.parentNode.parentNode.prepend(leftContent);
      }
  }
  else
  {
    block.appendChild(leftContent);
  }
  block.append(slider);
  if(isBottomCarousel)
  {
   block.appendChild(buttonMobileElement);
  }
  createSlider(block);
    const cardList = block.querySelector('ul');
    cardList.setAttribute('tabindex', '-1');
    const cards = cardList.querySelectorAll('li');
    const MAX_CARDS = 7;
    if (cards.length > MAX_CARDS) {

           if (isAuthoring()) {
              const warning = document.createElement('div');
              warning.textContent = `⚠️ Only 7 cards are allowed. Extra cards have been ignored.`;
              warning.style.color = 'red';
              block.prepend(warning);
           }

          const extraCards = Array.from(cards).slice(MAX_CARDS);
          extraCards.forEach(card => card.remove());
    }
}
