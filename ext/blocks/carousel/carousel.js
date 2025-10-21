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
    const cells = row.querySelectorAll(':scope > div');

    // Detect if this row is just the link button (from Universal Editor form fields)
    // It will be a single cell containing only a link, no images
    const isLinkRow = cells.length === 1
                      && cells[0].querySelector('a')
                      && !cells[0].querySelector('picture, img')
                      && cells[0].children.length === 1; // Only contains the link

    if (i > 1 && !isLinkRow) {
      const li = document.createElement('li');
      moveInstrumentation(row, li);

      // Extract eyebrow using content-based detection
      // Find cell that's plain text, no picture, short length (< 50 chars)
      let eyebrow = null;
      [...cells].forEach((cell) => {
        const text = cell.textContent.trim();
        if (text
            && text.length < 50
            && !cell.querySelector('picture, img, h1, h2, h3, h4, h5, h6')
            && cell !== cells[0] // Not the image cell
            && cell !== cells[1]) { // Not the alt text cell
          eyebrow = text;
          cell.remove();
        }
      });

      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
          // Add eyebrow to image container if it exists
          if (eyebrow) {
            const eyebrowEl = document.createElement('span');
            eyebrowEl.className = 'card-eyebrow';
            eyebrowEl.textContent = eyebrow;
            // Insert eyebrow as first child of image container
            div.insertBefore(eyebrowEl, div.firstChild);
          }
        } else {
          div.className = 'cards-card-body';
        }
      });
      slider.append(li);
    } else if (isLinkRow && isBottomCarousel) {
      // Extract the link info from the Universal Editor generated row
      const linkElement = cells[0].querySelector('a');
      if (linkElement) {
        anchorText = linkElement.textContent.trim();
        anchorLink = linkElement.href;
      }
    } else {
      const contentEl = row;
      if (contentEl) {
        if (contentEl.id) {
          h2Element = contentEl.id;
        }

        // Extract anchor text and link using content-based detection
        // Look for short text cells and link cells, regardless of position
        const headerCells = contentEl.querySelectorAll(':scope > div');
        [...headerCells].forEach((cell) => {
          const text = cell.textContent.trim();
          const linkEl = cell.querySelector('a');

          // Skip if it's title (has heading tags) or description (long text)
          const isTitle = cell.querySelector('h1, h2, h3, h4, h5, h6');
          const isDescription = text.length > 100;

          if (!isTitle && !isDescription && text && text.length < 50 && text.length > 0) {
            // Check if it's a link or plain text
            if (linkEl && !anchorLink) {
              // This is the link field
              anchorText = linkEl.textContent.trim();
              anchorLink = linkEl.href;
              cell.remove();
            } else if (!linkEl && !cell.querySelector('select') && !anchorText) {
              // This might be anchor text field (plain text, short)
              // But only if we haven't found it yet and it's not a select/dropdown
              anchorText = text;
              cell.remove();
            }
          }
        });

        // Check if there's an existing button in the content
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

    const buttonWrapper = document.createElement('p');
    buttonWrapper.className = 'button-container';
    buttonWrapper.appendChild(newButton);

    // Add button to mobile element for responsive display
    buttonMobileElement.appendChild(buttonWrapper.cloneNode(true));
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
  // Add button AFTER the cards slider for carousel-with-button
  if (isBottomCarousel && buttonMobileElement.children.length > 0) {
    // Desktop button
    const desktopButtonWrapper = document.createElement('div');
    desktopButtonWrapper.className = 'carousel-button-desktop';
    desktopButtonWrapper.appendChild(buttonMobileElement.firstChild.cloneNode(true));
    block.appendChild(desktopButtonWrapper);

    // Mobile button
    buttonMobileElement.className = 'carousel-button-mobile';
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
