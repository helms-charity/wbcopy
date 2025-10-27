import { fetchPlaceholders } from '../../scripts/aem.js';
import { COLOR_MAP } from '../../scripts/theme.js';
import { LINE_CHART_OPTIONS } from '../../scripts/constants.js';
import { getLanguage, PATH_PREFIX } from '../../scripts/utils.js';
import { formatNumberOnUnitMeasure, formatUnitMeasure, loadHighchartsScript } from '../../scripts/helpers.js';
import {
  fetchIndicatorNames,
  fetchLineChartData,
  fetchIndicatorValue,
  fetchIndicatorMetadata,
} from '../../scripts/api.js';
import { CLASS_MAIN_HEADING } from '../../scripts/scripts.js';
import { div } from '../../scripts/dom-helpers.js';

const globalProperties = await fetchPlaceholders(PATH_PREFIX);

function getRegionToFetch(selector) {
  return selector ? selector.trim() : '';
}

async function createLeftChart(block, Highcharts, config, selector) {
  const { indicatorId, categoryName } = config;
  const apiKeyName = globalProperties?.apiKeyName || '';
  const apiKeyValue = globalProperties?.apiKeyValue || '';
  const pageType = config?.pageType || '';

  const langCode = getLanguage();
  const isRTL = langCode === 'ar';

  const indicatorNameEndpoint = globalProperties?.metadataApiEndpoint;
  const indicatorMetadata = await fetchIndicatorMetadata(
    indicatorNameEndpoint,
    [indicatorId],
    pageType,
    {
      accept: 'application/json',
      'content-type': 'application/json',
      [apiKeyName]: apiKeyValue,
    },
  );
  const datasetId = indicatorMetadata?.series_description?.database_id || '';
  const urlsForLineChart = {
    data: globalProperties?.dataApiEndpoint,
    disaggregation: globalProperties?.disaggregationApiEndpoint,
  };

  const regionToFetch = getRegionToFetch(selector);
  const { indicatorData, disaggregationData } = await fetchLineChartData(urlsForLineChart, {
    pageType,
    datasetId,
    indicatorId,
    regionCode: regionToFetch,
  });
  const data = indicatorData[0] || {};
  const yAxisRaw = data?.data?.yAxis || [];
  const yAxis = yAxisRaw.map((val) => (val === 'null' ? null : parseFloat(val)));

  let latestValue = null;
  let secondLatestValue = null;
  for (let i = yAxis.length - 1; i >= 0; i--) {
    if (yAxis[i] != null && latestValue === null) {
      latestValue = yAxis[i];
    } else if (yAxis[i] != null && latestValue !== null && secondLatestValue === null) {
      secondLatestValue = yAxis[i];
    }
    if (latestValue !== null && secondLatestValue !== null) break;
  }
  const hasIncreased = latestValue !== null && secondLatestValue !== null
    ? latestValue > secondLatestValue
    : null;

  const xAxis = data?.data?.xAxis || [];
  const unitMeasure = data?.unitMeasure || '';
  const decimals = data?.decimals || 0;
  const unitMeasureFilter = disaggregationData?.find((filter) => filter.filterName === 'UNIT_MEASURE');
  const unitMeasureName = unitMeasureFilter?.filterValues?.[0]?.name || unitMeasure;
  const latestYear = xAxis.length ? xAxis[xAxis.length - 1] : '';
  const indicatorName = config.indicatorMap[indicatorId]?.name || indicatorMetadata?.series_description?.name || indicatorId;
  const unitMeasureDisplay = config.indicatorMap[indicatorId]?.unitMeasure || formatUnitMeasure(unitMeasure, unitMeasureName);

  const headerHtml = `
    <div class="data-indicator-title">
      ${config?.indicatorRedirectUrl && config?.indicatorRedirectUrl.trim() ? 
        `<a href="${config?.indicatorRedirectUrl}${indicatorId}">
          ${formatNumberOnUnitMeasure(latestValue, unitMeasure, decimals)} ${unitMeasureDisplay}
          ${hasIncreased !== null ? `<i class="lp lp-arrow-${hasIncreased ? 'up' : 'down'}" aria-label="${hasIncreased ? 'Value increased from previous year' : 'Value decreased from previous year'}"></i>` : ''}
        </a>` : 
        `<div>
        ${formatNumberOnUnitMeasure(latestValue, unitMeasure, decimals)} ${unitMeasureDisplay}
       ${hasIncreased !== null ? `<i class="lp lp-arrow-${hasIncreased ? 'up' : 'down'}" aria-label="${hasIncreased ? 'Value increased from previous year' : 'Value decreased from previous year'}"></i>` : ''}
    </div>`}
    </div>
    <p class="data-indicator-description">${indicatorName}, ${latestYear}</p>
  `;

  const chartId = `lifeChart-${regionToFetch}`;
  const dataIndicatorChart = document.createElement('div');
  dataIndicatorChart.className = 'data-indicator-chart';
  dataIndicatorChart.innerHTML = `
    <div class="data-indicator-header">
      ${headerHtml}
    </div>
    <div class="data-indicator-block" id="${chartId}"></div>
    <div class="data-indicator-flip">${config?.sourceLabel}</div>
  `;

    const sources = indicatorMetadata?.series_description?.sources || [];
    const sourceContent = sources.map((item, index) => {
      const sourceText = item.uri
        ? `<a href="${item.uri}" target="_blank">${item.source || (item.name ? `${item.name}, ${item.organization}` : item.organization)}</a>`
        : item.source || (item.name ? `${item.name}, ${item.organization}` : item.organization);
      return index > 0 ? `; ${sourceText}` : sourceText;
    }).join('');

    const datasetName = indicatorMetadata?.series_description?.database_name || '';
    const datasetUrl = `${config?.datasetRedirectUrl}${indicatorMetadata?.series_description?.database_id}`;

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'data-indicator-source';
    sourceDiv.innerHTML = `
      <button class="close-icon" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19.08 21.9134C19.8622 22.6955 21.1303 22.6955 21.9124 21.9134C22.6946 21.1312 22.6946 19.8631 21.9124 19.081L14.8314 12L21.9123 4.91901C22.6945 4.13686 22.6945 2.86875 21.9123 2.08661C21.1302 1.30446 19.8621 1.30446 19.0799 2.08661L11.999 9.16756L4.9181 2.08661C4.13596 1.30447 2.86785 1.30447 2.08571 2.08661C1.30357 2.86876 1.30357 4.13687 2.08571 4.91901L9.16664 12L2.08563 19.081C1.30349 19.8631 1.30349 21.1312 2.08563 21.9134C2.86777 22.6955 4.13587 22.6955 4.91802 21.9134L11.999 14.8324L19.08 21.9134Z" fill="#000D1A" fill-opacity="0.7"></path>
        </svg>
      </button>
      <div>
        <p class="tui__sm_title">${config?.sourceLabel}: ${sourceContent}</p>
        <p class="tui__sm_title">${config?.datasetLabel}: <a href="${datasetUrl}">${datasetName}</a></p>
        <p><a href="${config?.data360URL}" class="button">${config?.data360ButtonText}</a></p>
      </div>
    `;
    dataIndicatorChart.appendChild(sourceDiv);

    const sourceLink = dataIndicatorChart.querySelector('.data-indicator-flip');
    sourceLink.addEventListener('click', (e) => {
      e.preventDefault();
      dataIndicatorChart.classList.add('hover');
   });

   sourceDiv.querySelector('.close-icon').addEventListener('click', (e) => {
    e.preventDefault();
    dataIndicatorChart.classList.remove('hover');
  });

  block.appendChild(dataIndicatorChart);

  const series = [{
    name: categoryName,
    data: yAxis,
    color: COLOR_MAP[regionToFetch],
    lineWidth: 2,
    marker: { enabled: false },
    connectNulls: true,
  }];

  const lineChartOptions = {
    ...LINE_CHART_OPTIONS,
    chart: { type: 'line', backgroundColor: null },
    lang: {
      accessibility: {
        svgContainerLabel: `${indicatorName} line chart showing data for ${regionToFetch}`
      }
    },
    title: { text: null },
    subtitle: { text: null },
    xAxis: {
      categories: xAxis,
      reversed: isRTL,
      labels: {
        style: { color: 'rgba(0,0,0,0.6)', fontSize: '12px' },
        formatter() {
          if (this.isFirst) return this.value;
          if (this.isLast) return `<span style="padding-right: 10px;">${this.value}</span>`;
          return '';
        },
        align: 'center',
        x: 0,
        y: 20,
      },
      lineColor: 'transparent',
      tickColor: '#ecf0f1',
      tickPositioner() {
        return [0, this.categories.length - 1];
      },
      tickPosition: 'middle',
      tickAmount: 2,
      gridLineWidth: 0,
      tickmarkPlacement: 'on',
      tickLength: 8,
      tickWidth: 1,
    },
    yAxis: {
      title: { text: null },
      gridLineColor: '#c2d0dd',
      gridLineDashStyle: 'Dash',
      plotLines: [{
        color: 'rgba(0, 0, 0, 0.22)',
        dashStyle: 'Dash',
        width: 1,
        value: Math.max(...yAxis),
        zIndex: 5,
        label: { text: '', align: 'right' },
      }],
      tickPositions: [Math.min(...yAxis) || 0, Math.max(...yAxis)],
      endOnTick: false,
      startOnTick: false,
      lineWidth: 0,
      gridLineWidth: 1,
      tickWidth: 0,
      labels: {
        style: { color: 'rgba(0,0,0,0.6)', fontSize: '12px' },
        formatter() {
          return formatNumberOnUnitMeasure(this.value, unitMeasure, decimals);
        },
      },
      opposite: isRTL,
    },
    tooltip: {
      ...LINE_CHART_OPTIONS.tooltip,
      useHTML: true,
      backgroundColor: null,
      borderWidth: 0,
      shadow: false,
      style: { 
        padding: 0,
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left',
      },
      formatter() {
        const title = `<div class="tui_chart_tooltip_title" style="font-size: 14px; font-weight: 600; line-height: 16px; color: rgba(0, 0, 0, 0.87); padding-bottom: 4px; margin-bottom: 4px; border-bottom: 1px solid #CED4DE; text-align: ${isRTL ? 'right' : 'left'};">${this?.points?.[0]?.category}</div>`;
        const point = this?.points?.[0];
        const symbol = '●';
        const symbolStyle = `font-size: 17px; color: ${point.color}; margin-${isRTL ? 'left' : 'right'}: 8px; vertical-align: middle; display: inline-block;`;
        const ulStyle = `
        padding-${isRTL ? 'right' : 'left'}: 0;
        list-style: none;
        margin: 0;
        `;
        const pointHtml = `
          <li style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; direction: ${isRTL ? 'rtl' : 'ltr'};">
            <div class="tooltip_country" style="display: flex; align-items: center; min-width: 150px; padding-${isRTL ? 'left' : 'right'}: 10px;">
              <span style="${symbolStyle}">${symbol}</span>
              ${point.series.name}
            </div>
            <span class="tooltip_value" style="font-size: 16px; font-weight: 700; line-height: 20px; color: rgba(0, 0, 0, 0.87);">
              ${formatNumberOnUnitMeasure(point.y, unitMeasure, decimals)} ${unitMeasureDisplay}
            </span>
          </li>`;
        return `<div class="tui_chart_tooltip" style="border: 0.5px solid #CED4DE; background: #FFF; padding: 6px 8px; box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.15); width: auto; direction: ${isRTL ? 'rtl' : 'ltr'};">
                  ${title}
                  <ul style="${ulStyle}">${pointHtml}</ul>
                </div>`;
      },
    },
    series: series,
    legend: { 
      enabled: false,
      align: isRTL ? 'right' : 'center',
      layout: 'horizontal',
      verticalAlign: 'bottom',
    },
    credits: { enabled: false },
  };

  // Check if element exists before creating chart with retry logic
  const chartElement = document.getElementById(chartId);
  
  if (chartElement) {
    // Element is available, create chart immediately
    Highcharts.chart(chartId, lineChartOptions);
  } else {
    // Element not found, create interval to retry
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = 100; // 100ms intervals
    
    const retryTimeout = setInterval(() => {
      retryCount++;
      const element = document.getElementById(chartId);
      
      if (element) {
        // Element found, create chart and clear interval
        Highcharts.chart(chartId, lineChartOptions);
        clearInterval(retryTimeout);
      } else if (retryCount >= maxRetries) {
        // Max retries reached, clear interval and log warning
        clearInterval(retryTimeout);
        console.warn(`Chart element ${chartId} not found after ${maxRetries} retries`);
      }
    }, retryInterval);
  }
}


