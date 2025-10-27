import {
  div, p, form, input, label, button, span,
} from '../../scripts/dom-helpers.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getLanguage } from '../../scripts/utils.js';

const CONSTANTS = {
  SIGNUP_HEADING: 'signupHeading',
  SIGNUP_NEWSLETTER_CHECKBOX: 'signupNewsletterCheckbox',
  SIGNUP_EALERTS_CHECKBOX: 'signupEalertsCheckbox',
  SIGNUP_NAME_PLACEHOLDER: 'signupNamePlaceholder',
  SIGNUP_EMAIL_PLACEHOLDER: 'signupEmailPlaceholder',
  SIGNUP_BUTTON_TEXT: 'signupButtonText',
  SIGNUP_TERMS: 'signupTerms',
  SIGNUP_TERMS_VALIDATION: 'signupTermsValidation',
  SIGNUP_EMAIL_VALIDATION_MESSAGE: 'signupEmailValidationMessage',
  SIGNUP_SUCCESS_MESSAGE: 'signupSuccessMessage',
  SIGNUP_NEWSLETTER_EALERT_ERROR: 'signupNewsletterEalertError',
  SIGNUP_ERROR_MESSAGE: 'signupErrorMessage',
  SIGNUP_SUCCESS_MESSAGE_PROFILE_UPDATE: 'signupSuccessMessageProfileUpdate',
  SIGNUP_ERROR_MESSAGE_EALERT: 'signupErrorMessageEalert',
  SIGNUP_DESCRIPTION: 'signupDescription',
  SIGNUP_THANK_YOU_MESSAGE: 'signupSuccessMessageProfileUpdate',
  SIGNUP_CONFIRMATION_MESSAGE: 'signupSuccessMessage',
  SIGNUP_CONSENT_API_URL: 'signupConsentApiUrl',
  SIGNUP_OCP_APIM_SUBSCRIPTION_KEY: 'signupOcpApimSubscriptionKey',
  SIGNUP_SUBSCRIBE_API_URL: 'signupSubscribeApiUrl',
  SIGNUP_CUSWBG_SUBSCRIPTION_LIST: 'signupCuswbgSubscriptionList',
  SIGNUP_EVENT_SUB_LIST: 'signupEventSubList',
  SIGNUP_EVENT_SUB_UPDATE_LIST: 'signupEventSubUpdateList',
  SIGNUP_SUBSCRIPTION_TYPE: 'signupSubscriptionType',
  SIGNUP_ANALYTICS_FORMNAME: 'signupAnalyticsFormname',
  SIGNUP_ANALYTICS_FORMTYPE: 'signupAnalyticsFormtype',
  SIGNUP_TIMEOUT_ERROR: 'signupTimeoutError',
  SIGNUP_PROFILE_UPDATE: 'signupProfileUpdate',
  REALTIME_ENDPOINT: 'realtimeEndpoint',
  NEWSLETTER_SIGNUP_SUBSCRIBE_API_URL: 'newsletterSignupSubscribeApiUrl',
  NEWSLETTER_SIGNUP_OCP_APIM_SUBSCRIPTION_KEY: 'newsletterSignupOcpApimSubscriptionKey',
  NEWSLETTER_SUBSCRIPTION_NAMES: 'newsletterSubscriptionNames',
  NEWSLETTER_SUBSCRIPTION_LOCAL_TITLES: 'newsletterSubscriptionLocalTitles',
  NEWSLETTER_APPLICATION_NAME: 'newsletterApplicationName',
  NEWSLETTER_NEW_SUBSCRIBER_EMAIL_TEMPLATE: 'newsletterNewSubscriberEmailTemplate',
  NEWSLETTER_EXISTING_SUBSCRIBER_EMAIL_TEMPLATE: 'newsletterExistingSubscriberEmailTemplate',
  EALERTS_SUBSCRIPTION_API_URL: 'ealertsSubscriptionApiUrl',
};

async function callConsentAPI(email, firstName, placeholders) {
  const consentData = {
    dsDataElements: {
      Name: firstName,
      Occupation: '',
    },
    identifier: email,
  };
  const response = await fetch(placeholders[CONSTANTS.SIGNUP_CONSENT_API_URL], {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': placeholders[CONSTANTS.SIGNUP_OCP_APIM_SUBSCRIPTION_KEY],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(consentData),
  });

  const result = await response.json();
  return result.consent === 'success';
}

