/* eslint-disable no-restricted-globals */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
import { UNIT_MEASURE_EXCEPTION, UNITS, FILTER_MAPPING } from './constants.js';

// eslint-disable-next-line import/prefer-default-export
export const formatNumberOnUnitMeasure = (
  value,
  unitMeasure,
  decimals,
  isSymbol = true,
) => {
  let res = '';
  const numericValue = Number(value);
  if (!isNaN(numericValue)) {
    const decimalPlaces = decimals !== null && !isNaN(decimals) && decimals !== ''
      ? parseInt(decimals, 10)
      : undefined;

    if (numericValue !== 0 && numericValue < 1 && numericValue > -1) {
      res = numericValue.toFixed(
        decimalPlaces !== undefined ? decimalPlaces : 2,
      );
    } else if (UNIT_MEASURE_EXCEPTION.includes(unitMeasure)) {
      const unitConfig = UNITS[unitMeasure] || [];
      for (const { limit, factor, suffix } of unitConfig) {
        if (numericValue >= limit && numericValue < limit * 1_000) {
          res = `${(numericValue / factor).toFixed(
            decimalPlaces !== undefined ? decimalPlaces : 1,
          )}${suffix}`;
          break;
        }
      }
    } else {
      const minimumFractionDigits = Number.isInteger(numericValue)
        ? 0
        : decimalPlaces !== undefined
          ? decimalPlaces
          : 1;
      res = Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits:
          decimalPlaces !== undefined
            ? decimalPlaces
            : numericValue === 0
              ? undefined
              : 1,
        minimumFractionDigits,
      })
        .format(numericValue)
        .toLowerCase();
    }

    if (isSymbol) {
      if (unitMeasure === 'PT') {
        res += '%';
      } else if (unitMeasure === 'USD') {
        res = `$${res}`;
      }
    }
  } else {
    res = value;
  }
  return res;
};

export const formatUnitMeasure = (unitMeasure, unitMeasureName) => (unitMeasure
    && unitMeasureName
    && unitMeasure !== 'PT'
    && unitMeasure !== 'USD'
    && unitMeasure !== 'U'
    && unitMeasure !== 'NUMBER'
    && unitMeasure !== 'COUNT'
  ? ` ${unitMeasureName}`
  : '');

export const buildDisaggregationFiltersWithT = (
  params,
  disaggregationResponse,
  checkTotalFilterValue,
) => {
  let isSecondAPICallEligible = false;

  disaggregationResponse?.forEach((disaggregation) => {
    const { filterName, filterValues } = disaggregation;
    const filterKey = FILTER_MAPPING[filterName];

    if (filterKey && filterValues?.length > 1) {
      const value = checkTotalFilterValue
        ? filterValues.find((val) => val.id === '_T')?.id || filterValues[0]?.id
        : filterValues[0]?.id;

      // eslint-disable-next-line no-param-reassign
      params += ` AND ${filterKey}='${value}'`;

      if (checkTotalFilterValue && !isSecondAPICallEligible) {
        if (filterValues.map((val) => val.id)?.indexOf('_T') > 0) {
          isSecondAPICallEligible = true;
        }
      }
    }
  });

  return { params, isSecondAPICallEligible };
};

export function loadHighchartsScript() {
  return new Promise((resolve) => {
    if (window.Highcharts && window.Highcharts.A11yModule) {
      resolve(window.Highcharts);
      return;
    }

    const loadAccessibilityModule = () => {
      const accessibilityScript = document.createElement('script');
      accessibilityScript.src = 'https://code.highcharts.com/modules/accessibility.js';
      accessibilityScript.onload = () => resolve(window.Highcharts);
      document.head.appendChild(accessibilityScript);
    };

    if (window.Highcharts) {
      loadAccessibilityModule();
    } else {
      const script = document.createElement('script');
      script.src = 'https://code.highcharts.com/highcharts.js';
      script.onload = loadAccessibilityModule;
      document.head.appendChild(script);
    }
  });
}

