import { div, p, h2 , span, button, li, ul,a} from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const children = [...block.children];
  const [
    titleDiv,
    descDiv,
    ddHeadingDiv,
    ddplaceholderDiv,
    ddbodyDiv
  ] = children;

  const titleText = titleDiv?.textContent?.trim() || '';
  const wrapper = div({ class: 'text tui_body_text_large_regular' });

  if(titleText.length > 0 || descDiv.textContent.length > 0) {
    if (titleText) {
      const title = h2();
      title.textContent = titleText;
      wrapper.appendChild(title);
    }
    if (descDiv.textContent.length > 0) {
      const desc = p();
      desc.innerHTML = descDiv?.innerHTML || ''
      wrapper.appendChild(desc);
    }
    
  }


  const label = ddplaceholderDiv?.textContent?.trim() || 'Select an Option';

  // Create dropdown wrapper
  const dropdown = document.createElement('div');
  dropdown.className = 'tui__dropdown';

  dropdown.innerHTML = `
    <button
      class="tui__dropdown_toggle"
      aria-haspopup="true"
      aria-expanded="false"
      aria-labelledby="sr-regionbtn sr-dropdown-title"
      id="sr-regionbtn"
      role="button"
    >${label}</button>
    <div class="tui__dropdown_menu" role="menu" >
      <ul class="tui__secondary_dropdown_menu"></ul>
    </div>
  `;

  const toggle = dropdown.querySelector('.tui__dropdown_toggle');
  const content = dropdown.querySelector('.tui__dropdown_menu');
  const menuList = dropdown.querySelector('ul');
  // const menuListitems = content.querySelectorAll('[role="menuitem"]');

  // Move <a> links from original block into dropdown items
  const links = block.querySelectorAll('a');
  
  links.forEach((link) => {
    link.setAttribute('role', 'menuitem');
    link.setAttribute('tabindex','-1');
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    link.classList.remove('button');
    li.appendChild(link);
    menuList.appendChild(li);
  });

  const items = menuList.querySelectorAll('li');

// begin accessibility
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  content.setAttribute('role', 'menu');
  content.setAttribute('aria-hidden', 'true');

  let isOpen = false;

  function positionMenu() {
    const rect = toggle.getBoundingClientRect();
    const menuHeight = content.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    content.classList.remove('up', 'down');
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      content.classList.add('up');
      content.style.top = 'auto';
      content.style.bottom = '100%';
    } else {
      content.classList.add('down');
      content.style.bottom = 'auto';
      content.style.top = '100%';
    }
  }

   function openMenu() {
    positionMenu();
    content.classList.add('show');
    content.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    isOpen = true;
  }

  function closeMenu() {
    content.classList.remove('show', 'up', 'down');
    content.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }
  function closeAllDropdownsExcept(currentDropdown) {
    document.querySelectorAll('.tui__dropdown').forEach(other => {
      if (other !== currentDropdown) {
        const otherBtn = other.querySelector('.tui__dropdown_toggle');
        const otherMenu = other.querySelector('.tui__dropdown_menu');
        otherBtn.setAttribute('aria-expanded', 'false');
        otherMenu.setAttribute('aria-hidden', 'true');
        otherMenu.classList.remove('show', 'up', 'down');
      }
    });
  }

  toggle.addEventListener('click', (e) => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    closeAllDropdownsExcept(dropdown);
    expanded ? closeMenu() : openMenu();
    e.stopPropagation();
  });

  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      closeAllDropdownsExcept(dropdown);
      openMenu();
      items[0]?.focus();
    }
  });

 content.addEventListener('keydown', (e) => {
     const currentIndex = Array.from(links).indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      links[(currentIndex + 1) % links.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      links[(currentIndex - 1 + links.length) % links.length].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      toggle.focus();
    } else if (e.key === 'Tab') {
      closeMenu();
    }
  });

    // Re-position menu on scroll/resize if open
  window.addEventListener('scroll', () => {
    if (isOpen) {
      positionMenu();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (isOpen) {
      positionMenu();
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      closeMenu();
    }
  });
  links.forEach(item => {
    item.setAttribute('tabindex', '-1');
  });
// end accessibility

  // Inject dropdown into block
  block.innerHTML = '';
    if (titleText || descDiv.textContent.length > 0) {
        const colWrapper = div({ class: 'columns column-layout-50-50 block columns-2-cols' });
        const innerColumn = document.createElement('div');
        innerColumn.appendChild(wrapper);
        const secondColumn = document.createElement('div');   
        secondColumn.className = 'lp__browse_topic';
        if(ddHeadingDiv) {
        const dropdownTitle = h2({ id: 'sr-dropdown-title' });
        dropdownTitle.textContent = ddHeadingDiv.textContent?.trim() ;
        secondColumn.appendChild(dropdownTitle);
        }
        secondColumn.appendChild(dropdown); 
        
        innerColumn.appendChild(secondColumn);
        colWrapper.appendChild(innerColumn);
        block.appendChild(colWrapper);
    }else {
         block.appendChild(dropdown);
    }

 
}
