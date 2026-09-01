document.addEventListener('DOMContentLoaded', () => {
    firebase.initializeApp(FIREBASE_CONFIG);
    const auth = firebase.auth();

    let otpVerified = false; // Gate flag

    // ── Tab Switching ──────────────────────────────────────────────────────
    const loginTab    = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm   = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginTab?.addEventListener('click', () => {
        loginTab.classList.add('active'); registerTab.classList.remove('active');
        loginForm.style.display = 'block'; registerForm.style.display = 'none';
    });
    registerTab?.addEventListener('click', () => {
        registerTab.classList.add('active'); loginTab.classList.remove('active');
        registerForm.style.display = 'block'; loginForm.style.display = 'none';
    });

    // ── Role Toggle: show/hide Admin or Join fields ────────────────────────
    const regRole     = document.getElementById('reg-role');
    const adminFields = document.getElementById('admin-fields');
    const joinFields  = document.getElementById('join-fields');

    regRole?.addEventListener('change', () => {
        if (regRole.value === 'Admin') {
            adminFields.style.display = 'block';
            joinFields.style.display  = 'none';
        } else {
            adminFields.style.display = 'none';
            joinFields.style.display  = 'block';
        }
    });

    // ── Toggle Password Visibility ─────────────────────────────────────────
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    });

    // ── OTP: Send OTP ─────────────────────────────────────────────────────
    const sendOtpBtn  = document.getElementById('send-otp-btn');
    const resendBtn   = document.getElementById('resend-otp-btn');
    const otpStep     = document.getElementById('otp-step');
    const regGate     = document.getElementById('reg-gate');
    const emailInput  = document.getElementById('reg-email');

    async function sendOtp(isResend = false) {
        const email = emailInput?.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address first.', 'error');
            return;
        }

        const btn = isResend ? resendBtn : sendOtpBtn;
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const nameVal = document.getElementById('reg-name')?.value.trim() || '';
            const resp = await API.otp.send({ email, name: nameVal });

            otpStep.classList.add('visible');

            if (resp.testMode && resp.previewUrl) {
                // Ethereal test mode — show a clickable notice
                showToast(`🧪 Test email sent! <a href="${resp.previewUrl}" target="_blank" style="color:#a78bfa;text-decoration:underline;">Click here to view OTP email</a>`, 'info');
                // Also print to console for convenience
                console.log('%c📧 Test OTP Email Preview:', 'color:#a78bfa;font-weight:bold;font-size:14px;');
                console.log('%c👉 ' + resp.previewUrl, 'color:#60a5fa;');
                // Show a visible banner on the page
                showEtherealBanner(resp.previewUrl);
            } else {
                showToast(`✉️ OTP sent to ${email} — check your inbox!`, 'success');
            }

            if (sendOtpBtn) sendOtpBtn.textContent = 'Resend';
        } catch (err) {
            showToast(err.message || 'Failed to send OTP', 'error');
        } finally {
            btn.disabled = false;
            if (btn.textContent === 'Sending...') {
                btn.textContent = isResend ? 'Resend OTP' : 'Resend';
            }
        }
    }

    sendOtpBtn?.addEventListener('click', () => sendOtp(false));
    resendBtn?.addEventListener('click', () => sendOtp(true));

    // ── OTP: Verify OTP ────────────────────────────────────────────────────
    const verifyOtpBtn = document.getElementById('verify-otp-btn');

    verifyOtpBtn?.addEventListener('click', async () => {
        const email = emailInput?.value.trim();
        const otp   = document.getElementById('otp-input')?.value.trim();
        if (!email || !otp) { showToast('Enter the OTP code from your email.', 'error'); return; }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = '...';

        try {
            await API.otp.verify({ email, otp });
            unlockRegistration();
            // Remove the Ethereal banner if present
            document.getElementById('ethereal-banner')?.remove();
        } catch (err) {
            showToast(err.message || 'Invalid OTP. Please check and try again.', 'error');
        } finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify';
        }
    });

    function unlockRegistration() {
        otpVerified = true;
        otpStep.classList.remove('visible');
        document.getElementById('email-verified-section').style.display = 'block';
        emailInput.readOnly = true;
        if (sendOtpBtn) sendOtpBtn.style.display = 'none';
        regGate?.classList.add('unlocked');
        showToast('✅ Email verified! Complete your registration below.', 'success');
    }

    // ── Ethereal Test Mode Banner ──────────────────────────────────────────
    function showEtherealBanner(previewUrl) {
        // Remove any existing banner
        document.getElementById('ethereal-banner')?.remove();

        const banner = document.createElement('div');
        banner.id = 'ethereal-banner';
        banner.style.cssText = `
            background: rgba(99,102,241,0.12);
            border: 1px solid rgba(99,102,241,0.35);
            border-radius: 10px;
            padding: 1rem 1.25rem;
            margin-top: 0.75rem;
            font-size: 0.83rem;
            color: #cbd5e1;
            line-height: 1.6;
            animation: fadeIn 0.3s ease;
        `;
        banner.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:0.75rem;">
                <span style="font-size:1.3rem;">🧪</span>
                <div>
                    <strong style="color:#a78bfa;display:block;margin-bottom:0.3rem;">Test Mode — Ethereal Email</strong>
                    Your OTP was sent to a <em>fake inbox</em> (not a real email).<br>
                    Click the link below to open and view the OTP email in your browser:
                    <a href="${previewUrl}" target="_blank" rel="noopener" style="
                        display:block; margin-top:0.6rem;
                        color:#60a5fa; word-break:break-all;
                        font-size:0.78rem; text-decoration:underline;
                    ">${previewUrl}</a>
                </div>
            </div>
        `;

        // Insert after the OTP input step
        const otpStepEl = document.getElementById('otp-step');
        otpStepEl?.insertAdjacentElement('afterend', banner);
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        btn.disabled = true; btn.textContent = 'Signing in...';

        try {
            const cred    = await auth.signInWithEmailAndPassword(email, password);
            const idToken = await cred.user.getIdToken();
            const data    = await API.auth.login({ idToken });

            localStorage.setItem('stocksense_token',       idToken);
            localStorage.setItem('stocksense_user',        JSON.stringify(data.user));
            localStorage.setItem('stocksense_businessId',  data.businessId);
            localStorage.setItem('stocksense_businessName',data.businessName || '');
            if (data.joinCode) localStorage.setItem('stocksense_joinCode', data.joinCode);

            // Refresh branding before redirect
            if (typeof refreshBranding === 'function') refreshBranding();

            window.location.href = 'dashboard.html';
        } catch (err) {
            showToast(err.message || 'Login failed', 'error');
            btn.disabled = false; btn.textContent = 'Sign In';
        }
    });

    // ── REGISTER ───────────────────────────────────────────────────────────
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!otpVerified) {
            showToast('Please verify your email with OTP first.', 'error');
            return;
        }

        const name     = document.getElementById('reg-name').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const role     = document.getElementById('reg-role').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true; submitBtn.textContent = 'Creating account...';

        if (!name) { showToast('Please enter your full name.', 'error'); submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; return; }
        if (password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; return; }

        try {
            const cred    = await auth.createUserWithEmailAndPassword(email, password);
            const idToken = await cred.user.getIdToken();

            let payload = { idToken, name, email, role };

            if (role === 'Admin') {
                const businessName = document.getElementById('reg-business-name').value.trim();
                const adminCode    = document.getElementById('reg-admin-code').value.trim();
                if (!businessName) throw new Error('Please enter your Business Name.');
                if (!adminCode)    throw new Error('Please enter the Admin Secret Code.');
                payload = { ...payload, businessName, adminCode };
            } else {
                const joinCode = document.getElementById('reg-join-code').value.trim().toUpperCase();
                if (!joinCode) throw new Error('Please enter the Business Join Code from your Admin.');
                payload = { ...payload, joinCode };
            }

            const data = await API.auth.register(payload);

            localStorage.setItem('stocksense_token',        idToken);
            localStorage.setItem('stocksense_user',         JSON.stringify(data.user));
            localStorage.setItem('stocksense_businessId',   data.businessId);
            localStorage.setItem('stocksense_businessName', data.businessName || '');
            if (data.joinCode) localStorage.setItem('stocksense_joinCode', data.joinCode);

            // Show Join Code to new Admin
            if (role === 'Admin' && data.joinCode) {
                showToast(`✅ Business created! Your Join Code: ${data.joinCode}`, 'success');
                setTimeout(() => {
                    alert(`✅ Business Created!\n\nYour Business Join Code:\n\n🔑 ${data.joinCode}\n\nShare this with your Managers so they can join.`);
                    window.location.href = 'dashboard.html';
                }, 800);
                return;
            }

            window.location.href = 'dashboard.html';
        } catch (err) {
            showToast(err.message || 'Registration failed', 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Create Account';
        }
    });
});
