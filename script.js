// ===== IEEE Registration Form – Interactivity =====

document.addEventListener('DOMContentLoaded', () => {
  initCheckboxes();
  initRadios();
  initProgressBar();
  initFormSubmit();
  initOtherField();
});

// === Checkbox toggle ===
function initCheckboxes() {
  document.querySelectorAll('.checkbox-item').forEach(item => {
    item.addEventListener('click', () => {
      const cb = item.querySelector('input[type="checkbox"]');
      cb.checked = !cb.checked;
      item.classList.toggle('checked', cb.checked);
      
      // Handle "Other" option
      if (cb.value === 'other') {
        const otherField = document.getElementById('other-interest-field');
        if (otherField) otherField.style.display = cb.checked ? 'block' : 'none';
      }
      
      updateProgress();
    });
  });
}

// === Radio toggle ===
function initRadios() {
  document.querySelectorAll('.radio-item').forEach(item => {
    item.addEventListener('click', () => {
      const radio = item.querySelector('input[type="radio"]');
      const name = radio.name;
      // Uncheck siblings
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.checked = false;
        r.closest('.radio-item').classList.remove('checked');
      });
      radio.checked = true;
      item.classList.add('checked');
      updateProgress();
    });
  });
}

// === Other interest text field ===
function initOtherField() {
  const otherField = document.getElementById('other-interest-field');
  if (otherField) otherField.style.display = 'none';
}

// === Progress bar ===
function initProgressBar() {
  document.querySelectorAll('.field-input, .field-select, .field-textarea').forEach(el => {
    el.addEventListener('input', updateProgress);
    el.addEventListener('change', updateProgress);
  });
  updateProgress();
}

function updateProgress() {
  const totalSections = 6;
  let completedSections = 0;

  // Section 1: Personal info (check required fields)
  const s1Fields = ['full-name', 'university-id', 'major', 'year', 'phone'];
  const s1Filled = s1Fields.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  }).length;
  if (s1Filled >= 4) completedSections += s1Filled / s1Fields.length;

  // Section 2: Interests (at least one checkbox)
  const checkedInterests = document.querySelectorAll('#interests-section .checkbox-item.checked').length;
  if (checkedInterests > 0) completedSections += 1;

  // Section 3: Experience
  const checkedExperience = document.querySelectorAll('#experience-section .checkbox-item.checked').length;
  const skillsFilled = document.getElementById('skills-text')?.value.trim() !== '';
  if (checkedExperience > 0 || skillsFilled) completedSections += 1;

  // Section 4: Participation type
  const checkedParticipation = document.querySelectorAll('#participation-section .radio-item.checked').length;
  if (checkedParticipation > 0) completedSections += 1;

  // Section 5: Motivation
  const s5Fields = ['motivation', 'expectations', 'wishes'];
  const s5Filled = s5Fields.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  }).length;
  if (s5Filled > 0) completedSections += s5Filled / s5Fields.length;

  // Section 6: Availability
  const s6Fields = ['commitment', 'intro-session'];
  const s6Filled = s6Fields.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  }).length;
  if (s6Filled > 0) completedSections += s6Filled / s6Fields.length;

  const percent = Math.round((completedSections / totalSections) * 100);
  const progressFill = document.querySelector('.progress-fill');
  const progressCount = document.querySelector('.progress-count');
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressCount) progressCount.textContent = `${percent}%`;
}

// === Form validation & submit ===
function initFormSubmit() {
  const form = document.getElementById('ieee-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    let valid = true;

    // Required fields
    const requiredFields = [
      { id: 'full-name', msg: 'يرجى إدخال الاسم الكامل' },
      { id: 'university-id', msg: 'يرجى إدخال الرقم الجامعي' },
      { id: 'major', msg: 'يرجى إدخال التخصص' },
      { id: 'year', msg: 'يرجى اختيار السنة الدراسية' },
      { id: 'phone', msg: 'يرجى إدخال رقم الهاتف' },
      { id: 'motivation', msg: 'يرجى ذكر دافعك للانضمام' },
      { id: 'commitment', msg: 'يرجى تأكيد إمكانية الالتزام' },
      { id: 'intro-session', msg: 'يرجى الإجابة على هذا السؤال' },
    ];

    requiredFields.forEach(({ id, msg }) => {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        showError(id, msg);
        valid = false;
      }
    });

    // At least one interest
    const checkedInterests = document.querySelectorAll('#interests-section .checkbox-item.checked').length;
    if (checkedInterests === 0) {
      const errEl = document.getElementById('interests-error');
      if (errEl) { errEl.classList.add('visible'); }
      valid = false;
    }

    if (!valid) {
      // Scroll to first error
      const firstError = document.querySelector('.field-input.error, .field-select.error, .field-textarea.error, .field-error.visible');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // --- Sending data to Google Sheets ---
    const submitBtn = form.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML = '<span>جاري الإرسال...</span>';

    const url = 'https://script.google.com/macros/s/AKfycbyouBvR44x9qnlsGcnO_2lCIuLnaCsc2eXWimCruWCYijg0G3QmmadOG6ityqmUDBRn/exec';

    const formData = new FormData(form);
    const formObject = {};
    
    // Collect all data, joining multiple values (like checkboxes) with a comma
    for (const [key, value] of formData.entries()) {
      if (formObject[key]) {
        formObject[key] += ', ' + value;
      } else {
        formObject[key] = value;
      }
    }

    fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Used to prevent CORS issues with Google Apps Script
      body: JSON.stringify(formObject)
    })
    .then(() => {
      // Success
      document.getElementById('success-modal').classList.add('active');
      form.reset();
      
      // Reset visual states of checkboxes/radios
      document.querySelectorAll('.checked').forEach(el => el.classList.remove('checked'));
      updateProgress();
    })
    .catch(err => {
      console.error('Submission error:', err);
      alert('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى أو التأكد من اتصالك بالإنترنت.');
    })
    .finally(() => {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.innerHTML = originalBtnText;
    });
  });
}

function showError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.add('error');
  const errEl = document.getElementById(`${fieldId}-error`);
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.add('visible');
  }
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
}

// === Modal close ===
function closeModal() {
  document.getElementById('success-modal').classList.remove('active');
}
