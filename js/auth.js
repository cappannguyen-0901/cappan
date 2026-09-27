/* ============================================================
   AUTH — ĐĂNG NHẬP / ĐĂNG KÝ / PHÂN QUYỀN
============================================================ */

const Auth = {
  isLoggedIn() { return !!API.users.getCurrent(); },

  isStaff() {
    const u = API.users.getCurrent();
    return u && u.role === 'staff';
  },

  isCustomer() {
    const u = API.users.getCurrent();
    return u && u.role === 'customer';
  },

    login(phone, password) {
    console.log('🔐 Login attempt:', phone);

    const user = API.users.getByPhone(phone);
    console.log('📋 Tìm thấy user:', user);

    if (!user) {
      const allUsers = API.users.getAll();
      console.log('📋 Danh sách users hiện có:', allUsers);
      return { ok: false, error: 'Số điện thoại chưa đăng ký. Thử: 0900000001' };
    }

    if (user.password !== password) {
      return { ok: false, error: 'Mật khẩu không đúng' };
    }

    API.users.setCurrent(user);

    // ⚡ Gộp giỏ guest vào giỏ user
    API.cart.mergeGuestToUser(user.id);

    console.log('✅ Đăng nhập thành công:', user.name);
    return { ok: true, user };
  },

    register(data) {
    console.log('📝 Register attempt:', data);

    // Validate mã mời cho staff
    if (data.role === 'staff') {
      if (data.inviteCode !== 'CAPPAN-STAFF-2025') {
        return { ok: false, error: 'Mã mời nhân viên không đúng (thử: CAPPAN-STAFF-2025)' };
      }
    }

    // Check trùng SĐT
    if (API.users.getByPhone(data.phone)) {
      return { ok: false, error: 'Số điện thoại đã được đăng ký' };
    }

    const user = API.users.create(data);
    API.users.setCurrent(user);

    // ⚡ Gộp giỏ guest vào giỏ user mới
    API.cart.mergeGuestToUser(user.id);

    console.log('✅ Đăng ký thành công:', user);
    return { ok: true, user };
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      showToast('🔒 Vui lòng đăng nhập trước!', '#c62828');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return false;
    }
    return true;
  }
};