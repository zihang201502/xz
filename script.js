// Cumulus OS — 下载页面交互脚本

document.addEventListener('DOMContentLoaded', function () {
    // 背景光晕跟随鼠标
    const glow = document.querySelector('.glow');
    if (glow) {
        document.addEventListener('mousemove', function (e) {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            glow.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px))';
        });
    }

    // 复制源代码密码
    const pwdCopy = document.getElementById('sourcePwdCopy');
    const pwdText = document.getElementById('sourcePwd');

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta);
    }

    function showPwdCopied() {
        if (!pwdCopy) return;
        const original = pwdCopy.textContent;
        pwdCopy.textContent = '已复制';
        pwdCopy.classList.add('copied');
        setTimeout(function () {
            pwdCopy.textContent = original;
            pwdCopy.classList.remove('copied');
        }, 1500);
    }

    if (pwdCopy && pwdText) {
        pwdCopy.addEventListener('click', function () {
            const pwd = pwdText.textContent.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(pwd).then(showPwdCopied).catch(function () {
                    fallbackCopy(pwd);
                    showPwdCopied();
                });
            } else {
                fallbackCopy(pwd);
                showPwdCopied();
            }
        });
    }

    // ===== 导航栏登录 / 创建账户 =====
    const ADMIN_USER = '管理员';
    const ADMIN_PASS = 'cumulusosNB666';
    const ACCOUNT_KEY = 'cumulusosAccounts';
    const USER_KEY = 'cumulusosUser';
    const ADMIN_CODES = ['372648', '283728', '476583', '119384', '556638'];
    // 每天从五个代码里选一个，同一天两个页面一致，第二天自动更换
    const SESSION_ADMIN_CODE = (function () {
        const d = new Date();
        const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate();
        return ADMIN_CODES[seed % ADMIN_CODES.length];
    })();

    const navLogin = document.getElementById('navLogin');
    const navLoginLabel = document.getElementById('navLoginLabel');
    const loginModal = document.getElementById('loginModal');
    const loginMask = document.getElementById('loginMask');
    const loginClose = document.getElementById('loginClose');
    const loginBox = document.getElementById('loginBox');
    const loginTitle = document.getElementById('loginTitle');
    const loginDesc = document.getElementById('loginDesc');
    const switchTip = document.getElementById('switchTip');
    const switchBtn = document.getElementById('switchBtn');

    const loginForm = document.getElementById('loginForm');
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    const loginError = document.getElementById('loginError');

    const registerForm = document.getElementById('registerForm');
    const regUser = document.getElementById('regUser');
    const regPass = document.getElementById('regPass');
    const regPass2 = document.getElementById('regPass2');
    const regCode = document.getElementById('regCode');
    const regError = document.getElementById('regError');

    const accountMenu = document.getElementById('accountMenu');
    const accountAdmin = document.getElementById('accountAdmin');
    const accountCode = document.getElementById('accountCode');
    const sourceItem = document.getElementById('sourceItem');
    const sourceWindow = document.getElementById('sourceWindow');
    const logoutBtn = document.getElementById('logoutBtn');

    const DESC_LOGIN = '登录后可以使用账户相关功能';
    const DESC_REGISTER = '填好下面的信息，就能拥有自己的账户';

    function readAccounts() {
        try {
            const raw = localStorage.getItem(ACCOUNT_KEY);
            const data = raw ? JSON.parse(raw) : {};
            if (!data || typeof data !== 'object') return {};
            const list = {};
            Object.keys(data).forEach(function (name) {
                const value = data[name];
                if (typeof value === 'string') {
                    list[name] = { pass: value, admin: false };
                } else if (value && typeof value === 'object') {
                    list[name] = { pass: String(value.pass || ''), admin: !!value.admin };
                }
            });
            return list;
        } catch (err) {
            return {};
        }
    }

    function saveAccounts(accounts) {
        try {
            localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
        } catch (err) {}
    }

    function getCurrentUser() {
        try {
            const user = localStorage.getItem(USER_KEY);
            if (user) return user;
            if (localStorage.getItem('cumulusAdmin') === '1') return ADMIN_USER;
            return '';
        } catch (err) {
            return '';
        }
    }

    function setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(USER_KEY, user);
            } else {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem('cumulusAdmin');
            }
        } catch (err) {}
    }

    function isAdminUser(user) {
        if (!user) return false;
        if (user === ADMIN_USER) return true;
        const accounts = readAccounts();
        return !!(accounts[user] && accounts[user].admin);
    }

    function refreshLoginUI() {
        if (!navLogin) return;
        const user = getCurrentUser();
        if (navLoginLabel) navLoginLabel.textContent = user || '登录';
        navLogin.classList.toggle('logged-in', !!user);
        const admin = isAdminUser(user);
        if (accountAdmin) accountAdmin.style.display = admin ? '' : 'none';
        if (accountCode) accountCode.textContent = admin ? SESSION_ADMIN_CODE : '------';
        if (sourceItem) sourceItem.style.display = admin ? '' : 'none';
        if (sourceWindow) sourceWindow.style.display = admin ? '' : 'none';
        if (!user && accountMenu) {
            accountMenu.classList.remove('active');
        }
    }

    function setMode(mode) {
        if (!loginBox) return;
        const isRegister = mode === 'register';
        loginBox.classList.toggle('mode-register', isRegister);
        if (loginTitle) loginTitle.textContent = isRegister ? '创建账户' : '登录';
        if (loginDesc) loginDesc.textContent = isRegister ? DESC_REGISTER : DESC_LOGIN;
        if (switchTip) switchTip.textContent = isRegister ? '已经有账户？' : '还没有账户？';
        if (switchBtn) switchBtn.textContent = isRegister ? '去登录' : '创建一个';
        if (loginError) loginError.textContent = '';
        if (regError) regError.textContent = '';
    }

    function openLoginModal() {
        if (!loginModal) return;
        setMode('login');
        loginModal.classList.add('active');
        if (loginUser) loginUser.value = '';
        if (loginPass) loginPass.value = '';
        if (regUser) regUser.value = '';
        if (regPass) regPass.value = '';
        if (regPass2) regPass2.value = '';
        document.body.style.overflow = 'hidden';
        setTimeout(function () {
            if (loginUser) loginUser.focus();
        }, 260);
    }

    function closeLoginModal() {
        if (!loginModal) return;
        loginModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function shakeBox() {
        if (!loginBox) return;
        loginBox.classList.remove('shake');
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
    }

    if (navLogin) {
        navLogin.addEventListener('click', function (e) {
            e.stopPropagation();
            if (getCurrentUser()) {
                if (accountMenu) accountMenu.classList.toggle('active');
            } else {
                openLoginModal();
            }
        });
    }

    if (switchBtn) {
        switchBtn.addEventListener('click', function () {
            const isRegister = loginBox && loginBox.classList.contains('mode-register');
            setMode(isRegister ? 'login' : 'register');
            const target = isRegister ? loginUser : regUser;
            if (target) setTimeout(function () { target.focus(); }, 120);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const user = (loginUser ? loginUser.value : '').trim();
            const pass = loginPass ? loginPass.value : '';

            let matched = '';
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                matched = ADMIN_USER;
            } else {
                const accounts = readAccounts();
                if (accounts[user] && accounts[user] === pass) matched = user;
            }

            if (matched) {
                setCurrentUser(matched);
                closeLoginModal();
                refreshLoginUI();
                return;
            }

            if (loginError) loginError.textContent = '账户或密码不正确';
            if (loginPass) {
                loginPass.value = '';
                loginPass.focus();
            }
            shakeBox();
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const user = (regUser ? regUser.value : '').trim();
            const pass = regPass ? regPass.value : '';
            const pass2 = regPass2 ? regPass2.value : '';

            const fail = function (msg, el) {
                if (regError) regError.textContent = msg;
                shakeBox();
                if (el) el.focus();
            };

            if (!user) return fail('请填写用户名', regUser);
            if (user.length < 2 || user.length > 16) return fail('用户名需要 2-16 个字符', regUser);
            if (/\s/.test(user)) return fail('用户名不能包含空格', regUser);
            if (user === ADMIN_USER) return fail('这个用户名已被占用', regUser);
            if (!pass) return fail('请填写密码', regPass);
            if (pass.length < 6) return fail('密码至少 6 位', regPass);
            if (pass !== pass2) return fail('两次输入的密码不一致', regPass2);

            const accounts = readAccounts();
            if (accounts[user]) return fail('这个用户名已被占用', regUser);

            accounts[user] = pass;
            saveAccounts(accounts);
            setCurrentUser(user);
            closeLoginModal();
            refreshLoginUI();
        });
    }

    if (loginClose) loginClose.addEventListener('click', closeLoginModal);
    if (loginMask) loginMask.addEventListener('click', closeLoginModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && loginModal && loginModal.classList.contains('active')) {
            closeLoginModal();
        }
    });

    document.addEventListener('click', function (e) {
        if (accountMenu && accountMenu.classList.contains('active')) {
            if (!accountMenu.contains(e.target) && e.target !== navLogin) {
                accountMenu.classList.remove('active');
            }
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            setCurrentUser('');
            if (accountMenu) accountMenu.classList.remove('active');
            refreshLoginUI();
        });
    }

    refreshLoginUI();
});
