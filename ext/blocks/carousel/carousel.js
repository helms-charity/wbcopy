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

      // Extract eyebrow using robust multi-criteria detection
      let eyebrow = null;
      const eyebrowCandidates = [];

      [...cells].forEach((cell) => {
        const text = cell.textContent.trim();
        const hasPicture = cell.querySelector('picture, img');
        const hasHeading = cell.querySelector('h1, h2, h3, h4, h5, h6');
        const hasParagraph = cell.querySelector('p');

        // Collect plain text cells that could be eyebrows
        if (text && !hasPicture && !hasHeading && text.length > 0) {
          eyebrowCandidates.push({
            cell,
            text,
            hasParagraph,
            length: text.length,
            wordCount: text.split(/\s+/).length,
            hasPunctuation: /[.!?]/.test(text),
          });
        }
      });

      // Find the best eyebrow candidate:
      // - Short text (1-3 words, < 50 chars)
      // - No paragraph wrapper (or if it has one, very short)
      // - No punctuation (eyebrows are labels, not sentences)
      const eyebrowMatch = eyebrowCandidates
        .filter((c) => c.wordCount <= 4 && c.length < 50 && !c.hasPunctuation)
        .sort((a, b) => {
          // Prefer non-paragraph over paragraph
          if (!a.hasParagraph && b.hasParagraph) return -1;
          if (a.hasParagraph && !b.hasParagraph) return 1;
          // Then prefer shorter
          return a.length - b.length;
        })[0];

      if (eyebrowMatch) {
        eyebrow = eyebrowMatch.text;
        eyebrowMatch.cell.remove();
      }

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

        // Extract anchor text and link using robust multi-criteria detection
        const headerCells = contentEl.querySelectorAll(':scope > div');
        let linkCellFound = null;
        const textCellCandidates = [];

        // First pass: Identify all cells with their characteristics
        [...headerCells].forEach((cell) => {
          const text = cell.textContent.trim();
          const linkEl = cell.querySelector('a');
          const hasParagraph = cell.querySelector('p');
          const hasHeading = cell.querySelector('h1, h2, h3, h4, h5, h6, strong');
          const hasSelect = cell.querySelector('select');

          // Find link cell (contains <a> tag, not inside heading)
          if (linkEl && !hasHeading && !linkCellFound) {
            linkCellFound = { cell, linkEl };
          }

          // Collect potential text-only cells (not title, not description, not select)
          if (!linkEl && !hasHeading && !hasSelect && text && text.length > 0) {
            textCellCandidates.push({
              cell,
              text,
              hasParagraph,
              length: text.length,
              hasPunctuation: /[.!?]/.test(text), // Descriptions often have punctuation
              wordCount: text.split(/\s+/).length,
            });
          }
        });

        // Extract link if found
        if (linkCellFound && isBottomCarousel) {
          anchorText = linkCellFound.linkEl.textContent.trim();
          anchorLink = linkCellFound.linkEl.href;
          linkCellFound.cell.remove();
        } else if (textCellCandidates.length > 0 && isBottomCarousel) {
          // If no link cell, find anchor text from candidates
          // Prioritize: shortest, no punctuation, fewest words
          const anchorCandidate = textCellCandidates
            .filter((c) => !c.hasParagraph && !c.hasPunctuation && c.wordCount <= 3)
            .sort((a, b) => a.length - b.length)[0];

          if (anchorCandidate) {
            anchorText = anchorCandidate.text;
            // Note: link would need to be in a separate field
            anchorCandidate.cell.remove();
          }
        }

        // Append the rest of the content to leftContent
        leftContent.append(contentEl);
      }

      leftContent.className = isBottomCarousel ? 'main-heading' : 'default-content-wrapper';
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
