/**
 * Country Data Indicators Block
 * Creates a swiper carousel with data indicators showing country statistics
 *
 * Features:
 * - Displays country-specific indicator data in line and pie charts
 * - Optional benchmark comparison with region data via checkbox
 * - Caches region data for performance
 * - Supports multiple chart types (line charts show region comparison, pie charts remain country-only)
 */

import { COLOR_MAP } from "../../scripts/theme.js";
import {
  fetchCodeListAndCountryList, fetchIndicatorMetadata,
  fetchIndicatorsDataForSpecificIndicator, fetchDisaggregationDataForSpecificIndicator,
  fetchLineChartData,
} from "../../scripts/api.js";
import {
  loadHighchartsScript, formatNumberOnUnitMeasure, formatUnitMeasure, formatValues,
  getRecentYear, getArrowIcon, loadSwiperDependencies, initializeSwiper,
  createSourceContent, getCountryColor, getRegionForCountry,
} from "../../scripts/helpers.js";
import { LINE_CHART_OPTIONS } from "../../scripts/constants.js";
import { fetchPlaceholders } from "../../scripts/aem.js";
import { PATH_PREFIX, getLanguage } from "../../scripts/utils.js";
import { CLASS_MAIN_HEADING } from "../../scripts/scripts.js";
import { div } from "../../scripts/dom-helpers.js";

// -----------------------------
// Global config and app state
// -----------------------------
const globalProperties = await fetchPlaceholders(PATH_PREFIX);

// Language/RTL support
const langCode = getLanguage();
const isRTL = langCode === 'ar';

let countryList = [];
let countriesMapping = null;

// Region code -> readable name map (fallback to code when unknown)
const REGION_NAME_MAP = {
  LCN: 'Latin America & Caribbean',
  SAS: 'South Asia',
  SSF: 'Sub-Saharan Africa',
  ECS: 'Europe & Central Asia',
  MEA: 'Middle East & North Africa',
  EAS: 'East Asia & Pacific',
  NAC: 'North America',
  WLD: 'World',
  AFW: 'West Africa',
  AFE: 'East Africa',
};

// -----------------------------
// Data fetching helpers
// -----------------------------
// Function to fetch region data for a specific indicator
const fetchRegionDataForIndicator = async (indicatorId, databaseId, regionCode, timeRange) => {
  try {
    const urlsForLineChart = {
      data: globalProperties?.dataApiEndpoint,
      disaggregation: globalProperties?.disaggregationApiEndpoint,
    };

    const { indicatorData } = await fetchLineChartData(urlsForLineChart, {
      datasetId: databaseId,
      indicatorId,
      regionCode
    });

    if (!indicatorData || !indicatorData[0]) {
      return null;
    }

    const data = indicatorData[0];
    const { xAxis, yAxis } = data?.data || {};

    if (!xAxis || !yAxis) {
      return null;
    }

    // Filter data to match the same time range as country data
    const { minYear, maxYear } = timeRange;
    const startIndex = xAxis.findIndex((year) => year >= minYear);
    const endIndex = xAxis.findIndex((year) => year >= maxYear);

    if (startIndex === -1) return null;

    const actualEndIndex = endIndex === -1 ? xAxis.length - 1 : endIndex;
    const filteredYAxis = yAxis.slice(startIndex, actualEndIndex + 1).map((value) =>
      value !== undefined && value !== null && value !== 'null' && value !== 'NaN'
        ? Number(value)
        : null
    );

    return {
      yAxis: filteredYAxis,
      regionCode,
      regionName: REGION_NAME_MAP[regionCode] || `Region ${regionCode}`,
      regionColor: COLOR_MAP[regionCode] || COLOR_MAP.default || '#ff6b6b'
    };
  } catch (error) {
    console.warn(`Failed to fetch region data for indicator ${indicatorId}:`, error);
    return null;
  }
};

