import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createSlider from '../../scripts/slider.js';

export default function decorate(block) {
  const isBottomCarousel = block.classList.contains('carousel-with-button');

  let i = 0;
  const slider = document.createElement('ul');
  const leftContent = document.createElement('div');
  let h2Element;
  let anchorText = '';
  let anchorLink = '';

  [...block.children].forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');

    // Detect if this row is a link-only row (for anchorText/link extraction)
    const hasOnlyLink = cells.length === 1
      && cells[0].querySelector('a')
      && !cells[0].querySelector('picture, img, h1, h2, h3, h4, h5, h6');

    // Detect if this row is a card (has image or multiple cells with text/heading)
    const isCard = cells.length >= 2
      && (cells[0].querySelector('picture, img') || cells[1].querySelector('h3, h4'));

    // Header rows (i <= 1): Title and Description
    if (i <= 1) {
      const contentEl = row;
      if (contentEl && contentEl.id) {
        h2Element = contentEl.id;
      }
      leftContent.append(contentEl);
    } else if (hasOnlyLink && isBottomCarousel) {
      // Link row: Extract anchorText and link
      const linkEl = cells[0].querySelector('a');
      if (linkEl) {
        anchorText = linkEl.textContent.trim();
        anchorLink = linkEl.href;
      }
      // Don't process this row further - it's not a card
    } else if (isCard) {
      // Card row: cells[0] = image, cells[1] = text, cells[2] = eyebrow (optional)
      const li = document.createElement('li');
      moveInstrumentation(row, li);

      let eyebrow = null;
      if (cells[2]) {
        eyebrow = cells[2].textContent.trim();
      }

      // Process image cell
      if (cells[0]) {
        cells[0].className = 'cards-card-image';
        // Add eyebrow to image container if it exists
        if (eyebrow) {
          const eyebrowEl = document.createElement('span');
          eyebrowEl.className = 'card-eyebrow';
          eyebrowEl.textContent = eyebrow;
          cells[0].insertBefore(eyebrowEl, cells[0].firstChild);
        }
        li.append(cells[0]);
      }

      // Process text cell
      if (cells[1]) {
        cells[1].className = 'cards-card-body';
        li.append(cells[1]);
      }

      slider.append(li);
    }
    i += 1;
  });

  // Create button element from anchor text and link fields
  let buttonElement = null;
  if (isBottomCarousel && anchorText && anchorLink) {
    const newButton = document.createElement('a');
    newButton.href = anchorLink;
    newButton.className = 'button';
    newButton.textContent = anchorText;
    if (h2Element) {
      newButton.setAttribute('aria-describedby', h2Element);
    }

    buttonElement = document.createElement('div');
    buttonElement.className = 'carousel-button';
    const buttonWrapper = document.createElement('p');
    buttonWrapper.className = 'button-container';
    buttonWrapper.appendChild(newButton);
    buttonElement.appendChild(buttonWrapper);
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

      // Create link for the title only
      const titleLink = document.createElement('a');
      titleLink.href = oldLink.href;
      titleLink.title = oldLink.title;
      titleLink.textContent = oldLink.textContent;
      moveInstrumentation(oldLink, titleLink);

      // Find the heading (h3, h4, etc.) and wrap it with the link
      const heading = bodyDiv.querySelector('h3, h4, h5, h6');
      if (heading) {
        heading.textContent = '';
        heading.appendChild(titleLink);
      } else {
        // Fallback: if no heading, wrap the first paragraph
        const firstP = bodyDiv.querySelector('p');
        if (firstP && firstP.contains(oldLink)) {
          firstP.textContent = '';
          firstP.appendChild(titleLink);
        }
      }

      // Remove the old link if it still exists
      if (oldLink.parentNode) {
        oldLink.remove();
      }
    });
  }
  /* ------------------------------------------------------------- */

  leftContent.className = isBottomCarousel ? 'main-heading' : 'default-content-wrapper';

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
  createSlider(block);

  // Add button element to wrapper AFTER createSlider so navigation buttons exist
  if (isBottomCarousel && buttonElement) {
    const wrapper = block.parentElement;
    const navigationButtons = wrapper.querySelector('.carousel-navigation-buttons');

    // Create a container for both button and navigation to keep them on the same line
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'carousel-controls';

    // Add button to controls container
    controlsContainer.appendChild(buttonElement);

    // Move navigation buttons into the same container
    if (navigationButtons) {
      controlsContainer.appendChild(navigationButtons);
    }

    // Add the controls container to the wrapper
    wrapper.appendChild(controlsContainer);
  }
  const cardList = block.querySelector('ul');
  cardList.setAttribute('tabindex', '-1');
}
