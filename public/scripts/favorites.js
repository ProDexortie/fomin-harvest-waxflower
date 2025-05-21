// favorites.js - Модуль для работы с избранными блюдами

const Favorites = {
  // Массив избранных блюд
  items: [],
  
  // Инициализация модуля
  init: function() {
    console.log('Инициализация модуля избранного');
    
    // Загружаем сохраненные избранные блюда из localStorage
    this.loadFromStorage();
    
    // Добавляем кнопку избранного в меню, если ее еще нет
    this.addFavoritesButton();
  },
  
  // Загрузка избранных блюд из localStorage
  loadFromStorage: function() {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        this.items = JSON.parse(savedFavorites);
      } catch (e) {
        console.error('Ошибка при загрузке избранного:', e);
        this.items = [];
      }
    }
  },
  
  // Сохранение избранных блюд в localStorage
  saveToStorage: function() {
    localStorage.setItem('favorites', JSON.stringify(this.items));
  },
  
  // Добавление кнопки избранного в меню
  addFavoritesButton: function() {
    const navList = document.querySelector('nav ul');
    if (!navList || navList.querySelector('.favorites-link')) return;
    
    // Создаем новый элемент списка для ссылки на избранное
    const favItem = document.createElement('li');
    favItem.innerHTML = `
      <a href="/favorites" class="nav-link" data-page="favorites">
        <i class="fas fa-heart"></i>
        <span class="favorites-count">${this.items.length}</span>
      </a>
    `;
    
    // Добавляем элемент перед корзиной
    const cartItem = navList.querySelector('li:last-child');
    navList.insertBefore(favItem, cartItem);
    
    // Добавляем обработчик клика
    const favLink = favItem.querySelector('.nav-link');
    favLink.addEventListener('click', e => {
      e.preventDefault();
      const page = favLink.getAttribute('data-page');
      const href = favLink.getAttribute('href');
      history.pushState({ page }, '', href);
      Router.loadPage(page);
    });
    
    // Добавляем стили для счетчика избранного
    const style = document.createElement('style');
    style.textContent = `
      .favorites-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-color);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        position: relative;
        top: -8px;
        left: -5px;
      }
    `;
    document.head.appendChild(style);
    
    // Добавляем шаблон страницы избранного, если его еще нет
    if (!document.getElementById('favorites-template')) {
      const template = document.createElement('template');
      template.id = 'favorites-template';
      template.innerHTML = `
        <section class="page favorites-page">
          <h1>Избранное</h1>
          <div class="favorites-empty hidden">
            <p>В избранном пока нет блюд</p>
            <a href="/" class="btn btn-primary">Перейти в меню</a>
          </div>
          <div class="favorites-container">
            <!-- Избранные блюда будут загружены динамически -->
          </div>
        </section>
      `;
      document.body.appendChild(template);
    }
  },
  
  // Обновление счетчика избранных блюд
  updateFavoritesCount: function() {
    const favCount = document.querySelector('.favorites-count');
    if (favCount) {
      favCount.textContent = this.items.length;
    }
  },
  
  // Добавление блюда в избранное
  addToFavorites: function(dish) {
    // Проверяем, есть ли уже блюдо в избранном
    const existingItem = this.items.find(item => item.id === dish._id);
    
    if (!existingItem) {
      // Если блюда нет в избранном, добавляем его
      this.items.push({
        id: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        description: dish.description,
        rating: dish.rating,
        discount: dish.discount || 0
      });
      
      // Сохраняем избранное и обновляем счетчик
      this.saveToStorage();
      this.updateFavoritesCount();
      
      App.showMessage(`"${dish.name}" добавлено в избранное`, 'success');
    } else {
      // Если блюдо уже в избранном, удаляем его
      this.removeFromFavorites(dish._id);
    }
    
    // Обновляем кнопки избранного на странице меню
    this.updateFavoriteButtons();
    
    // Если мы на странице избранного, обновляем ее отображение
    if (Router.currentPage === 'favorites') {
      this.renderFavorites();
    }
  },
  
  // Удаление блюда из избранного
  removeFromFavorites: function(dishId) {
    // Находим индекс блюда
    const index = this.items.findIndex(item => item.id === dishId);
    
    if (index !== -1) {
      const removedItem = this.items[index];
      
      // Удаляем блюдо из массива
      this.items.splice(index, 1);
      
      // Сохраняем избранное и обновляем счетчик
      this.saveToStorage();
      this.updateFavoritesCount();
      
      App.showMessage(`"${removedItem.name}" удалено из избранного`, 'info');
      
      // Обновляем кнопки избранного на странице меню
      this.updateFavoriteButtons();
      
      // Если мы на странице избранного, обновляем ее отображение
      if (Router.currentPage === 'favorites') {
        this.renderFavorites();
      }
    }
  },
  
  // Проверка, находится ли блюдо в избранном
  isInFavorites: function(dishId) {
    return this.items.some(item => item.id === dishId);
  },
  
  // Обновление кнопок избранного на странице меню
  updateFavoriteButtons: function() {
    const dishCards = document.querySelectorAll('.dish-card');
    
    dishCards.forEach(card => {
      const favBtn = card.querySelector('.favorite-btn');
      if (!favBtn) return;
      
      const dishId = favBtn.getAttribute('data-id');
      const isFavorite = this.isInFavorites(dishId);
      
      // Обновляем иконку и текст кнопки
      favBtn.innerHTML = isFavorite ? 
        '<i class="fas fa-heart"></i> В избранном' : 
        '<i class="far fa-heart"></i> В избранное';
      
      // Обновляем класс кнопки
      if (isFavorite) {
        favBtn.classList.add('is-favorite');
      } else {
        favBtn.classList.remove('is-favorite');
      }
    });
  },
  
  // Инициализация страницы избранного
  initPage: function() {
    console.log('Инициализация страницы избранного');
    this.renderFavorites();
  },
  
  // Отображение избранных блюд
  renderFavorites: function() {
    const container = document.querySelector('.favorites-container');
    const emptyMessage = document.querySelector('.favorites-empty');
    
    if (!container || !emptyMessage) return;
    
    // Проверяем, есть ли избранные блюда
    if (this.items.length === 0) {
      emptyMessage.classList.remove('hidden');
      container.classList.add('hidden');
      return;
    }
    
    // Если есть избранные блюда, показываем их
    emptyMessage.classList.add('hidden');
    container.classList.remove('hidden');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем сетку для блюд
    const grid = document.createElement('div');
    grid.className = 'dishes-container';
    container.appendChild(grid);
    
    // Отображаем каждое избранное блюдо
    this.items.forEach(dish => {
      const dishCard = document.createElement('div');
      dishCard.className = 'dish-card';
      
      // Вычисляем цену с учетом скидки
      const discountedPrice = dish.discount ? 
        dish.price * (1 - dish.discount / 100) : 
        dish.price;
      
      dishCard.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}" class="dish-image">
        <div class="dish-info">
          <div class="dish-name">${dish.name}</div>
          <div class="dish-description">${dish.description}</div>
          
          <div class="dish-price-container">
            ${dish.discount ? `
              <span class="dish-original-price">${App.formatPrice(dish.price)} ₽</span>
              <span class="dish-discount">-${dish.discount}%</span>
            ` : ''}
            <div class="dish-price">${App.formatPrice(discountedPrice)} ₽</div>
          </div>
          
          <div class="dish-rating">
            <i class="fas fa-star"></i>
            <span>${dish.rating.toFixed(1)}</span>
          </div>
          
          <div class="dish-actions">
            <button class="btn btn-primary add-to-cart" data-id="${dish.id}">
              <i class="fas fa-shopping-cart"></i> В корзину
            </button>
            <button class="btn btn-secondary remove-favorite" data-id="${dish.id}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
      
      grid.appendChild(dishCard);
      
      // Добавляем обработчик события для кнопки "В корзину"
      const addToCartBtn = dishCard.querySelector('.add-to-cart');
      addToCartBtn.addEventListener('click', () => {
        // Находим блюдо в меню
        const menuDish = Menu.dishes.find(d => d._id === dish.id);
        if (menuDish) {
          Menu.addToCart(menuDish);
        } else {
          // Если блюда нет в меню (например, оно было удалено), используем данные из избранного
          Cart.addItem({
            _id: dish.id,
            name: dish.name,
            price: discountedPrice,
            image: dish.image
          });
          App.showMessage(`"${dish.name}" добавлено в корзину`, 'success');
        }
      });
      
      // Добавляем обработчик события для кнопки удаления из избранного
      const removeFavoriteBtn = dishCard.querySelector('.remove-favorite');
      removeFavoriteBtn.addEventListener('click', () => {
        this.removeFromFavorites(dish.id);
      });
    });
  }
};