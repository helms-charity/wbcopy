import { li, p } from '../../scripts/dom-helpers.js';
import {
  getLanguage, PATH_PREFIX, fetchCountriesList,
} from '../../scripts/utils.js';

const allVal = 'All';

function scrolltab() {
  const minScreenWidth = 320;
  if (window.innerWidth < minScreenWidth) return;

  let scrollAmount = getScrollAmountByScreen(window.innerWidth);

  const alphaTabs = document.querySelector('.alpha-tabs');
  const ul = document.querySelector('.alpha-tabs ul');
  const leftBtn = document.querySelector('.scroll-btn.left');
  const rightBtn = document.querySelector('.scroll-btn.right');

  const isRTL = getComputedStyle(alphaTabs).direction === 'rtl';

  if (!ul.style.left) ul.style.left = '0px';

  const getLeftPosi = () => parseInt(ul.style.left, 10) || 0;
  const widthOfList = () => ul.scrollWidth;

  const widthOfRightHidden = () => {
    const visibleWidth = alphaTabs.clientWidth;
    const totalWidth = widthOfList();
    const leftPos = getLeftPosi();

    return isRTL
      ? totalWidth - visibleWidth - leftPos // RTL
      : totalWidth + leftPos - visibleWidth; // LTR
  };

  const reAdjust = () => {
    const leftPos = getLeftPosi();

    if (widthOfRightHidden() > 1) {
      rightBtn.style.display = 'block';
    } else {
      rightBtn.style.display = 'none';
    }

    if (isRTL) {
      if (leftPos > 0) {
        leftBtn.style.display = 'block';
      } else {
        ul.style.left = '0px';
        leftBtn.style.display = 'none';
      }
    } else {
      if (leftPos < 0) {
        leftBtn.style.display = 'block';
      } else {
        ul.style.left = '0px';
        leftBtn.style.display = 'none';
      }
    }
  };

  reAdjust();

  window.addEventListener('resize', () => {
    scrollAmount = getScrollAmountByScreen(window.innerWidth);

    const leftPos = getLeftPosi();
    const totalWidth = widthOfList();
    const visibleWidth = alphaTabs.clientWidth;
    const minLeft = visibleWidth - totalWidth;
    const maxLeft = 0;

    if (totalWidth <= visibleWidth) {
      ul.style.left = "0px";
    } else {
      if (isRTL) {
        if (leftPos > maxLeft) ul.style.left = "0px";
        else if (leftPos < minLeft) ul.style.left = `${minLeft}px`;
      } else {
        if (leftPos > maxLeft) ul.style.left = "0px";
        else if (leftPos < minLeft) ul.style.left = `${minLeft}px`;
      }
    }

    reAdjust();
  });

  // ➤ Right Button Click
  rightBtn.addEventListener("click", () => {
    const leftPos = getLeftPosi();
    const hiddenRight = widthOfRightHidden();

    if (hiddenRight > 0) {
      const scrollBy = Math.min(scrollAmount, hiddenRight);
      ul.style.transition = "left 0.3s ease";

      if (isRTL) {
        ul.style.left = `${leftPos + scrollBy}px`; // Arabic: move content right
      } else {
        ul.style.left = `${leftPos - scrollBy}px`; // English: move content left
      }

      leftBtn.style.display = 'block';
    }

    setTimeout(reAdjust, 350);
  });

  // ➤ Left Button Click
  leftBtn.addEventListener("click", () => {
    const leftPos = getLeftPosi();
    const scrollBy = Math.min(scrollAmount, Math.abs(leftPos));
    ul.style.transition = "left 0.3s ease";

    if ((isRTL && leftPos > 0) || (!isRTL && leftPos < 0)) {
      if (isRTL) {
        ul.style.left = `${leftPos - scrollBy}px`; // Arabic: move content left
      } else {
        ul.style.left = `${leftPos + scrollBy}px`; // English: move content right
      }

      rightBtn.style.display = "block";
    }

    setTimeout(reAdjust, 350);
  });
}

function getScrollAmountByScreen(width) {
  if (width <= 480) return 60;
  if (width <= 768) return 80;
  if (width <= 1024) return 100;
  return 120;
}

