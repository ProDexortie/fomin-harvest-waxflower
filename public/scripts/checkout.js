// checkout.js - Модуль для оформления заказа

const Checkout = {
  // Функция для валидации email
  validateEmail: function(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },
  
  // Данные о примененном промокоде
  appliedPromoCode: null,
  discountAmount: 0,
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля оформления заказа');
  },
  
  // Инициализация страницы оформления заказа
  initPage: function() {
    console.log('Инициализация страницы оформления заказа');
    
    // Проверяем, есть ли товары в корзине
    if (Cart.items.length === 0) {
      // Если корзина пуста, перенаправляем на страницу корзины
      App.showMessage('Корзина пуста. Добавьте товары перед оформлением заказа.', 'warning');
      setTimeout(() => {
        Router.navigateTo('cart');
      }, 1000);
      return;
    }
    
    // Отображаем товары из корзины
    this.renderOrderItems();
    
    // Настраиваем форму оформления заказа
    this.setupCheckoutForm();
    
    // Настраиваем форму промокода
    this.setupPromoCodeForm();
  },
  
  // Отображение товаров из корзины
  renderOrderItems: function() {
    const orderItems = document.querySelector('.order-items');
    const totalAmount = document.querySelector('.order-summary .total-amount');
    const finalAmount = document.querySelector('.order-summary .final-amount');
    const discountElement = document.querySelector('.order-summary .discount-amount');
    
    if (!orderItems || !totalAmount) return;
    
    // Очищаем список товаров
    orderItems.innerHTML = '';
    
    // Отображаем каждый товар
    Cart.items.forEach(item => {
      const orderItem = document.createElement('div');
      orderItem.className = 'order-item';
      orderItem.innerHTML = `
        <div class="order-item-name">${item.name} x ${item.quantity}</div>
        <div class="order-item-price">${App.formatPrice(item.price * item.quantity)} ₽</div>
      `;
      orderItems.appendChild(orderItem);
    });
    
    // Обновляем общую стоимость
    const cartTotal = Cart.getTotalAmount();
    totalAmount.textContent = App.formatPrice(cartTotal);
    
    // Обновляем информацию о скидке и конечной сумме
    if (discountElement && finalAmount) {
      if (this.appliedPromoCode) {
        this.discountAmount = (cartTotal * this.appliedPromoCode.discount) / 100;
        discountElement.textContent = App.formatPrice(this.discountAmount);
        finalAmount.textContent = App.formatPrice(cartTotal - this.discountAmount);
        
        // Показываем блок со скидкой
        document.querySelector('.discount-info').classList.remove('hidden');
      } else {
        // Скрываем блок со скидкой
        document.querySelector('.discount-info').classList.add('hidden');
        this.discountAmount = 0;
        finalAmount.textContent = App.formatPrice(cartTotal);
      }
    }
  },
  
  // Настройка формы промокода
  setupPromoCodeForm: function() {
    const promoForm = document.getElementById('promo-form');
    if (!promoForm) return;
    
    promoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const promoCode = document.getElementById('promo-code').value.trim();
      if (!promoCode) {
        App.showMessage('Пожалуйста, введите промокод', 'warning');
        return;
      }
      
      this.applyPromoCode(promoCode);
    });
  },
  
  // Применение промокода
  applyPromoCode: function(code) {
    // Блокируем кнопку
    const applyBtn = document.querySelector('#promo-form button');
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
    }
    
    fetch('/api/promo-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })
    .then(response => response.json())
    .then(data => {
      if (data.valid) {
        // Промокод действителен
        this.appliedPromoCode = {
          code: code,
          discount: data.discount
        };
        
        // Обновляем отображение заказа
        this.renderOrderItems();
        
        // Показываем сообщение об успехе
        App.showMessage(data.message, 'success');
        
        // Очищаем поле ввода и блокируем форму
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-code').disabled = true;
        applyBtn.innerHTML = 'Применен';
        applyBtn.disabled = true;
        
        // Добавляем кнопку сброса промокода
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn btn-link reset-promo';
        resetBtn.innerHTML = 'Отменить';
        resetBtn.addEventListener('click', () => this.resetPromoCode());
        
        const promoFormActions = document.querySelector('.promo-form-actions');
        if (promoFormActions && !promoFormActions.querySelector('.reset-promo')) {
          promoFormActions.appendChild(resetBtn);
        }
      } else {
        // Промокод недействителен
        App.showMessage(data.error || 'Недействительный промокод', 'error');
        applyBtn.disabled = false;
        applyBtn.innerHTML = 'Применить';
      }
    })
    .catch(error => {
      console.error('Ошибка при проверке промокода:', error);
      App.showMessage('Произошла ошибка при проверке промокода', 'error');
      
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.innerHTML = 'Применить';
      }
    });
  },
  
  // Сброс примененного промокода
  resetPromoCode: function() {
    this.appliedPromoCode = null;
    this.discountAmount = 0;
    
    // Разблокируем форму промокода
    const promoInput = document.getElementById('promo-code');
    const applyBtn = document.querySelector('#promo-form button');
    const resetBtn = document.querySelector('.reset-promo');
    
    if (promoInput) promoInput.disabled = false;
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = 'Применить';
    }
    if (resetBtn) resetBtn.remove();
    
    // Обновляем отображение заказа
    this.renderOrderItems();
    
    App.showMessage('Промокод отменен', 'info');
  },
  
  // Настройка формы оформления заказа
  setupCheckoutForm: function() {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!checkoutForm) return;
    
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      
      // Собираем данные формы
      const formData = new FormData(checkoutForm);
      const customerName = formData.get('customerName');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const address = formData.get('address');
      
      // Проверяем заполнение полей
      if (!customerName || !email || !phone || !address) {
        App.showMessage('Пожалуйста, заполните все поля формы', 'warning');
        return;
      }
      
      // Проверяем корректность email
      if (!this.validateEmail(email)) {
        App.showMessage('Пожалуйста, введите корректный email', 'warning');
        return;
      }
      
      // Формируем данные для отправки
      const orderData = {
        customerName,
        email,
        phone,
        address,
        items: Cart.items.map(item => ({
          dish: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: Cart.getTotalAmount(),
        promoCode: this.appliedPromoCode ? this.appliedPromoCode.code : null,
        discountAmount: this.discountAmount
      };
      
      // Отправляем заказ на сервер
      this.submitOrder(orderData);
    });
  },
  
  // Отправка заказа на сервер
  submitOrder: function(orderData) {
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    }
    
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при создании заказа');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Добавляем заказ в активные
        ActiveOrders.addOrder({
          orderNumber: data.orderNumber,
          status: 'Принят',
          createdAt: new Date().toISOString()
        });
        
        // Очищаем корзину
        Cart.clearCart();
        
        // Перенаправляем на страницу успешного оформления заказа
        Router.navigateTo('order-success', { orderNumber: data.orderNumber });
      } else {
        App.showMessage('Ошибка при оформлении заказа: ' + (data.message || 'Неизвестная ошибка'), 'error');
      }
    })
    .catch(error => {
      console.error('Ошибка при оформлении заказа:', error);
      App.showMessage('Ошибка при оформлении заказа. Пожалуйста, попробуйте позже.', 'error');
    })
    .finally(() => {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Подтвердить заказ';
      }
    });
  }
};