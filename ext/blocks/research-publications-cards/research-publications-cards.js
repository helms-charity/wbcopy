import { div, a } from '../../scripts/dom-helpers.js';
import { CLASS_MAIN_HEADING } from '../../scripts/scripts.js';

function createCard(cardData) {
  const children = [...cardData.children];

  // Detect if first child is eyebrowText or image
  let eyebrowText = children[0];
  let imageContainer = children[1];
  let imageAltText = children[2];
  let cardTitle = children[3];
  let desc = children[4];
  let titlelink = children[5];
  let btn = children[6];
  let btnLink = children[7];

  if (
    eyebrowText &&
    eyebrowText.querySelector('a, img, picture')
  ) {
    // No eyebrowText, shift fields
    eyebrowText = null;
    imageContainer = children[0];
    imageAltText = children[1];
    cardTitle = children[2];
    desc = children[3];
    titlelink = children[4];
    btn = children[5];
    btnLink = children[6];
  }

  const tLink = titlelink?.textContent || '#';
  const imgElement = imageContainer?.querySelector('img');

  if (imgElement && imageAltText) {
    imgElement.setAttribute('alt', imageAltText.textContent);
    imageContainer.className = 'card-img';
    imageAltText.remove();
    const imgLink = a({ href: tLink, title: cardTitle?.textContent || '', tabIndex: '-1' }, imgElement.parentElement);
    imageContainer.append(imgLink);
  }

  if (desc) desc.className = 'desc';

  const eyebrowDiv = eyebrowText ? div({ class: 'eyebrowtext' }, eyebrowText.textContent) : null;
  eyebrowText?.remove();

  // Conditionally include eyebrowDiv
  const txtContainer = div(
    { class: 'text-content' },
    ...(eyebrowDiv ? [eyebrowDiv] : []),
    a({ href: tLink, class: 'title' }, cardTitle),
    desc,
    btn && btnLink?.textContent ? a({ href: btnLink.textContent, class: 'card-btn' }, btn) : null
  );

  cardData.append(txtContainer);
  cardData.className = 'rp-card';

  titlelink?.remove();
  btnLink?.remove();
}

export default async function decorate(block) {
  const children = [...block.children];
  const title = children[0];
  const linkText = children[1];
  const link = children[2];
  const variant = children[3]; // might be undefined on old pages
  const cards = children.slice(4);
  let cardlist = [...cards];

  title.className = CLASS_MAIN_HEADING;

  let variantNode = null;
  if (
    variant &&
    variant.children.length === 1 &&
    !variant.querySelector('a, img, picture') &&
    variant.textContent.trim() !== ''
  ) {
    // Treat as block class
    variantNode = variant;
  }

  if (variantNode) {
    block.classList.add(variantNode.textContent.trim());
    variantNode.remove();
  } else if (variant) {
    // Treat as first card if it has image/picture
    cardlist = [variant, ...cards];
  }

  const linkTag = link.getElementsByTagName('a')[0];
  let buttonWrapper;

  if (linkTag) {
    linkTag.className = 'button primary';
    linkTag.innerHTML = linkText.textContent;
    linkTag.title = linkText.textContent;
    const titleButtonWrapper = div({ class: 'heading-wrapper' }, title, link);
    buttonWrapper = div({ class: 'button-wrapper' }, linkTag.cloneNode(true));
    linkText.remove();
    block.prepend(titleButtonWrapper);
  }

  const cardsContainer = div({ class: 'cards-container' });
  cardlist.forEach((card) => {
    createCard(card);
    cardsContainer.append(card);
  });
  block.append(cardsContainer);

  if (linkTag) {
    block.append(buttonWrapper);
  }
}
