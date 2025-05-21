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
    
    // Настройка табов
    this.setupTabs();
    
    // Настройка формы создания промокода
    this.setupPromoForm();
    
    // Настройка формы блюда
    this.setupDishForm();
  },
  
  // Настройка табов в админ-панели
  setupTabs: function() {
    const tabItems = document.querySelectorAll('.tab-item');
    
    if (!tabItems.length) return;
    
    tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        // Удаляем активный класс у всех табов
        tabItems.forEach(item => item.classList.remove('active'));
        
        // Удаляем активный класс у всех панелей
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Добавляем активный класс текущему табу
        tab.classList.add('active');
        
        // Получаем ID таба и активируем соответствующую панель
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Загружаем данные для выбранного таба
        if (tabId === 'orders') {
          this.loadOrders();
        } else if (tabId === 'promo') {
          this.loadPromoCodes();
        } else if (tabId === 'dishes') {
          this.loadDishes();
        }
      });
    });
  },
  
  // Настройка формы создания/редактирования блюда
  setupDishForm: function() {
    const dishForm = document.getElementById('admin-dish-form');
    
    if (!dishForm) return;
    
    // Переменная для отслеживания режима формы (создание/редактирование)
    this.dishFormMode = 'create';
    this.currentDishId = null;
    
    dishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Получаем данные формы
      const formData = new FormData(dishForm);
      const name = formData.get('name');
      const description = formData.get('description');
      const price = parseFloat(formData.get('price'));
      const image = formData.get('image');
      
      // Проверяем обязательные поля
      if (!name || !description || isNaN(price)) {
        App.showMessage('Пожалуйста, заполните все обязательные поля', 'warning');
        return;
      }
      
      // Создаем объект блюда
      const dishData = {
        name,
        description,
        price,
        image: image || '/images/default-dish.jpg'
      };
      
      // В зависимости от режима формы создаем или обновляем блюдо
      if (this.dishFormMode === 'create') {
        this.createDish(dishData);
      } else {
        this.updateDish(this.currentDishId, dishData);
      }
    });
    
    // Кнопка отмены редактирования
    const cancelEditBtn = document.getElementById('cancel-edit-dish');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        this.resetDishForm();
      });
    }
  },
  
  // Сброс формы блюда (переход в режим создания)
  resetDishForm: function() {
    const dishForm = document.getElementById('admin-dish-form');
    const submitBtn = dishForm.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById('cancel-edit-dish');
    const formTitle = document.querySelector('.dish-form-title');
    
    // Сбрасываем форму
    dishForm.reset();
    
    // Меняем режим формы на создание
    this.dishFormMode = 'create';
    this.currentDishId = null;
    
    // Обновляем UI
    submitBtn.innerHTML = 'Добавить блюдо';
    cancelBtn.classList.add('hidden');
    formTitle.textContent = 'Добавить новое блюдо';
  },
  
  // Настройка формы создания промокода
  setupPromoForm: function() {
    const promoForm = document.getElementById('admin-promo-form');
    
    if (!promoForm) return;
    
    promoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Получаем данные формы
      const code = document.getElementById('promo-code-name').value.trim();
      const discount = parseInt(document.getElementById('promo-discount').value);
      const expiresAt = document.getElementById('promo-expires').value;
      
      // Проверяем основные поля
      if (!code || !discount) {
        App.showMessage('Пожалуйста, заполните обязательные поля', 'warning');
        return;
      }
      
      // Проверяем размер скидки
      if (discount < 1 || discount > 100) {
        App.showMessage('Размер скидки должен быть от 1 до 100%', 'warning');
        return;
      }
      
      // Создаем промокод
      this.createPromoCode({
        code,
        discount,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      });
    });
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
      
      // Загружаем заказы (активный таб по умолчанию)
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
  
  // Загрузка списка блюд
  loadDishes: function() {
    const dishesList = document.querySelector('.dishes-list');
    
    if (!dishesList) return;
    
    // Показываем индикатор загрузки
    dishesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка блюд...</div>';
    
    fetch('/api/dishes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при получении блюд');
        }
        return response.json();
      })
      .then(dishes => {
        this.renderDishes(dishes);
      })
      .catch(error => {
        console.error('Ошибка при загрузке блюд:', error);
        dishesList.innerHTML = `<div class="error">Ошибка при загрузке блюд: ${error.message}</div>`;
      });
  },
  
  // Отображение списка блюд