// Month mapping for date parsing
export const MONTH_MAP = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// Format values for display
export const formatValues = (value) => {
  let formattedValue = null;
  if (!Number.isNaN(value) && value !== undefined && value !== null && value !== '') {
    formattedValue = parseFloat(value);
  }
  return formattedValue;
};

// Parse date string in the format YYYY-MM-DD or YYYY-MMM-DD
export const parseDateString = (dateString) => {
  const parts = dateString?.split('-');
  const year = parseInt(parts[0], 10);
  let month = parts[1] ? parts[1] : '01'; // Default to January if not provided
  const day = parts[2] ? parseInt(parts[2], 10) : 1; // Default to the 1st if not provided

  // Convert month name to month number
  if (Number.isNaN(month)) {
    month = MONTH_MAP.indexOf(month.toUpperCase()) + 1;
  } else {
    month = parseInt(month, 10);
  }

  // Adjust month to be zero-indexed
  month -= 1;

  // Create the Date object
  return new Date(year, month, day);
};

// Find the minimum and maximum years from an array of objects
export const findMinMaxYears = (arr) => {
  const sortDate = arr.reduce(
    (acc, obj) => {
      const min = parseDateString(obj.minYear);
      const max = parseDateString(obj.maxYear);

      // Update the accumulator with the minimum and maximum values
      acc.minDateFormat = acc.minYear === null
        ? obj.minYear
        : min < acc.minYear
          ? obj.minYear
          : acc.minDateFormat;
      acc.maxDateFormat = acc.minYear === null
        ? obj.maxYear
        : max > acc.maxYear
          ? obj.maxYear
          : acc.maxDateFormat;
      acc.minYear = acc.minYear === null ? min : min < acc.minYear ? min : acc.minYear;
      acc.maxYear = acc.minYear === null ? max : max > acc.maxYear ? max : acc.maxYear;
      return acc;
    },
    { minYear: Infinity, maxYear: -Infinity },
  );
  return {
    minYear: sortDate.minDateFormat,
    maxYear: sortDate.maxDateFormat,
  };
};

// Get the date range from indicator data
export const getDateRange = (indicatorData) => {
  const data = indicatorData.map((obj) => {
    let minYear = 0;
    let maxYear = 0;
    let minDateFormat = '';
    let maxDateFormat = '';
    const { xAxis } = obj.data;
    const { yAxis } = obj.data;

    const dateStrings = xAxis.filter((year, index) => (yAxis[index] !== '' ? parseInt(year, 10) : false));

    // Parse each date string
    if (dateStrings.length > 0) {
      dateStrings.forEach((dateString) => {
        const parsedDate = parseDateString(dateString);

        // Update min and max dates
        if (minYear === 0 || parsedDate < minYear) {
          minYear = parsedDate;
          minDateFormat = dateString;
        }
        if (maxYear === 0 || parsedDate > maxYear) {
          maxYear = parsedDate;
          maxDateFormat = dateString;
        }
      });
    }

    const formattedMinDate = minYear !== 0 ? minDateFormat : 0;
    const formattedMaxDate = maxYear !== 0 ? maxDateFormat : 0;

    return {
      minYear: formattedMinDate,
      maxYear: formattedMaxDate,
    };
  });

  return data.length
    ? data.length === 1
      ? data[0]
      : findMinMaxYears(data)
    : { minYear: 0, maxYear: 0 };
};

// Get the most recent year from the filtered data
export const getRecentYear = (filteredData) => {
  const { minYear, maxYear } = getDateRange(filteredData);
  return { minYear, maxYear };
};

// Helper function to find region in the mapping data
export const getRegionForCountry = (countryCode, countriesMapping) => {
  if (countriesMapping && countriesMapping.HCL_WB_REGIONS) {
    for (const region of countriesMapping.HCL_WB_REGIONS) {
      if (region.countries && region.countries.includes(countryCode)) {
        return region.id; // Return the region code
      }
    }
  }
  return null; // Country not found in any region
};

