// admin.js - Модуль для администраторской панели

const Admin = {
  // Статус авторизации
  isLoggedIn: false,
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля админа');
    
    // Проверяем статус авторизации
    this.checkLoginStatus();
  },
  
  // Инициализация страницы админа
  initPage: function() {
    console.log('Инициализация страницы админа');
    
    // Настройка формы входа
    this.setupLoginForm();
    
    // Настройка кнопки выхода
    this.setupLogoutButton();
    
    // Отображаем соответствующую секцию в зависимости от статуса авторизации
    this.updateView();
  },
  
  // Проверка статуса авторизации
  checkLoginStatus: function() {
    fetch('/api/admin/check')
      .then(response => response.json())
      .then(data => {
        this.isLoggedIn = data.isAdmin;
        
        // Если мы на странице админа, обновляем отображение
        if (Router.currentPage === 'admin') {
          this.updateView();
        }
      })
      .catch(error => {
        console.error('Ошибка при проверке статуса авторизации:', error);
        this.isLoggedIn = false;
      });
  },
  
  // Обновление отображения в зависимости от статуса авторизации
  updateView: function() {
    const adminLogin = document.querySelector('.admin-login');
    const adminPanel = document.querySelector('.admin-panel');
    
    if (!adminLogin || !adminPanel) return;
    
    if (this.isLoggedIn) {
      // Если авторизован, показываем панель и скрываем форму входа
      adminLogin.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      
      // Загружаем заказы
      this.loadOrders();
    } else {
      // Если не авторизован, показываем форму входа и скрываем панель
      adminLogin.classList.remove('hidden');
      adminPanel.classList.add('hidden');
    }
  },
  
  // Настройка формы входа
  setupLoginForm: function() {
    const loginForm = document.getElementById('admin-login-form');
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      
      if (!username || !password) {
        App.showMessage('Пожалуйста, заполните все поля', 'warning');
        return;
      }
      
      this.login(username, password);
    });
  },
  
  // Настройка кнопки выхода
  setupLogoutButton: function() {
    const logoutBtn = document.getElementById('admin-logout');
    
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', () => {
      this.logout();
    });
  },
  
  // Вход в панель администратора
  login: function(username, password) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#admin-login-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    }
    
    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        this.isLoggedIn = true;
        App.showMessage('Вход выполнен успешно', 'success');
        this.updateView();
      } else {
        App.showMessage('Ошибка авторизации: ' + (data.error || 'Неизвестная ошибка'), 'error');
      }
    })
    .catch(error => {
      console.error('Ошибка при входе:', error);
      App.showMessage('Ошибка при входе. Неверные учетные данные.', 'error');
    })
    .finally(() => {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Войти';
      }
    });
  },
  
  // Выход из панели администратора
  logout: function() {
    fetch('/api/admin/logout', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.isLoggedIn = false;
        App.showMessage('Выход выполнен успешно', 'success');
        this.updateView();
      }
    })
    .catch(error => {
      console.error('Ошибка при выходе:', error);
    });
  },
  
  // Загрузка списка заказов
  loadOrders: function() {
    const ordersList = document.querySelector('.orders-list');
    
    if (!ordersList) return;
    
    // Показываем индикатор загрузки
    ordersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка заказов...</div>';
    
    fetch('/api/admin/orders')
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            // Если не авторизован, обновляем статус
            this.isLoggedIn = false;
            this.updateView();
            throw new Error('Необходима авторизация');
          }
          throw new Error('Ошибка при получении заказов');
        }
        return response.json();
      })
      .then(orders => {
        this.renderOrders(orders);
      })
      .catch(error => {
        console.error('Ошибка при загрузке заказов:', error);
        ordersList.innerHTML = `<div class="error">Ошибка при загрузке заказов: ${error.message}</div>`;
      });
  },
  
  // Отображение списка заказов
  renderOrders: function(orders) {
    const ordersList = document.querySelector('.orders-list');
    
    if (!ordersList) return;
    
    // Если заказов нет, показываем сообщение
    if (orders.length === 0) {
      ordersList.innerHTML = '<div class="no-orders">Заказов пока нет</div>';
      return;
    }
    
    // Очищаем список
    ordersList.innerHTML = '';
    
    // Отображаем каждый заказ
    orders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      orderCard.innerHTML = `
        <div class="order-header">
          <div class="order-number-field">Заказ #${order.orderNumber}</div>
          <div class="order-date">${App.formatDate(order.createdAt)}</div>
        </div>
        
        <div class="customer-info">
          <p><strong>Клиент:</strong> ${order.customerName}</p>
          <p><strong>Телефон:</strong> ${order.phone}</p>
          <p><strong>Адрес:</strong> ${order.address}</p>
        </div>
        
        <div class="admin-order-items">
          <h3>Состав заказа:</h3>
          ${order.items.map(item => `
            <div class="admin-order-item">
              <span>${item.name} x ${item.quantity}</span>
              <span>${App.formatPrice(item.price * item.quantity)} ₽</span>
            </div>
          `).join('')}
          <div class="admin-order-total">
            <strong>Итого: ${App.formatPrice(order.totalAmount)} ₽</strong>
          </div>
        </div>
        
        <div class="admin-status-select">
          <label><strong>Статус заказа:</strong></label>
          <select class="status-select" data-id="${order._id}" data-current="${order.status}">
            <option value="Принят" ${order.status === 'Принят' ? 'selected' : ''}>Принят</option>
            <option value="Готовится" ${order.status === 'Готовится' ? 'selected' : ''}>Готовится</option>
            <option value="В доставке" ${order.status === 'В доставке' ? 'selected' : ''}>В доставке</option>
            <option value="Доставлен" ${order.status === 'Доставлен' ? 'selected' : ''}>Доставлен</option>
          </select>
        </div>
      `;
      ordersList.appendChild(orderCard);
      
      // Добавляем обработчик события для изменения статуса
      const statusSelect = orderCard.querySelector('.status-select');
      statusSelect.addEventListener('change', e => {
        const orderId = e.target.getAttribute('data-id');
        const currentStatus = e.target.getAttribute('data-current');
        const newStatus = e.target.value;
        
        // Если статус не изменился, ничего не делаем
        if (currentStatus === newStatus) return;
        
        this.updateOrderStatus(orderId, newStatus, e.target);
      });
    });
  },
  
  // Обновление статуса заказа
  updateOrderStatus: function(orderId, status, selectElement) {
    // Блокируем селект
    selectElement.disabled = true;
    
    fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса заказа');
      }
      return response.json();
    })
    .then(updatedOrder => {
      // Обновляем атрибут data-current
      selectElement.setAttribute('data-current', status);
      App.showMessage(`Статус заказа #${updatedOrder.orderNumber} изменен на "${status}"`, 'success');
    })
    .catch(error => {
      console.error('Ошибка при обновлении статуса заказа:', error);
      App.showMessage('Ошибка при обновлении статуса заказа', 'error');
      
      // Возвращаем предыдущий статус
      selectElement.value = selectElement.getAttribute('data-current');
    })
    .finally(() => {
      // Разблокируем селект
      selectElement.disabled = false;
    });
  }
};