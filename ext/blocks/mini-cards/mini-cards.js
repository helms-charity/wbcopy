import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import { moveInstrumentation, CLASS_MAIN_HEADING } from '../../scripts/scripts.js';
import { a, div } from '../../scripts/dom-helpers.js';
import { processTags, getTaxonomy } from '../../scripts/utils.js';
// import { isAuthoring } from '../../scripts/reference-limiter.js';

async function processTag(tag) {
  const tagTxt = tag.innerText;
  if (tagTxt) {
    const tagValues = tagTxt.split(',').map((t) => t.trim()).filter(Boolean);
    const taxonomyNames = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const tagValue of tagValues) {
      tag.classList.add(toClassName(processTags(tagValue, 'content-type')));
      // eslint-disable-next-line no-await-in-loop
      taxonomyNames.push(await getTaxonomy(tagValue, 'content-type'));
    }
    if (tag.firstElementChild) {
      tag.firstElementChild.innerText = taxonomyNames.join(', ');
    } else {
      tag.innerText = taxonomyNames.join(', ');
    }
  }
}

export default function decorate(block) {
  block.setAttribute('data-editor-editable', 'true');

  block.addEventListener('click', (e) => {
    e.stopPropagation();
    block.setAttribute('data-editor-selected', 'true');
  });

  const isMiniCardWithButton = block.classList.contains('mini-card-with-button');

  if (isMiniCardWithButton) {
    const [heading, button, ...cards] = [...block.children];
    const buttonElementDesktop = button;
    const buttonElementMobile = button.cloneNode(true);
    if (heading && buttonElementDesktop) {
      [...buttonElementDesktop.children].forEach((child) => {
        heading.appendChild(child);
      });
      buttonElementDesktop.remove();
    }
    createCards(heading, cards);
    block.appendChild(buttonElementMobile);
  } else {
    // const [heading, button, ...cards] = [...block.children];
    const children = [...block.children];
    const heading = children[0];
    const button = children[1];
    let cards = children.slice(2);
    if (button && button.textContent.trim() !== '') {
      cards = children.slice(1);
    }

    createCards(heading, cards);
  }
  function createCards(heading, cards) {
    if (heading) {
      heading.classList.add(CLASS_MAIN_HEADING);
    }
    const miniCardsContainer = div({ class: 'mini-card-container' });
    cards.forEach(async (row) => {
      row.className = 'mini-card';
      const [imageDiv, tagDiv, titleDiv, dateDiv, timeDiv, locationDiv, linkDiv, alt, desc, eyebrowTextDiv, classes] = row.children;
      // const imgTag = imageDiv ? imageDiv.querySelector('img') : null;
      /* if ((!imgTag || !imgTag.src)) { // Check if image is missing
        if (isAuthoring()) { // warn only in authoring mode
          const warning = document.createElement('div');
          warning.style.color = 'red';
          warning.textContent = 'Image is required for mini-cards.';
          row.appendChild(warning);
        } else { // remove the row if not in authoring mode and image is missing
          row.remove();
          return;
        }
      } else {
        timeDiv.className = 'mini-card-time';
      } */
      timeDiv.className = 'mini-card-time';
      imageDiv.className = 'mini-card-image';
      tagDiv.className = 'mini-card-tag';
      titleDiv.className = 'mini-card-title';
      dateDiv.className = 'mini-card-date';
      locationDiv.className = 'mini-card-location';

      if (desc) {
        const buttonContainer = desc.querySelector('.button-container');
        if (buttonContainer) {
          const link = buttonContainer.querySelector('a');
          if (link) {
            link.classList.remove('button');
            desc.appendChild(link);
          }
          buttonContainer.remove();
        }
        desc.className = 'mini-card-desc';
      }

      const link = linkDiv.textContent ? linkDiv.textContent : '';
      if (!alt) {
        alt = 'Default Alt';
      }
      if (alt) {
        const pic = imageDiv.querySelector('img');
        const p = alt.querySelector('p');
        if (!p && pic) {
          pic.alt = 'Default Alt';
        }
        if (p && pic) {
          pic.alt = p.textContent.trim();
        }
        alt.remove();
      }

      linkDiv.remove();
      if (!timeDiv.textContent) {
        timeDiv.remove();
      }
      if (!locationDiv.textContent) {
        locationDiv.remove();
      }
      if (!dateDiv.textContent) {
        dateDiv.remove();
      }
      if (desc && !desc.textContent) {
        desc.remove();
      }
      if (!imageDiv.textContent) {
        imageDiv.remove();
      }
      if (!titleDiv.textContent) {
        titleDiv.remove();
      }
      if (!tagDiv.textContent) {
        tagDiv.remove();
      }
      if (tagDiv.textContent) {
        await processTag(tagDiv);
      }
      if (eyebrowTextDiv && eyebrowTextDiv.textContent.trim()) {
        const eyebrowText = eyebrowTextDiv.textContent.trim();
        let tagText = tagDiv.firstElementChild ? tagDiv.firstElementChild.innerText : '';
        if (tagDiv.firstElementChild) {
          tagDiv.firstElementChild.innerText += (tagText ? ' , ' : '') + eyebrowText;
        } else {
          tagDiv.innerText += (tagDiv.innerText ? ' , ' : '') + eyebrowText;
        }
      }
      if (eyebrowTextDiv) eyebrowTextDiv.remove();


      if (classes && classes.textContent.trim()) {
        const classesValue = classes.textContent.trim();
        const filteredClasses = classesValue.split(',').filter(item => item.trim() !== 'mini-card').map(item => item.trim());
        const filteredClassesString = filteredClasses.join(' ');
        if (filteredClassesString) {
          imageDiv.classList.add(filteredClassesString);
        }
      }
      if (classes) classes.remove();

      const text = div({ class: 'mc-text-wrapper' }, tagDiv?.textContent.trim() ? tagDiv : '', a({ href: link }, titleDiv), (dateDiv.textContent.trim() || timeDiv.textContent.trim()) ? div({ class: 'date-time-info' }, dateDiv?.textContent.trim() ? dateDiv : '', timeDiv?.textContent.trim() ? timeDiv : '') : '', locationDiv?.textContent.trim() ? locationDiv : '', desc?.textContent.trim() ? desc : '');
      row.append(text, a({ href: link, tabindex: -1 }, imageDiv));
      miniCardsContainer.append(row);
    });

    block.append(miniCardsContainer);
    // Optimize images
    block.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '250' }]);
      const newPic = optimizedPic.querySelector('img');
      newPic.width = 250;
      newPic.height = 150;
      moveInstrumentation(img, newPic);
      img.closest('picture').replaceWith(optimizedPic);
    });
  }

}