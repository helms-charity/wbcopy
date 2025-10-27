/* eslint-disable max-len */
import { buildDisaggregationFiltersWithT } from './helpers.js';

let controller = null;

const fetchData = async (
  endpoint,
  method = 'GET',
  data = null,
  headers = {},
  cancelToken = false,
) => {
  const url = `${endpoint}`;

  if (cancelToken && controller) {
    controller.abort();
  }

  let signal;

  if (cancelToken) {
    controller = new AbortController();
    signal = controller.signal;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : null,
      ...(cancelToken && { signal }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request canceled:', error.message);
    } else if (error.message.includes('HTTP error')) {
      console.error('Request failed with status:', error.message.split('status: ')[1]);
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error;
  }
};

export async function fetchDisaggregationData(url) {
  try {
    const data = await fetchData(url);
    return data || [];
  } catch (error) {
    console.error('Error fetching disaggregation data:', error);
    return [];
  }
}

export async function fetchUnitMeasureCodelist(url) {
  try {
    const data = await fetchData(url);
    return data.UNIT_MEASURE || [];
  } catch (error) {
    console.error('Error fetching unit measure codelist:', error);
    return [];
  }
}

export async function fetchIndicatorMetadata(url, indicatorIds, pageType, headers) {
  const data = {
    count: true,
    facets: [],
    orderby: '',
    select: 'series_description',
    searchFields: '',
    search: '*',
    top: 1000,
    skip: 0,
    filter: `series_description/idno eq ${indicatorIds.map((id) => `'${id}'`)} ${pageType === 'topic' ? "and tags/any(t2: (t2/tag_group eq 'feature-topic-profile' ))" : ''}`,
  };
  const response = await fetchData(url, 'POST', data, headers);
  return response?.value?.[0];
}

export async function fetchIndicatorNames(url, pageType, indicatorIds, headers) {
  const data = {
    count: true,
    facets: [],
    orderby: '',
    select: 'series_description/idno,series_description/name,series_description/database_id',
    searchFields: '',
    search: '*',
    top: 1000,
    skip: 0,
    filter: `series_description/idno eq ${indicatorIds.map((id) => `'${id}'`).join(' or series_description/idno eq ')} ${pageType === 'topic' ? "and tags/any(t2: (t2/tag_group eq 'feature-topic-profile' ))" : ''}`,
  };
  const response = await fetchData(url, 'POST', data, headers);
  return response?.value?.reduce((acc, item) => {
    acc[item.series_description.idno] = {
      name: item.series_description.name || '',
      database_id: item.series_description.database_id || '',
    };
    return acc;
  }, {}) || {};
}

export async function fetchLineChartData(url, {
  pageType, datasetId, indicatorId, regionCode,
}) {
  const baseParams = `filter=DATASET='${datasetId}' AND IND_ID='${indicatorId}' AND REF_AREA='${pageType === 'topic' ? 'WLD' : regionCode}'`;

  const disaggregationData = await fetchDisaggregationData(`${url.disaggregation}?datasetId=${datasetId}&indicatorId=${indicatorId}`);
  const { params: paramsWithT, isSecondAPICallEligible } = buildDisaggregationFiltersWithT(baseParams, disaggregationData, true);
  let dataUrl = `${url.data}?${paramsWithT}`;

  let data = await fetchData(dataUrl);
  if ((!Array.isArray(data) || !data.length) && isSecondAPICallEligible) {
    const { params: paramsWithoutT } = buildDisaggregationFiltersWithT(baseParams, disaggregationData, false);
    dataUrl = `${url.data}?${paramsWithoutT}`;
    data = await fetchData(dataUrl);
  }

  return { indicatorData: data, disaggregationData };
}

export async function fetchIndicatorValue(url, {
  pageType, datasetId, indicatorId, regionCode,
}) {
  const baseParams = `filter=DATASET='${datasetId}' AND IND_ID='${indicatorId}' AND REF_AREA='${pageType === 'topic' ? 'WLD' : regionCode}'`;

  const disaggregationData = await fetchDisaggregationData(`${url.disaggregation}?datasetId=${datasetId}&indicatorId=${indicatorId}`);
  const { params: paramsWithT, isSecondAPICallEligible } = buildDisaggregationFiltersWithT(baseParams, disaggregationData, true);
  let dataUrl = `${url.data}?${paramsWithT}`;

  let data = await fetchData(dataUrl);
  if ((!Array.isArray(data) || !data.length) && isSecondAPICallEligible) {
    const { params: paramsWithoutT } = buildDisaggregationFiltersWithT(baseParams, disaggregationData, false);
    dataUrl = `${url.data}?${paramsWithoutT}`;
    data = await fetchData(dataUrl);
  }

  return { indicatorData: Array.isArray(data) && data.length ? data[0] : null, disaggregationData };
}

// Fetch code list and country list from the API
export const fetchCodeListAndCountryList = async (globalProperties) => {
  try {
    const codelistEndpoint = globalProperties?.codelistApiEndpoint || 'https://extdataportalqa.worldbank.org/qa/api/data360/metadata/codelist';
    const countryEndpoint = globalProperties?.countryApiEndpoint || 'https://extdataportalqa.worldbank.org/qa/api/data360/metadata/country';

    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
    };

    // if (apiKeyName && apiKeyValue) {
    //   headers[apiKeyName] = apiKeyValue;
    // }

    const codeListResponse = await fetch(codelistEndpoint, { headers });
    const codeList = await codeListResponse.json();

    const groupingResponse = await fetch(countryEndpoint, { headers });
    const countriesMapping = await groupingResponse.json();

    // Extract country list from HCL_WB_REGIONS
    let extractedCountryList = [];
    if (countriesMapping && countriesMapping.HCL_WB_REGIONS) {
      extractedCountryList = countriesMapping.HCL_WB_REGIONS.map(
        (item) => item.countries,
      );
      extractedCountryList = extractedCountryList.flat();
    }

    let countryList = [];
    // Filter code list to get only countries that are in the extracted country list
    if (extractedCountryList.length > 0 && codeList && codeList.REF_AREA) {
      const tempList = codeList.REF_AREA.filter((obj) => extractedCountryList.includes(obj.id));
      countryList = tempList;
    }

    return { codeList, countryList, countriesMapping };
  } catch (error) {
    console.error('Error fetching country list:', error);
    return { codeList: null, countryList: [], countriesMapping: null };
  }
};

