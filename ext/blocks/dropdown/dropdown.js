export default function decorate(block) {
  const label = block.dataset.label || 'Select an Option';

  // Create dropdown wrapper
  const dropdown = document.createElement('div');
  dropdown.className = 'tui__dropdown';

  dropdown.innerHTML = `
    <span class="lp__dropdown_label sr-only" id="sr-regiontitle">
      ${label} <span class="sr-only">On selection, leaving this page</span>
    </span>
    <button
      class="tui__dropdown_toggle"
      aria-haspopup="true"
      aria-expanded="false"
      aria-describedby="sr-regiontitle sr-regionbtn"
      id="sr-regionbtn"
      role="button"
    >${label}</button>
    <div class="tui__dropdown_menu" aria-describedby="sr-regiontitle" role="menu">
      <ul role="menu" class="tui__secondary_dropdown_menu"></ul>
    </div>
  `;

  const toggle = dropdown.querySelector('.tui__dropdown_toggle');
  const content = dropdown.querySelector('.tui__dropdown_menu');
  const menuList = dropdown.querySelector('ul');

  // Move <a> links from original block into dropdown items
  const links = block.querySelectorAll('a');
  links.forEach((link) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'menuitem');
    li.setAttribute('tabindex', '-1');
    link.classList.remove('button');
    li.appendChild(link);
    menuList.appendChild(li);
  });

  const items = menuList.querySelectorAll('li');

  // Toggle dropdown open/close
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    content.style.display = expanded ? 'none' : 'block';
    if (!expanded && items.length > 0) items[0].focus();
  });

  // Keyboard navigation: open on ArrowDown
  toggle.addEventListener('keydown', (evt) => {
    if (evt.key === 'ArrowDown' || evt.keyCode === 40) {
      evt.preventDefault();
      if (items.length > 0) items[0].focus();
    }
  });

  // Keyboard navigation inside list
  items.forEach((item, index) => {
    item.addEventListener('keydown', (evt) => {
      if (evt.key === 'ArrowDown' || evt.keyCode === 40) {
        evt.preventDefault();
        const nextIndex = (index + 1) % items.length;
        items[nextIndex].focus();
      } else if (evt.key === 'ArrowUp' || evt.keyCode === 38) {
        evt.preventDefault();
        const prevIndex = (index - 1 + items.length) % items.length;
        items[prevIndex].focus();
      } else if (evt.key === 'Escape' || evt.keyCode === 27) {
        toggle.focus();
        toggle.setAttribute('aria-expanded', 'false');
        content.style.display = 'none';
      }
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      content.style.display = 'none';
    }
  });

  // Inject dropdown into block
  block.innerHTML = '';
  block.appendChild(dropdown);
}
