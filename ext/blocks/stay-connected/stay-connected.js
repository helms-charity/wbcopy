import { a, div, ul } from '../../scripts/dom-helpers.js';
import { isAuthoring } from '../../scripts/reference-limiter.js';

export default function decorate(block) {
  block.classList.add('columns', 'column-layout-67-33', 'columns-2-cols');

  const [heading, ...cards] = [...block.children];
  const parentDiv = div();
  block.append(parentDiv);

  heading.classList.add('heading-wrapper');
  heading.firstElementChild.classList.add('heading');
  parentDiv.append(heading);

  const socialList = div({ class: 'social-list' });
  const ulElement = ul();
  socialList.append(ulElement);

  cards.forEach((card) => {
    const title = card.children[0].querySelector('p')?.textContent.trim();
    const className = card.children[1].querySelector('p')?.textContent.trim();
    const url = card.querySelector('a')?.getAttribute('href');
    if (title && className && url) {
      const li = document.createElement('li');
      const aElement = a({ href: url, 'aria-label': title, class: `social-list-btn lp ${className}` });
      li.appendChild(aElement);
      ulElement.append(li);
    }

    if (isAuthoring()) {
      card.style.display = 'none'; // Hide the original card
    } else {
      card.remove(); // Remove the original card from the DOM
    }
  });

  parentDiv.append(socialList);
}