async function createRightIndicators(block, config, selector) {
  const apiKeyValue = globalProperties?.apiKeyValue || '';
  const apiKeyName = globalProperties?.apiKeyName || '';
  const indicatorNameEndpoint = globalProperties?.metadataApiEndpoint;
  const pageType = config?.pageType || '';
  const indicatorNames = await fetchIndicatorNames(indicatorNameEndpoint, pageType, config?.indicatorIdsRightPanel, {
    accept: 'application/json',
    'content-type': 'application/json',
    [apiKeyName]: apiKeyValue,
  });

  const regionToFetch = getRegionToFetch(selector);

  const indicatorListData = await Promise.all(
    config?.indicatorIdsRightPanel.map(async (id) => {
      const datasetId = indicatorNames[id]?.database_id || '';
      const urlsForIndicatorValue = {
        data: globalProperties?.dataApiEndpoint,
        disaggregation: globalProperties?.disaggregationApiEndpoint,
      };

      const { indicatorData } = await fetchIndicatorValue(urlsForIndicatorValue, { 
        pageType,
        datasetId, 
        indicatorId: id, 
        regionCode: regionToFetch 
      });
      const unitMeasure = indicatorData?.unitMeasure || '';
      const decimals = indicatorData?.decimals || 0;
      const yAxisRaw = indicatorData?.data?.yAxis || [];
      const yAxis = yAxisRaw.map((val) => (val === 'null' ? null : parseFloat(val)));

      let latestValue = null;
      let secondLatestValue = null;
      for (let i = yAxis.length - 1; i >= 0; i--) {
        if (yAxis[i] != null && latestValue === null) {
          latestValue = yAxis[i];
        } else if (yAxis[i] != null && latestValue !== null && secondLatestValue === null) {
          secondLatestValue = yAxis[i];
        }
        if (latestValue !== null && secondLatestValue !== null) break;
      }
      const hasIncreased = latestValue !== null && secondLatestValue !== null
        ? latestValue > secondLatestValue
        : null;
      const value = latestValue !== null ? formatNumberOnUnitMeasure(latestValue, unitMeasure, decimals) : 'N/A';

      return {
        id,
        label: config.indicatorMap[id]?.name || indicatorNames[id]?.name || id,
        value,
        hasIncreased,
      };
    })
  );

  const filteredIndicatorListData = indicatorListData.filter(stat => stat.value !== 'N/A');

  const dataIndicatorWrapper = document.createElement('div');
  dataIndicatorWrapper.className = 'data-indicator-wrapper';
  const listItems = filteredIndicatorListData.map(stat => `
    <li class="data-indicator-item">
      <div class="data-indicator-listtitle">
        ${config?.indicatorRedirectUrl && config?.indicatorRedirectUrl.trim() ? 
          `<a href="${config?.indicatorRedirectUrl}${stat.id}">${stat.label}</a>` : 
        `<div>${stat.label}</div>`}
      </div>
      <p class="data-indicator-value">${stat.value}</p>
      <div class="${stat.hasIncreased !== null ? (stat.hasIncreased ? 'data-up-arrow' : 'data-down-arrow') : ''}" role="img" aria-label="${stat.hasIncreased !== null ? (stat.hasIncreased ? 'Value increased from previous year' : 'Value decreased from previous year') : ''}"></div>
    </li>
  `).join('');
  dataIndicatorWrapper.innerHTML = `<ul class="data-indicator-list">${listItems}</ul>`;
  block.appendChild(dataIndicatorWrapper);
}

