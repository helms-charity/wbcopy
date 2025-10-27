import { div } from '../../scripts/dom-helpers.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */

function switchBlock(className, element) {
  const newElement = element.cloneNode(true);
  newElement.className = className;
  return newElement;
}

/**
 * Add <img> for icon, prefixed with codeBasePath and optional prefix.
 * @param {Element} [span] span element with icon classes
 */
function addAttributes(span) {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const iconsvgs = {
    facebook: `<svg width="10" height="20" viewBox="0 0 10 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.09489 3.21362H9.875V0.173047C9.56847 0.131958 8.51222 0.0385742 7.28239 0.0385742C4.71563 0.0385742 2.95767 1.62236 2.95767 4.5322V7.21045H0.125V10.6096H2.95767V19.1636H6.42926V10.6096H9.14744L9.57955 7.21045H6.42926V4.86838C6.42926 3.88599 6.69886 3.21362 8.09489 3.21362Z" fill="white"/>
</svg>
`,
    whatsapp: `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1971_10345)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M10.1024 0.788574C4.72238 0.788574 0.360521 5.15043 0.360521 10.5315C0.360521 12.372 0.871258 14.0933 1.7581 15.5621L0 20.7886L5.39335 19.0616C6.78869 19.8327 8.39435 20.2734 10.1024 20.2734C15.4835 20.2734 19.8453 15.9115 19.8453 10.5304C19.8453 5.14932 15.4835 0.788574 10.1024 0.788574ZM10.1024 18.641C8.45555 18.641 6.92111 18.147 5.64037 17.3002L2.52365 18.2983L3.53622 15.2862C2.56482 13.9487 1.99177 12.3063 1.99177 10.5304C1.99288 6.05841 5.63036 2.41982 10.1024 2.41982C14.5744 2.41982 18.213 6.05841 18.213 10.5304C18.213 15.0024 14.5744 18.641 10.1024 18.641ZM14.6701 12.7447C14.4253 12.6112 13.2258 11.9636 13.001 11.8724C12.7762 11.7811 12.6115 11.7333 12.4369 11.9758C12.2622 12.2184 11.7637 12.7603 11.6134 12.9205C11.4621 13.0808 11.3163 13.0964 11.0715 12.9617C10.8279 12.8282 10.0367 12.5355 9.11761 11.6532C8.40325 10.9666 7.93479 10.1332 7.79904 9.87948C7.66329 9.62467 7.79904 9.49559 7.92701 9.37653C8.04273 9.2686 8.18627 9.09502 8.31646 8.95481C8.44553 8.81461 8.49115 8.71224 8.58017 8.54978C8.66919 8.38733 8.63358 8.24045 8.57572 8.1136C8.51786 7.98675 8.0661 6.74496 7.87805 6.23867C7.69 5.73349 7.47969 5.80805 7.33393 5.80248C7.18927 5.79803 7.02348 5.77021 6.85768 5.76465C6.69189 5.75797 6.42038 5.81027 6.18338 6.05062C5.94637 6.29097 5.28096 6.86847 5.23534 8.09246C5.18972 9.31534 6.0365 10.5315 6.15445 10.7018C6.27239 10.872 7.77123 13.5247 10.2615 14.6152C12.7529 15.7057 12.7651 15.373 13.2224 15.3485C13.6798 15.324 14.7157 14.8021 14.9449 14.2291C15.1741 13.656 15.1919 13.1587 15.1341 13.053C15.0762 12.9472 14.9127 12.8783 14.669 12.7447H14.6701Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_1971_10345">
<rect width="19.8453" height="20" fill="white" transform="translate(0 0.788574)"/>
</clipPath>
</defs>
</svg>
`,
    twitter: `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1971_10349)">
<path d="M8.73532 7.14009L14.1989 0.788574H12.9036L8.15925 6.3035L4.37011 0.788574H0L5.73019 9.12762L0 15.7886H1.29525L6.30504 9.96421L10.307 15.7886H14.6771L8.7341 7.14009H8.73532ZM6.96184 9.201L6.38087 8.37052L1.76125 1.76338H3.75L7.47798 7.09606L8.05895 7.92654L12.9048 14.8578H10.9161L6.96184 9.20222V9.201Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_1971_10349">
<rect width="14.6771" height="15" fill="white" transform="translate(0 0.788574)"/>
</clipPath>
</defs>
</svg>
`,
    instagram: `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1971_10355)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.865 0.788574C2.629 0.788574 0 3.41757 0 6.65357V14.9236C0 18.1596 2.629 20.7886 5.865 20.7886H14.135C17.371 20.7886 20 18.1596 20 14.9236V6.65357C20 3.41757 17.371 0.788574 14.135 0.788574H5.865ZM14.135 2.60357C16.369 2.60357 18.185 4.41957 18.185 6.65357V14.9236C18.185 17.1576 16.369 18.9736 14.135 18.9736H5.865C3.631 18.9736 1.815 17.1576 1.815 14.9236V6.65357C1.815 4.41957 3.631 2.60357 5.865 2.60357H14.135ZM15.3125 4.41857C14.8103 4.41857 14.4062 4.82268 14.4062 5.32482C14.4062 5.82696 14.8103 6.23107 15.3125 6.23107C15.8146 6.23107 16.2188 5.82696 16.2188 5.32482C16.2188 4.82268 15.8146 4.41857 15.3125 4.41857ZM10 5.32482C7.239 5.32482 5 7.56382 5 10.3248C5 13.0858 7.239 15.3248 10 15.3248C12.761 15.3248 15 13.0858 15 10.3248C15 7.56382 12.761 5.32482 10 5.32482ZM10 7.13982C11.759 7.13982 13.185 8.56582 13.185 10.3248C13.185 12.0838 11.759 13.5098 10 13.5098C8.241 13.5098 6.815 12.0838 6.815 10.3248C6.815 8.56582 8.241 7.13982 10 7.13982Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_1971_10355">
<rect width="20" height="20" fill="white" transform="translate(0 0.788574)"/>
</clipPath>
</defs>
</svg>
`,
    youtube: `<svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M17.8459 1.42584C18.6637 1.64424 19.3094 2.28994 19.5278 3.10774C19.9284 4.61324 19.9284 7.78857 19.9284 7.78857C19.9284 7.78857 19.9284 10.9639 19.5278 12.4694C19.3094 13.2872 18.6637 13.9329 17.8459 14.1513C16.3404 14.5519 9.96423 14.5519 9.96423 14.5519C9.96423 14.5519 3.58803 14.5519 2.08253 14.1513C1.26473 13.9329 0.619029 13.2872 0.400629 12.4694C0 10.9639 0 7.78857 0 7.78857C0 7.78857 0 4.61324 0.400629 3.10774C0.619029 2.28994 1.26473 1.64424 2.08253 1.42584C3.58803 1.02521 9.96423 1.02521 9.96423 1.02521C9.96423 1.02521 16.3404 1.02521 17.8459 1.42584ZM13.1713 7.78857L7.97139 10.7886V4.78854L13.1713 7.78857Z" fill="white"/>
</svg>
`,
    linkedin: `<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1971_10361)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0.591797 2.3668C0.591797 1.22814 1.54214 0.277802 2.6808 0.277802H16.3178C17.4565 0.277802 18.4068 1.22814 18.4068 2.3668V16.0038C18.4068 17.1425 17.4565 18.0928 16.3178 18.0928H2.6808C1.54214 18.0928 0.591797 17.1425 0.591797 16.0038V2.3668ZM7.49988 15.2238V7.56184H5.05088V15.2238H7.49988ZM6.27538 6.53684C7.09138 6.53684 7.66288 5.93484 7.66288 5.18384C7.64688 4.41684 7.09138 3.83084 6.29138 3.83084C5.49138 3.83084 4.90288 4.41684 4.90288 5.18384C4.90288 5.93484 5.47438 6.53684 6.25938 6.53684H6.27538ZM14.5179 15.2238V10.8748C14.5179 10.6618 14.5339 10.4478 14.5979 10.2978C14.7739 9.87084 15.1639 9.42684 15.8159 9.42684C16.6799 9.42684 17.0219 10.0768 17.0219 11.0298V15.2238H19.4709V10.7458C19.4709 8.48684 18.2629 7.40984 16.6639 7.40984C15.3679 7.40984 14.7899 8.11684 14.5019 8.61684H14.5179V7.56184H12.0689C12.1009 8.29684 12.0689 15.2238 12.0689 15.2238H14.5179Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_1971_10361">
<rect width="18.4068" height="18.4068" fill="white" transform="translate(0.591797 0.277802)"/>
</clipPath>
</defs>
</svg>
`,
  };

  if (iconsvgs[iconName]) {
    span.innerHTML = iconsvgs[iconName];
  }
}

export default async function decorate(block) {
  const section = div({ class: 'footer-section' });
  const classes = ['ft-social', 'ft-main', 'ft-legal'];

  [...block.children].forEach((rowValue, index) => {
    rowValue.className = classes[index];
    [...rowValue.children].forEach((column) => {
      const ul = column.querySelector('ul');
      if (ul) {
        switch (rowValue.className) {
          case 'ft-social':
            column.append(switchBlock('ft-social-list', ul));
            break;
          case 'ft-main':
            rowValue.append(switchBlock('ft-main-item', ul));
            break;
          case 'ft-legal':
            column.append(switchBlock('ft-legal-list', ul));
            break;
          default:
            break;
        }
      }
      if (rowValue.className === 'ft-main') {
        rowValue.removeChild(column);
      }
    });

    [...rowValue.querySelectorAll('span[class*="icon-"]')].forEach((span) => {
      addAttributes(span);
    });
    rowValue.removeChild(rowValue.firstElementChild);
    section.append(rowValue);
  });
  block.append(section);
}