// Fetch indicators data for a specific indicator
export const fetchIndicatorsDataForSpecificIndicator = async (
  specificIndicatorId,
  specificDatasetId,
  disaggregationResponse,
  countryCode,
  globalProperties,
  countryList,
) => {
  try {
    const datasetID = (() => {
      const upperCaseId = specificDatasetId.toUpperCase();
      if (upperCaseId === 'HCI') return 'WB_HCI';
      if (upperCaseId === 'HCP') return 'WB_HCP';
      return specificDatasetId;
    })();

    const baseParams = `filter= DATASET='${datasetID}' AND IND_ID='${specificIndicatorId
      .trim()
      .toUpperCase()}'`;

    const { params: paramsWithT, isSecondAPICallEligible } = buildDisaggregationFiltersWithT(baseParams, disaggregationResponse, true);
    const finalParamsWithT = `${paramsWithT} AND REF_AREA='${countryCode}'`;

    const dataApiEndpoint = globalProperties?.dataApiEndpoint || 'https://extdataportal.worldbank.org/api/data360/data/indicator';

    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
    };

    // if (apiKeyName && apiKeyValue) {
    //   headers[apiKeyName] = apiKeyValue;
    // }

    let responseData = await fetch(
      `${dataApiEndpoint}?${finalParamsWithT}`,
      { headers },
    );
    let response = await responseData.json();
    let indicatorResponse = response || [];

    if (!indicatorResponse.length && isSecondAPICallEligible) {
      const { params: paramsWithoutT } = buildDisaggregationFiltersWithT(
        baseParams,
        disaggregationResponse,
        false,
      );
      const finalParamsWithoutT = `${paramsWithoutT} AND REF_AREA='${countryCode}'`;

      // Use fallback endpoint for the second call if needed
      const fallbackEndpoint = globalProperties?.dataApiEndpoint || 'https://extdataportalqa.worldbank.org/qa/api/data360/data/indicator';

      responseData = await fetch(
        `${fallbackEndpoint}?${finalParamsWithoutT}`,
        { headers },
      );
      response = await responseData.json();
      indicatorResponse = response || [];
    }

    if (indicatorResponse?.length) {
      const allCountries = countryList.map((obj) => obj.id);
      const filteredResponse = indicatorResponse.filter((obj) => [...allCountries, ...['WLD']].find((name) => name === obj.countryCode));
      if (!Array.isArray(filteredResponse) || !filteredResponse.length) return [];

      return filteredResponse;
    }
    return [];
  } catch (error) {
    console.error('Error fetching indicator data:', error);
    return [];
  }
};

// Fetch disaggregation data for a specific indicator
export const fetchDisaggregationDataForSpecificIndicator = async (
  specificIndicatorId,
  specificDatasetId,
  globalProperties,
) => {
  const datasetID = (() => {
    const upperCaseId = specificDatasetId?.toUpperCase();
    if (upperCaseId === 'HCI') return 'WB_HCI';
    if (upperCaseId === 'HCP') return 'WB_HCP';
    return specificDatasetId;
  })();
  const params2 = `datasetId=${datasetID}&indicatorId=${specificIndicatorId}`;

  const disaggregationApiEndpoint = globalProperties?.disaggregationApiEndpoint || 'https://extdataportalqa.worldbank.org/qa/api/data360/metadata/disaggregation';

  const endpoint = `${disaggregationApiEndpoint}?${params2}`;

  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  // if (apiKeyName && apiKeyValue) {
  //   headers[apiKeyName] = apiKeyValue;
  // }

  const responseData = await fetch(endpoint, { headers });
  const response = await responseData.json();

  return response;
};

export default fetchData;
