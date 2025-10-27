import { div, h2, button, li, ul, a } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const [subtitleEl, ...items] = [...block.children];
  const subtitleText = subtitleEl?.textContent?.trim() || '';
  const wrapper = div({ class: 'lp__browse_location' });

  if (subtitleText) {
    const subtitle = h2();
    subtitle.textContent = subtitleText;
    subtitle.id = 'sr-browse-location';
    block.replaceChild(subtitle, subtitleEl);
  }

  items.forEach((item, index) => {
    item.classList.add('tui__dropdown');
    const [labelEl, linksContainer] = [...item.children];
    const labelText = labelEl?.textContent?.trim() || `Dropdown ${index + 1}`;
    const dropdownId = `sr-region-${index}`;

    // Create toggle button
    const toggleButton = button({
      class: 'tui__dropdown_toggle',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      'aria-labelledby': `${dropdownId}btn sr-browse-location`,
      id: `${dropdownId}btn`,
      role: 'button',
    });
    toggleButton.textContent = labelText;

    // Build the dropdown menu
    const dropdownMenu = div({
      class: 'tui__dropdown_menu',
      role: 'menu',
    });

    const ulEl = ul({ class: 'tui__secondary_dropdown_menu' });

    // Filter out empty/blank links (like `&nbsp;`)
    const linkParagraphs = [...linksContainer.querySelectorAll('p')]
      .filter((p) => p.textContent.trim() && p.querySelector('a'));

    linkParagraphs.forEach((linkP) => {
      const link = linkP.querySelector('a');
      const menuItem = li({ role: 'none' });
      const linkEl = a({
        href: link.href,
        title: link.textContent.trim(),
        class: 'lp__dropdown_item',
        role: 'menuitem',
        tabindex: '-1',
      });
      linkEl.textContent = link.textContent.trim();
      menuItem.append(linkEl);
      ulEl.append(menuItem);
    });

    dropdownMenu.append(ulEl);

    // Clear and rebuild item
    item.textContent = '';
    item.append(toggleButton, dropdownMenu);
  });

  // Attach all toggles & keyboard interaction outside the loop
  items.forEach((dropdown) => {
    const toggleBtn = dropdown.querySelector('.tui__dropdown_toggle');
    const menu = dropdown.querySelector('.tui__dropdown_menu');
    const menuItems = menu.querySelectorAll('[role="menuitem"]');

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
      if (isOpen) return;
      isOpen = true;
      toggleBtn.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.style.display = 'block';
      positionMenu();
      if (menuItems.length > 0) {
        menuItems[0].focus();
      }
    }

    function closeMenu() {
      if (!isOpen) return;
      isOpen = false;
      toggleBtn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.style.display = 'none';
      toggleBtn.focus();
    }

    function toggleMenu() {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    // Toggle button event listeners
    toggleBtn.addEventListener('click', toggleMenu);
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    });

    // Menu item navigation
    menuItems.forEach((menuItem, idx) => {
      menuItem.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIdx = (idx + 1) % menuItems.length;
          menuItems[nextIdx].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIdx = (idx - 1 + menuItems.length) % menuItems.length;
          menuItems[prevIdx].focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          menuItem.click();
        }
      });

      menuItem.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu on window resize
    window.addEventListener('resize', () => {
      if (isOpen) {
        positionMenu();
      }
    });

    // Close menu when focus leaves dropdown
    dropdown.addEventListener('focusout', (e) => {
      if (!dropdown.contains(e.relatedTarget)) {
        closeMenu();
      }
    });
  });

  wrapper.append(...items);
  block.textContent = '';
  block.append(wrapper);
}