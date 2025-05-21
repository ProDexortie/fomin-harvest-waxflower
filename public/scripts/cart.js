// cart.js - Модуль для работы с корзиной

const Cart = {
  // Элементы корзины
  items: [],
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля корзины');
    
    // Загружаем сохраненные товары из localStorage
    this.loadFromStorage();
    
    // Обновляем счетчик товаров в корзине
    this.updateCartCount();
  },
  
  // Инициализация страницы корзины
  initPage: function() {
    console.log('Инициализация страницы корзины');
    
    // Проверяем, находимся ли мы на странице корзины
    if (document.querySelector('.cart-page')) {
      // Загружаем данные корзины из localStorage (на всякий случай)
      this.loadFromStorage();
      
      // Отображаем содержимое корзины
      this.renderCartItems();
      
      // Настраиваем кнопку оформления заказа
      this.setupCheckoutButton();
    }
  },
  
  // Загрузка элементов корзины из localStorage
  loadFromStorage: function() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        this.items = JSON.parse(savedCart);
      } catch (e) {
        console.error('Ошибка при загрузке корзины:', e);
        this.items = [];
      }
    }
  },
  
  // Сохранение корзины в localStorage
  saveToStorage: function() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  },
  
  // Добавить товар в корзину
  addItem: function(dish) {
    // Проверяем, есть ли уже товар в корзине
    const existingItem = this.items.find(item => item.id === dish._id);
    
    if (existingItem) {
      // Если товар уже есть, увеличиваем количество
      existingItem.quantity++;
    } else {
      // Если товара нет, добавляем новый
      this.items.push({
        id: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1
      });
    }
    
    // Сохраняем корзину и обновляем счетчик
    this.saveToStorage();
    this.updateCartCount();
    
    // Если мы на странице корзины, обновляем ее отображение
    if (Router.currentPage === 'cart') {
      this.renderCartItems();
    }
  },
  
  // Удалить товар из корзины
  removeItem: function(itemId) {
    // Находим индекс товара
    const index = this.items.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      // Удаляем товар из массива
      this.items.splice(index, 1);
      
      // Сохраняем корзину и обновляем счетчик
      this.saveToStorage();
      this.updateCartCount();
      
      // Обновляем отображение корзины
      this.renderCartItems();
    }
  },
  
  // Изменить количество товара
  updateQuantity: function(itemId, quantity) {
    // Находим товар
    const item = this.items.find(item => item.id === itemId);
    
    if (item) {
      // Обновляем количество (минимум 1)
      item.quantity = Math.max(1, quantity);
      
      // Сохраняем корзину и обновляем счетчик
      this.saveToStorage();
      this.updateCartCount();
      
      // Обновляем отображение корзины
      this.renderCartItems();
    }
  },
  
  // Очистить корзину
  clearCart: function() {
    this.items = [];
    this.saveToStorage();
    this.updateCartCount();
    
    // Если мы на странице корзины, обновляем ее отображение
    if (Router.currentPage === 'cart') {
      this.renderCartItems();
    }
  },
  
  // Обновить счетчик товаров в шапке
  updateCartCount: function() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = totalItems;
    }
  },
  
  // Получить общую стоимость корзины
  getTotalAmount: function() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  // Отображение товаров в корзине
  renderCartItems: function() {
    const cartItems = document.querySelector('.cart-items');
    const cartEmpty = document.querySelector('.cart-empty');
    const cartContent = document.querySelector('.cart-content');
    const totalAmount = document.querySelector('.total-amount');
    
    if (!cartItems || !cartEmpty || !cartContent || !totalAmount) {
      console.error('Не найдены элементы корзины на странице');
      return;
    }
    
    // Перезагружаем данные из localStorage перед отображением
    this.loadFromStorage();
    
    // Проверяем, пуста ли корзина
    if (this.items.length === 0) {
      cartEmpty.classList.remove('hidden');
      cartContent.classList.add('hidden');
      return;
    }
    
    // Если корзина не пуста, показываем содержимое
    cartEmpty.classList.add('hidden');
    cartContent.classList.remove('hidden');
    
    // Очищаем список товаров
    cartItems.innerHTML = '';
    
    // Отображаем каждый товар
    this.items.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${App.formatPrice(item.price)} ₽</div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn decrease" data-id="${item.id}">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn increase" data-id="${item.id}">+</button>
        </div>
        <div class="cart-item-remove" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </div>
      `;
      cartItems.appendChild(cartItem);
      
      // Добавляем обработчики событий
      const decreaseBtn = cartItem.querySelector('.decrease');
      const increaseBtn = cartItem.querySelector('.increase');
      const removeBtn = cartItem.querySelector('.cart-item-remove');
      
      decreaseBtn.addEventListener('click', () => {
        this.updateQuantity(item.id, item.quantity - 1);
      });
      
      
      increaseBtn.addEventListener('click', () => {
        this.updateQuantity(item.id, item.quantity + 1);
      });
      
      removeBtn.addEventListener('click', () => {
        this.removeItem(item.id);
      });
    });
    
    // Обновляем общую стоимость
    totalAmount.textContent = App.formatPrice(this.getTotalAmount());
  },
  
  // Настройка кнопки оформления заказа
  setupCheckoutButton: function() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        // Проверяем, есть ли товары в корзине
        if (this.items.length === 0) {
          App.showMessage('Корзина пуста. Добавьте товары перед оформлением заказа.', 'warning');
          return;
        }
        
        // Переходим на страницу оформления заказа
        Router.navigateTo('checkout');
      });
    }
  }
};