export default function decorate(block) {
  const [allText, ...items] = [...block.children];
  allVal = allText?.textContent?.trim() || 'All';
  const outer = document.createElement('div');
  outer.className = 'lp__browse_country';

  const wrapper = document.createElement('div');
  wrapper.className = 'lp__browse_countrylist';
  wrapper.innerHTML = `
    <div class="alpha-tabs">
    <button class="scroll-btn left" aria-label="Scroll left"><img src="https://www.worldbank.org/content/dam/sites/corporate/img/global/caret-left.svg" alt="prev"></button>
    <div class="alpha-tabs-wrapper">
      <ul></ul>
    </div>
    <button class="scroll-btn right" aria-label="Scroll right"><img src="https://www.worldbank.org/content/dam/sites/corporate/img/global/caret-right.svg" alt="next"></span></button>
    </div>
    <ul class="alpha-list"></ul>`;

  const tabsUl = wrapper.querySelector('.alpha-tabs > .alpha-tabs-wrapper > ul');
  const listUl = wrapper.querySelector('.alpha-list');

  // Map base Arabic letters to display letters
  const arabicDisplayMap = {
    'ا': 'أ', // Display 'ا' as 'أ'
    'ب': 'ب',
    'ت': 'ت',
    'ث': 'ﺙ',
    'ج': 'ج',
    'ح': 'ﺡ',
    'خ': 'ﺥ',
    'د': 'د',
    'ذ': 'ﺫ',
    'ر': 'ر',
    'ز': 'ز',
    'س': 'س',
    'ش': 'ش',
    'ص': 'ص',
    'ض': 'ﺽ',
    'ط': 'ط',
    'ظ': 'ﻅ',
    'ع': 'ع',
    'غ': 'غ',
    'ف': 'ف',
    'ق': 'ق',
    'ك': 'ك',
    'ل': 'ل',
    'م': 'ﻡ',
    'ن': 'ﻥ',
    'ه': 'ه',
    'و': 'و',
    'ي': 'ي'
  };

  // Function to get the base letter for grouping Arabic letters
  function getBaseArabicLetter(letter) {
    if (letter === 'أ' || letter === 'إ' || letter === 'ا') return 'ا';
    // Add more normalization rules if needed
    return letter;
  }

  fetchCountriesList().then((countries) => {
    const seenLetters = new Set();
    const insertedLetters = new Set();

    countries.forEach(({ Label: label, Name: name, Show: show }) => {
      if (!label || !name) return;
      if (show === 'No') return;

      label = label.replace(/href="([^"]+)"/g, (match, url) => {
        let fixedUrl = url.replace(/^http:\/\//, 'https://');
        fixedUrl = fixedUrl.replace(/([^:])\/\/+/g, '$1/');
        return `href="${fixedUrl}"`;
      });

      const langCode = getLanguage();
      const locale = langCode === 'ru' ? 'ru-RU' : langCode === 'ar' ? 'ar-EG' : 'en-US';

      let firstLetter = name.trim().charAt(0)
        .toLocaleUpperCase(locale)
        .normalize('NFC');

      // For Arabic, normalize to base letter
      if (langCode === 'ar') {
        firstLetter = getBaseArabicLetter(firstLetter);
      }

      if (!insertedLetters.has(firstLetter)) {
        insertedLetters.add(firstLetter);
        seenLetters.add(firstLetter);

        if (firstLetter !== 'A' && firstLetter !== 'أ' && firstLetter !== 'ا') {
          const separatorDiv = document.createElement('div');
          separatorDiv.className = 'separator';
          listUl.appendChild(separatorDiv);
        }

        const headingEl = p({});
        headingEl.className = 'alpha-alphabet';
        headingEl.setAttribute('role','heading');
        headingEl.setAttribute('aria-level','3');

        // For Arabic show mapped display letter, else show letter itself
        headingEl.textContent = (langCode === 'ar' && arabicDisplayMap[firstLetter])
          ? arabicDisplayMap[firstLetter]
          : firstLetter;

        headingEl.dataset.letter = firstLetter;
        listUl.appendChild(headingEl);
      }

      const itemLi = li({});
      itemLi.className = 'alpha-list-group';
      itemLi.innerHTML = label;
      itemLi.dataset.letter = firstLetter;
      listUl.appendChild(itemLi);
    });

    convertAlphaListGroups(wrapper);
    buildTabs(tabsUl, seenLetters);

    // Keyboard navigation
    tabsUl.addEventListener('keydown', (e) => {
      const tabs = Array.from(tabsUl.querySelectorAll('.alpha-tab:not(.disabled)'));
      const current = document.activeElement;
      const idx = tabs.indexOf(current);
      if (idx === -1) return;

      let nextIdx = idx;
      if (e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % tabs.length;
        tabs[nextIdx].focus();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + tabs.length) % tabs.length;
        tabs[nextIdx].focus();
        e.preventDefault();
      } else if (e.key === 'Home') {
        tabs[0].focus();
        e.preventDefault();
      } else if (e.key === 'End') {
        tabs[tabs.length - 1].focus();
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        current.click();
        e.preventDefault();
      }
    });

    // Tab click handling
    tabsUl.addEventListener('click', (e) => {
      const tab = e.target.closest('.alpha-tab');
      if (!tab || tab.classList.contains('disabled')) return;

      tabsUl.querySelectorAll('.alpha-tab.active').forEach((t) => {
        t.classList.remove('active');
        // t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });

      tab.classList.add('active');
      // tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      tab.focus();
      filterByLetter(tab.dataset.letter, wrapper);
    });

    filterByLetter(allVal, wrapper);

    // === Scroll Button Setup ===

    scrolltab();



  });

  outer.appendChild(wrapper);
  block.innerHTML = '';
  block.appendChild(outer);

  /* ---------- Build A–Z tab bar ---------- */
  function buildTabs(tabsUl, seenLetters) {
    const makeTab = (label, datasetLetter, disabled = false) => {
      const el = document.createElement('li');
      el.className = 'alpha-tab' + (disabled ? ' disabled' : '');
      el.textContent = label;
      el.dataset.letter = datasetLetter;
      //el.role = 'tab';
      if (label !== allVal) {
        el.tabIndex = -1;
        //el.setAttribute('aria-selected', 'false');
      } else {
        el.tabIndex = 0;
        //el.setAttribute('aria-selected', 'true');
      }
      return el;
    };

    tabsUl.appendChild(makeTab(allVal, allVal)).classList.add('active');

    const langCode = getLanguage();
    let letters = [];

    if (langCode === 'ar') {
      // Use the keys of arabicDisplayMap as base letters for tabs
      letters = Object.keys(arabicDisplayMap);
    } else if (langCode === 'ru') {
      for (let i = 1040; i <= 1071; i++) {
        letters.push(String.fromCharCode(i));
      }
    } else {
      for (let i = 65; i <= 90; i++) {
        letters.push(String.fromCharCode(i));
      }
    }

    letters.forEach((letter) => {
      const disabled = !seenLetters.has(letter);
      // For Arabic, display mapped letter but dataset uses base letter
      const displayLetter = langCode === 'ar' ? arabicDisplayMap[letter] || letter : letter;
      tabsUl.appendChild(makeTab(displayLetter, letter, disabled));
    });
  }

  /* ---------- Show/hide countries and headings ---------- */
  function filterByLetter(letter, root) {
    root.querySelectorAll('.alpha-list-group').forEach((li) => {
      li.style.display = letter === allVal || li.dataset.letter === letter ? '' : 'none';
    });

    root.querySelectorAll('.alpha-alphabet').forEach((h) => {
      h.style.display = letter === allVal || h.dataset.letter === letter ? '' : 'none';
    });

    const separatorDivs = root.querySelectorAll('.separator');
    separatorDivs.forEach(div => {
      div.style.display = letter === allVal ? '' : 'none';
    });
  }

 function convertAlphaListGroups(root = document) {
  root.querySelectorAll('li.alpha-list-group').forEach((li) => {
    // Top-level anchor remains unwrapped

    li.querySelectorAll(':scope > ul > li').forEach((langLi) => {
      const langAnchor = langLi.querySelector('a');
      if (!langAnchor) return;

      // ✅ Move lang="" from <a> to <li>
      const code = langAnchor.getAttribute('lang') || '';
      if (code) {
        langLi.setAttribute('lang', code);
        langAnchor.removeAttribute('lang');
      }

      // ✅ Update Arabic label if needed
      if (code.trim() === 'ar') {
        langAnchor.textContent = "عربي";
      }
    });
  });
}

}
