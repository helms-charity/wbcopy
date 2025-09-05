import { div, p, h2, h3, span, ul, li, a, form, input } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const children = [...block.children];
  const [
    prefixDiv,
    titleDiv,
    descDiv,
    formHeadingDiv,
    formbodyDiv,
    formplaceholderDiv,
    formtargetDiv,
    formlinksDiv
  ] = children;

  const prefixText = prefixDiv?.textContent?.trim() || '';
  const titleText = titleDiv?.textContent?.trim() || '';
  //const description = p({}, descDiv?.textContent || '');
  const description = p({});
  description.innerHTML = descDiv?.innerHTML || ''

  // Form heading
  const headingText = formHeadingDiv?.textContent || '';
  const headingDesc = formbodyDiv?.textContent || '';
  let formHeading;
  if (headingText) {
    formHeading = h3({}, headingText);
  }
  const formDescription = p({ class: 'tui_body_text_medium_regular' }, headingDesc);

  if (!formtargetDiv || !formtargetDiv.textContent) {
    console.warn('Form target is not defined or empty. Please check the block structure.');
    return;
  }

  const actionUrl = formtargetDiv.textContent.trim();

  // Create inputs separately so we can access them in JS
  const searchInput = input({
    type: 'search',
    placeholder: formplaceholderDiv?.textContent.trim() || 'Search Projects',
    class: 'search-input-field',
    name: 'qterm',
    'aria-label': formplaceholderDiv?.textContent.trim() || 'Search Projects',
  });

  const submitBtn = input({
    class: 'lp__submit_icon',
    type: 'image',
    src: 'https://www.worldbank.org/content/dam/sites/edge/Search-small-white.svg',
    alt: 'search',
  });

  const searchFormEl = form(
    {
      class: 'lp__input_group',
      name: 'searchbox',
      method: 'post',
    },
    searchInput,
    submitBtn
  );

  // Attach submit handler
  searchFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if ( actionUrl) {
      const targetUrl = `${actionUrl}${encodeURIComponent(query)}`;
      window.location.href = targetUrl;
    } else {
      alert('Missing action url');
    }
  });

  const formWrapper = div({ class: 'lp__secondary_search' }, searchFormEl);

  // Link list
  const links = [...formlinksDiv?.querySelectorAll('a') || []].map((link) =>
    li({}, a({ href: link.href }, link.textContent))
  );

  const linkList = div({ class: 'tui__link_list' }, ul({}, ...links));

  const isSignupVariation = block.classList.contains('signup-variation');

  if(isSignupVariation){
    const heading = h3({}, `${prefixText} `, span({}, titleText));
    const header = div({ class: 'development-projects-search' }, heading, description);
    // Full search section
    const searchSection = div(
      { class: 'development-projects-header' },
      formHeading,
      formDescription,
      formWrapper,
      linkList
    );
    const container = div(
      { class: 'development-projects-container' },
          searchSection,
          header
    );
    block.innerHTML = '';
    block.append(container);
  }else{
    const heading = h2({}, `${prefixText} `, span({}, titleText));
    const header = div({ class: 'development-projects-header' }, heading, description);
    // Full search section
    const searchSection = div(
      { class: 'development-projects-search' },
      formHeading,
      formDescription,
      formWrapper,
      linkList
    );
    const container = div(
      { class: 'development-projects-container' },
      header,
      searchSection
    );
    block.innerHTML = '';
    block.append(container);
  } 
  
}