async function callRealtimeAPI(placeholders) {
  try {
    const response = await fetch(placeholders[CONSTANTS.REALTIME_ENDPOINT]);
    if (!response.ok) {
      throw new Error('Failed to fetch realtime data');
    }

    const data = await response.json();
    const botScoreHeader = response.headers.get('x-bot-score');
    const botScore = botScoreHeader !== null ? parseInt(botScoreHeader, 10) : null;

    const realtime = {
      ipAddress: data.ipAddress,
    };

    if (Number.isInteger(botScore)) {
      realtime.botScore = botScore;
    }

    return realtime;
  } catch (error) {
    // console.error('Error fetching realtime data:', error);
  }
}

function callEalertSubscription(url, email, countries, resources) {
  const myHeaders = new Headers();

  const formdata = new FormData();
  formdata.append('email', email);
  formdata.append('preferred_lang', getLanguage());

  if (countries) {
    countries.split(',').forEach((country) => {
      if (country && country.trim()) {
        formdata.append('countries[]', country.trim().split('^')[0]);
      }
    });
  }

  if (resources) {
    resources.split(',').forEach((resource) => {
      if (resource && resource.trim()) {
        formdata.append('resources[]', resource.trim());
      }
    });
  }

  fetch(url, {
    method: 'POST',
    headers: myHeaders,
    body: formdata,
    redirect: 'follow'
  });
}

