/* ============================================================
   TRANG PROFILE
============================================================ */

function renderProfile() {
  const user = Store.getUser();
  const guest = document.getElementById('profileGuest');
  const content = document.getElementById('profileContent');
  if (!guest || !content) return;

  if (!user) {
    guest.hidden = false;
    content.hidden = true;
    return;
  }
  guest.hidden = true;
  content.hidden = false;

  // Header info
  document.getElementById('profileAvatar').textContent =
    (user.name || user.phone).charAt(0).toUpperCase();
  document.getElementById('profileName').textContent = user.name || 'Khách';
  document.getElementById('profilePhone').textContent = '📞 ' + user.phone;
  document.getElementById('profileJoined').textContent =
    user.joinedAt ? '🗓️ Thành viên từ ' + new Date(user.joinedAt).toLocaleDateString('vi-VN') : '';

  // Form info
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editPhone').value = user.phone || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editBirthday').value = user.birthday || '';
  document.getElementById('editAddress').value = user.address || '';

  renderBookings();
  renderOrders();
}

function switchProfileTab(tabId) {
  document.querySelectorAll('.profile-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabId)
  );
  document.querySelectorAll('.profile-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'panel-' + tabId)
  );
}

/* ----- LỊCH SỬ ĐẶT CHỖ ----- */
function renderBookings() {
  const el = document.getElementById('bookingsList');
  if (!el) return;

  const bookings = Store.getBookings();
  if (bookings.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🪑</div>
        <p>Bạn chưa có lịch sử đặt chỗ nào.</p>
        <a href="booking.html" class="btn">Đặt chỗ ngay</a>
      </div>
    `;
    return;
  }

  el.innerHTML = '<div class="history-list">' + bookings.slice().reverse().map(b => `
    <div class="history-card">
      <div class="history-icon">🪑</div>
      <div class="history-body">
        <div class="history-title">Chỗ ${b.seat} – ${b.floor}</div>
        <div class="history-meta">
          <span>📅 ${b.date}</span>
          <span>🕐 ${b.time}</span>
          <span>👥 ${b.guests || '2 người'}</span>
        </div>
        ${b.note ? `<div class="history-note">📝 ${b.note}</div>` : ''}
      </div>
      <div class="history-status ${b.status === 'cancelled' ? 'cancelled' : 'success'}">
        ${b.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}
      </div>
    </div>
  `).join('') + '</div>';
}

/* ----- LỊCH SỬ ĐƠN HÀNG ----- */
function renderOrders() {
  const el = document.getElementById('ordersList');
  if (!el) return;

  const orders = Store.getOrders();
  if (orders.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>Bạn chưa có đơn hàng nào.</p>
        <a href="order.html" class="btn">Đặt nước ngay</a>
      </div>
    `;
    return;
  }

  el.innerHTML = '<div class="history-list">' + orders.slice().reverse().map(o => `
    <div class="history-card">
      <div class="history-icon">📦</div>
      <div class="history-body">
        <div class="history-title">
          Đơn #${o.id} 
          <span class="order-status ${o.step >= 4 ? 'success' : 'pending'}">
            ${o.step >= 4 ? 'Đã giao' : 'Đang xử lý'}
          </span>
        </div>
        <div class="history-meta">
          <span>📅 ${o.time}</span>
        </div>
        <div class="order-items">
          ${o.items.map(i => `<span class="order-item-tag">${i.name} × ${i.qty}</span>`).join('')}
        </div>
        <div class="history-note">📍 ${o.address}</div>
      </div>
      <div class="history-total">
        <div class="total-label">Tổng</div>
        <div class="total-value">${formatVND(o.total)}</div>
      </div>
    </div>
  `).join('') + '</div>';
}

/* ----- LƯU THÔNG TIN CÁ NHÂN ----- */
function saveProfile() {
  const user = Store.getUser();
  if (!user) return;

  user.name = document.getElementById('editName').value.trim() || user.name;
  user.email = document.getElementById('editEmail').value.trim();
  user.birthday = document.getElementById('editBirthday').value;
  user.address = document.getElementById('editAddress').value.trim();

  Store.setUser(user);
  updateUserArea();
  renderProfile();
  showToast('✓ Đã lưu thông tin cá nhân!');
}

/* ----- INIT ----- */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('profileContent')) return;
  renderProfile();
});