const initializeData = async () => {
  const { countryList: fetchedCountryList, countriesMapping: fetchedCountriesMapping } =
    await fetchCodeListAndCountryList(globalProperties);
  countryList = fetchedCountryList;
  countriesMapping = fetchedCountriesMapping;
};

const loadDependencies = async () => {
  const Highcharts = await loadHighchartsScript();
  await loadSwiperDependencies();
  return Highcharts;
};

// -----------------------------
// DOM builders
// -----------------------------
const createIndicatorSlide = (indicatorData, index, indicatorMetadata, config) => {
  const { indicator, displayValue, latestCurrentYear, unitMeasureName, chartConfig, xAxis, yAxis } = indicatorData;

  const arrowIcon = getArrowIcon(xAxis, yAxis);

  const slide = document.createElement("div");
  slide.className = "swiper-slide swiperdata-indicator-list";

  slide.innerHTML = `
    <div class="data-indicator-chart">
      <div class="data-indicator-header">
        <div class="data-indicator-title">
          <a href="${config?.indicatorRedirectUrl || '/search?indicator='}${indicator.idno}">
            ${displayValue} ${arrowIcon}
          </a>
        </div>
        <p class="data-indicator-description">
          ${chartConfig?.chartType === "pie"
      ? `${unitMeasureName}, ${latestCurrentYear}`
      : `${indicator.name.split(",")[0]}, ${latestCurrentYear}`}
        </p>
      </div>
      <div class="data-indicator-chart-container" style="width: 100%; height: 220px;">
        <div id="chart-${index}" style="width: 100%; height: 200px;"></div>
      </div>
      <div class="data-indicator-footer">
        <a href="#" class="data-indicator-flip" data-slide-index="${index}">${config.sourceLabel}</a>
      </div>
    </div>
  `;

  slide.querySelector(".data-indicator-flip").addEventListener("click", (e) => {
    e.preventDefault();
    const chartContainer = slide.querySelector(".data-indicator-chart");
    const existingSource = slide.querySelector(".data-indicator-source");
    
    if (existingSource) {
      existingSource.remove();
      chartContainer.classList.remove("hover");
      return;
    }

    const sources = indicatorMetadata?.series_description?.sources || [];
    const sourceContent = createSourceContent(sources);
    const datasetName = indicatorMetadata?.series_description?.database_name || "";
    const datasetUrl = `${config?.datasetRedirectUrl || '/search?dataset='}${indicatorMetadata?.series_description?.database_id}`;

    const sourceDiv = document.createElement("div");
    sourceDiv.className = "data-indicator-source";
    sourceDiv.innerHTML = `
      <button class="close-icon" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19.08 21.9134C19.8622 22.6955 21.1303 22.6955 21.9124 21.9134C22.6946 21.1312 22.6946 19.8631 21.9124 19.081L14.8314 12L21.9123 4.91901C22.6945 4.13686 22.6945 2.86875 21.9123 2.08661C21.1302 1.30446 19.8621 1.30446 19.0799 2.08661L11.999 9.16756L4.9181 2.08661C4.13596 1.30447 2.86785 1.30447 2.08571 2.08661C1.30357 2.86876 1.30357 4.13687 2.08571 4.91901L9.16664 12L2.08563 19.081C1.30349 19.8631 1.30349 21.1312 2.08563 21.9134C2.86777 22.6955 4.13587 22.6955 4.91802 21.9134L11.999 14.8324L19.08 21.9134Z" fill="#000D1A" fill-opacity="0.7"></path>
        </svg>
      </button>
      <div>
        <p class="tui__sm_title">${config.sourceLabel}: ${sourceContent || "World Bank Data"}</p>
        <p class="tui__sm_title">${config.datasetLabel}: <a href="${datasetUrl}">${datasetName}</a></p>
        <p><a href="${config?.data360URL}" class="button">${config.data360ButtonText}</a></p>
      </div>
    `;

    sourceDiv.querySelector(".close-icon").addEventListener("click", () => {
      sourceDiv.remove();
      chartContainer.classList.remove("hover");
    });
    
    chartContainer.appendChild(sourceDiv);
    chartContainer.classList.add("hover");
  });

  return slide;
};