async function callSubscriptionAPI(email, firstName, placeholders, subscriptionNames) {
  let subscriptionName = '';
  let subscriptionLocalTitle = '';
  if (subscriptionNames) {
    const subscriptionParts = subscriptionNames.split('|');
    if (subscriptionParts.length > 1) {
      subscriptionName = subscriptionParts.pop().trim();
      subscriptionLocalTitle = subscriptionParts.join('|').trim();
    }
  }
  
  const realtime = await callRealtimeAPI(placeholders);
  
  const subscriptionData = {
    subscriptionNames: [
      subscriptionName || placeholders[CONSTANTS.NEWSLETTER_SUBSCRIPTION_NAMES]
    ],
    subscriptionLocalTitles: [
      subscriptionLocalTitle || placeholders[CONSTANTS.NEWSLETTER_SUBSCRIPTION_LOCAL_TITLES],
    ],
    email: email,
    firstName: firstName,
    applicationName: placeholders[CONSTANTS.NEWSLETTER_APPLICATION_NAME],
    emailTemplates: {
      newSubscriber: placeholders[CONSTANTS.NEWSLETTER_NEW_SUBSCRIBER_EMAIL_TEMPLATE],
      existingSubscriber: placeholders[CONSTANTS.NEWSLETTER_EXISTING_SUBSCRIBER_EMAIL_TEMPLATE]
    },
    locale: getLanguage(),
    subscriptionSource: window.location.href
  };

  if (realtime.ipAddress !== undefined) {
    subscriptionData.ipAddress = realtime.ipAddress;
  }

  if (realtime.botScore !== undefined) {
    subscriptionData.botScore = realtime.botScore;
  }

  const response = await fetch(placeholders[CONSTANTS.NEWSLETTER_SIGNUP_SUBSCRIBE_API_URL], {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': placeholders[CONSTANTS.NEWSLETTER_SIGNUP_OCP_APIM_SUBSCRIPTION_KEY],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  let status = '';
  const result = await response.json();
  if (result && result.hasOwnProperty('subscriptions')) {
    let subscriptions = result.subscriptions;
    if (subscriptions.length > 0) {
      let subscription = subscriptions[0];
      if (subscription.hasOwnProperty('status')) {
        status = subscription.status;
      }
    }
  }
  return status;
}

function showConfirmationMessage(formElement, message) {
  formElement.innerHTML = `
    <div class="confirmation-message">
      <p>${message}</p>
    </div>
  `;
}

function showThankYouMessage(formElement, message) {
  formElement.innerHTML = `
    <div class="thank-you-message">
      <p>${message}</p>
    </div>
  `;
}

function pushToWBGDataLayer(email, profileType, placeholder) {
  if (window.wbgData) {
    window.wbgData.page.pageInfo.formName = placeholder[CONSTANTS.SIGNUP_ANALYTICS_FORMNAME] || 'world bank group newsletters';
    window.wbgData.page.pageInfo.formType = placeholder[CONSTANTS.SIGNUP_ANALYTICS_FORMTYPE] || 'newsletter';
    window.wbgData.page.pageInfo.formSubmit = profileType;

    window.wbgData.page.newsletter = {
      userID: btoa(email),
      subscriptionlist: `${placeholder[CONSTANTS.NEWSLETTER_SUBSCRIPTION_NAMES]}:${getLanguage()}`,
    };

    if (profileType === 'N' && typeof _satellite === 'object') {
      // eslint-disable-next-line no-undef
      _satellite.track('extnewsletter');
    }
  }
}

function attachFormValidation(block, placeholders) {
  const emailInput = block.querySelector('#email');
  const errorMessage = block.querySelector('#error-message');

  // Custom Email Validation Function
  function validateEmail(emailId) {
    const re = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.(?!\d)\w{2,10})+$/;
    return re.test(String(emailId).toLowerCase());
  }

  emailInput.addEventListener('blur', () => {
    errorMessage.textContent = ''; // Reset error message
    if (!validateEmail(emailInput.value)) {
      emailInput.classList.add('input-error');
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.setAttribute('aria-describedby', 'email-error');
      errorMessage.textContent = placeholders[CONSTANTS.SIGNUP_EMAIL_VALIDATION_MESSAGE] || 'Please enter a valid email.';
      emailInput.setAttribute('aria-invalid', 'true');
    } else {
      emailInput.classList.remove('input-error');
      emailInput.removeAttribute('aria-invalid');
    }
  });

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    errorMessage.textContent = '';

    const termErrorMessage = block.querySelector('#term-error-message');
    termErrorMessage.textContent = '';

    const email = emailInput.value;
    const firstName = block.querySelector('#firstname').value || '';
    const agreeInput = block.querySelector('#agree');
    const agree = agreeInput.checked;
    const countryNewsCheckbox = block.querySelector('#country-news-checkbox');
    
    const subscriptionNames = block.querySelector('#signup-form').getAttribute('data-subscription') || '';
    // Reset previous styles
    emailInput.classList.remove('input-error');
    emailInput.setAttribute('aria-invalid', 'false');
    emailInput.setAttribute('aria-describedby', 'email-error');
    agreeInput.setAttribute('aria-invalid', 'false');
    agreeInput.setAttribute('aria-describedby', 'terms-error');

    if (!validateEmail(email)) {
      errorMessage.textContent = placeholders[CONSTANTS.SIGNUP_EMAIL_VALIDATION_MESSAGE] || 'Please enter a valid email.';
      emailInput.classList.add('input-error');
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.setAttribute('aria-describedby', 'email-error');
      return;
    }

    if (!agree) {
      termErrorMessage.textContent = placeholders[CONSTANTS.SIGNUP_TERMS_VALIDATION]
        || 'Please agree with the terms.';
      agreeInput.classList.add('input-error');
      agreeInput.setAttribute('aria-invalid', 'true');
      agreeInput.setAttribute('aria-describedby', 'terms-error');
      return;
    }

    try {
      if (countryNewsCheckbox && countryNewsCheckbox.checked && placeholders[CONSTANTS.EALERTS_SUBSCRIPTION_API_URL]) {
        callEalertSubscription(placeholders[CONSTANTS.EALERTS_SUBSCRIPTION_API_URL], email, countryNewsCheckbox.getAttribute('data-countries'), countryNewsCheckbox.getAttribute('data-resources'));
      }
      
      const subscriptionStatus = await callSubscriptionAPI(email, firstName, placeholders, subscriptionNames);
      let profileType = 'U';
      if (subscriptionStatus === 'Subscribed') {
        showConfirmationMessage(block.querySelector('#signup-form'), placeholders[CONSTANTS.SIGNUP_CONFIRMATION_MESSAGE]);
        profileType = 'N';
      } else if (subscriptionStatus === 'Already Subscribed') {
        showConfirmationMessage(block.querySelector('#signup-form'), placeholders[CONSTANTS.SIGNUP_ERROR_MESSAGE]);
      } else {
        errorMessage.textContent = placeholders[CONSTANTS.SIGNUP_TIMEOUT_ERROR] || 'An error occured while processing your request. Please try again later.';
      }
      pushToWBGDataLayer(email, profileType, placeholders);
      callConsentAPI(email, firstName, placeholders);
    } catch (error) {
      errorMessage.textContent = 'An unexpected error occurred. Please try again later.';
    }
  });
}

