import { div, a } from '../../scripts/dom-helpers.js';

const isMobile = window.matchMedia('(max-width: 767px)');

function createSlider(block) {
  const slider = block.querySelector('.feature-card-items');
  if (!slider) return;

  slider.classList.add('feature-card-slider');

  const itemList = [...block.querySelectorAll('.feature-card-slider > a')];
  const observerOptions = {
    rootMargin: '0px',
    threshold: 0.25,
  };

  slider.style.gridTemplateColumns = `repeat(${itemList.length}, 76%)`;

  // Observer Callback Function
  const callBack = (entries) => {
    entries.forEach((entry) => {
      const {
        target,
      } = entry;
      if (entry.intersectionRatio >= 0.25) {
        target.classList.remove('opacity');
        target.classList.add('active');
      } else {
        target.classList.remove('active');
        target.classList.add('opacity');
      }
    });
  };

  // Create Observer instance
  const observer = new IntersectionObserver(callBack, observerOptions);

  // Apply observer on each item
  itemList.forEach((item) => {
    observer.observe(item);
  });
}

function createCards(block, cards) {
  const featureCardItems = div({ class: 'feature-card-items' });
  featureCardItems.append(...cards);
  block.append(featureCardItems);

  cards.forEach(async (row) => {
    row.className = 'feature-card';
    const [image, title, description, link] = [...row.children];
    image.className = 'feature-card-image';
    title.className = 'feature-card-title';
    description.className = 'feature-card-description';

    const anchor = a({ class: 'feature-card-item', href: link.textContent });
    link.remove();

    row.parentNode.insertBefore(anchor, row);
    anchor.appendChild(row);
  });
}

export default function decorate(block) {
  const [title, rte, ...cards] = [...block.children];

  if (title || rte) {
    const headerDiv = div({ class: 'feature-cards-header' });
    if (title) {
      title.className = 'feature-cards-main-title';
      headerDiv.append(title);
    }
    if (rte) {
      rte.className = 'feature-cards-main-description';
      headerDiv.append(rte);
    }
    block.append(headerDiv);
  }

  if (!cards.length) return;

  const isProductAndServices = block.classList.contains('products-and-services');
  if (isProductAndServices) {
    createCards(block, cards);

    if (isMobile && isMobile.matches) {
      createSlider(block);
    }
  }

  const isKnowledgeData = block.classList.contains('knowledge-data');
  if (isKnowledgeData) {
    createCards(block, cards);
  }
}