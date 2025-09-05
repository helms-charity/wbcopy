export const FILTER_MAPPING = {
  SEX: 'SEX',
  AGE: 'AGE',
  URBANISATION: 'URB',
  COMP_BREAKDOWN_1: 'COMP1',
  COMP_BREAKDOWN_2: 'COMP2',
  COMP_BREAKDOWN_3: 'COMP3',
  FREQ: 'FREQ',
  UNIT_MEASURE: 'UNIT',
  // following are for ifc green bond filter
  BOND_TYPE: 'BOND_TYPE',
  CURRENCY: 'CURRENCY',
  DEAL_SIZE: 'DEAL_SIZE',
  ISSUER_TYPE: 'ISSUER_TYPE',
  METRIC: 'METRIC',
  TENOR_BUCKET: 'TENOR_BUCKET',
  UNIT: 'UNIT',
};

export const LINE_CHART_OPTIONS = {
  chart: {
    type: 'line',
    height: '600',
  },
  tooltip: {
    shared: true,
  },
  exporting: {
    // allowHTML: true,
    buttons: {
      contextButton: {
        menuItems: [
          'viewFullscreen',
          'downloadPNG',
          'downloadJPEG',
          'downloadSVG',
          'printChart',
        ],
      },
    },
  },
  title: {
    text: null,
  },
  subtitle: {
    text: null,
  },
  xAxis: {
    title: {
      text: null,
    },
  },
  yAxis: {
    title: {
      text: null,
    },
    labels: {
      format: '{text}',
    },
  },
  credits: {
    enabled: false,
  },
  legend: {
    enabled: true,
    // maxHeight: 80,
  },
  plotOptions: {
    series: {
      // connectNulls: true,
      marker: {
        enabled: false,
      },
      lineWidth: 4,
    },
  },
  responsive: {
    rules: [
      {
        condition: {
          maxWidth: 350,
        },
        // chartOptions: {
        //   xAxis: {
        //     labels: {
        //       step: 5,
        //     },
        //   },
        // },
      },
    ],
  },
};

export const UNIT_MEASURE_EXCEPTION = ['T', 'W_POP', 'BITS', 'BIT_S_IU'];

export const UNITS = {
  T: [
    { limit: 1_000, factor: 1_000, suffix: 'Kt' },
    { limit: 1_000_000, factor: 1_000_000, suffix: 'Mt' },
    { limit: 1_000_000_000, factor: 1_000_000_000, suffix: 'Gt' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Tt' },
  ],
  W_POP: [
    { limit: 1_000, factor: 1_000, suffix: 'Kw' },
    { limit: 1_000_000, factor: 1_000_000, suffix: 'Mw' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Gw' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Tt' },
  ],
  BITS: [
    { limit: 1_000, factor: 1_000, suffix: 'Kb' },
    { limit: 1_000_000, factor: 1_000_000, suffix: 'Mb' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Gb' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Tt' },
  ],
  BIT_S_IU: [
    { limit: 1_000, factor: 1_000, suffix: 'Kb' },
    { limit: 1_000_000, factor: 1_000_000, suffix: 'Mb' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Gb' },
    { limit: 1_000_000_000_000, factor: 1_000_000_000_000, suffix: 'Tt' },
  ],
};
