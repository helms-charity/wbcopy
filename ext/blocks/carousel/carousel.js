import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createSlider from '../../scripts/slider.js';
import { isAuthoring } from '../../scripts/reference-limiter.js';

export default function decorate(block) {
  const isBottomCarousel = block.classList.contains('carousel-with-button');

  let i = 0;
  const slider = document.createElement('ul');
  // Only create leftContent when we actually need it
  const leftContent = document.createElement('div');
  const buttonMobileElement = document.createElement('div');
  let h2Element;
  let anchorText = '';
  let anchorLink = '';

  [...block.children].forEach((row) => {
    if (i > 1) {
      console.log('i > 1');
      const li = document.createElement('li');
      moveInstrumentation(row, li);

      // Extract eyebrow if present (first child that's plain text/single line)
      const firstChild = row.firstElementChild;
      let eyebrow = null;
      if (firstChild && firstChild.children.length === 0 && firstChild.textContent.trim()) {
        eyebrow = firstChild.textContent.trim();
        firstChild.remove();
      }

      while (row.firstElementChild) li.append(row.firstElementChild);
      console.log('appended', row.firstElementChild);

      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
          // Add eyebrow to image container if it exists
          if (eyebrow) {
            const eyebrowEl = document.createElement('em');
            eyebrowEl.textContent = eyebrow;
            div.appendChild(eyebrowEl);
          }
        } else {
          div.className = 'cards-card-body';
        }
      });
      slider.append(li);
    } else {
      const contentEl = row;
      if (contentEl) {
        if (contentEl.id) {
          h2Element = contentEl.id;
        }

        // Check for separate anchor text and link fields
        const cells = contentEl.querySelectorAll(':scope > div');
        if (cells.length >= 3) {
          // Check if third cell contains anchor text
          const anchorTextCell = cells[2];
          if (anchorTextCell && anchorTextCell.textContent.trim()) {
            anchorText = anchorTextCell.textContent.trim();
            anchorTextCell.remove();
          }
          // Check if fourth cell contains link
          if (cells.length >= 4) {
            const linkCell = cells[3];
            if (linkCell) {
              const linkElement = linkCell.querySelector('a');
              if (linkElement) {
                anchorLink = linkElement.href;
              } else if (linkCell.textContent.trim()) {
                anchorLink = linkCell.textContent.trim();
              }
              linkCell.remove();
            }
          }
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

  // Create button from anchor text and link fields after processing all header rows
  if (isBottomCarousel && anchorText && anchorLink && !leftContent.querySelector('a.button, button')) {
    const newButton = document.createElement('a');
    newButton.href = anchorLink;
    newButton.className = 'button';
    newButton.textContent = anchorText;
    if (h2Element) {
      newButton.setAttribute('aria-describedby', h2Element);
    }

    const buttonContainer = document.createElement('p');
    buttonContainer.appendChild(newButton);
    leftContent.appendChild(buttonContainer);

    buttonMobileElement.appendChild(newButton.cloneNode(true));
  }

  // Optimise pictures
  slider.querySelectorAll('picture > img').forEach((img) => {
    let { alt } = img;
    if (!alt) {
      alt = 'Default Alt';
    }
    if (!img.src.includes('delivery-')) {
      const optimizedPic = createOptimizedPicture(img.src, alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    }
  });

  /* ---------- extra wrapping only for bottom carousel ---------- */
  if (isBottomCarousel) {
    slider.querySelectorAll('li').forEach((li) => {
      const imgDiv = li.querySelector('.cards-card-image');
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
  if (!isBottomCarousel) {
    if (leftContent) {
      block.parentNode.parentNode.prepend(leftContent);
    }
  } else {
    block.appendChild(leftContent);
  }
  block.append(slider);
  if (isBottomCarousel) {
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
      warning.textContent = '⚠️ Only 7 cards are allowed. Extra cards have been ignored.';
      warning.style.color = 'red';
      block.prepend(warning);
    }

    const extraCards = Array.from(cards).slice(MAX_CARDS);
    extraCards.forEach((card) => card.remove());
  }
}
