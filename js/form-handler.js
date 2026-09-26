/**
 * ============================================================================
 *  CoWiTa — form submission handler
 * ============================================================================
 *
 *  Takes over every <form data-cowita-form> on the site, submits the values
 *  to the Google Apps Script backend (see apps-script/Code.gs), then sends
 *  the visitor to the confirmation page:
 *
 *      /get-involved/thank-you.html
 *
 *  The thank-you page shows "We have received your application..." and an
 *  "Explore CoWiTa" button, and a confirmation email is sent to the visitor
 *  by the backend.
 *
 *  Also upgrades the talent quick-pick cards on have-talent.html so clicking
 *  one scrolls to the form and pre-selects the matching radio button.
 * ============================================================================
 */

(function () {
  'use strict';

  var CONFIRMATION_PAGE = '/get-involved/thank-you.html';

  /* =========================================================
     BOOTSTRAP
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var forms = document.querySelectorAll('form[data-cowita-form]');

    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        handleSubmit(event, form);
      });
    });

    initTalentQuickPick();
  }

  /* =========================================================
     SUBMISSION
     ========================================================= */

  function handleSubmit(event, form) {
    // Native HTML5 validation runs first; bail out if invalid.
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      return;
    }

    event.preventDefault();

    if (isHoneypotFilled(form)) {
      // Bot: send them somewhere harmless without submitting anything.
      window.location.href = CONFIRMATION_PAGE;
      return;
    }

    var payload = buildPayload(form);
    var submitButton = form.querySelector('[type="submit"]');
    var originalLabel = submitButton ? submitButton.textContent : '';

    setBusyState(form, submitButton, true);

    if (!window.COWITA_CONFIG || !window.COWITA_CONFIG.FORM_ENDPOINT) {
      setBusyState(form, submitButton, false);
      showInlineError(
        form,
        'This form is not connected to the CoWiTa database yet. ' +
          'Please email us directly at info@cowiterg@gmail.com — we will get it working shortly.'
      );
      return;
    }

    fetchSubmission(payload)
      .then(function () {
        window.location.href = form.dataset.thankYouUrl || CONFIRMATION_PAGE;
      })
      .catch(function (error) {
        setBusyState(form, submitButton, false);
        showInlineError(
          form,
          'Sorry — we could not submit your application just now. ' +
            'Please check your internet connection and try again, or email us at info@cowiterg@gmail.com.'
        );
        console.error('CoWiTa form submission failed:', error);
      });
  }

  function fetchSubmission(payload) {
    return fetch(window.COWITA_CONFIG.FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })
      .then(function (response) {
        var contentType = response.headers.get('content-type') || '';

        if (contentType.indexOf('application/json') === -1) {
          // Apps Script sometimes answers with a redirect page; treat any
          // 2xx response as delivered.
          return { ok: true };
        }

        return response.json().then(function (result) {
          if (!result || result.ok !== true) {
            throw new Error(
              (result && result.error) || 'Submission rejected by the server.'
            );
          }

          return result;
        });
      })
      .then(function (result) {
        if (result && result.ok !== true) {
          throw new Error('Submission rejected by the server.');
        }

        return result;
      });
  }

  function buildPayload(form) {
    var payload = {
      form_type: form.dataset.formType || 'contact',
    };

    if (window.COWITA_CONFIG && window.COWITA_CONFIG.DEBUG) {
      payload.debug = true;
    }

    var fields = form.querySelectorAll('input, select, textarea');

    Array.prototype.forEach.call(fields, function (field) {
      if (field.disabled || !field.name) {
        return;
      }

      if (field.type === 'checkbox' && field.type === 'radio') {
        return;
      }

      if (field.type === 'checkbox') {
        var groupName = field.name.replace(/\[\]$/, '');
        var group = form.querySelectorAll(
          'input[type="checkbox"][name="' + cssEscape(field.name) + '"]'
        );

        if (group.length > 1) {
          // Multi-select group: collect every checked value once.
          if (field !== group[0] || payload[groupName]) {
            return;
          }

          var checked = [];

          Array.prototype.forEach.call(group, function (box) {
            if (box.checked) {
              checked.push(box.value);
            }
          });

          payload[groupName] = checked;
          return;
        }

        payload[field.name] = field.checked ? field.value : '';
        return;
      }

      if (field.type === 'radio') {
        if (!field.checked) {
          return;
        }

        payload[field.name] = field.value;
        return;
      }

      if (field.type === 'file') {
        // File uploads are not part of this pipeline.
        return;
      }

      payload[field.name] = field.value;
    });

    return payload;
  }

  function isHoneypotFilled(form) {
    var honeypot = form.querySelector('input[name="honeypot"]');

    return Boolean(honeypot && honeypot.value);
  }

  /* =========================================================
     UI STATE HELPERS
     ========================================================= */

  function setBusyState(form, submitButton, busy) {
    var errorBox = form.querySelector('.form-error');

    if (errorBox) {
      errorBox.remove();
    }

    form.classList.toggle('is-submitting', busy);

    if (submitButton) {
      submitButton.disabled = busy;

      if (busy) {
        submitButton.dataset.originalLabel = submitButton.textContent;
        submitButton.textContent = 'Submitting…';
      } else if (submitButton.dataset.originalLabel) {
        submitButton.textContent = submitButton.dataset.originalLabel;
      }
    }
  }

  function showInlineError(form, message) {
    var errorBox = document.createElement('div');

    errorBox.className = 'form-error';
    errorBox.setAttribute('role', 'alert');
    errorBox.style.cssText =
      'margin-top:18px;padding:14px 16px;border-left:3px solid #b3432b;' +
      'background:rgba(179,67,43,0.08);color:#7c2d1a;font-size:0.9rem;line-height:1.6;';
    errorBox.textContent = message;

    var actions = form.querySelector('[type="submit"]');

    if (actions && actions.parentNode) {
      actions.parentNode.insertBefore(errorBox, actions.nextSibling);
    } else {
      form.appendChild(errorBox);
    }

    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) {
      return window.CSS.escape(value);
    }

    return value.replace(/["\\\]]/g, '\\$&');
  }

  /* =========================================================
     TALENT QUICK-PICK CARDS
     ========================================================= */

  /**
   * have-talent.html has radio cards ("talent_preview") bound to the form
   * via the form attribute. Selecting one now scrolls to the form and
   * mirrors the choice into the form's discipline radios.
   */
  function initTalentQuickPick() {
    var quickPicks = document.querySelectorAll('input[name="talent_preview"]');

    if (!quickPicks.length) {
      return;
    }

    Array.prototype.forEach.call(quickPicks, function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) {
          return;
        }

        var form = document.getElementById('talent-intake-form');
        var discipline = form
          ? form.querySelector('input[name="discipline"][value="' + input.value + '"]')
          : null;

        if (discipline) {
          discipline.checked = true;
        }

        var formSection = document.getElementById('talent-form');

        if (formSection && typeof formSection.scrollIntoView === 'function') {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();
