import { p, span, hr } from '../../scripts/dom-helpers.js';

function updateHeadingStructure(block) {
  const headingBlock = block;
  if (!headingBlock) return;

  const children = [...headingBlock.children];

  const [
    eyebrowDiv,
    prefixDiv,
    mainHeadingDiv,
    headerTagDiv,
    suffixDiv,
    bottomLineDiv,
    borderLineClassDiv,
    spacingTopClassDiv,
    spacingBottomClassDiv,
    buttontextDiv,
    buttonLinkDiv,
    descDiv
  ] = children;

  const getTextContent = (div) => div?.querySelector('p')?.textContent.trim() || '';

  const eyebrowText = getTextContent(eyebrowDiv);
  const prefixText = getTextContent(prefixDiv);
  const mainHeadingText = getTextContent(mainHeadingDiv);
  const headerTag = getTextContent(headerTagDiv) || 'h2';
  const suffixText = getTextContent(suffixDiv);
  const addBottomLine = getTextContent(bottomLineDiv) === 'true';
  const borderLineClass = getTextContent(borderLineClassDiv);
  const spacingTopClass = getTextContent(spacingTopClassDiv);
  const spacingBottomClass = getTextContent(spacingBottomClassDiv);
  const descText = getTextContent(descDiv);
  const buttonText = getTextContent(buttontextDiv);
  const buttonLink = getTextContent(buttonLinkDiv);

  headingBlock.innerHTML = '';

  // Add the borderline and spacing classes
  if (borderLineClass) headingBlock.classList.add(borderLineClass);
  if (spacingTopClass) headingBlock.classList.add(spacingTopClass);
  if (spacingBottomClass) headingBlock.classList.add(spacingBottomClass);

  // Create eyebrow text element
  const eyebrow = p({ class: 'eyebrowtext' }, eyebrowText);
  const headerElement = document.createElement(headerTag);
  const prefixSpan = span(prefixText);
  const suffixSpan = span(suffixText);

  headerElement.append(prefixSpan, ` ${mainHeadingText} `, suffixSpan);

  // Append elements to the heading block
  headingBlock.append(eyebrow, headerElement);
  
   if(descText){
    const desc = p({ class: 'tui_body_text_md_regular' }, descText);
    headingBlock.append(desc);
  }

  // Add button if both text and link are present
  if (buttonText && buttonLink) {
    const outerDiv = document.createElement('div');
    const innerDiv = document.createElement('div');
    const pEl = document.createElement('p');
    const a = document.createElement('a');

    a.href = buttonLink;
    a.textContent = buttonText;
    a.className = 'button primary';

    pEl.className = 'button-container';
    pEl.appendChild(a);
    innerDiv.appendChild(pEl);
    outerDiv.appendChild(innerDiv);
    headingBlock.appendChild(outerDiv);
  }
  
  if (addBottomLine) {
    headingBlock.append(hr());
  }
}

export default function decorate(block) {
  updateHeadingStructure(block);
}