const createBenchmarkToggle = (text) => {
  const container = document.createElement('div');
  container.className = 'benchmark-comparison-container';
  container.style.cssText = 'margin-bottom: 20px; display: flex; align-items: center; gap: 8px; padding: 12px;';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'benchmark-region-checkbox';
  checkbox.style.cssText = 'margin: 0; cursor: pointer; width: 16px; height: 16px;';

  const label = document.createElement('label');
  label.htmlFor = 'benchmark-region-checkbox';
  label.textContent = text;
  label.style.cssText = 'margin: 0; cursor: pointer; font-size: 14px; color: rgba(0, 0, 0, 0.87); font-weight: 500;';

  container.append(checkbox, label);
  return container;
};

const createCountryStructure = (block, processedIndicators, indicatorMetadataMap, config) => {
  // Add checkbox to block first, before the charts section
  // block.appendChild(createBenchmarkToggle(config.comparisonCheckBoxText)); // Temporarily hidden

  const section = document.createElement("section");
  section.className = "default swiperdata-indicator-container";

  const swiperContainer = document.createElement("div");
  swiperContainer.className = "swiper swiper-container swiperdata-indicator";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";

  processedIndicators.forEach((indicatorData, index) => {
    const indicatorMetadata = indicatorMetadataMap[indicatorData.indicator.idno];
    const slide = createIndicatorSlide(indicatorData, index, indicatorMetadata, config);
    swiperWrapper.appendChild(slide);
  });

  const nextButton = document.createElement("div");
  nextButton.className = "swiper-button-next";
  const prevButton = document.createElement("div");
  prevButton.className = "swiper-button-prev swiper-button-disabled";
  prevButton.setAttribute("aria-disabled", "true");
  prevButton.setAttribute("tabindex", "-1");

  swiperContainer.appendChild(swiperWrapper);
  swiperContainer.appendChild(nextButton);
  swiperContainer.appendChild(prevButton);
  section.appendChild(swiperContainer);
  block.appendChild(section);
};

