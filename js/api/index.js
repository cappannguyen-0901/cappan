/* ============================================================
   API GIẢ — MÔ PHỎNG BACKEND
============================================================ */

const API = {

  /* ---------- USERS ---------- */
  users: {
    getAll() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]'); }
      catch { return []; }
    },
    getById(id) { return this.getAll().find(u => u.id === id) || null; },
    getByPhone(p) { return this.getAll().find(u => u.phone === p) || null; },
    getCurrent() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null'); }
      catch { return null; }
    },
    setCurrent(u) {
      if (u) localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEYS.currentUser);
    },
    create(data) {
      const list = this.getAll();
      const user = {
        id: 'U' + String(list.length + 1).padStart(3, '0'),
        name: data.name,
        phone: data.phone,
        password: data.password,
        role: data.role || 'customer',
        email: data.email || '',
        address: data.address || '',
        birthday: data.birthday || '',
        joinedAt: new Date().toISOString(),
        noShowCount: 0
      };
      list.push(user);
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(list));
      return user;
    },
    update(id, patch) {
      const list = this.getAll();
      const i = list.findIndex(u => u.id === id);
      if (i === -1) return null;
      list[i] = { ...list[i], ...patch };
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(list));
      const cur = this.getCurrent();
      if (cur && cur.id === id) this.setCurrent(list[i]);
      return list[i];
    },
    seedDemo() {
      if (this.getAll().length > 0) return;
      const demo = [
        { id:'U001', name:'Khách Demo', phone:'0900000001', password:'123', role:'customer', joinedAt:new Date().toISOString(), noShowCount:0 },
        { id:'U002', name:'Nhân viên Demo', phone:'0900000002', password:'123', role:'staff', joinedAt:new Date().toISOString(), noShowCount:0 }
      ];
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(demo));
    }
  },

  /* ---------- CATEGORIES ---------- */
  categories: {
    getAll() { return [...SEED_CATEGORIES].sort((a,b) => a.order - b.order); },
    getById(id) { return SEED_CATEGORIES.find(c => c.id === id) || null; }
  },

  /* ---------- MENU ---------- */
  menu: {
    getAll() { return SEED_MENU_ITEMS; },
    getById(id) { return SEED_MENU_ITEMS.find(m => m.id === id) || null; },
    getByCategory(catId) { return SEED_MENU_ITEMS.filter(m => m.categoryId === catId); },
    getAvailable() { return SEED_MENU_ITEMS.filter(m => m.inStock); },
    getOutOfStock() { return SEED_MENU_ITEMS.filter(m => !m.inStock); },

    search(kw) {
      const k = kw.toLowerCase().trim();
      if (!k) return SEED_MENU_ITEMS;
      return SEED_MENU_ITEMS.filter(m => m.name.toLowerCase().includes(k));
    },

    markOutOfStock(id) {
      const m = SEED_MENU_ITEMS.find(x => x.id === id);
      if (m) m.inStock = false;
      return m;
    },

    markInStock(id) {
      const m = SEED_MENU_ITEMS.find(x => x.id === id);
      if (m) m.inStock = true;
      return m;
    },

    add(item) {
      const newItem = {
        id: 'M' + Date.now().toString().slice(-4),
        name: item.name,
        categoryId: item.categoryId,
        price: item.price,
        img: item.img || 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600',
        description: item.description || '',
        badge: item.badge || '',
        inStock: true,
        sizes: item.sizes || [],
        toppings: item.toppings || []
      };
      SEED_MENU_ITEMS.push(newItem);
      return newItem;
    },

    remove(id) {
      const i = SEED_MENU_ITEMS.findIndex(m => m.id === id);
      if (i === -1) return false;
      SEED_MENU_ITEMS.splice(i, 1);
      return true;
    }
  },

  /* ---------- FLOORS ---------- */
  floors: {
    getAll() { return SEED_FLOORS; },
    getById(id) { return SEED_FLOORS.find(f => f.id === id) || null; }
  },

    /* ---------- SEATS ---------- */
  seats: {
    _getStateMap() {
      try {
        const saved = JSON.parse(localStorage.getItem('cappan_seats_state') || '{}');
        // Nếu là mảng (dữ liệu cũ) → chuyển thành map
        if (Array.isArray(saved)) {
          const map = {};
          saved.forEach(s => {
            if (s.id && s.status === 'booked') map[s.id] = 'booked';
          });
          localStorage.setItem('cappan_seats_state', JSON.stringify(map));
          return map;
        }
        return (saved && typeof saved === 'object') ? saved : {};
      } catch (e) {
        console.warn('Lỗi đọc seats state:', e);
        return {};
      }
    },

    _setStateMap(map) {
      localStorage.setItem('cappan_seats_state', JSON.stringify(map));
    },

    /* ⚡ ĐỒNG BỘ: Quét tất cả booking confirmed → đánh dấu ghế booked */
    syncFromBookings() {
      const map = this._getStateMap();
      const bookings = API.bookings.getAll();

      // Reset các ghế không còn booking active
      const activeSeatIds = bookings
        .filter(b => b.status === 'confirmed')
        .map(b => b.seatId);

      // Xoá tất cả ghế booked cũ
      Object.keys(map).forEach(seatId => {
        if (map[seatId] === 'booked' && !activeSeatIds.includes(seatId)) {
          delete map[seatId];
        }
      });

      // Đánh dấu ghế có booking active
      activeSeatIds.forEach(seatId => {
        map[seatId] = 'booked';
      });

      this._setStateMap(map);
      return map;
    },

    getAll() {
      const map = this._getStateMap();
      return SEED_SEATS.map(s => ({
        ...s,
        status: map[s.id] || 'available'
      }));
    },

    getById(id) {
      const found = this.getAll().find(s => s.id === id);
      return found || null;
    },

    getByFloor(fId) {
      return this.getAll().filter(s => s.floorId === fId);
    },

    getAvailable() {
      return this.getAll().filter(s => s.status === 'available');
    },

    getBooked() {
      return this.getAll().filter(s => s.status === 'booked');
    },

    book(id) {
      const map = this._getStateMap();
      map[id] = 'booked';
      this._setStateMap(map);
      return this.getById(id);
    },

    release(id) {
      const map = this._getStateMap();
      map[id] = 'available';
      this._setStateMap(map);
      return this.getById(id);
    },

    releaseAll() {
      this._setStateMap({});
    },

    releaseByFloor(floorId) {
      const map = this._getStateMap();
      SEED_SEATS.filter(s => s.floorId === floorId).forEach(s => {
        delete map[s.id];
      });
      this._setStateMap(map);
    },

    resetToDefault() {
      localStorage.removeItem('cappan_seats_state');
    }
  },

    /* ---------- BOOKINGS ---------- */
  bookings: {
    getAll() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
      } catch { return []; }
    },

    getByUser(uid) {
      return this.getAll().filter(b => b.userId === uid);
    },

    getBySeat(sid) {
      return this.getAll().filter(b => b.seatId === sid);
    },

    getActiveBySeat(sid) {
      return this.getAll().find(b => b.seatId === sid && b.status === 'confirmed') || null;
    },

    create(data) {
      const list = this.getAll();
      const bk = {
        id: 'BK' + Math.floor(1000 + Math.random() * 9000),
        userId: data.userId,
        seatId: data.seatId,
        floorId: data.floorId,
        date: data.date,
        time: data.time,
        guests: data.guests || 2,
        note: data.note || '',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };
      list.push(bk);
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(list));

      // ⚡ Đánh dấu ghế + đồng bộ
      API.seats.book(data.seatId);
      API.seats.syncFromBookings();

      return bk;
    },

    cancel(id) {
      const list = this.getAll();
      const i = list.findIndex(b => b.id === id);
      if (i === -1) return null;
      list[i].status = 'cancelled';
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(list));

      // ⚡ Giải phóng ghế + đồng bộ
      API.seats.release(list[i].seatId);
      API.seats.syncFromBookings();

      return list[i];
    },

    complete(id) {
      const list = this.getAll();
      const i = list.findIndex(b => b.id === id);
      if (i === -1) return null;
      list[i].status = 'completed';
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(list));

      // ⚡ Giải phóng ghế + đồng bộ
      API.seats.release(list[i].seatId);
      API.seats.syncFromBookings();

      return list[i];
    }
  },

  /* ---------- ORDERS ---------- */
  orders: {
    getAll() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || '[]'); }
      catch { return []; }
    },
    getById(id) { return this.getAll().find(o => o.id === id) || null; },
    getByUser(uid) { return this.getAll().filter(o => o.userId === uid); },
    getCurrent() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentOrder) || 'null'); }
      catch { return null; }
    },
    setCurrent(o) {
      if (o) localStorage.setItem(STORAGE_KEYS.currentOrder, JSON.stringify(o));
      else localStorage.removeItem(STORAGE_KEYS.currentOrder);
    },
    create(data) {
      const list = this.getAll();
      const o = {
        id: 'OD' + Math.floor(1000 + Math.random() * 9000),
        userId: data.userId,
        items: data.items,
        total: data.total,
        subtotal: data.subtotal || data.total,
        shipping: data.shipping || 0,
        address: data.address,
        phone: data.phone,
        note: data.note || '',
        customerName: data.customerName || '',
        status: 'pending',
        step: 0,
        createdAt: new Date().toISOString()
      };
      list.push(o);
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(list));
      this.setCurrent(o);
      return o;
    },
    updateStep(id, step) {
      const list = this.getAll();
      const i = list.findIndex(o => o.id === id);
      if (i === -1) return null;
      list[i].step = step;
      const map = ['pending', 'preparing', 'delivering', 'delivering', 'completed'];
      list[i].status = map[step] || 'pending';
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(list));
      const cur = this.getCurrent();
      if (cur && cur.id === id) this.setCurrent(list[i]);
      return list[i];
    }
  },

    /* ---------- CART (TÁCH THEO USER) ---------- */
  cart: {
    /* Lấy key localStorage theo user hiện tại */
    _getKey() {
      const user = API.users.getCurrent();
      if (user && user.id) {
        return `cappan_cart_${user.id}`;
      }
      return 'cappan_cart_guest';
    },

    /* Lấy user id hiện tại */
    _getUserId() {
      const user = API.users.getCurrent();
      return user ? user.id : null;
    },

    get() {
      try {
        const key = this._getKey();
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch { return []; }
    },

    set(items) {
      const key = this._getKey();
      localStorage.setItem(key, JSON.stringify(items));
    },

    add(item) {
      const cart = this.get();
      const ex = cart.find(i => i.itemId === item.itemId && i.size === item.size);
      if (ex) ex.qty++;
      else cart.push({ ...item, qty: 1 });
      this.set(cart);
      return cart;
    },

    remove(itemId, size) {
      const cart = this.get().filter(i => !(i.itemId === itemId && i.size === size));
      this.set(cart);
      return cart;
    },

    clear() {
      const key = this._getKey();
      localStorage.removeItem(key);
    },

    /* ⚡ Chuyển giỏ từ guest → user khi đăng nhập */
    mergeGuestToUser(userId) {
      try {
        const guestKey = 'cappan_cart_guest';
        const userKey = `cappan_cart_${userId}`;

        const guestCart = JSON.parse(localStorage.getItem(guestKey) || '[]');
        if (guestCart.length === 0) return;

        const userCart = JSON.parse(localStorage.getItem(userKey) || '[]');

        // Gộp 2 giỏ — nếu trùng món thì cộng số lượng
        guestCart.forEach(gItem => {
          const ex = userCart.find(uItem =>
            uItem.itemId === gItem.itemId && uItem.size === gItem.size
          );
          if (ex) ex.qty += gItem.qty;
          else userCart.push(gItem);
        });

        localStorage.setItem(userKey, JSON.stringify(userCart));
        localStorage.removeItem(guestKey);

        console.log(`🛒 Đã gộp ${guestCart.length} món từ guest → ${userId}`);
      } catch (e) {
        console.warn('Lỗi merge cart:', e);
      }
    },

    /* Lấy số món trong giỏ user cụ thể (dùng cho debug) */
    getByUserId(userId) {
      try {
        const key = `cappan_cart_${userId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch { return []; }
    },

    /* Xoá giỏ của 1 user cụ thể */
    clearByUserId(userId) {
      localStorage.removeItem(`cappan_cart_${userId}`);
    }
  },
    /* ---------- STAFF ---------- */
  staff: {
    getAll() {
      return SEED_STAFF;
    },
    getById(id) {
      return SEED_STAFF.find(s => s.id === id) || null;
    }
  },

  /* ---------- SHIFTS ---------- */
  shifts: {
    getAll() {
      return SEED_SHIFTS;
    },
    getById(id) {
      return SEED_SHIFTS.find(s => s.id === id) || null;
    },

    /* Lấy lịch phân ca dạng { '2025-01-15': { morning: ['S001'], afternoon: [...], evening: [...] } } */
    getSchedule() {
      try {
        return JSON.parse(localStorage.getItem('cappan_schedule') || '{}');
      } catch { return {}; }
    },

    setSchedule(schedule) {
      localStorage.setItem('cappan_schedule', JSON.stringify(schedule));
    },

    /* Lấy nhân viên trong 1 ca cụ thể */
    getStaffInShift(date, shiftId) {
      const schedule = this.getSchedule();
      return (schedule[date] && schedule[date][shiftId]) || [];
    },

    /* Thêm nhân viên vào ca */
    addStaffToShift(date, shiftId, staffId) {
      const schedule = this.getSchedule();
      if (!schedule[date]) schedule[date] = {};
      if (!schedule[date][shiftId]) schedule[date][shiftId] = [];

      // Tránh trùng
      if (schedule[date][shiftId].includes(staffId)) return false;

      // Kiểm tra nhân viên đã có ca khác trong ngày chưa
      Object.keys(schedule[date]).forEach(sid => {
        if (sid !== shiftId && schedule[date][sid].includes(staffId)) {
          return false; // đã có ca khác
        }
      });

      schedule[date][shiftId].push(staffId);
      this.setSchedule(schedule);
      return true;
    },

    /* Xoá nhân viên khỏi ca */
    removeStaffFromShift(date, shiftId, staffId) {
      const schedule = this.getSchedule();
      if (!schedule[date] || !schedule[date][shiftId]) return false;
      const idx = schedule[date][shiftId].indexOf(staffId);
      if (idx === -1) return false;
      schedule[date][shiftId].splice(idx, 1);
      this.setSchedule(schedule);
      return true;
    },

    /* Kiểm tra nhân viên có bận không (đã có ca khác trong ngày) */
    isStaffBusy(date, staffId) {
      const schedule = this.getSchedule();
      if (!schedule[date]) return null;
      for (const shiftId of Object.keys(schedule[date])) {
        if (schedule[date][shiftId].includes(staffId)) {
          return shiftId;
        }
      }
      return null;
    },

    /* Xoá toàn bộ lịch */
    clearAll() {
      localStorage.removeItem('cappan_schedule');
    }
  },

  /* ---------- UTILS ---------- */
  utils: {
    formatVND(n) { return n.toLocaleString('vi-VN') + 'đ'; },
    randomId(prefix='ID', len=4) { return prefix + Math.floor(Math.random() * Math.pow(10, len)); },
    now() { return new Date().toISOString(); },
    today() { return new Date().toISOString().split('T')[0]; }
  }
};

/* Seed demo users khi load */
API.users.seedDemo();