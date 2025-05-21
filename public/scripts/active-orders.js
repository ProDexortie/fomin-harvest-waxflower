// active-orders.js - Модуль для управления активными заказами пользователя

const ActiveOrders = {
  // Массив активных заказов
  orders: [],
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля активных заказов');
    
    // Загружаем сохраненные заказы из localStorage
    this.loadFromStorage();
    
    // Очистка старых заказов (старше недели)
    this.cleanOldOrders();
    
    // Создаем и добавляем панель активных заказов
    this.createActiveOrdersPanel();
    
    // Настраиваем интервал для обновления статусов заказов
    this.setupStatusUpdater();
  },
  
  // Загрузка активных заказов из localStorage
  loadFromStorage: function() {
    const savedOrders = localStorage.getItem('activeOrders');
    if (savedOrders) {
      try {
        this.orders = JSON.parse(savedOrders);
      } catch (e) {
        console.error('Ошибка при загрузке активных заказов:', e);
        this.orders = [];
      }
    }
  },
  
  // Сохранение активных заказов в localStorage
  saveToStorage: function() {
    localStorage.setItem('activeOrders', JSON.stringify(this.orders));
  },
  
  // Очистка старых заказов (старше недели)
  cleanOldOrders: function() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 дней назад
    
    // Удаляем заказы старше недели
    this.orders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate > oneWeekAgo;
    });
    
    // Сохраняем обновленный список
    this.saveToStorage();
  },
  
  // Добавление нового заказа в активные
  addOrder: function(order) {
    // Проверяем, нет ли уже такого заказа
    const existingOrder = this.orders.find(o => o.orderNumber === order.orderNumber);
    
    if (!existingOrder) {
      // Добавляем новый заказ
      this.orders.push({
        orderNumber: order.orderNumber,
        status: order.status || 'Принят',
        createdAt: order.createdAt || new Date().toISOString(),
        lastChecked: new Date().toISOString()
      });
      
      // Сохраняем в localStorage
      this.saveToStorage();
      
      // Обновляем отображение
      this.updateActiveOrdersDisplay();
    }
  },
  
  // Обновление статуса заказа
  updateOrderStatus: function(orderNumber, status) {
    const order = this.orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
      order.status = status;
      order.lastChecked = new Date().toISOString();
      
      // Если заказ доставлен или отменен, помечаем его для удаления через некоторое время
      if (status === 'Доставлен' || status === 'Отменен') {
        order.markedForRemoval = true;
        order.removalTime = new Date().getTime() + 2 * 60 * 60 * 1000; // 2 часа в миллисекундах
      }
      
      // Сохраняем в localStorage
      this.saveToStorage();
      
      // Обновляем отображение
      this.updateActiveOrdersDisplay();
    }
  },
  
  // Удаление заказа из активных
  removeOrder: function(orderNumber) {
    this.orders = this.orders.filter(o => o.orderNumber !== orderNumber);
    
    // Сохраняем в localStorage
    this.saveToStorage();
    
    // Обновляем отображение
    this.updateActiveOrdersDisplay();
  },
  
  // Проверка, есть ли активные заказы
  hasActiveOrders: function() {
    return this.orders.length > 0;
  },
  
  // Создание панели активных заказов
  createActiveOrdersPanel: function() {
    // Создаем панель, если ее еще нет
    if (!document.querySelector('.active-orders-panel')) {
      // Создаем элемент панели
      const panel = document.createElement('div');
      panel.className = 'active-orders-panel';
      
      // Стили для панели
      panel.style.position = 'fixed';
      panel.style.bottom = '20px';
      panel.style.right = '20px';
      panel.style.width = '300px';
      panel.style.maxHeight = '70vh';
      panel.style.overflowY = 'auto';
      panel.style.backgroundColor = 'white';
      panel.style.borderRadius = '10px';
      panel.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      panel.style.zIndex = '100';
      panel.style.transition = 'transform 0.3s ease';
      panel.style.transform = 'translateY(100%)';
      panel.style.opacity = '0';
      panel.style.visibility = 'hidden';
      
      // Создаем заголовок панели
      const header = document.createElement('div');
      header.className = 'active-orders-header';
      header.style.padding = '15px';
      header.style.backgroundColor = '#e67e22';
      header.style.color = 'white';
      header.style.borderTopLeftRadius = '10px';
      header.style.borderTopRightRadius = '10px';
      header.style.fontWeight = 'bold';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.innerHTML = `
        <span>Активные заказы</span>
        <button class="toggle-active-orders-btn" style="background: none; border: none; color: white; cursor: pointer;">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // Создаем контейнер для заказов
      const ordersContainer = document.createElement('div');
      ordersContainer.className = 'active-orders-container';
      ordersContainer.style.padding = '15px';
      
      // Добавляем элементы в панель
      panel.appendChild(header);
      panel.appendChild(ordersContainer);
      
      // Создаем кнопку для показа панели
      const showBtn = document.createElement('button');
      showBtn.className = 'show-active-orders-btn';
      showBtn.innerHTML = `
        <i class="fas fa-concierge-bell"></i>
        <span class="active-orders-count">0</span>
      `;
      
      // Стили для кнопки
      showBtn.style.position = 'fixed';
      showBtn.style.bottom = '20px';
      showBtn.style.right = '20px';
      showBtn.style.width = '50px';
      showBtn.style.height = '50px';
      showBtn.style.borderRadius = '50%';
      showBtn.style.backgroundColor = '#e67e22';
      showBtn.style.color = 'white';
      showBtn.style.display = 'flex';
      showBtn.style.justifyContent = 'center';
      showBtn.style.alignItems = 'center';
      showBtn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      showBtn.style.cursor = 'pointer';
      showBtn.style.border = 'none';
      showBtn.style.fontSize = '20px';
      showBtn.style.zIndex = '99';
      
      // Стили для счетчика заказов
      const countElement = showBtn.querySelector('.active-orders-count');
      countElement.style.position = 'absolute';
      countElement.style.top = '-5px';
      countElement.style.right = '-5px';
      countElement.style.backgroundColor = 'white';
      countElement.style.color = '#e67e22';
      countElement.style.borderRadius = '50%';
      countElement.style.width = '20px';
      countElement.style.height = '20px';
      countElement.style.fontSize = '12px';
      countElement.style.display = 'flex';
      countElement.style.justifyContent = 'center';
      countElement.style.alignItems = 'center';
      countElement.style.fontWeight = 'bold';
      
      // Добавляем обработчики событий
      showBtn.addEventListener('click', () => {
        panel.style.transform = 'translateY(0)';
        panel.style.opacity = '1';
        panel.style.visibility = 'visible';
        showBtn.style.display = 'none';
      });
      
      const closeBtn = header.querySelector('.toggle-active-orders-btn');
      closeBtn.addEventListener('click', () => {
        panel.style.transform = 'translateY(100%)';
        panel.style.opacity = '0';
        panel.style.visibility = 'hidden';
        showBtn.style.display = 'flex';
      });
      
      // Добавляем элементы на страницу
      document.body.appendChild(panel);
      document.body.appendChild(showBtn);
      
      // Обновляем отображение
      this.updateActiveOrdersDisplay();
    }
  },
  
  // Обновление отображения активных заказов
  updateActiveOrdersDisplay: function() {
    const container = document.querySelector('.active-orders-container');
    const countElement = document.querySelector('.active-orders-count');
    const showBtn = document.querySelector('.show-active-orders-btn');
    const panel = document.querySelector('.active-orders-panel');
    
    if (!container || !countElement || !showBtn || !panel) return;
    
    // Обновляем счетчик заказов
    countElement.textContent = this.orders.length;
    
    // Показываем или скрываем кнопку, в зависимости от наличия заказов
    if (this.orders.length === 0) {
      showBtn.style.display = 'none';
      panel.style.transform = 'translateY(100%)';
      panel.style.opacity = '0';
      panel.style.visibility = 'hidden';
    } else {
      showBtn.style.display = 'flex';
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если нет заказов, показываем сообщение
    if (this.orders.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">У вас нет активных заказов</p>';
      return;
    }
    
    // Сортируем заказы по времени создания (сначала новые)
    const sortedOrders = [...this.orders].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Отображаем каждый заказ
    sortedOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'active-order-card';
      orderCard.style.marginBottom = '15px';
      orderCard.style.padding = '15px';
      orderCard.style.backgroundColor = '#fff5eb';
      orderCard.style.borderRadius = '5px';
      orderCard.style.border = '1px solid #ddd';
      
      // Определяем цвет статуса
      let statusColor = '#f39c12'; // По умолчанию желтый (Принят)
      
      switch (order.status) {
        case 'Готовится':
          statusColor = '#e67e22'; // Оранжевый
          break;
        case 'В доставке':
          statusColor = '#f8c291'; // Персиковый
          break;
        case 'Доставлен':
          statusColor = '#6ab04c'; // Зеленый
          break;
        case 'Отменен':
          statusColor = '#e74c3c'; // Красный
          break;
      }
      
      // Заполняем карточку
      orderCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 16px;">Заказ #${order.orderNumber}</h3>
          <span class="order-card-date" style="font-size: 12px; color: #666;">
            ${App.formatDate(order.createdAt)}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="order-card-status" style="
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            background-color: ${statusColor};
            color: white;
            font-size: 14px;
          ">
            ${order.status}
          </span>
          <button class="track-order-btn" data-order="${order.orderNumber}" style="
            background: none;
            border: none;
            color: #e67e22;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
          ">
            Отследить
          </button>
        </div>
      `;
      
      // Добавляем обработчик на кнопку отслеживания
      const trackBtn = orderCard.querySelector('.track-order-btn');
      trackBtn.addEventListener('click', () => {
        // Перенаправляем на страницу отслеживания с номером этого заказа
        Router.navigateTo('tracking', { order: order.orderNumber });
        
        // Скрываем панель
        panel.style.transform = 'translateY(100%)';
        panel.style.opacity = '0';
        panel.style.visibility = 'hidden';
        showBtn.style.display = 'flex';
      });
      
      // Добавляем карточку в контейнер
      container.appendChild(orderCard);
    });
  },
  
  // Проверка и удаление заказов, помеченных для удаления
  checkAndRemoveMarkedOrders: function() {
    const now = new Date().getTime();
    
    // Находим заказы, помеченные для удаления, у которых истекло время
    const ordersToRemove = this.orders.filter(order => 
      order.markedForRemoval && order.removalTime < now
    );
    
    // Удаляем эти заказы
    ordersToRemove.forEach(order => {
      this.removeOrder(order.orderNumber);
    });
  },
  
  // Настройка интервала для обновления статусов заказов
  setupStatusUpdater: function() {
    // Обновляем статусы каждые 2 минуты
    setInterval(() => {
      this.updateOrdersStatus();
    }, 2 * 60 * 1000); // 2 минуты в миллисекундах
    
    // Проверяем старые заказы каждые 6 часов
    setInterval(() => {
      this.cleanOldOrders();
    }, 6 * 60 * 60 * 1000); // 6 часов в миллисекундах
    
    // Также обновляем статусы сразу при загрузке страницы
    this.updateOrdersStatus();
  },
  
  // Обновление статусов всех активных заказов
  updateOrdersStatus: function() {
    // Если нет заказов, нечего обновлять
    if (this.orders.length === 0) return;
    
    console.log('Обновление статусов активных заказов...');
    
    // Обновляем статус каждого заказа
    const promises = this.orders.map(order => {
      return fetch(`/api/orders/${order.orderNumber}`)
        .then(response => {
          if (!response.ok) {
            // Если заказ не найден (404), вероятно он был удален администратором
            if (response.status === 404) {
              this.removeOrder(order.orderNumber);
              throw new Error('Заказ не найден - возможно, удален администратором');
            }
            throw new Error('Ошибка при получении информации о заказе');
          }
          return response.json();
        })
        .then(updatedOrder => {
          // Если заказ доставлен или отменен, помечаем его для удаления через несколько часов
          if (updatedOrder.status === 'Доставлен' || updatedOrder.status === 'Отменен') {
            const currentOrder = this.orders.find(o => o.orderNumber === order.orderNumber);
            if (currentOrder) {
              // Устанавливаем флаг для будущего удаления
              if (!currentOrder.markedForRemoval) {
                currentOrder.markedForRemoval = true;
                currentOrder.removalTime = new Date().getTime() + 2 * 60 * 60 * 1000; // 2 часа
                this.saveToStorage();
              }
            }
          }
          
          // Обновляем статус, если он изменился
          if (updatedOrder.status !== order.status) {
            this.updateOrderStatus(order.orderNumber, updatedOrder.status);
          }
          
          return updatedOrder;
        })
        .catch(error => {
          console.error(`Ошибка при обновлении статуса заказа ${order.orderNumber}:`, error);
          
          // Если это не ошибка 404 (уже обработали), проверяем, не пора ли удалить заказы, помеченные для удаления
          if (!error.message.includes('не найден')) {
            // Проверяем, не пора ли удалить заказы, помеченные для удаления
            this.checkAndRemoveMarkedOrders();
          }
        });
    });
    
    // Ждем завершения всех запросов
    Promise.all(promises).then(() => {
      // После обновления всех заказов, обновляем отображение
      this.updateActiveOrdersDisplay();
    });
  }
};