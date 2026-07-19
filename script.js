/* ==========================================================================
   VIP BOOKING PORTAL — SCRIPT
   Handles screen transitions, multi-step form, loading animation,
   confetti, and EmailJS submission.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------ *
   * 1. EMAILJS CONFIGURATION
   *    Replace the three placeholder strings below with your own
   *    EmailJS credentials. Get these from https://www.emailjs.com
   * ------------------------------------------------------------------ */
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';   // <-- INSERT EmailJS Public Key HERE
  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID_HERE';   // <-- INSERT EmailJS Service ID HERE
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE'; // <-- INSERT EmailJS Template ID HERE

  // Initialize EmailJS with the public key (only works once key is filled in).
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  /* ------------------------------------------------------------------ *
   * 2. SCREEN ELEMENTS
   * ------------------------------------------------------------------ */
  const screenLanding = document.getElementById('screen-landing');
  const screenForm = document.getElementById('screen-form');
  const screenLoading = document.getElementById('screen-loading');
  const screenSuccess = document.getElementById('screen-success');

  const btnBegin = document.getElementById('btn-begin');
  const btnDone = document.getElementById('btn-done');
  const bookingForm = document.getElementById('booking-form');

  /**
   * Swap between full-page "screens" with a smooth fade transition.
   * @param {HTMLElement} fromScreen - screen currently visible
   * @param {HTMLElement} toScreen - screen to reveal
   */
  function switchScreen(fromScreen, toScreen) {
    fromScreen.style.opacity = '0';
    fromScreen.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      fromScreen.hidden = true;
      toScreen.hidden = false;
      // Force reflow so the fade-in animation replays.
      void toScreen.offsetWidth;
      toScreen.style.opacity = '';
      toScreen.style.transform = '';
      toScreen.classList.remove('screen--active');
      void toScreen.offsetWidth;
      toScreen.classList.add('screen--active');
    }, 350);
  }

  btnBegin.addEventListener('click', () => {
    switchScreen(screenLanding, screenForm);
  });

  /* ------------------------------------------------------------------ *
   * 3. MULTI-STEP FORM NAVIGATION
   * ------------------------------------------------------------------ */
  const TOTAL_STEPS = 6;
  const formSteps = Array.from(document.querySelectorAll('.form-step'));
  const progressFill = document.getElementById('progress-bar-fill');
  const progressTrack = document.getElementById('progress-bar-track');
  const progressLabel = document.getElementById('progress-step-label');

  function goToStep(stepNumber) {
    formSteps.forEach((stepEl) => {
      const isTarget = Number(stepEl.dataset.step) === stepNumber;
      stepEl.classList.toggle('form-step--active', isTarget);
    });

    const percent = (stepNumber / TOTAL_STEPS) * 100;
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    progressLabel.textContent = `Step ${stepNumber} of ${TOTAL_STEPS}`;

    // Move focus to the new step's heading for accessibility.
    const heading = document.querySelector(`.form-step[data-step="${stepNumber}"] h2`);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  /**
   * Validates the required input(s) inside a given step before advancing.
   */
  function stepIsValid(stepEl) {
    const requiredFields = stepEl.querySelectorAll('[required]');
    for (const field of requiredFields) {
      if (field.type === 'radio') {
        const groupName = field.name;
        const checked = stepEl.querySelector(`input[name="${groupName}"]:checked`);
        if (!checked) {
          field.reportValidity();
          return false;
        }
      } else if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  document.querySelectorAll('.btn-continue').forEach((btn) => {
    btn.addEventListener('click', () => {
      const currentStepEl = btn.closest('.form-step');
      if (!stepIsValid(currentStepEl)) return;
      goToStep(Number(btn.dataset.next));
    });
  });

  document.querySelectorAll('.btn-back').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToStep(Number(btn.dataset.prev));
    });
  });

  /* ------------------------------------------------------------------ *
   * 4. LOADING ANIMATION + PLAYFUL MESSAGES
   * ------------------------------------------------------------------ */
  const loadingMessages = [
    'Checking availability...',
    'Finding perfect outfit...',
    'Charging social battery...',
    'Making last-minute playlist...',
    'It takes FOREVER to pick out clothes!...',
    'Almost ready...'
  ];

  const loadingMessageEl = document.getElementById('loading-message');
  const loadingBarFill = document.getElementById('loading-bar-fill');

  function runLoadingSequence() {
    return new Promise((resolve) => {
      let index = 0;
      loadingMessageEl.textContent = loadingMessages[0];
      loadingBarFill.style.width = `${(1 / loadingMessages.length) * 100}%`;

      const interval = setInterval(() => {
        index += 1;

        if (index >= loadingMessages.length) {
          clearInterval(interval);
          loadingBarFill.style.width = '100%';
          setTimeout(resolve, 400);
          return;
        }

        loadingMessageEl.style.opacity = '0';
        setTimeout(() => {
          loadingMessageEl.textContent = loadingMessages[index];
          loadingMessageEl.style.opacity = '1';
        }, 200);

        loadingBarFill.style.width = `${((index + 1) / loadingMessages.length) * 100}%`;
      }, 1000);
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. CONFETTI ANIMATION (lightweight canvas implementation)
   * ------------------------------------------------------------------ */
  const confettiCanvas = document.getElementById('confetti-canvas');
  const confettiCtx = confettiCanvas.getContext('2d');
  const confettiColors = ['#D4AF37', '#F4E2A1', '#FFFFFF', '#4ADE80'];

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();

  function launchConfetti() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const pieceCount = 140;
    const pieces = Array.from({ length: pieceCount }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height * 0.4,
      size: 6 + Math.random() * 6,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      speedY: 2 + Math.random() * 3,
      speedX: -1.5 + Math.random() * 3,
      rotation: Math.random() * 360,
      rotationSpeed: -6 + Math.random() * 12
    }));

    let frame = 0;
    const maxFrames = 220;

    function draw() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      pieces.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        confettiCtx.restore();
      });

      frame += 1;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------------ *
   * 6. FORM SUBMISSION
   * ------------------------------------------------------------------ */
  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const lastStepEl = document.querySelector('.form-step[data-step="6"]');
    if (!stepIsValid(lastStepEl)) return;

    // Gather booking details.
    const formData = new FormData(bookingForm);
    const bookingDetails = {
      date: formData.get('date') || 'Not specified',
      time: formData.get('time') || 'Not specified',
      location: formData.get('location') || 'Not specified',
      spoil: formData.get('spoil') || 'Not specified',
      dresscode: formData.get('dresscode') || 'Not specified',
      request: formData.get('request') || 'None',
      timestamp: new Date().toLocaleString('en-KE', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };

    // Move from the form to the loading screen.
    switchScreen(screenForm, screenLoading);

    // Run the playful loading sequence and attempt the email send in parallel.
    const [emailResult] = await Promise.all([
      sendBookingEmail(bookingDetails).catch((err) => {
        console.warn('EmailJS send failed (check your credentials in script.js):', err);
        return null;
      }),
      runLoadingSequence()
    ]);

    // Move to the success screen and celebrate.
    switchScreen(screenLoading, screenSuccess);
    launchConfetti();
  });

  /**
   * Sends the booking details to the site owner via EmailJS.
   * Requires EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID
   * to be filled in at the top of this file. Your EmailJS template should
   * include matching variables, e.g. {{date}}, {{time}}, {{location}},
   * {{spoil}}, {{dresscode}}, {{request}}, {{timestamp}}.
   */
  function sendBookingEmail(details) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE') {
      // Credentials not configured yet — skip silently in dev/preview.
      return Promise.resolve(null);
    }

    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      date: details.date,
      time: details.time,
      location: details.location,
      spoil: details.spoil,
      dresscode: details.dresscode,
      request: details.request,
      timestamp: details.timestamp
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. DONE BUTTON — resets back to landing for a fresh visit
   * ------------------------------------------------------------------ */
  btnDone.addEventListener('click', () => {
    switchScreen(screenSuccess, screenLanding);
    bookingForm.reset();
    goToStep(1);
  });

});