// Обновленная версия метода renderDishes без столбца рейтинга
renderDishes: function(dishes) {
  const dishesList = document.querySelector('.dishes-list');
  
  if (!dishesList) return;
  
  // Если блюд нет, показываем сообщение
  if (dishes.length === 0) {
    dishesList.innerHTML = '<div class="no-dishes">Блюд пока нет</div>';
    return;
  }
  
  // Очищаем список
  dishesList.innerHTML = '';
  
  // Создаем таблицу для блюд
  const table = document.createElement('table');
  table.className = 'dishes-table';
  
  // Создаем заголовок таблицы
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Изображение</th>
      <th>Название</th>
      <th>Описание</th>
      <th>Цена</th>
      <th>Действия</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Создаем тело таблицы
  const tbody = document.createElement('tbody');
  
  // Добавляем строки для каждого блюда
  dishes.forEach(dish => {
    const tr = document.createElement('tr');
    
    // Обрезаем длинное описание для показа в таблице
    const shortDescription = dish.description.length > 100 
      ? dish.description.substring(0, 100) + '...' 
      : dish.description;
    
    tr.innerHTML = `
      <td>
        <img src="${dish.image}" alt="${dish.name}" class="dish-thumbnail" onerror="this.src='/images/default-dish.jpg'">
      </td>
      <td><strong>${dish.name}</strong></td>
      <td class="dish-description-cell" title="${dish.description}">${shortDescription}</td>
      <td>${App.formatPrice(dish.price)} ₽</td>
      <td>
        <div class="dish-actions">
          <button class="btn btn-sm btn-secondary edit-dish" data-id="${dish._id}">
            <i class="fas fa-edit"></i> Редактировать
          </button>
          <button class="btn btn-sm btn-danger delete-dish" data-id="${dish._id}">
            <i class="fas fa-trash-alt"></i> Удалить
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
    
    // Добавляем обработчики событий
    const editBtn = tr.querySelector('.edit-dish');
    editBtn.addEventListener('click', () => {
      this.editDish(dish);
    });
    
    const deleteBtn = tr.querySelector('.delete-dish');
    deleteBtn.addEventListener('click', () => {
      // Показываем подтверждение
      if (confirm(`Вы уверены, что хотите удалить блюдо "${dish.name}"? Это действие нельзя отменить.`)) {
        this.deleteDish(dish._id);
      }
    });
  });
  
  table.appendChild(tbody);
  dishesList.appendChild(table);
},
  
  // Генерация HTML для отображения звездного рейтинга
  generateStarRating: function(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Полные звезды
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Половина звезды (если нужно)
    if (halfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Пустые звезды
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  },
  
  // Редактирование блюда
  editDish: function(dish) {
    const dishForm = document.getElementById('admin-dish-form');
    const submitBtn = dishForm.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById('cancel-edit-dish');
    const formTitle = document.querySelector('.dish-form-title');
    
    // Заполняем форму данными блюда
    dishForm.elements.name.value = dish.name;
    dishForm.elements.description.value = dish.description;
    dishForm.elements.price.value = dish.price;
    dishForm.elements.image.value = dish.image;
    
    // Меняем режим формы на редактирование
    this.dishFormMode = 'edit';
    this.currentDishId = dish._id;
    
    // Обновляем UI
    submitBtn.innerHTML = 'Сохранить изменения';
    cancelBtn.classList.remove('hidden');
    formTitle.textContent = 'Редактировать блюдо';
    
    // Прокручиваем к форме
    dishForm.scrollIntoView({ behavior: 'smooth' });
  },
  
  // Создание нового блюда
  createDish: function(dishData) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#admin-dish-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';
    }
    
    fetch('/api/admin/dishes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dishData)
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          this.isLoggedIn = false;
          this.updateView();
          throw new Error('Необходима авторизация');
        }
        throw new Error('Ошибка при создании блюда');
      }
      return response.json();
    })
    .then(data => {
      // Очищаем форму
      document.getElementById('admin-dish-form').reset();
      
      // Показываем сообщение
      App.showMessage(`Блюдо "${dishData.name}" успешно создано`, 'success');
      
      // Перезагружаем список блюд
      this.loadDishes();
    })
    .catch(error => {
      console.error('Ошибка при создании блюда:', error);
      App.showMessage('Ошибка при создании блюда: ' + error.message, 'error');
    })
    .finally(() => {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Добавить блюдо';
      }
    });
  },
  
  // Обновление блюда
  updateDish: function(dishId, dishData) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#admin-dish-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
    }
    
    fetch(`/api/admin/dishes/${dishId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dishData)
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          this.isLoggedIn = false;
          this.updateView();
          throw new Error('Необходима авторизация');
        }
        throw new Error('Ошибка при обновлении блюда');
      }
      return response.json();
    })
    .then(data => {
      // Сбрасываем форму
      this.resetDishForm();
      
      // Показываем сообщение
      App.showMessage(`Блюдо "${dishData.name}" успешно обновлено`, 'success');
      
      // Перезагружаем список блюд
      this.loadDishes();
    })
    .catch(error => {
      console.error('Ошибка при обновлении блюда:', error);
      App.showMessage('Ошибка при обновлении блюда: ' + error.message, 'error');
    })
    .finally(() => {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Сохранить изменения';
      }
    });
  },
  
  // Удаление блюда
  deleteDish: function(dishId) {
    fetch(`/api/admin/dishes/${dishId}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          this.isLoggedIn = false;
          this.updateView();
          throw new Error('Необходима авторизация');
        }
        throw new Error('Ошибка при удалении блюда');
      }
      return response.json();
    })
    .then(data => {
      // Показываем сообщение
      App.showMessage('Блюдо успешно удалено', 'success');
      
      // Перезагружаем список блюд
      this.loadDishes();
      
      // Если мы редактировали это блюдо, сбрасываем форму
      if (this.currentDishId === dishId) {
        this.resetDishForm();
      }
    })
    .catch(error => {
      console.error('Ошибка при удалении блюда:', error);
      App.showMessage('Ошибка при удалении блюда: ' + error.message, 'error');
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
      
      // Определяем класс для статуса
      let statusClass = '';
      switch (order.status) {
        case 'Принят':
          statusClass = 'status-new';
          break;
        case 'Готовится':
          statusClass = 'status-processing';
          break;
        case 'В доставке':
          statusClass = 'status-delivery';
          break;
        case 'Доставлен':
          statusClass = 'status-delivered';
          break;
        case 'Отменен':
          statusClass = 'status-canceled';
          break;
      }
      
      orderCard.innerHTML = `
        <div class="order-header">
          <div class="order-number-field">Заказ #${order.orderNumber}</div>
          <div class="order-date">${App.formatDate(order.createdAt)}</div>
        </div>
        
        <div class="customer-info">
          <p><strong>Клиент:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.email || 'Не указан'}</p>
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
            <strong>Сумма заказа: ${App.formatPrice(order.totalAmount)} ₽</strong>
            ${order.discountAmount > 0 ? `
              <div class="admin-order-discount">
                <div>Скидка: ${App.formatPrice(order.discountAmount)} ₽</div>
                <div>Итого к оплате: ${App.formatPrice(order.finalAmount)} ₽</div>
                ${order.promoCode ? `<div>Промокод: ${order.promoCode}</div>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="admin-order-actions">
          <div class="admin-status-select">
            <label><strong>Статус заказа:</strong></label>
            <select class="status-select ${statusClass}" data-id="${order._id}" data-current="${order.status}">
              <option value="Принят" ${order.status === 'Принят' ? 'selected' : ''}>Принят</option>
              <option value="Готовится" ${order.status === 'Готовится' ? 'selected' : ''}>Готовится</option>
              <option value="В доставке" ${order.status === 'В доставке' ? 'selected' : ''}>В доставке</option>
              <option value="Доставлен" ${order.status === 'Доставлен' ? 'selected' : ''}>Доставлен</option>
              <option value="Отменен" ${order.status === 'Отменен' ? 'selected' : ''}>Отменен</option>
            </select>
          </div>
          <button class="btn btn-danger delete-order" data-id="${order._id}">
            <i class="fas fa-trash-alt"></i> Удалить
          </button>
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
      
      // Добавляем обработчик для кнопки удаления
      const deleteBtn = orderCard.querySelector('.delete-order');
      deleteBtn.addEventListener('click', e => {
        const orderId = e.target.closest('.delete-order').getAttribute('data-id');
        
        // Показываем подтверждение
        if (confirm('Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.')) {
          this.deleteOrder(orderId, orderCard);
        }
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
      
      // Обновляем класс статуса
      selectElement.className = selectElement.className.replace(/status-\w+/g, '');
      let statusClass = '';
      switch (status) {
        case 'Принят':
          statusClass = 'status-new';
          break;
        case 'Готовится':
          statusClass = 'status-processing';
          break;
        case 'В доставке':
          statusClass = 'status-delivery';
          break;
        case 'Доставлен':
          statusClass = 'status-delivered';
          break;
        case 'Отменен':
          statusClass = 'status-canceled';
          break;
      }
      selectElement.classList.add(statusClass);
      
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
  },
  
  // Удаление заказа
  deleteOrder: function(orderId, orderCard) {
    fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при удалении заказа');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Удаляем элемент из DOM
        orderCard.remove();
        
        // Показываем сообщение
        App.showMessage('Заказ успешно удален', 'success');
        
        // Проверяем, остались ли еще заказы
        const remainingOrders = document.querySelectorAll('.order-card').length;
        if (remainingOrders === 0) {
          document.querySelector('.orders-list').innerHTML = '<div class="no-orders">Заказов пока нет</div>';
        }
      }
    })
    .catch(error => {
      console.error('Ошибка при удалении заказа:', error);
      App.showMessage('Ошибка при удалении заказа', 'error');
    });
  },
  
  // Загрузка списка промокодов
  loadPromoCodes: function() {
    const promoList = document.querySelector('.promo-list-container');
    
    if (!promoList) return;
    
    // Показываем индикатор загрузки
    promoList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка промокодов...</div>';
    
    fetch('/api/admin/promo-codes')
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            // Если не авторизован, обновляем статус
            this.isLoggedIn = false;
            this.updateView();
            throw new Error('Необходима авторизация');
          }
          throw new Error('Ошибка при получении промокодов');
        }
        return response.json();
      })
      .then(promoCodes => {
        this.renderPromoCodes(promoCodes);
      })
      .catch(error => {
        console.error('Ошибка при загрузке промокодов:', error);
        promoList.innerHTML = `<div class="error">Ошибка при загрузке промокодов: ${error.message}</div>`;
      });
  },
  
  // Отображение списка промокодов
  renderPromoCodes: function(promoCodes) {
    const promoList = document.querySelector('.promo-list-container');
    
    if (!promoList) return;
    
    // Если промокодов нет, показываем сообщение
    if (promoCodes.length === 0) {
      promoList.innerHTML = '<div class="no-promo-codes">Промокодов пока нет</div>';
      return;
    }
    
    // Очищаем список
    promoList.innerHTML = '';
    
    // Создаем таблицу для промокодов
    const table = document.createElement('table');
    table.className = 'promo-codes-table';
    
    // Создаем заголовок таблицы
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Код</th>
        <th>Скидка</th>
        <th>Срок действия</th>
        <th>Статус</th>
        <th>Действия</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Создаем тело таблицы
    const tbody = document.createElement('tbody');
    
    // Сортируем промокоды: сначала активные, потом по дате создания (сначала новые)
    promoCodes.sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Добавляем строки для каждого промокода
    promoCodes.forEach(promo => {
      const tr = document.createElement('tr');
      
      // Определяем класс для статуса
      const statusClass = promo.active ? 'promo-active' : 'promo-inactive';
      
      // Форматируем дату истечения, если она есть
      let expiresAt = 'Бессрочно';
      if (promo.expiresAt) {
        const expiryDate = new Date(promo.expiresAt);
        const now = new Date();
        const isExpired = expiryDate < now;
        
        expiresAt = expiryDate.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        if (isExpired) {
          expiresAt += ' (истек)';
        }
      }
      
      tr.innerHTML = `
        <td>${promo.code}</td>
        <td>${promo.discount}%</td>
        <td>${expiresAt}</td>
        <td class="${statusClass}">${promo.active ? 'Активен' : 'Неактивен'}</td>
        <td>
          <div class="promo-actions">
            <button class="btn btn-sm ${promo.active ? 'btn-warning toggle-promo' : 'btn-success toggle-promo'}" data-id="${promo._id}" data-active="${promo.active}">
              ${promo.active ? '<i class="fas fa-pause"></i> Деактивировать' : '<i class="fas fa-play"></i> Активировать'}
            </button>
            <button class="btn btn-sm btn-danger delete-promo" data-id="${promo._id}">
              <i class="fas fa-trash-alt"></i> Удалить
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
      
      // Добавляем обработчики событий
      const toggleBtn = tr.querySelector('.toggle-promo');
      toggleBtn.addEventListener('click', () => {
        const promoId = toggleBtn.getAttribute('data-id');
        const isActive = toggleBtn.getAttribute('data-active') === 'true';
        
        this.togglePromoCode(promoId, !isActive, tr);
      });
      
      const deleteBtn = tr.querySelector('.delete-promo');
      deleteBtn.addEventListener('click', () => {
        const promoId = deleteBtn.getAttribute('data-id');
        
        // Показываем подтверждение
        if (confirm('Вы уверены, что хотите удалить этот промокод? Это действие нельзя отменить.')) {
          this.deletePromoCode(promoId, tr);
        }
      });
    });
    
    table.appendChild(tbody);
    promoList.appendChild(table);
  },
  
  // Создание нового промокода
  createPromoCode: function(promoData) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#admin-promo-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';
    }
    
    fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promoData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при создании промокода');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Очищаем форму
        document.getElementById('promo-code-name').value = '';
        document.getElementById('promo-discount').value = '';
        document.getElementById('promo-expires').value = '';
        
        // Показываем сообщение
        App.showMessage(`Промокод "${promoData.code}" успешно создан`, 'success');
        
        // Перезагружаем список промокодов
        this.loadPromoCodes();
      }
    })
    .catch(error => {
      console.error('Ошибка при создании промокода:', error);
      App.showMessage('Ошибка при создании промокода', 'error');
    })
    .finally(() => {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Создать промокод';
      }
    });
  },
  
  // Активация/деактивация промокода
  togglePromoCode: function(promoId, active, rowElement) {
    // Находим кнопку переключения в строке
    const toggleBtn = rowElement.querySelector('.toggle-promo');

    // Блокируем кнопку на время запроса
    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    }

    fetch(`/api/admin/promo-codes/${promoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса промокода');
      }
      return response.json();
    })
    .then(data => {
      if (data.success || data._id) { // Проверка на успешный ответ (может вернуться success или обновленный объект)
        // Обновляем отображение промокода
        const statusCell = rowElement.querySelector('td:nth-child(4)');

        // Обновляем атрибут data-active
        toggleBtn.setAttribute('data-active', active);

        // Обновляем текст кнопки
        toggleBtn.innerHTML = active ? 
          '<i class="fas fa-pause"></i> Деактивировать' : 
          '<i class="fas fa-play"></i> Активировать';

        // Обновляем класс кнопки
        toggleBtn.className = `btn btn-sm ${active ? 'btn-warning toggle-promo' : 'btn-success toggle-promo'}`;

        // Обновляем статус
        statusCell.className = active ? 'promo-active' : 'promo-inactive';
        statusCell.textContent = active ? 'Активен' : 'Неактивен';

        // Показываем сообщение
        App.showMessage(`Промокод ${active ? 'активирован' : 'деактивирован'}`, 'success');
      } else {
        throw new Error('Сервер вернул некорректный ответ');
      }
    })
    .catch(error => {
      console.error('Ошибка при обновлении статуса промокода:', error);
      App.showMessage('Ошибка при обновлении статуса промокода', 'error');

      // Восстанавливаем исходное состояние кнопки
      if (toggleBtn) {
        toggleBtn.innerHTML = active ? 
          '<i class="fas fa-pause"></i> Деактивировать' : 
          '<i class="fas fa-play"></i> Активировать';
        toggleBtn.disabled = false;
      }
    })
    .finally(() => {
      // Разблокируем кнопку
      if (toggleBtn) {
        toggleBtn.disabled = false;
      }
    });
  },
  
  // Удаление промокода
  deletePromoCode: function(promoId, rowElement) {
    fetch(`/api/admin/promo-codes/${promoId}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при удалении промокода');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Удаляем строку из таблицы
        rowElement.remove();
        
        // Показываем сообщение
        App.showMessage('Промокод успешно удален', 'success');
        
        // Проверяем, остались ли еще промокоды
        const remainingPromoCodes = document.querySelectorAll('.promo-codes-table tbody tr').length;
        if (remainingPromoCodes === 0) {
          document.querySelector('.promo-list-container').innerHTML = '<div class="no-promo-codes">Промокодов пока нет</div>';
        }
      }
    })
    .catch(error => {
      console.error('Ошибка при удалении промокода:', error);
      App.showMessage('Ошибка при удалении промокода', 'error');
    });
  }
};