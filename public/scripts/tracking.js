// tracking.js - Модуль для отслеживания заказа

const Tracking = {
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля отслеживания заказа');
  },
  
  // Инициализация страницы отслеживания
  initPage: function() {
    console.log('Инициализация страницы отслеживания');
    
    // Настройка формы отслеживания
    this.setupTrackingForm();
    
    // Проверяем, есть ли номер заказа в URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    
    if (orderNumber) {
      // Если номер заказа есть в URL, сразу выполняем поиск
      document.getElementById('order-number').value = orderNumber;
      this.trackOrder(orderNumber);
    }
  },
  
  // Настройка формы отслеживания
  setupTrackingForm: function() {
    const trackingForm = document.getElementById('tracking-form');
    
    if (!trackingForm) return;
    
    trackingForm.addEventListener('submit', e => {
      e.preventDefault();
      
      const orderNumber = document.getElementById('order-number').value.trim();
      
      if (!orderNumber) {
        App.showMessage('Пожалуйста, введите номер заказа', 'warning');
        return;
      }
      
      this.trackOrder(orderNumber);
    });
  },
  
  // Отслеживание заказа по номеру
  trackOrder: function(orderNumber) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#tracking-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Поиск...';
    }
    
    fetch(`/api/orders/${orderNumber}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Заказ не найден');
          }
          throw new Error('Ошибка при получении информации о заказе');
        }
        return response.json();
      })
      .then(order => {
        this.displayOrderInfo(order);
        
        // Добавляем или обновляем заказ в активных заказах, если он еще не доставлен
        if (order.status !== 'Доставлен') {
          ActiveOrders.addOrder(order);
        }
      })
      .catch(error => {
        console.error('Ошибка при отслеживании заказа:', error);
        App.showMessage(`Ошибка: ${error.message}`, 'error');
        
        // Скрываем результат, если он был показан
        const trackingResult = document.querySelector('.tracking-result');
        if (trackingResult) {
          trackingResult.classList.add('hidden');
        }
      })
      .finally(() => {
        // Восстанавливаем кнопку
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Проверить статус';
        }
      });
  },
  
  // Отображение информации о заказе
  displayOrderInfo: function(order) {
    const trackingResult = document.querySelector('.tracking-result');
    
    if (!trackingResult) return;
    
    // Показываем результат
    trackingResult.classList.remove('hidden');
    
    // Статусы заказа для прогресс-бара
    const statuses = ['Принят', 'Готовится', 'В доставке', 'Доставлен'];
    const currentStatusIndex = statuses.indexOf(order.status);
    
    // Создаем HTML для отображения информации о заказе
    trackingResult.innerHTML = `
      <div class="order-details">
        <h2>Информация о заказе #${order.orderNumber}</h2>
        <p>Дата заказа: ${App.formatDate(order.createdAt)}</p>
        <p>Имя: ${order.customerName}</p>
        <p>Телефон: ${order.phone}</p>
        <p>Адрес доставки: ${order.address}</p>
        <p>Сумма заказа: ${App.formatPrice(order.totalAmount)} ₽</p>
      </div>
      
      <div class="order-status">
        <h3>Статус заказа:</h3>
        <span class="status-label status-${order.status}">${order.status}</span>
      </div>
      
      <div class="order-progress">
        ${statuses.map((status, index) => {
          let statusClass = '';
          if (index < currentStatusIndex) {
            statusClass = 'step-complete';
          } else if (index === currentStatusIndex) {
            statusClass = 'step-active';
          }
          
          return `
            <div class="progress-step ${statusClass}">
              <div class="step-icon">
                ${index < currentStatusIndex ? '<i class="fas fa-check"></i>' : (index === currentStatusIndex ? '<i class="fas fa-circle"></i>' : index + 1)}
              </div>
              <div class="step-label">${status}</div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="order-items-list">
        <h3>Состав заказа:</h3>
        <ul>
          ${order.items.map(item => `
            <li>${item.name} x ${item.quantity} - ${App.formatPrice(item.price * item.quantity)} ₽</li>
          `).join('')}
        </ul>
      </div>
    `;
  }
};