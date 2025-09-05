import { fetchPlaceholders } from '../../scripts/aem.js';
import { getLanguage, getFormattedDates } from '../../scripts/utils.js';
import { div, a, p, img, picture, source } from '../../scripts/dom-helpers.js';

const langCode = getLanguage();
const globalProperties = await fetchPlaceholders();
const langMap = globalProperties.langMap || '[{"code": "en", "name": "English"}]';
const langName = JSON.parse(langMap).find((lang) => lang.code === langCode)?.name || 'English';

const showSpinner = (container) => container.append(div({ class: 'spinner-container' }, div({ class: 'spinner' })));
const removeSpinner = (container) => container.querySelector('.spinner-container')?.remove();
const hasDivContent = (el) => el?.textContent.trim().length > 0 || el?.children.length > 0;

async function fetchInlineSearchData(url, method = 'GET', headers = {}, body = null) {
  try {
    const options = { method, headers: { ...headers }, redirect: 'follow' };
    if (method === 'POST' && body) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
}

function getActualValue(value) {
  if (typeof value === 'string') return value;

  if (value?.['cdata!']) return value['cdata!'];

  if (Array.isArray(value) && value[0]?.['cdata!']) return value[0]['cdata!'];

  return '';
}

function seeAllButton(block, cls) {
  const seeAllButtonLabel = block.children[6]?.textContent.trim() || 'See All';
  const seeAllLink = block.children[7]?.textContent.trim() || '';
  
  if (seeAllButtonLabel && seeAllLink) {
    return div({ class: cls }, p({ class: 'button-container' }, a({ class: 'see-all-link button', href: seeAllLink }, seeAllButtonLabel)));
  } else {
    return '';
  }
}

function createMiniCard(type, heading, link, date, image) {
  const card = div({ class: 'mini-card' },
    div({ class: 'mc-text-wrapper' },
      type ? div({ class: 'mini-card-tag' }, p(type)) : '',
      a({ href: link }, div({ class: 'mini-card-title' }, p(heading))),
      div({ class: 'date-time-info' }, date ? div({ class: 'mini-card-date' }, p(date)) : '')
    )
  );

  if (image) {
    const pictureElement = picture({},
      source({ media: '(min-width: 600px)', type: 'image/webp', srcset: image }),
      source({ type: 'image/webp', srcset: image }),
      source({ media: '(min-width: 600px)', srcset: image }),
      img({ loading: 'lazy', alt: heading, title: heading, src: image, width: '250', height: '150' })
    );
    card.append(a({ href: link }, div({ class: 'mini-card-image' }, pictureElement)));
  }

  return card;
}

async function fetchSearchData(type, url, method, overridePostData) {
  const commonOptions = {
    events: {
      headers: {},
      body: {
        query: '',
        filter: `(contentType: ANY("Event") OR contentType: ANY("Event Series")) AND language: ANY("${langName}")`,
        pageSize: 20,
        offset: 0,
        orderby: 'eventStartDate desc',
        count: true,
        summarization: false,
        siteName: 'ibrdevents',
        facetSpecs: []
      }
    },
    blogs: {
      headers: {
        'ocp-apim-subscription-key': 'a02440fa123c4740a83ed288591eafe4',
      },
      body: {
        search: '*',
        facets: [],
        filter: `language eq '${langName}'`,
        top: 20,
        skip: 0,
        orderby: 'blogDate desc',
        count: true
      }
    }
  };

  const { headers = {}, body = {} } = commonOptions[type] || {};
  return fetchInlineSearchData(url, method, headers, overridePostData || body);
}

async function updateDatesTranslation(data, key, dateProp) {
  const items = data?.[key];
  if (!items) return data;

  const dates = Object.values(items).map(item => item?.[dateProp] || '');
  const { dateArray = [] } = await getFormattedDates(dates, langCode) || {};

  Object.keys(items).forEach((k, i) => {
    if (dateArray[i]) items[k][dateProp] = dateArray[i];
  });

  return data;
}

function populateItems(items, wrapper, getCardProps) {
  items.forEach(item => {
    const { type, title, link, date, image } = getCardProps(item);
    wrapper.append(createMiniCard(type, title, link, date, image));
  });
}

async function decorateSearch(type, wrapper, data, displayItems) {
  let items = [];

  if (type === 'events' && data.SearchResults?.length) {
    const structured = data.SearchResults.reduce((acc, doc) => {
      const d = doc.document;
      if (d?.id && d.structData) acc[d.id] = d.structData;
      return acc;
    }, {});
    data.SearchResults = structured;

    const updatedData = await updateDatesTranslation(data, 'SearchResults', 'eventStartDate');
    items = Object.values(updatedData.SearchResults).slice(0, displayItems);

    populateItems(items, wrapper, item => ({
      type: item.contentType,
      title: item.eventTitle,
      link: item.publishPath,
      date: item.eventStartDate,
      image: item.s7ThumbnailPath || item.eventCardImageReference
    }));
  }

  if (type === 'blogs' && data.value?.length) {
    const updated = await updateDatesTranslation(data, 'value', 'blogDate');
    items = updated.value.slice(0, displayItems);

    populateItems(items, wrapper, item => ({
      type: 'Blog',
      title: item.blogTitle,
      link: item.pagePublishPath,
      date: item.blogDate,
      image: ''
    }));
  }

  if (type === 'news') {
    const updated = await updateDatesTranslation(data, 'documents', 'lnchdt');
    items = Object.values(updated.documents).slice(0, displayItems);

    populateItems(items, wrapper, item => ({
      type: getActualValue(item.conttype),
      title: getActualValue(item.title),
      link: item.url,
      date: item.lnchdt,
      image: ''
    }));
  }

  if (type === 'results') {
    const updated = await updateDatesTranslation(data, 'documents', 'lnchdt');
    items = Object.values(updated.documents).slice(0, displayItems);

    populateItems(items, wrapper, item => ({
      type: '',
      title: getActualValue(item.title),
      link: item.url,
      date: '',
      image: ''
    }));
  }

  if (type === 'projects') {
    const updated = await updateDatesTranslation(data, 'projects', 'boardapprovaldate');
    items = Object.values(updated.projects).slice(0, displayItems);

    populateItems(items, wrapper, item => ({
      type: '',
      title: item.project_name,
      link: item.publishPath || `https://projects.worldbank.org/${langCode}/projects-operations/project-detail/${item.proj_id}`,
      date: '',
      image: ''
    }));
  }
}

export default async function decorate(block) {
  const viewType = block.classList.contains('vertical') ? 'vertical' : 'horizontal';
  const searchType = block.children[0]?.textContent.trim();
  const url = block.children[1]?.textContent.trim();
  const method = block.children[2]?.textContent.trim() === 'true' ? 'POST' : 'GET';
  const body = block.children[3]?.textContent?.trim();
  const parsedBody = (searchType === 'blogs' || searchType === 'events') && body ? JSON.parse(body) : null;
  const displayItems = parseInt(block.children[4]?.textContent.trim() || '3', 10);
  const heading = block.children[5];
  const seeAllButtonElement = seeAllButton(block, 'see-all-link-wrapper-header');

  const miniCardsContainer = div({ class: 'mini-cards' });
  if (viewType === 'horizontal' && hasDivContent(heading)) {
    heading.classList.add('main-heading');
    heading.append(seeAllButton(block, 'see-all-link-wrapper-header'));
    miniCardsContainer.append(heading);
  } else if (viewType === 'vertical' && hasDivContent(heading)) {
    heading.classList.add('main-heading');
    miniCardsContainer.append(heading);
  }

  block.innerHTML = '';
  showSpinner(block);

  try {
    const data = await fetchSearchData(searchType, url, method, parsedBody);
    if (data) {
      const searchResults = data.SearchResults;
      if (searchResults && searchResults.length === 0 && searchType === 'events') {
        removeSpinner(block);
        return;
      }

      const wrapper = div({ class: 'mini-card-container' });
      await decorateSearch(searchType, wrapper, data, displayItems);
      miniCardsContainer.append(wrapper);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    removeSpinner(block);
  }

  if (seeAllButtonElement) {
    miniCardsContainer.append(seeAllButtonElement);
  }

  block.append(miniCardsContainer);
}