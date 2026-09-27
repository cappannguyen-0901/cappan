/* ============================================================
   MAIN — HÀM DÙNG CHUNG
============================================================ */

/* ---------- TOAST ---------- */
function showToast(msg, color = '#2E7D32') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = color;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ---------- MODAL ---------- */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

/* ---------- MOBILE MENU ---------- */
function toggleMobileMenu() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('open');
}

/* ============================================================
   UPDATE USER AREA — Phân quyền theo role
============================================================ */
function updateUserArea() {
  const el = document.getElementById('userArea');
  if (!el) return;

  const user = API.users.getCurrent();
  const cartCount = API.cart.get().reduce((s, i) => s + i.qty, 0);

  // ⚡ Nhân viên KHÔNG có giỏ hàng
  const isStaff = user && user.role === 'staff';
  const cartBtn = !isStaff ? `
    <a href="cart.html" class="cart-icon" title="Giỏ hàng">
      🛒${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
    </a>
  ` : '';

  if (!user) {
    el.innerHTML = `
      ${cartBtn}
      <a href="login.html" class="btn-login">Đăng nhập</a>
      <a href="register.html" class="btn-register">Đăng ký</a>
    `;
    return;
  }

  if (isStaff) {
    // NHÂN VIÊN — không giỏ hàng, có link dashboard
    el.innerHTML = `
      <a href="staff-dashboard.html" class="user-link">👨‍💼 ${user.name}</a>
      <button onclick="handleLogout()">Đăng xuất</button>
    `;
    return;
  }

  // KHÁCH — có giỏ hàng
  el.innerHTML = `
    ${cartBtn}
    <a href="profile.html" class="user-link">👤 ${user.name}</a>
    <button onclick="handleLogout()">Đăng xuất</button>
  `;
}
/* ============================================================
   LOGOUT — MODAL XÁC NHẬN + OVERLAY LOADING
============================================================ */
function handleLogout() {
  const existing = document.getElementById('logoutModal');
  if (existing) {
    existing.classList.add('open');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'logoutModal';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:400px; text-align:center;">
      <div style="font-size:3rem; margin-bottom:15px;">👋</div>
      <h2 style="color:var(--brown); margin-bottom:10px;">Đăng xuất?</h2>
      <p style="color:var(--gray); margin-bottom:25px;">
        Bạn có chắc chắn muốn đăng xuất khỏi CAPPAN?
      </p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button class="btn-outline" onclick="closeModal('logoutModal')" style="min-width:120px;">
          Ở lại
        </button>
        <button class="btn" onclick="confirmLogout()" style="min-width:120px;">
          Đăng xuất
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);
}

function confirmLogout() {
  closeModal('logoutModal');
  showLogoutLoading();

  setTimeout(() => {
    try {
      Auth.logout();
      console.log('✅ Đã xoá user');
    } catch (e) {
      console.error('❌ Lỗi logout:', e);
      localStorage.removeItem('cappan_current_user');
    }

    updateUserArea();
    showToast('✓ Đã đăng xuất thành công!');

    setTimeout(() => {
      hideLogoutLoading();
      window.location.href = 'index.html';
    }, 1000);
  }, 800);
}

function showLogoutLoading() {
  let overlay = document.getElementById('logoutLoading');
  if (overlay) {
    overlay.classList.add('show');
    return;
  }

  overlay = document.createElement('div');
  overlay.id = 'logoutLoading';
  overlay.className = 'logout-loading';
  overlay.innerHTML = `
    <div class="logout-loading-content">
      <div class="spinner"></div>
      <p>Đang đăng xuất...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);
}

function hideLogoutLoading() {
  const overlay = document.getElementById('logoutLoading');
  if (overlay) overlay.classList.remove('show');
}

/* ============================================================
   CHAT AI
============================================================ */
function toggleChat() {
  const box = document.getElementById('chatBox');
  if (!box) return;

  box.classList.toggle('open');
  if (box.classList.contains('open')) {
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }, 300);
  }
}

function sendChat() {
  const input = document.getElementById('chatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  // Ẩn quick replies
  const qr = document.getElementById('quickReplies');
  if (qr) qr.remove();

  // Hiện tin nhắn user
  addChatMsg(text, 'user');
  input.value = '';

  // Hiện "đang gõ..."
  showTypingIndicator();

  // Delay giả lập AI suy nghĩ
  const delay = 400 + Math.random() * 600;
  setTimeout(() => {
    hideTypingIndicator();
    const reply = AIBrain.reply(text);
    addChatMsg(reply, 'bot');
  }, delay);
}

function showTypingIndicator() {
  const body = document.getElementById('chatBody');
  if (!body) return;
  if (document.getElementById('typingIndicator')) return;

  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="bubble typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function addChatMsg(text, who) {
  const body = document.getElementById('chatBody');
  if (!body) return;

  const div = document.createElement('div');
  div.className = 'msg ' + who;

  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  div.innerHTML = `<div class="bubble">${safe.replace(/\n/g, '<br>')}</div>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

/* ---------- QUICK REPLIES ---------- */
const QUICK_REPLIES = [
  'Còn chỗ yên tĩnh không?',
  'Menu có gì?',
  'Giờ mở cửa?',
  'Đặt chỗ thế nào?'
];

function sendQuickReply(text) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = text;
  sendChat();
}

function renderQuickReplies() {
  const body = document.getElementById('chatBody');
  if (!body) return;
  if (document.getElementById('quickReplies')) return;

  const div = document.createElement('div');
  div.id = 'quickReplies';
  div.className = 'quick-replies';
  div.innerHTML = QUICK_REPLIES.map(q =>
    `<button class="quick-reply-btn" onclick="sendQuickReply('${q}')">${q}</button>`
  ).join('');
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

/* ============================================================
   INIT CHUNG
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateUserArea();

  // Hiện quick replies sau 1s
  setTimeout(renderQuickReplies, 1000);
});