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
        
        // Добавляем или обновляем заказ в активных заказах, если он еще не доставлен и не отменен
        if (order.status !== 'Доставлен' && order.status !== 'Отменен') {
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
    
    // Проверяем, отменен ли заказ
    const isOrderCancelled = order.status === 'Отменен';
    
    // Создаем HTML для отображения информации о заказе
    trackingResult.innerHTML = `
      <div class="order-details">
        <h2>Информация о заказе #${order.orderNumber}</h2>
        <p>Дата заказа: ${App.formatDate(order.createdAt)}</p>
        <p>Имя: ${order.customerName}</p>
        <p>Телефон: ${order.phone}</p>
        <p>Email: ${order.email || 'Не указан'}</p>
        <p>Адрес доставки: ${order.address}</p>
        <p>Сумма заказа: ${App.formatPrice(order.totalAmount)} ₽</p>
        ${order.comment ? `<p>Комментарий к заказу: ${order.comment}</p>` : ''}
      </div>
      
      <div class="order-status">
        <h3>Статус заказа:</h3>
        <span class="status-label status-${order.status.replace(/\s+/g, '-')}">${order.status}</span>
        
        ${isOrderCancelled ? `
          <div class="cancelled-info">
            <p>Заказ был отменен. Если у вас возникли вопросы, пожалуйста, свяжитесь с нами.</p>
          </div>
        ` : ''}
        
        ${!isOrderCancelled && order.canCancel ? `
          <div class="cancel-order-container">
            <button class="btn btn-danger cancel-order-btn" data-order="${order.orderNumber}">
              Отменить заказ
            </button>
            <p class="cancel-note">Заказ можно отменить до момента его передачи в доставку</p>
          </div>
        ` : ''}
      </div>
      
      ${!isOrderCancelled ? `
        <div class="order-progress">
          ${statuses.map((status, index) => {
            let stepClass = '';
            
            // Для статуса "Доставлен" все шаги должны быть завершены
            if (order.status === 'Доставлен') {
              stepClass = 'step-complete';
            } else {
              // Иначе применяем обычную логику
              if (index < currentStatusIndex) {
                stepClass = 'step-complete';
              } else if (index === currentStatusIndex) {
                stepClass = 'step-active';
              }
            }
            
            // Определяем иконку для шага
            let iconHtml = '';
            if (stepClass === 'step-complete') {
              iconHtml = '<i class="fas fa-check"></i>';
            } else if (stepClass === 'step-active') {
              iconHtml = '<i class="fas fa-circle"></i>';
            } else {
              iconHtml = (index + 1).toString();
            }
            
            return `
              <div class="progress-step ${stepClass}">
                <div class="step-icon">
                  ${iconHtml}
                </div>
                <div class="step-label">${status}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      <div class="order-items-list">
        <h3>Состав заказа:</h3>
        <ul>
          ${order.items.map(item => `
            <li>${item.name} x ${item.quantity} - ${App.formatPrice(item.price * item.quantity)} ₽</li>
          `).join('')}
        </ul>
      </div>
    `;
    
    // Добавляем обработчики событий для кнопки отмены заказа, если она есть
    const cancelBtn = trackingResult.querySelector('.cancel-order-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelOrder(order.orderNumber);
      });
    }
  },
  
  // Отмена заказа
  cancelOrder: function(orderNumber) {
    // Показываем диалог подтверждения
    if (!confirm('Вы уверены, что хотите отменить заказ? Это действие нельзя отменить.')) {
      return;
    }
    
    // Блокируем кнопку отмены
    const cancelBtn = document.querySelector('.cancel-order-btn');
    if (cancelBtn) {
      cancelBtn.disabled = true;
      cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отмена...';
    }
    
    fetch(`/api/orders/${orderNumber}/cancel`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 400) {
          return response.json().then(data => {
            throw new Error(data.error || 'Этот заказ нельзя отменить');
          });
        }
        throw new Error('Ошибка при отмене заказа');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        App.showMessage('Заказ успешно отменен', 'success');
        
        // Обновляем информацию о заказе
        this.trackOrder(orderNumber);
        
        // Обновляем статус в активных заказах
        ActiveOrders.updateOrderStatus(orderNumber, 'Отменен');
      } else {
        App.showMessage('Ошибка при отмене заказа: ' + (data.error || 'Неизвестная ошибка'), 'error');
      }
    })
    .catch(error => {
      console.error('Ошибка при отмене заказа:', error);
      App.showMessage(error.message || 'Ошибка при отмене заказа', 'error');
    });
  }
};