// Check if a value is valid (not null, undefined, empty string, "null", or "NaN")
export const isValidValue = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && value !== 'null'
  && value !== 'NaN'
);

// Find the latest non-null value and its index
export const findLatestValue = (yAxis) => {
  for (let i = yAxis.length - 1; i >= 0; i -= 1) {
    if (isValidValue(yAxis[i])) {
      return { value: parseFloat(yAxis[i]), index: i };
    }
  }
  return { value: null, index: -1 };
};

// Find the previous non-null value before a given index
export const findPreviousValue = (yAxis, fromIndex) => {
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (isValidValue(yAxis[i])) {
      return { value: parseFloat(yAxis[i]), index: i };
    }
  }
  return { value: null, index: -1 };
};

// Get arrow icon based on trend comparison
export const getArrowIcon = (xAxis, yAxis) => {
  if (!xAxis || !yAxis || xAxis.length < 2 || yAxis.length < 2) return '';

  const { value: latestValue, index: latestIndex } = findLatestValue(yAxis);
  const { value: previousValue } = findPreviousValue(yAxis, latestIndex);

  if (latestValue !== null && previousValue !== null) {
    if (latestValue > previousValue) return '<i class="lp lp-arrow-up"></i>';
    if (latestValue < previousValue) return '<i class="lp lp-arrow-down"></i>';
  }
  return '';
};

// Load Swiper dependencies
export const loadSwiperDependencies = async () => {
  // Check if Swiper CSS is loaded
  if (!document.querySelector('link[href*="swiper"]')) {
    const swiperCSS = document.createElement('link');
    swiperCSS.rel = 'stylesheet';
    swiperCSS.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
    document.head.appendChild(swiperCSS);
  }

  // Check if Swiper JS is loaded
  if (typeof Swiper === 'undefined') {
    await new Promise((resolve) => {
      const swiperJS = document.createElement('script');
      swiperJS.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
      swiperJS.onload = resolve;
      document.head.appendChild(swiperJS);
    });
  }
};

// Initialize Swiper carousel with default configuration
export const initializeSwiper = (container) => {
  if (typeof Swiper === 'undefined') {
    // console.warn('Swiper library not found. Please include Swiper.js');
    return null;
  }

  return new Swiper(container, {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: false,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: { slidesPerView: 2, spaceBetween: 24 },
      1024: { slidesPerView: 3, spaceBetween: 32 },
    },
  });
};

// Create source content HTML from sources array
export const createSourceContent = (sources) => sources
  .map((item, index) => {
    const sourceText = item.uri
      ? `<a href="${item.uri}" target="_blank">${item.source
          || (item.name ? `${item.name}, ${item.organization}` : item.organization)}</a>`
      : item.source
        || (item.name ? `${item.name}, ${item.organization}` : item.organization);
    return index > 0 ? `; ${sourceText}` : sourceText;
  })
  .join('');

// Parse indicators configuration string
export const parseIndicatorsConfig = (indicatorsConfig) => indicatorsConfig.split(',').map((item) => {
  const [indicatorId, chartType] = item.trim().split('|');
  return {
    idno: indicatorId,
    chartType: chartType || 'line',
  };
}).filter((item) => item.idno);

// Get country color from region mapping
export const getCountryColor = (countryCode, countriesMapping, COLOR_MAP) => {
  const regionCode = getRegionForCountry(countryCode, countriesMapping);

  if (regionCode) {
    if (COLOR_MAP[`${regionCode}_countries`]) {
      const regionColors = COLOR_MAP[`${regionCode}_countries`];
      return Array.isArray(regionColors) ? regionColors[0] : regionColors;
    }
    if (COLOR_MAP[regionCode]) {
      return COLOR_MAP[regionCode];
    }
  }

  console.log(`No region found for ${countryCode}, using fallback color`);
  return null;
};