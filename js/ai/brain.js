/* ============================================================
   AI BRAIN — BỘ NÃO TRỢ LÝ CAPPAN
   Xử lý ngôn ngữ tự nhiên đơn giản + đọc data realtime
============================================================ */

const AIBrain = {

  /* Biến nhớ context giữa các câu hỏi */
  _lastTopic: null,

  /* ----------------------------------------------------------
     HÀM CHÍNH — Nhận câu hỏi, trả về câu trả lời
  ---------------------------------------------------------- */
  reply(input) {
    const text = input.toLowerCase().trim();
    const user = API.users.getCurrent();

    // Lưu topic trước để AI nhớ context
    const lastTopic = this._lastTopic || null;
    this._lastTopic = this._detectTopic(text) || lastTopic;

    // Ưu tiên check câu NGẮN (dưới 4 từ) dùng context
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 3 && lastTopic) {
      const contextReply = this._handleContext(text, lastTopic, user);
      if (contextReply) return contextReply;
    }

    // Check theo thứ tự ưu tiên
    return this._checkBookingHelp(text)
        || this._checkOrderHelp(text)
        || this._checkGreeting(text, user)
        || this._checkOutOfStock(text)
        || this._checkSeats(text)
        || this._checkMenu(text)
        || this._checkPrice(text)
        || this._checkHours(text)
        || this._checkAddress(text)
        || this._checkWifi(text)
        || this._checkFloors(text)
        || this._checkParking(text)
        || this._checkVegetarian(text)
        || this._checkPeakHours(text)
        || this._checkChangeSeat(text)
        || this._checkBulkOrder(text)
        || this._checkMyAccount(text, user)
        || this._checkThanks(text)
        || this._fallback(text);
  },

  /* ----------------------------------------------------------
     PHÁT HIỆN CHỦ ĐỀ — Để nhớ context cho câu tiếp theo
  ---------------------------------------------------------- */
  _detectTopic(text) {
    if (/chỗ|bàn|ngồi|khu vực/.test(text)) return 'seat';
    if (/menu|thực đơn|đồ uống|món/.test(text)) return 'menu';
    if (/đặt chỗ|đặt bàn/.test(text)) return 'booking';
    if (/đặt nước|order|giao hàng/.test(text)) return 'order';
    if (/giá|bao nhiêu/.test(text)) return 'price';
    return null;
  },

  /* ----------------------------------------------------------
     XỬ LÝ CÂU NGẮN DỰA VÀO CONTEXT
  ---------------------------------------------------------- */
  _handleContext(text, topic, user) {
    // Đang ở topic "chỗ ngồi" + khách nói "yên tĩnh"
    if (topic === 'seat') {
      const zoneMap = {
        'yên tĩnh': 'quiet', 'học': 'quiet', 'làm việc': 'quiet', 'học bài': 'quiet',
        'cửa sổ': 'window', 'view': 'window', 'view đẹp': 'window', 'cạnh cửa sổ': 'window',
        'nhóm': 'group', 'họp': 'group', 'họp nhóm': 'group',
        'trung tâm': 'center', 'giữa': 'center'
      };
      for (const [kw, zone] of Object.entries(zoneMap)) {
        if (text.includes(kw)) {
          return this._replySeatsByZone(zone, kw);
        }
      }
    }

    // Đang ở topic "menu" + khách nói tên nhóm
    if (topic === 'menu') {
      const catMap = {
        'cà phê': 'coffee', 'coffee': 'coffee',
        'trà': 'tea', 'tea': 'tea',
        'sinh tố': 'smoothie', 'smoothie': 'smoothie',
        'nước ép': 'juice', 'juice': 'juice',
        'soda': 'soda', 'đá xay': 'soda',
        'khác': 'other'
      };
      for (const [kw, catId] of Object.entries(catMap)) {
        if (text.includes(kw)) {
          return this._replyMenuByCategory(catId);
        }
      }
    }

    return null;
  },

  /* ----------------------------------------------------------
     TRẢ LỜI CHỖ THEO ZONE — Dùng chung
  ---------------------------------------------------------- */
  _replySeatsByZone(zone, zoneName) {
    const filtered = API.seats.getAvailable().filter(s => s.zone === zone);
    if (filtered.length === 0) {
      return `Dạ hiện tại khu vực "${zoneName}" đã hết chỗ. Bạn có muốn thử khu vực khác không?`;
    }
    const list = filtered.map(s =>
      `• ${s.id} (${s.capacity} người) – ${API.floors.getById(s.floorId).name}`
    ).join('\n');
    return `Dạ còn ${filtered.length} chỗ ở khu vực ${zoneName}:\n${list}\n\nBạn vào mục "Đặt chỗ" để chọn nhé!`;
  },

  /* ----------------------------------------------------------
     TRẢ LỜI MENU THEO NHÓM
  ---------------------------------------------------------- */
  _replyMenuByCategory(catId) {
    const cat = API.categories.getById(catId);
    if (!cat) return null;
    const items = API.menu.getByCategory(catId);
    const list = items.map(m => `• ${m.name} – ${API.utils.formatVND(m.price)}`).join('\n');
    return `${cat.name} có ${items.length} món:\n${list}`;
  },

  /* ----------------------------------------------------------
     1. CHÀO HỎI — Cá nhân hóa theo user
  ---------------------------------------------------------- */
  _checkGreeting(text, user) {
    const greetings = ['chào', 'hello', 'hi', 'xin chào', 'alo'];
    if (!greetings.some(g => text.includes(g))) return null;
    // Chỉ match khi câu ngắn (tránh match giữa câu)
    if (text.split(' ').length > 4) return null;

    const hour = new Date().getHours();
    let timeGreet = 'Xin chào';
    if (hour < 11) timeGreet = 'Chào buổi sáng';
    else if (hour < 14) timeGreet = 'Chào buổi trưa';
    else if (hour < 18) timeGreet = 'Chào buổi chiều';
    else timeGreet = 'Chào buổi tối';

    if (user) {
      return `${timeGreet} ${user.name}! 👋\nTôi có thể giúp gì cho bạn hôm nay?`;
    }
    return `${timeGreet}! 👋 Tôi là trợ lý ảo CAPPAN.\nBạn có thể hỏi tôi về menu, chỗ ngồi, giờ mở cửa...`;
  },

  /* ----------------------------------------------------------
     2. MÓN HẾT HÀNG — Đọc data realtime
  ---------------------------------------------------------- */
  _checkOutOfStock(text) {
    const keys = ['hết', 'còn món', 'còn gì', 'còn không', 'hết hàng'];
    if (!keys.some(k => text.includes(k))) return null;

    const out = API.menu.getOutOfStock();
    const avail = API.menu.getAvailable();

    if (out.length === 0) {
      return `Dạ quán vẫn còn đầy đủ ${avail.length} món ạ! Bạn muốn uống gì?`;
    }

    const list = out.map(m => `• ${m.name}`).join('\n');
    return `Hiện tại quán đã HẾT các món sau:\n${list}\n\nCòn lại ${avail.length} món khác đang phục vụ ạ!`;
  },

  /* ----------------------------------------------------------
     3. CHỖ NGỒI — Đọc realtime + gợi ý theo zone
  ---------------------------------------------------------- */
  _checkSeats(text) {
    // Nếu là câu hỏi "cách đặt chỗ" → KHÔNG match rule này
    if (/cách.*(đặt|book)|hướng dẫn|làm sao/.test(text)) return null;

    const keys = ['chỗ', 'bàn', 'ngồi', 'trống', 'khu vực'];
    if (!keys.some(k => text.includes(k))) return null;

    this._lastTopic = 'seat';

    // Check theo zone
    const zones = {
      'yên tĩnh': 'quiet', 'học': 'quiet', 'làm việc': 'quiet', 'học bài': 'quiet',
      'cửa sổ': 'window', 'view': 'window', 'view đẹp': 'window', 'đẹp': 'window',
      'nhóm': 'group', 'họp': 'group',
      'trung tâm': 'center'
    };

    for (const [kw, zone] of Object.entries(zones)) {
      if (text.includes(kw)) {
        return this._replySeatsByZone(zone, kw);
      }
    }

    // Liệt kê tổng quát
    const allAvailable = API.seats.getAvailable();
    if (allAvailable.length === 0) {
      return 'Dạ hiện tại quán đã hết chỗ. Bạn thông cảm nhé! 😔';
    }

    const byFloor = {};
    allAvailable.forEach(s => {
      if (!byFloor[s.floorId]) byFloor[s.floorId] = 0;
      byFloor[s.floorId]++;
    });

    let reply = `Dạ còn tổng cộng ${allAvailable.length} chỗ trống:\n`;
    Object.keys(byFloor).forEach(fId => {
      const floor = API.floors.getById(fId);
      reply += `• ${floor.name}: ${byFloor[fId]} chỗ\n`;
    });

    reply += '\nBạn muốn ngồi khu vực nào? (yên tĩnh / cửa sổ / nhóm / ngoài trời)';
    return reply;
  },

  /* ----------------------------------------------------------
     4. MENU — Đọc data + gợi ý món
  ---------------------------------------------------------- */
  _checkMenu(text) {
    const keys = ['menu', 'thực đơn', 'có gì', 'đồ uống', 'uống gì', 'món gì'];
    if (!keys.some(k => text.includes(k))) return null;

    this._lastTopic = 'menu';

    const cats = API.categories.getAll();
    const total = API.menu.getAll().length;

    let reply = `Dạ CAPPAN có ${total} món chia làm ${cats.length} nhóm:\n`;
    cats.forEach(c => {
      const count = API.menu.getByCategory(c.id).length;
      reply += `• ${c.name} (${count} món)\n`;
    });
    reply += '\nBạn muốn uống nhóm nào ạ?';
    return reply;
  },

  /* ----------------------------------------------------------
     5. GIÁ CẢ — Đọc data + trả lời chính xác
  ---------------------------------------------------------- */
  _checkPrice(text) {
    const keys = ['giá', 'bao nhiêu', 'mắc không', 'đắt không'];
    if (!keys.some(k => text.includes(k))) return null;

    const items = API.menu.getAll();
    const min = Math.min(...items.map(i => i.price));
    const max = Math.max(...items.map(i => i.price));

    // Nếu hỏi giá 1 món cụ thể
    const found = items.find(i => text.includes(i.name.toLowerCase()));
    if (found) {
      return `${found.name} có giá ${API.utils.formatVND(found.price)} ạ!`;
    }

    return `Dạ đồ uống CAPPAN dao động từ ${API.utils.formatVND(min)} đến ${API.utils.formatVND(max)}. Bạn muốn hỏi giá món nào cụ thể không?`;
  },

  /* ----------------------------------------------------------
     6. GIỜ MỞ CỬA — Realtime theo giờ
  ---------------------------------------------------------- */
  _checkHours(text) {
    const keys = ['giờ', 'mở cửa', 'đóng cửa', 'mấy giờ'];
    if (!keys.some(k => text.includes(k))) return null;

    const hour = new Date().getHours();
    const open = hour >= 7 && hour < 22;

    if (open) {
      return `🕐 Quán đang MỞ CỬA ạ!\nGiờ hoạt động: 7:00 – 22:30 hằng ngày.`;
    }
    return `🕐 Hiện tại quán đã ĐÓNG CỬA.\nGiờ hoạt động: 7:00 – 22:30 hằng ngày. Hẹn gặp bạn ngày mai!`;
  },

  /* ----------------------------------------------------------
     7. ĐỊA CHỈ
  ---------------------------------------------------------- */
  _checkAddress(text) {
    const keys = ['địa chỉ', 'ở đâu', 'đường nào', 'chỗ nào', 'vị trí'];
    if (!keys.some(k => text.includes(k))) return null;
    return '📍 CAPPAN ở 123 Đường Lê Lợi, Quận 1, TP.HCM.\nBạn có thể xem bản đồ ở trang "Liên hệ" nhé!';
  },

  /* ----------------------------------------------------------
     8. WIFI
  ---------------------------------------------------------- */
  _checkWifi(text) {
    if (!text.includes('wifi') && !text.includes('mật khẩu')) return null;
    return '📶 Wifi miễn phí cho khách:\n• Tên: CAPPAN_Free\n• Mật khẩu: cappan2025';
  },

  /* ----------------------------------------------------------
     9. HƯỚNG DẪN ĐẶT CHỖ — Chỉ match câu hỏi CÁCH LÀM
  ---------------------------------------------------------- */
  _checkBookingHelp(text) {
    const howToKeys = ['cách đặt chỗ', 'làm sao đặt', 'đặt chỗ thế nào',
                       'hướng dẫn đặt', 'book chỗ sao', 'đặt bàn thế nào',
                       'cách book', 'làm sao book'];
    if (!howToKeys.some(k => text.includes(k))) return null;

    this._lastTopic = 'booking';
    return `🪑 Để đặt chỗ, bạn làm theo 4 bước:\n1. Vào mục "Đặt chỗ" trên menu\n2. Chọn tầng bạn muốn ngồi\n3. Click vào chỗ màu XANH\n4. Điền thông tin và xác nhận\n\nBạn muốn ngồi tầng nào? (trệt / lầu 1 / lầu 2 / thượng)`;
  },

  /* ----------------------------------------------------------
     10. HƯỚNG DẪN ĐẶT NƯỚC
  ---------------------------------------------------------- */
  _checkOrderHelp(text) {
    const keys = ['đặt nước', 'đặt món', 'order', 'giao hàng', 'ship'];
    if (!keys.some(k => text.includes(k))) return null;

    this._lastTopic = 'order';
    return `🥤 Để đặt nước, bạn làm theo 4 bước:\n1. Vào mục "Đặt nước"\n2. Chọn món → "+ Thêm vào giỏ"\n3. Vào "Giỏ hàng" để kiểm tra\n4. Điền địa chỉ → "Đặt hàng ngay"\n\nSau đó bạn có thể theo dõi shipper ở mục "Theo dõi đơn" nhé!`;
  },

  /* ----------------------------------------------------------
     11. CÁC TẦNG — Giới thiệu không gian
  ---------------------------------------------------------- */
  _checkFloors(text) {
    const keys = ['tầng', 'lầu', 'không gian', 'khu vực'];
    if (!keys.some(k => text.includes(k))) return null;

    const floors = API.floors.getAll();
    let reply = '🏢 CAPPAN có 4 không gian:\n';
    floors.forEach(f => {
      reply += `• ${f.name} — ${f.description}\n`;
    });
    reply += '\nBạn muốn ngồi tầng nào ạ?';
    return reply;
  },

  /* ----------------------------------------------------------
     12. BÃI ĐẬU XE
  ---------------------------------------------------------- */
  _checkParking(text) {
    const keys = ['đậu xe', 'gửi xe', 'parking', 'bãi xe', 'để xe'];
    if (!keys.some(k => text.includes(k))) return null;
    return '🅿️ CAPPAN có bãi giữ xe MIỄN PHÍ ngay trước cửa quán.\nBạn cứ yên tâm mang xe đến nhé!';
  },

  /* ----------------------------------------------------------
     13. MÓN CHAY
  ---------------------------------------------------------- */
  _checkVegetarian(text) {
    const keys = ['món chay', 'đồ chay', 'ăn chay', 'chay'];
    if (!keys.some(k => text.includes(k))) return null;
    return '🥗 Hiện tại CAPPAN chưa có menu chay riêng, nhưng có một số món phù hợp:\n• Sinh tố Bơ\n• Sinh tố Xoài\n• Nước ép Cam\n• Trà Sen Vàng\n\nBạn muốn thử món nào không ạ?';
  },

  /* ----------------------------------------------------------
     14. GIỜ CAO ĐIỂM
  ---------------------------------------------------------- */
  _checkPeakHours(text) {
    const keys = ['đông nhất', 'cao điểm', 'đông khách', 'vắng nhất'];
    if (!keys.some(k => text.includes(k))) return null;
    return '📊 Quán thường ĐÔNG NHẤT vào:\n• 8:00 – 10:00 (giờ đi làm)\n• 14:00 – 16:00 (giờ xế chiều)\n• 19:00 – 21:00 (giờ tối)\n\nNếu bạn muốn yên tĩnh, nên đến lúc 7:00 hoặc sau 16:00 nhé!';
  },

  /* ----------------------------------------------------------
     15. ĐỔI CHỖ
  ---------------------------------------------------------- */
  _checkChangeSeat(text) {
    const keys = ['đổi chỗ', 'đổi bàn', 'thay đổi chỗ', 'chuyển chỗ'];
    if (!keys.some(k => text.includes(k))) return null;
    return '🔄 Bạn có thể đổi chỗ bằng cách:\n1. Vào "Đặt chỗ" → chọn chỗ mới\n2. Nhân viên sẽ huỷ chỗ cũ cho bạn\n\nHoặc gọi hotline: 0909 123 456 để được hỗ trợ nhanh nhé!';
  },

  /* ----------------------------------------------------------
     16. ĐẶT TIỆC / SỐ LƯỢNG LỚN
  ---------------------------------------------------------- */
  _checkBulkOrder(text) {
    const keys = ['tiệc', 'sinh nhật', 'sự kiện', 'đặt nhiều', 'số lượng lớn', '20 người', '30 người'];
    if (!keys.some(k => text.includes(k))) return null;
    return '🎉 CAPPAN có dịch vụ đặt tiệc riêng!\n\nVới đoàn đông (trên 10 người), bạn vui lòng:\n• Gọi hotline: 0909 123 456\n• Hoặc để lại tin nhắn ở mục "Liên hệ"\n\nChúng tôi sẽ tư vấn menu và sắp xếp không gian phù hợp nhất!';
  },

  /* ----------------------------------------------------------
     17. TÀI KHOẢN — Cá nhân hóa
  ---------------------------------------------------------- */
  _checkMyAccount(text, user) {
    const keys = ['tài khoản', 'đơn hàng', 'lịch sử', 'đặt chỗ của tôi'];
    if (!keys.some(k => text.includes(k))) return null;

    if (!user) {
      return '🔒 Bạn cần đăng nhập để xem thông tin tài khoản.\nClick "Đăng nhập" ở góc phải trên nhé!';
    }

    const bookings = API.bookings.getByUser(user.id).filter(b => b.status === 'confirmed');
    const orders = API.orders.getByUser(user.id).filter(o => o.step < 4);

    let reply = `👤 Tài khoản: ${user.name}\n`;
    reply += `📅 Đặt chỗ đang hoạt động: ${bookings.length}\n`;
    reply += `📦 Đơn hàng đang xử lý: ${orders.length}\n\n`;
    reply += 'Vào mục "Tài khoản" để xem chi tiết nhé!';
    return reply;
  },

  /* ----------------------------------------------------------
     18. CẢM ƠN — Random
  ---------------------------------------------------------- */
  _checkThanks(text) {
    const keys = ['cảm ơn', 'thanks', 'thank you', 'cám ơn'];
    if (!keys.some(k => text.includes(k))) return null;

    const replies = [
      '😊 Rất vui được giúp bạn!',
      '🙌 Không có gì ạ! Hẹn gặp bạn tại quán.',
      '☕ Cảm ơn bạn đã quan tâm CAPPAN!',
      '😄 Vui lòng phục vụ bạn!'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  },

  /* ----------------------------------------------------------
     19. FALLBACK — Thử đoán ý
  ---------------------------------------------------------- */
  _fallback(text) {
    // 1. Thử tìm món gần giống
    const items = API.menu.getAll();
    const found = items.find(i => {
      const firstName = i.name.toLowerCase().split(' ')[0];
      return text.includes(firstName) && firstName.length > 2;
    });
    if (found) {
      return `Bạn đang hỏi về ${found.name} phải không? Món này giá ${API.utils.formatVND(found.price)}. Bạn muốn đặt không?`;
    }

    // 2. Thử tìm theo nhóm
    const catKeywords = {
      'cà phê': 'coffee', 'coffee': 'coffee',
      'trà': 'tea',
      'sinh tố': 'smoothie',
      'nước ép': 'juice',
      'soda': 'soda'
    };
    for (const [kw, catId] of Object.entries(catKeywords)) {
      if (text.includes(kw)) {
        return this._replyMenuByCategory(catId);
      }
    }

    // 3. Fallback với gợi ý
    const replies = [
      '🤔 Câu này hơi khó với tôi. Bạn thử hỏi cụ thể hơn nhé!\n\nVí dụ:\n• "Còn chỗ yên tĩnh không?"\n• "Trà đào giá bao nhiêu?"\n• "Cách đặt chỗ thế nào?"',
      '😅 Tôi chưa hiểu rõ. Bạn có thể hỏi về:\n• Menu và giá\n• Chỗ ngồi (yên tĩnh / cửa sổ / nhóm)\n• Giờ mở cửa, địa chỉ, wifi\n• Cách đặt chỗ / đặt nước',
      '🤖 Tôi mới chỉ là trợ lý ảo đơn giản. Bạn thử hỏi:\n• "Menu có gì?"\n• "Còn chỗ không?"\n• "Giờ mở cửa?"'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
};