function createSignupModule(block, placeholders) {
  let countryNewsWrapper = '';
  const countryNewsCheckbox = block.children[0]?.textContent.trim();
  const subscriptionNames = block.children[1]?.textContent.trim();
  const countries = block.children[2]?.textContent.trim();
  const resources = block.children[3]?.textContent.trim();
  if (countryNewsCheckbox) {
    countryNewsWrapper = div(
      { class: 'country-news-checkbox checkbox-group' },
      input({
        type: 'checkbox',
        id: 'country-news-checkbox',
        'data-countries': countries ? countries : '',
        'data-resources': resources ? resources : '',
      }),
      label({
        for: 'country-news-checkbox',
      }, p(countryNewsCheckbox)),
    );
  }
  block.innerHTML = '';

  const container = div({ class: 'email-signup-container' });

  const content = div(
    { class: 'signup-content' },
    div({ class: 'main-heading' }, p({})),
    p({ class: 'signup-description' }, placeholders[CONSTANTS.SIGNUP_DESCRIPTION]),
  );
  content.querySelector('.main-heading p').innerHTML = placeholders[CONSTANTS.SIGNUP_HEADING];

  const formelement = form(
    { id: 'signup-form' },
    div(
      { class: 'input-group' },
      div(
        { class: 'input-container' },
        input({
          type: 'email',
          id: 'email',
          placeholder: ' ',
          require: true,
          'aria-describedby': 'error-message',
        }),
        label({
          for: 'email',
          class: 'floating-placeholder',
        }, placeholders[CONSTANTS.SIGNUP_EMAIL_PLACEHOLDER] || '* Your email'),
      ),
      div(
        { class: 'input-container' },
        input({
          type: 'text',
          id: 'firstname',
          placeholder: ' ',
        }),
        label({
          for: 'firstname',
          class: 'floating-placeholder',
        }, placeholders[CONSTANTS.SIGNUP_NAME_PLACEHOLDER] || 'Your first name'),
      ),
      button({ type: 'submit', id: 'signup-btn-desktop' }, span({ class: 'icon' }), placeholders[CONSTANTS.SIGNUP_BUTTON_TEXT] || 'Sign up'),
    ),
    div({ class: 'error-message', id: 'error-message', 'aria-live': 'polite' }),
    div(
      { class: 'input-group checkbox-group' },
      input({
        type: 'checkbox',
        id: 'agree',
        require: true,
      }),
      label({
        for: 'agree',
      }, placeholders[CONSTANTS.SIGNUP_TERMS] || 'I agree with the terms of the Privacy Notice and consent to my personal data being processed, to the extent necessary, to subscribe to the selected updates.'),
    ),
    div({ class: 'error-message', id: 'term-error-message', role: 'alert' }), countryNewsWrapper,
    button({ type: 'submit', id: 'signup-btn' }, span({ class: 'icon' }), placeholders[CONSTANTS.SIGNUP_BUTTON_TEXT] || 'Sign up'),
  );

  formelement.querySelector('.checkbox-group label').innerHTML = placeholders[CONSTANTS.SIGNUP_TERMS];
  formelement.setAttribute('novalidate', true);
  formelement.setAttribute('data-subscription', subscriptionNames);

  container.appendChild(content);
  container.appendChild(formelement);

  block.appendChild(container);

  attachFormValidation(block, placeholders);
}

async function fetchingPlaceholdersData(block) {
  const listOfAllPlaceholdersData = await fetchLanguagePlaceholders();
  if (!listOfAllPlaceholdersData) return;

  createSignupModule(block, listOfAllPlaceholdersData);
}

export default function decorate(block) {
  fetchingPlaceholdersData(block);
}
