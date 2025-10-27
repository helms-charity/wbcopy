import { a, h2 } from '../../scripts/dom-helpers.js';

function applyCollapse(text, collapsibleText, readMoreLabel, readLessLabel) {
  text.classList.add('visible-text');
  collapsibleText.classList.add('collapse-text');

  // Check if collapsibleText has content
  const hasContent = collapsibleText && collapsibleText.textContent.trim().length > 0;

  // Hide the collapsible text and "Read Less" initially
  collapsibleText.style.display = 'none';

  // Make readMoreLabel an anchor (add undefined check)
  let readMoreAnchor;
  if (readMoreLabel) {
    readMoreAnchor = a(
      { href: '#', class: 'read-more-button', 'aria-expanded': 'false' },
      readMoreLabel.textContent || 'Read More',
    );
    const p = readMoreLabel.querySelector('p');
    if (p) {
      p.replaceWith(readMoreAnchor);
    }
  }

  // Make readLessLabel an anchor (add undefined check)
  let readLessAnchor;
  if (readLessLabel) {
    readLessAnchor = a(
      { href: '#', class: 'read-less-button', 'aria-expanded': 'true' },
      readLessLabel.textContent || 'Read Less',
    );
    readLessAnchor.style.display = 'none';
    const p2 = readLessLabel.querySelector('p');
    if (p2) {
      p2.replaceWith(readLessAnchor);
    }
  }

  // Toggle functionality
  if (readMoreAnchor && readLessAnchor) {
    readMoreAnchor.addEventListener('click', (e) => {
      e.preventDefault();

      const appendedElements = text.querySelectorAll('.collapse-elements');
      appendedElements.forEach((el) => {
        el.style.display = '';
      });

      const visibleContainer = text.querySelector('div');
      const collapseContainer = collapsibleText.querySelector('div');
      const lastVisibleEl = visibleContainer?.lastElementChild;

      if (lastVisibleEl && lastVisibleEl.tagName === 'UL') {
        const firstCollapseEl = collapseContainer?.firstElementChild;
        if (firstCollapseEl && firstCollapseEl.tagName === 'UL') {
          const collapseLis = [...firstCollapseEl.querySelectorAll('li')];
          collapseLis.forEach((li) => {
            lastVisibleEl.appendChild(li);
            li.classList.add('collapse-elements'); // <-- add class here
          });
          firstCollapseEl.remove();

          let next = collapseContainer?.firstElementChild;
          while (next) {
            const sibling = next;
            next = sibling.nextElementSibling;

            const liWrapper = document.createElement('li');
            liWrapper.classList.add('merged-extra-content', 'collapse-elements'); // <-- add class here
            liWrapper.appendChild(sibling);
            lastVisibleEl.appendChild(liWrapper);
          }
        } else {
          const children = [...collapseContainer.children];
          let ref = lastVisibleEl;
          children.forEach((child) => {
            ref.insertAdjacentElement('afterend', child);
            child.classList.add('collapse-elements'); // <-- add class here
            ref = child;
          });
        }
      } else {
        const children = [...collapseContainer.children];
        let ref = lastVisibleEl;
        children.forEach((child) => {
          ref.insertAdjacentElement('afterend', child);
          child.classList.add('collapse-elements'); // <-- add class here
          ref = child;
        });
      }

      collapsibleText.style.display = '';
      readMoreAnchor.style.display = 'none';
      readLessAnchor.style.display = '';
    });

    readLessAnchor.addEventListener('click', (e) => {
      e.preventDefault();

      const visibleContainer = text.querySelector('div');
      const collapseContainer = collapsibleText.querySelector('div');

      // Look for the last visible UL in the visible container
      const lastVisibleEl = visibleContainer?.lastElementChild;

      // Find all collapse elements
      const collapseEls = text.querySelectorAll('.collapse-elements');

      if (lastVisibleEl && lastVisibleEl.tagName === 'UL') {
        // Move all li elements with .collapse-elements back into a UL in collapsibleText
        const newCollapseUl = document.createElement('ul');
        collapseEls.forEach((el) => {
          if (el.tagName === 'LI') {
            newCollapseUl.appendChild(el);
          }
        });
        if (newCollapseUl.children.length) {
          collapseContainer.insertAdjacentElement('afterbegin', newCollapseUl);
        }

        // Move any merged extra content after UL into collapsibleText
        const mergedExtraContent = visibleContainer.querySelectorAll('.merged-extra-content');
        mergedExtraContent.forEach((extra) => {
          collapseContainer.appendChild(extra);
        });
      } else {
        // Move any non-UL collapse-elements back into collapsibleText
        collapseEls.forEach((el) => {
          if (el.tagName !== 'LI') {
            collapseContainer.appendChild(el);
          }
        });
      }

      // Clear collapse-elements class
      collapseEls.forEach((el) => {
        el.classList.remove('collapse-elements', 'merged-extra-content');
      });

      collapsibleText.style.display = 'none';
      readMoreAnchor.style.display = '';
      readLessAnchor.style.display = 'none';

      text.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  // Hide read more if no collapsible content
  if (!hasContent && readMoreAnchor && readLessAnchor) {
    readMoreAnchor.style.display = 'none';
    readLessAnchor.style.display = 'none';
  }
}

export default function decorate(block) {
  const [title, text, collapsibleText, readMoreLabel, readLessLabel] = block.children;

  if (title.textContent.trim().length > 0) {
    const collapsibleTextTitle = h2({ class: 'collapsible-text-title' });
    collapsibleTextTitle.textContent = title.textContent?.trim();
    title.replaceWith(collapsibleTextTitle);
  }

  applyCollapse(text, collapsibleText, readMoreLabel, readLessLabel);
}