const loaderMarkup = `
  <div class="loader-wrapper" style="display: flex; justify-content: center; align-items: center; height: 100%;">
    <img
      class="ajax-loader-1"
      src="https://www.worldbank.org/content/dam/wbr-redesign/logos/ajax.gif"
      alt="loader"
    />
  </div>
`;

export default async function decorate(block) {
  const [
    pageType,
    selector, 
    title, linkText, link,
    CategoryName,
    sourceLabel,
    datasetLabel,
    data360ButtonText,
    ...indicatorItems
  ] = [...block.children];

  const indicatorMap = {};
  const indicatorIds = [];
  indicatorItems.forEach((item) => {
    const id = item.querySelector('div:nth-child(1) p')?.textContent?.trim();
    const name = item.querySelector('div:nth-child(2) p')?.textContent?.trim();
    const unitMeasure = item.querySelector('div:nth-child(3) p')?.textContent?.trim();
    if (id) {
      indicatorMap[id] = { name, unitMeasure };
      indicatorIds.push(id);
    }
  });

  const config = {
    pageType: pageType?.textContent?.trim(),
    selector: selector?.textContent?.trim(),
    indicatorIdsRightPanel: indicatorIds,
    indicatorRedirectUrl: globalProperties?.indicatorRedirectUrl || '',
    datasetRedirectUrl: globalProperties?.datasetRedirectUrl || '',
    exploreMoreRedirectUrl: globalProperties?.exploreMoreRedirectUrl || '',
    categoryName: CategoryName?.textContent?.trim() || '', // Restored
    data360URL: globalProperties?.data360Url || '',
    indicatorId: indicatorIds[0] || '',
    apiKeyName: globalProperties?.apiKeyName || '',
    apiKeyValue: globalProperties?.apiKeyValue || '',
    sourceLabel: sourceLabel?.textContent?.trim() || 'Source',
    datasetLabel: datasetLabel?.textContent?.trim() || 'Dataset',
    data360ButtonText: data360ButtonText?.textContent?.trim() || 'Go to Data 360',
    indicatorMap,
  };

  const regionChartsContainer = document.querySelector(".region-charts-container");
  if (regionChartsContainer) {
    regionChartsContainer.style.setProperty("display", "block", "important");
  }

  const Highcharts = await loadHighchartsScript();

  title.classList.add(CLASS_MAIN_HEADING);
  title.classList.add('heading');

  const linkAnchor = link.querySelector('a');
  linkAnchor.innerHTML = linkText.textContent;
  linkAnchor.title = linkText.textContent;
  linkAnchor.className = 'button primary';

  const cleanLink = div({}, linkAnchor);
  const titleButtonWrapper = div({ class: 'heading-wrapper' }, title, cleanLink);

  const buttonWrapper = div(
    { class: 'button-wrapper' },
    linkAnchor.cloneNode(true),
  );

  [...block.children].forEach(child => {
    child.style.display = 'none';
  });

  block.prepend(titleButtonWrapper);

  const section = document.createElement('section');
  section.className = 'data-indicator-container';
  block.append(section);

  const wrapper = document.createElement('div');
  section.append(wrapper);

  const leftContainer = document.createElement('div');
  const rightContainer = document.createElement('div');
  leftContainer.innerHTML = loaderMarkup;
  rightContainer.innerHTML = loaderMarkup;
  wrapper.append(leftContainer, rightContainer);

  const leftPromise = createLeftChart(leftContainer, Highcharts, config, config.selector)
    .then(() => leftContainer.querySelector('.loader-wrapper')?.remove());
  const rightPromise = createRightIndicators(rightContainer, config, config.selector)
    .then(() => rightContainer.querySelector('.loader-wrapper')?.remove());

  await Promise.all([leftPromise, rightPromise]);
  
  block.append(buttonWrapper);
}
