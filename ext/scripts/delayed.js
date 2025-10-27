// add delayed functionality here
import {
  getMetadata, loadScript, fetchPlaceholders,
  sampleRUM,
} from './aem.js';
import {
  a, span, i,
} from './dom-helpers.js';
import {
  isInternalPage, scriptEnabled, PATH_PREFIX, formatDate, getLanguage,
} from './utils.js';

async function getUserIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || '';
  } catch (e) {
    // console.error('IP fetch failed', e);
    return '';
  }
}
async function renderWBDataLayer() {
  const config = await fetchPlaceholders(PATH_PREFIX);
  const lastPubDateStr = getMetadata('published-time');
  const firstPubDateStr = getMetadata('content_date') || lastPubDateStr;
  const userIp = await getUserIp();
  let bUnit = getMetadata('originating_unit');
  if (bUnit && bUnit.length > 0) {
    bUnit = bUnit.substring(bUnit.lastIndexOf(',') + 1).trim();
  }
  let siteSection = getMetadata('site_section');
  if (!siteSection || siteSection.length < 1) {
    siteSection = getMetadata('pagename');
    const match = siteSection.match(/:(.*)/);
    siteSection = match ? match[1] : null;
  }
  window.wbgData.page = {
    pageInfo: {
      pageCategory: getMetadata('pagecategory'),
      channel: getMetadata('channel'),
      contentType: getMetadata('content_type'),
      pageUid: getMetadata('pageuid'),
      pageName: getMetadata('pagename'),
      pageFirstPub: formatDate(firstPubDateStr),
      pageLastMod: formatDate(lastPubDateStr),
      webpackage: getMetadata('webpackage_id') || '',
      topicTag: getMetadata('topic_tag') || '',
      hier1: getMetadata('hier1') || '',
    },
    sectionInfo: {
      siteSection: getMetadata('site_section') || siteSection || '',
      subsectionP2: getMetadata('subsectionp2') || '',
      subsectionP3: getMetadata('subsectionp3') || '',
      subsectionP4: getMetadata('subsectionp4') || '',
      subsectionP5: getMetadata('subsectionp5') || '',
    },
  };

  window.wbgData.site = {
    siteInfo: {
      siteLanguage: getLanguage() || 'en',
      siteType: config.analyticsSiteType || 'main',
      siteEnv: config.environment || 'Dev',
      siteCountry: getMetadata('site_country') || '',
      siteRegion: getMetadata('site_region') || '',
      userIpaddressType: userIp,
    },

    techInfo: {
      cmsType: config.analyticsCmsType || 'aem edge',
      bussVPUnit: bUnit || config.analyticsBussvpUnit || 'ecr',
      bussUnit: getMetadata('buss_unit') || bUnit || config.originating_unit || 'ecrcc',
      bussUserGroup: config.analyticsBussUserGroup || 'external',
      bussAgency: config.analyticsBussAgency || 'ibrd',
    },
  };
}

/**
 * Swoosh on page
 */

// Adobe Target
window.targetGlobalSettings = {
  bodyHidingEnabled: false,
};

function pageSwoosh() {
  const pSwoosh = getMetadata('page-swoosh');
  if (!pSwoosh || pSwoosh.length < 1) return;
  if (pSwoosh !== 'page-swoosh-no') {
    document.body.classList.add(pSwoosh);
  } else {
    document.body.classList.remove(pSwoosh);
  }
}

// refactor tweetable links function
/**
 * Opens a popup for the Twitter links autoblock.
 */
function openPopUp(popUrl) {
  const popupParams = `height=450, width=550, top=${(window.innerHeight / 2 - 275)}`
   + `, left=${(window.innerWidth / 2 - 225)}`
   + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
  window.open(popUrl, 'fbShareWindow', popupParams);
}

/**
 * Finds and decorates anchor elements with Twitter hrefs
 */
function buildTwitterLinks() {
  const main = document.querySelector('main');
  if (!main) return;

  // get all paragraph elements
  const paras = main.querySelectorAll('p');
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);

  [...paras].forEach((paragraph) => {
    const tweetables = paragraph.innerHTML.match(/&lt;tweetable[^>]*&gt;([\s\S]*?)&lt;\/tweetable&gt;/g);
    if (tweetables) {
      tweetables.forEach((tweetableTag) => {
        const matchedContent = tweetableTag.match(
          /&lt;tweetable(?:[^>]*data-channel=['"]([^'"]*)['"])?(?:[^>]*data-hashtag=['"]([^'"]*)['"])?[^>]*&gt;([\s\S]*?)&lt;\/tweetable&gt;/,
        );
        const channel = matchedContent[1] || '';
        const hashtag = matchedContent[2] || '';
        const tweetContent = matchedContent[3];

        let modalURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`
          + `&original_referrer=${encodedUrl}&source=tweetbutton`;
        if (channel) modalURL += `&via=${encodeURIComponent(channel.charAt(0) === '@' ? channel.substring(1) : channel)}`;
        if (hashtag) modalURL += `&hashtags=${encodeURIComponent(hashtag)}`;

        const tweetableEl = span(
          { class: 'tweetable' },
          a({ href: modalURL, target: '_blank', tabindex: 0 }, tweetContent, i({ class: 'lp lp-twit' })),
        );
        paragraph.innerHTML = paragraph.innerHTML.replace(tweetableTag, tweetableEl.outerHTML);
      });
    }
    [...paragraph.querySelectorAll('.tweetable > a')].forEach((twitterAnchor) => {
      twitterAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        const apiURL = twitterAnchor.href;
        openPopUp(apiURL);
      });
    });
  });
}

async function loadAdobeLaunch() {
  if (!scriptEnabled()) { return; }

  const config = await fetchPlaceholders(PATH_PREFIX);
  const env = config.environment || 'Dev';
  await loadScript(config[`analyticsEndpoint${env}`]);
}

async function removeTitleAttrFromButtons() {
  const buttons = document.querySelectorAll('.button-container .button');
  buttons.forEach((button) => {
    if (button.hasAttribute('title')) {
      button.removeAttribute('title');
    }
  });
}

async function loadDelayed() {
  pageSwoosh();
  buildTwitterLinks();
  sampleRUM('cwv');
  if (!isInternalPage()) {
    renderWBDataLayer();
    await loadAdobeLaunch();
  }
  await removeTitleAttrFromButtons();
}
loadDelayed();
