// menu.js - Модуль для работы с меню

const Menu = {
  // Данные блюд
  dishes: [],
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля меню');
  },
  
  // Инициализация страницы меню
  initPage: function() {
    console.log('Инициализация страницы меню');
    this.loadDishes();
  },
  
  // Загрузка блюд с сервера
  loadDishes: function() {
    fetch('/api/dishes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке блюд');
        }
        return response.json();
      })
      .then(dishes => {
        this.dishes = dishes;
        this.renderDishes();
      })
      .catch(error => {
        console.error('Ошибка при загрузке блюд:', error);
        App.showMessage('Не удалось загрузить меню. Пожалуйста, попробуйте позже.', 'error');
      });
  },
  
  // Отображение блюд на странице
  renderDishes: function() {
    const container = document.querySelector('.dishes-container');
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если блюд нет, показываем сообщение
    if (this.dishes.length === 0) {
      container.innerHTML = '<p class="no-dishes">Блюда не найдены</p>';
      return;
    }
    
    // Отображаем каждое блюдо
    this.dishes.forEach(dish => {
      const dishCard = document.createElement('div');
      dishCard.className = 'dish-card';
      dishCard.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="dish-image">
        <div class="dish-info">
          <div class="dish-name">${dish.name}</div>
          <div class="dish-description">${dish.description}</div>
          <div class="dish-price">${App.formatPrice(dish.price)} ₽</div>
          <div class="dish-actions">
            <button class="btn btn-primary add-to-cart" data-id="${dish._id}">
              <i class="fas fa-shopping-cart"></i> В корзину
            </button>
          </div>
        </div>
      `;
      container.appendChild(dishCard);
      
      // Добавляем обработчик события для кнопки "В корзину"
      const addToCartBtn = dishCard.querySelector('.add-to-cart');
      addToCartBtn.addEventListener('click', () => {
        this.addToCart(dish);
      });
    });
  },
  
  // Добавление блюда в корзину
  addToCart: function(dish) {
    Cart.addItem(dish);
    App.showMessage(`"${dish.name}" добавлено в корзину`, 'success');
  }
};