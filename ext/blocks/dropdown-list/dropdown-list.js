import { div, p, h2 , span, button, li, ul,a} from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const [subtitleEl, ...items] = [...block.children];
  const subtitleText = subtitleEl?.textContent?.trim() || '';
  const wrapper = div({ class: 'lp__browse_location' });

  if (subtitleText) {
    const subtitle = h2();
    subtitle.textContent = subtitleText;
    subtitle.id = 'sr-browse-location';
    subtitle.id = 'sr-browse-location';
    block.replaceChild(subtitle, subtitleEl);
  }

  items.forEach((item, index) => {
    item.classList.add('tui__dropdown');
     const [labelEl, linksContainer] = [...item.children];
    const labelText = labelEl?.textContent?.trim() || `Dropdown ${index + 1}`;
    const dropdownId = `sr-region-${index}`;

    // Create screen-reader label span
    //const srLabel = span({ class: 'lp__dropdown_label sr-only', id: `${dropdownId}title` , role: 'presentation' });
    //srLabel.innerHTML = `${labelText} <span class="sr-only">On selection, leaving this page</span>`;
    //const srLabel = span({ class: 'lp__dropdown_label sr-only', id: `${dropdownId}title` , role: 'presentation' });
    //srLabel.innerHTML = `${labelText} <span class="sr-only">On selection, leaving this page</span>`;

    // Create toggle button
    const toggleButton = button({
      class: 'tui__dropdown_toggle',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      'aria-labelledby': `${dropdownId}btn sr-browse-location`,
      id: `${dropdownId}btn`,
      role: 'button'
    });
    toggleButton.textContent = labelText;

    // Build the dropdown menu
    const dropdownMenu = div({
      class: 'tui__dropdown_menu',
      role: 'menu'
    });

    const ulEl = ul({ class: 'tui__secondary_dropdown_menu' });

    // Filter out empty/blank links (like `&nbsp;`)
    const linkParagraphs = [...linksContainer.querySelectorAll('p')]
      .filter(p => p.textContent.trim() && p.querySelector('a'));

    linkParagraphs.forEach(linkP => {
      const link = linkP.querySelector('a');
      const menuItem = li({ role: 'none'});
      const linkEl = a({
        href: link.href,
        title: link.textContent.trim(),
        class: 'lp__dropdown_item',
        role: 'menuitem',
        tabindex: '-1'
      });
      linkEl.textContent = link.textContent.trim();
      menuItem.append(linkEl);
      ulEl.append(menuItem);
    });

    dropdownMenu.append(ulEl);

    // Clear and rebuild item
    item.textContent = '';
    item.append( toggleButton, dropdownMenu);

  });

  // Attach all toggles & keyboard interaction outside the loop
  items.forEach((dropdown) => {
  const toggleBtn = dropdown.querySelector('.tui__dropdown_toggle');
  const menu = dropdown.querySelector('.tui__dropdown_menu');
  const items = menu.querySelectorAll('[role="menuitem"]');

  //const menuId = `dropdown-menu-${index}`;
 // menu.setAttribute('id', menuId);
  toggleBtn.setAttribute('aria-haspopup', 'true');
  toggleBtn.setAttribute('aria-expanded', 'false');
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-hidden', 'true');

  let isOpen = false;

  function positionMenu() {
    const rect = toggleBtn.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    menu.classList.remove('up', 'down');
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      menu.classList.add('up');
      menu.style.top = 'auto';
      menu.style.bottom = '100%';
    } else {
      menu.classList.add('down');
      menu.style.bottom = 'auto';
      menu.style.top = '100%';
    }
  }

  function openMenu() {
    positionMenu();
    menu.classList.add('show');
    menu.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    isOpen = true;
  }

  function closeMenu() {
    menu.classList.remove('show', 'up', 'down');
    menu.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
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

  toggleBtn.addEventListener('click', (e) => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    closeAllDropdownsExcept(dropdown);
    expanded ? closeMenu() : openMenu();
    e.stopPropagation();
  });

  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      closeAllDropdownsExcept(dropdown);
      openMenu();
       items[0]?.focus();
    }
  });

 menu.addEventListener('keydown', (e) => {
    const itemsArray = Array.from(items);
    const currentIndex = itemsArray.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex === -1) {
        itemsArray[0]?.focus();
      } else {
        itemsArray[(currentIndex + 1) % itemsArray.length]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === -1) {
        itemsArray[itemsArray.length - 1]?.focus();
      } else {
        itemsArray[(currentIndex - 1 + itemsArray.length) % itemsArray.length]?.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      toggleBtn.focus();
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

  // Make sure all items are focusable
  items.forEach(item => {
    item.setAttribute('tabindex', '-1');
  });
    });
    wrapper.append(...items);
    block.append(wrapper);
}