// -----------------------------
// Chart renderers
// -----------------------------
const renderLineChart = (Highcharts, chartId, indicator, currentXAxis, currentYAxis, unitMeasure, unitMeasureName, decimals, countryColor, config, regionData = null) => {
  const countrySeriesData = (currentYAxis || []).map((val) => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  });
  const series = [{
    name: config?.countryName || 'Country',
    data: countrySeriesData,
    color: countryColor,
    lineWidth: 2,
    marker: { enabled: false },
    connectNulls: true,
  }];

  // Add region series if region data is provided
  if (regionData && regionData.yAxis && regionData.yAxis.length > 0) {
    series.push({
      name: regionData.regionName || 'Region',
      data: regionData.yAxis,
      color: regionData.regionColor || COLOR_MAP.default,
      lineWidth: 2,
      marker: { enabled: false },
      connectNulls: true,
      dashStyle: 'dash'
    });
  }

  // Compute safe min/max ignoring nulls, include region series if present
  const countryNumbers = countrySeriesData.filter((v) => Number.isFinite(v));
  const regionNumbers = (regionData?.yAxis || [])
    .map((v) => (v === null || v === undefined ? null : Number(v)))
    .filter((v) => Number.isFinite(v));
  const allNumbers = countryNumbers.concat(regionNumbers);
  const yMin = allNumbers.length ? Math.min(...allNumbers) : 0;
  const yMax = allNumbers.length ? Math.max(...allNumbers) : 0;

  Highcharts.chart(chartId, {
    ...LINE_CHART_OPTIONS,
    chart: {
      type: "line",
      backgroundColor: null,
      // height: 200,
    },
    title: { text: null },
    subtitle: { text: null },
    tooltip: {
      shared: true, backgroundColor: null, borderWidth: 0, shadow: false, useHTML: true, outside: true,
      style: { padding: 0, width: "300px", height: "auto", direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' },
      formatter() {
        const title = `<div class="tui_chart_tooltip_title" style="font-size: 14px; font-weight: 600; line-height: 16px; color: rgba(0, 0, 0, 0.87); padding-bottom: 4px; margin-bottom: 4px; border-bottom: 1px solid #CED4DE; text-align: ${isRTL ? 'right' : 'left'};">${this?.points?.[0]?.category}</div>`;
        const ulStyle = `padding-${isRTL ? 'right' : 'left'}: 0;
                  list-style: none;
                  margin: 0;
                  `;
        const points = this?.points?.map((point) => {
          const symbol = '●';
          const symbolStyle = `font-size: 17px; color: ${point.color}; margin-${isRTL ? 'left' : 'right'}: 8px; vertical-align: middle; display: inline-block;`;
          return `<li style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; direction: ${isRTL ? 'rtl' : 'ltr'};">
            <div class="tooltip_country" style="display: flex; align-items: center; min-width: 150px; padding-${isRTL ? 'left' : 'right'}: 10px;">
              <span style="${symbolStyle}">${symbol}</span>${point.series.name}
            </div>
            <span class="tooltip_value" style="font-size: 16px; font-weight: 700; line-height: 20px; color: rgba(0, 0, 0, 0.87);">
              ${formatNumberOnUnitMeasure(point.y, unitMeasure, decimals)} ${formatUnitMeasure(unitMeasure, unitMeasureName)}
            </span>
          </li>`;
        }).join('');
        return `<div class="tui_chart_tooltip" style="border: 0.5px solid #CED4DE; background: #FFF; padding: 6px 8px; box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.15); width: auto; direction: ${isRTL ? 'rtl' : 'ltr'};">${title}<ul style="${ulStyle}">${points}</ul></div>`;
      },
    },
    xAxis: {
      categories: currentXAxis,
      reversed: isRTL,
      labels: {
        style: { color: "#7f8c8d" },
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
    },
    yAxis: {
      title: { text: null },
      gridLineColor: "#c2d0dd",
      gridLineDashStyle: 'Dash',
      plotLines: [{
        color: 'rgba(0, 0, 0, 0.22)',
        dashStyle: 'Dash',
        width: 1,
        value: yMax,
        zIndex: 5,
        label: { text: '', align: 'right' },
      }],
      tickPositions: [yMin, yMax],
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
    series: series,
    legend: { enabled: series.length > 1, align: isRTL ? 'right' : 'center', layout: 'horizontal', verticalAlign: 'bottom' },
    credits: { enabled: false },
  });
};

const renderPieChart = (Highcharts, chartId, indicator, currentXAxis, currentYAxis, unitMeasure, unitMeasureName, decimals, countryColor, config) => {
  let latestValue = null;
  let latestYear = null;

  for (let j = currentYAxis.length - 1; j >= 0; j--) {
    if (currentYAxis[j] !== null && currentYAxis[j] !== undefined) {
      latestValue = parseFloat(currentYAxis[j]);
      latestYear = currentXAxis[j];
      break;
    }
  }

  if (latestValue === null) latestValue = 0;
  const remainingValue = 100 - latestValue;

  Highcharts.chart(chartId, {
    chart: { type: "pie", backgroundColor: null, height: 200 },
    title: {
      text: latestValue !== null && latestValue !== undefined
        ? `${formatNumberOnUnitMeasure(latestValue, 0)}%`
        : "No Data" + `<span style="font-size: 12px; color: #7f8c8d;"> (${unitMeasureName})</span>`,
      verticalAlign: "middle", floating: true,
    },
    tooltip: {
      useHTML: true, backgroundColor: null, borderWidth: 0, shadow: false, style: { padding: 0, direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' },
      formatter() {
        const title = `<div class="tui_chart_tooltip_title" style="font-size: 14px; font-weight: 600; line-height: 16px; color: rgba(0, 0, 0, 0.87); padding-bottom: 4px; margin-bottom: 4px; border-bottom: 1px solid #CED4DE; text-align: ${isRTL ? 'right' : 'left'};">${latestYear}</div>`;
        const point = this.point;
        const symbol = '●';
        const symbolStyle = `font-size: 17px; color: ${point.color}; margin-${isRTL ? 'left' : 'right'}: 8px; vertical-align: middle; display: inline-block;`;
        const ulStyle = `
        padding-${isRTL ? 'right' : 'left'}: 0;
        list-style: none;
        margin: 0;
        `;
        const pointData = `<li style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <div class="tooltip_country" style="display: flex; align-items: center; min-width: 150px;">
            <span style="${symbolStyle}">${symbol}</span>${config?.countryName}
          </div>
          <span class="tooltip_value" style="font-size: 16px; font-weight: 700; line-height: 20px; color: rgba(0, 0, 0, 0.87);">
            ${formatNumberOnUnitMeasure(point.percentage, unitMeasure, decimals)} ${formatUnitMeasure(unitMeasure, unitMeasureName)}
          </span>
        </li>`;
        return `<div class="tui_chart_tooltip" style="border: 0.5px solid #CED4DE; background: #FFF; padding: 6px 8px; box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.15); width: auto; direction: ${isRTL ? 'rtl' : 'ltr'};">${title}<ul style="${ulStyle}">${pointData}</ul></div>`;
      },
    },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: false, cursor: "pointer", dataLabels: { enabled: false }, showInLegend: false,
        innerSize: "60%", borderWidth: 0, colors: [countryColor, "#ecf0f1"],
      },
    },
    series: [{
      name: indicator.name.split(",")[0], colorByPoint: true,
      data: [
        { name: "Access", y: latestValue, color: countryColor },
        { name: "No Access", y: remainingValue, color: "#ecf0f1" },
      ],
    }],
    credits: { enabled: false },
  });
};

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
  await initializeData();

  const [
    selector,
    title,
    linkText,
    link,
    countryName,
    sourceLabel,
    datasetLabel,
    data360ButtonText,
    comparisonCheckBoxText,
    ...indicatorItems
  ] = [...block.children];

  const indicatorMap = {};
  indicatorItems.forEach((item) => {
    const id = item.querySelector('div:nth-of-type(1)')?.textContent?.trim();
    const name = item.querySelector('div:nth-of-type(2)')?.textContent?.trim();
    const unitMeasure = item.querySelector('div:nth-of-type(3)')?.textContent?.trim();
    const chartType = item.querySelector('div:nth-of-type(4)')?.textContent?.trim();
    if (id) {
      indicatorMap[id] = { name, unitMeasure, chartType };
    }
  });

  const config = {
    selector: selector?.textContent?.trim(),
    indicatorRedirectUrl: globalProperties?.indicatorRedirectUrl || '',
    datasetRedirectUrl: globalProperties?.datasetRedirectUrl || '',
    exploreMoreRedirectUrl: globalProperties?.exploreMoreRedirectUrl || '',
    countryName: countryName?.textContent?.trim() || '',
    data360URL: globalProperties?.data360Url || '',
    apiKeyName: globalProperties?.apiKeyName || '',
    apiKeyValue: globalProperties?.apiKeyValue || '',
    sourceLabel: sourceLabel?.textContent?.trim() || 'Source',
    datasetLabel: datasetLabel?.textContent?.trim() || 'Dataset',
    data360ButtonText: data360ButtonText?.textContent?.trim() || 'Go to Data 360',
    comparisonCheckBoxText: comparisonCheckBoxText?.textContent?.trim() || 'Compare with benchmark region data'
  };

  // block.innerHTML = '';

  const countryChartsContainer = document.querySelector(".country-charts-container");
  if (countryChartsContainer) {
    countryChartsContainer.style.setProperty("display", "block", "important");
  }


  title.className = CLASS_MAIN_HEADING;
  const linkTag = link.getElementsByTagName('a')[0];
  linkTag.innerHTML = linkText.textContent;
  linkTag.title = linkText.textContent;
  linkTag.className = 'button primary';
  
  // Find any child element with an id within the main-heading div
  // Fixes accessibility issue 7845
  const elementWithId = title.querySelector('[id]');
  const elementId = elementWithId ? elementWithId.id : '';
  
  if (elementId) {
    linkTag.setAttribute('aria-describedby', elementId);
  }
  
  const titleButtonWrapper = div({ class: 'heading-wrapper' }, title, link);
  const buttonWrapper = div({ class: 'button-wrapper' }, linkTag.cloneNode(true));
  linkText.remove();
  [...block.children].forEach(child => {
    child.style.display = 'none';
  });
  block.prepend(titleButtonWrapper);

  // Build indicators list from indicatorMap (id -> chartType)
  const indicatorsData = Object.entries(indicatorMap).map(([idno, cfg]) => ({ idno, chartType: cfg?.chartType || 'line' }));

  // Show loader
  const section = document.createElement("section");
  section.className = "default swiperdata-indicator-container";
  section.innerHTML = loaderMarkup;
  block.appendChild(section);

  try {
    const Highcharts = await loadDependencies();
    const countryCode = selector?.textContent?.trim();
    const countryColor = getCountryColor(countryCode, countriesMapping, COLOR_MAP);
    const chartsToRender = [];
    const processedIndicators = [];
    const indicatorMetadataMap = {};

    // Helper: compute filtered series by recent years
    const filterSeriesByRecentYears = (indicatorDataArr) => {
      const { xAxis: xAll = [], yAxis: yAll = [] } = indicatorDataArr?.[0]?.data || {};
      const { minYear, maxYear } = getRecentYear(indicatorDataArr);
      const startIndex = xAll?.findIndex((category) => category >= minYear);
      const endIndex = xAll?.findIndex((category) => category >= maxYear);
      const x = xAll?.slice(startIndex, endIndex + 1) || [];
      const y = yAll.slice(startIndex, endIndex + 1).map((value) =>
        value !== undefined && value !== null && value !== 'null' && value !== 'NaN' ? formatValues(value) : null
      );
      return { x, y };
    };

    // Fetch all indicators in parallel to reduce load time
    const indicatorResults = await Promise.all(indicatorsData.map(async ({ idno: indicatorId, chartType }, idx) => {
      // Fetch metadata and disaggregation concurrently (data depends on disaggregation)
      const indicatorNameEndpoint = globalProperties?.metadataApiEndpoint;
      const metadataPromise = indicatorNameEndpoint
        ? fetchIndicatorMetadata(
            indicatorNameEndpoint,
            [indicatorId],
            { accept: 'application/json', 'content-type': 'application/json', [config.apiKeyName]: config.apiKeyValue }
          ).catch((e) => {
            console.warn(`Failed to fetch metadata for indicator ${indicatorId}:`, e);
            return null;
          })
        : Promise.resolve(null);

      const disaggPromise = fetchDisaggregationDataForSpecificIndicator(
        indicatorId,
        // database id is unknown until metadata resolves; default to WB_WDI for the request, API should handle idno
        // We'll re-request data with correct DB id below if needed
        'WB_WDI',
        globalProperties
      ).catch((e) => {
        console.warn(`Failed to fetch disaggregation for indicator ${indicatorId}:`, e);
        return [];
      });

      const [indicatorMetadata, disaggregationInitial] = await Promise.all([metadataPromise, disaggPromise]);

      const indicator = {
        idno: indicatorId,
        name: indicatorMetadata?.series_description?.name || indicatorId,
        database_id: indicatorMetadata?.series_description?.database_id || 'WB_WDI',
        definition_long: indicatorMetadata?.series_description?.definition_long || '',
        sources: indicatorMetadata?.series_description?.sources || [],
      };
      if (indicatorMetadata) indicatorMetadataMap[indicatorId] = indicatorMetadata;

      // Prefer name from authoring override
      const overrideConfig = indicatorMap[indicatorId] || {};
      if (overrideConfig?.name) indicator.name = overrideConfig.name;

      // If initial disaggregation may have been queried with default DB, query again with actual DB id
      const disaggregation = indicator.database_id === 'WB_WDI' ? disaggregationInitial : await fetchDisaggregationDataForSpecificIndicator(
        indicator.idno,
        indicator.database_id,
        globalProperties
      ).catch(() => disaggregationInitial);

      const indicatorData = await fetchIndicatorsDataForSpecificIndicator(
        indicator.idno,
        indicator.database_id,
        disaggregation,
        countryCode,
        globalProperties,
        countryList
      ).catch((e) => {
        console.warn(`Failed to fetch indicator data for ${indicatorId}:`, e);
        return [];
      });

      const { x: currentXAxis, y: currentYAxis } = filterSeriesByRecentYears(indicatorData);
      const unitMeasureFilter = disaggregation.find((f) => f.filterName === 'UNIT_MEASURE');
      let unitMeasureName = unitMeasureFilter?.filterValues?.[0]?.name || '';
      if (overrideConfig?.unitMeasure) unitMeasureName = overrideConfig.unitMeasure;

      // Latest non-null value for display
      let latestCurrentValue = null;
      let latestIndex = -1;
      for (let j = currentYAxis.length - 1; j >= 0; j--) {
        if (currentYAxis[j] !== null && currentYAxis[j] !== undefined) {
          latestCurrentValue = Number(currentYAxis[j]);
          latestIndex = j;
          break;
        }
      }
      const latestCurrentYear = latestIndex >= 0 ? currentXAxis[latestIndex] : '';
      const displayValue = latestCurrentValue !== null
        ? (chartType === 'pie' ? indicator.name.split(',')[0] : `${latestCurrentValue.toFixed(2)} ${unitMeasureName}`)
        : 'No data available';

      const unitMeasure = indicatorData?.[0]?.unitMeasure;
      const decimals = indicatorData?.[0]?.decimals;
      const unitMult = indicatorData?.[0]?.unitMult;

      return {
        idx,
        indicator,
        chartType,
        displayValue,
        latestCurrentYear,
        unitMeasureName,
        currentXAxis,
        currentYAxis,
        unitMeasure,
        decimals,
        unitMult,
      };
    }));

    // Populate processed arrays in original order
    indicatorResults.forEach((res) => {
      if (!res) return;
      const {
        idx, indicator, chartType, displayValue, latestCurrentYear,
        unitMeasureName, currentXAxis, currentYAxis, unitMeasure, decimals, unitMult
      } = res;
      processedIndicators.push({
        indicator,
        chartConfig: { indicatorId: indicator.idno, chartType },
        displayValue,
        latestCurrentYear,
        unitMeasureName,
        xAxis: currentXAxis,
        yAxis: currentYAxis,
      });
      chartsToRender.push({
        index: idx,
        indicator,
        chartConfig: { indicatorId: indicator.idno, chartType },
        currentXAxis,
        currentYAxis,
        unitMeasureName,
        unitMeasure,
        decimals,
        unitMult,
        countryColor,
      });
    });

    // Remove loader and create the country structure
    const loaderSection = block.querySelector('.swiperdata-indicator-container');
    if (loaderSection) {
      loaderSection.remove();
    }

    createCountryStructure(block, processedIndicators, indicatorMetadataMap, config);

    // Get the region code for the current country
    const regionCode = getRegionForCountry(countryCode, countriesMapping);

    // Set up checkbox event listener for benchmark comparison
    const checkbox = block.querySelector('#benchmark-region-checkbox');
    const regionDataCache = new Map(); // Cache for region data

    // Hide checkbox if no region is found for the country
    if (!regionCode) {
      const checkboxContainer = block.querySelector('.benchmark-comparison-container');
      if (checkboxContainer) checkboxContainer.style.display = 'none';
    }

    const renderChartsWithRegionData = async (includeRegion) => {
      // Pre-resolve region data for all line charts in parallel if needed
      const regionPromises = includeRegion && regionCode
        ? chartsToRender.map(async ({ indicator, chartConfig, currentXAxis, currentYAxis }) => {
            if (chartConfig?.chartType !== 'line') return null;
            const { minYear, maxYear } = getRecentYear([{ data: { xAxis: currentXAxis, yAxis: currentYAxis } }]);
            const cacheKey = `${indicator.idno}_${regionCode}_${minYear}-${maxYear}`;
            if (regionDataCache.has(cacheKey)) return { key: cacheKey, data: regionDataCache.get(cacheKey) };
            const data = await fetchRegionDataForIndicator(
              indicator.idno,
              indicator.database_id,
              regionCode,
              { minYear, maxYear }
            );
            regionDataCache.set(cacheKey, data);
            return { key: cacheKey, data };
          })
        : [];

      await Promise.all(regionPromises);

      for (const { index: i, indicator, chartConfig, currentXAxis, currentYAxis,
        unitMeasureName, unitMeasure, decimals, countryColor } of chartsToRender) {

        if (!currentYAxis || currentYAxis.length === 0) continue;
        const chartId = `chart-${i}`;
        let regionData = null;

        if (includeRegion && chartConfig?.chartType === 'line' && regionCode) {
          const { minYear, maxYear } = getRecentYear([{ data: { xAxis: currentXAxis, yAxis: currentYAxis } }]);
          const cacheKey = `${indicator.idno}_${regionCode}_${minYear}-${maxYear}`;
          regionData = regionDataCache.get(cacheKey) || null;
        }

        if (chartConfig?.chartType === 'line') {
          renderLineChart(Highcharts, chartId, indicator, currentXAxis, currentYAxis,
            unitMeasure, unitMeasureName, decimals, countryColor, config, regionData);
        } else if (chartConfig?.chartType === 'pie') {
          renderPieChart(Highcharts, chartId, indicator, currentXAxis, currentYAxis,
            unitMeasure, unitMeasureName, decimals, countryColor, config);
        }
      }

      // Force a reflow to ensure charts are properly sized
      setTimeout(() => {
        const charts = document.querySelectorAll('[id^="chart-"]');
        charts.forEach((chartEl) => {
          if (!chartEl || !Highcharts) return;
          const chart = Highcharts.charts.find((c) => c && c.container === chartEl);
          if (chart) chart.reflow();
        });
      }, 50);
    };

    if (checkbox) {
      checkbox.addEventListener('change', async (e) => {
        const checkboxContainer = checkbox.parentElement;
        const label = checkboxContainer?.querySelector('label');
        const originalText = label?.textContent;

        if (e.target.checked) {
          if (label) label.textContent = 'Loading region data...';
          checkbox.disabled = true;
        }

        try {
          await renderChartsWithRegionData(e.target.checked);
        } finally {
          if (label && originalText) label.textContent = originalText;
          checkbox.disabled = false;
        }
      });
    }

    window.addEventListener("resize", () => block.swiper?.update());

    setTimeout(() => {
      const swiperContainer = block.querySelector('.swiper-container');
      block.swiper = initializeSwiper(swiperContainer);
    }, 100);

    setTimeout(() => {
      // Initial render without region data
      renderChartsWithRegionData(false);

      // Force a reflow to ensure proper chart sizing
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }, 200);

  } catch (error) {
    console.error("Error initializing country block:", error);
    // Remove loader on error
    const loaderSection = block.querySelector('.swiperdata-indicator-container');
    if (loaderSection) {
      loaderSection.remove();
    }
  }

  block.append(buttonWrapper);
}
