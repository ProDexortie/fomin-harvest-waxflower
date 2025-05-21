// menu.js - Модуль для работы с меню

const Menu = {
  // Данные блюд
  dishes: [],
  
  // Текущее выбранное блюдо для детального просмотра/отзывов
  currentDish: null,
  
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
  
  // Получение конкретного блюда по ID
  getDishById: function(id) {
    return this.dishes.find(dish => dish._id === id);
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
          <div class="dish-rating">
            ${this.generateStarRating(dish.rating)}
            <span class="review-count">(${dish.reviewCount || 0})</span>
          </div>
          <div class="dish-description">${dish.description}</div>
          <div class="dish-price">${App.formatPrice(dish.price)} ₽</div>
          <div class="dish-actions">
            <button class="btn btn-primary add-to-cart" data-id="${dish._id}">
              <i class="fas fa-shopping-cart"></i> В корзину
            </button>
            <button class="btn btn-secondary view-details" data-id="${dish._id}">
              <i class="fas fa-info-circle"></i> Подробнее
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
      
      // Добавляем обработчик события для кнопки "Подробнее"
      const viewDetailsBtn = dishCard.querySelector('.view-details');
      viewDetailsBtn.addEventListener('click', () => {
        this.showDishDetails(dish._id);
      });
    });
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
    
    return `<div class="stars">${starsHtml}</div>`;
  },
  
  // Показать детали блюда и отзывы
  showDishDetails: function(dishId) {
    this.currentDish = this.getDishById(dishId);
    
    if (!this.currentDish) {
      App.showMessage('Блюдо не найдено', 'error');
      return;
    }
    
    // Создаем модальное окно для деталей блюда
    this.createDishDetailsModal(this.currentDish);
    
    // Загружаем отзывы
    this.loadReviews(dishId);
  },
  
  // Создание модального окна с деталями блюда
  createDishDetailsModal: function(dish) {
    // Удаляем существующее модальное окно, если оно есть
    const existingModal = document.querySelector('.dish-details-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'dish-details-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${dish.name}</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="dish-details">
            <div class="dish-image-container">
              <img src="${dish.image}" alt="${dish.name}" class="dish-detail-image">
            </div>
            <div class="dish-details-info">
              <div class="dish-detail-rating">
                ${this.generateStarRating(dish.rating)}
                <span class="review-count">(${dish.reviewCount || 0} отзывов)</span>
              </div>
              <p class="dish-detail-description">${dish.description}</p>
              <p class="dish-detail-price">Цена: <span>${App.formatPrice(dish.price)} ₽</span></p>
              <button class="btn btn-primary add-to-cart-detail" data-id="${dish._id}">
                <i class="fas fa-shopping-cart"></i> Добавить в корзину
              </button>
            </div>
          </div>
          
          <div class="dish-reviews-container">
            <h3>Отзывы</h3>
            <div class="reviews-list">
              <div class="loading-reviews">Загрузка отзывов...</div>
            </div>
            
            <div class="add-review-form">
              <h4>Оставить отзыв</h4>
              <form id="review-form">
                <div class="form-group">
                  <label for="review-name">Ваше имя</label>
                  <input type="text" id="review-name" name="userName" required>
                </div>
                <div class="form-group">
                  <label>Оценка</label>
                  <div class="rating-input">
                    <input type="radio" id="star5" name="rating" value="5">
                    <label for="star5"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star4" name="rating" value="4">
                    <label for="star4"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star3" name="rating" value="3" checked>
                    <label for="star3"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star2" name="rating" value="2">
                    <label for="star2"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star1" name="rating" value="1">
                    <label for="star1"><i class="fas fa-star"></i></label>
                  </div>
                </div>
                <div class="form-group">
                  <label for="review-comment">Комментарий</label>
                  <textarea id="review-comment" name="comment" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Отправить отзыв</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик закрытия модального окна
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    
    // Обработчик клика вне модального окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Обработчик кнопки "Добавить в корзину"
    const addToCartBtn = modal.querySelector('.add-to-cart-detail');
    addToCartBtn.addEventListener('click', () => {
      this.addToCart(dish);
      modal.remove();
    });
    
    // Обработчик формы отзыва
    const reviewForm = modal.querySelector('#review-form');
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitReview(dish._id, reviewForm);
    });
    
    // Добавляем стили для модального окна, если их еще нет
    this.addModalStyles();
  },
  
  // Добавление стилей для модального окна
  addModalStyles: function() {
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .dish-details-modal {
          display: block;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          overflow: auto;
        }
        
        .modal-content {
          background-color: white;
          margin: 5% auto;
          padding: 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 800px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .close-modal {
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .dish-details {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }
        
        .dish-image-container {
          flex: 0 0 40%;
          margin-right: 30px;
        }
        
        .dish-detail-image {
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .dish-details-info {
          flex: 1;
        }
        
        .dish-detail-rating {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .dish-detail-rating .stars {
          color: #f39c12;
          margin-right: 10px;
        }
        
        .dish-detail-price {
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        
        .dish-detail-price span {
          color: var(--primary-color);
        }
        
        .dish-reviews-container {
          margin-top: 30px;
        }
        
        .review-item {
          padding: 15px;
          border-bottom: 1px solid #eee;
          margin-bottom: 15px;
        }
        
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .review-author {
          font-weight: bold;
        }
        
        .review-date {
          color: #666;
          font-size: 14px;
        }
        
        .review-rating {
          color: #f39c12;
          margin-bottom: 10px;
        }
        
        .no-reviews {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        
        .add-review-form {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        
        .rating-input {
          display: flex;
          flex-direction: row-reverse;
          justify-content: flex-end;
        }
        
        .rating-input input {
          display: none;
        }
        
        .rating-input label {
          cursor: pointer;
          font-size: 24px;
          color: #ddd;
          padding: 0 5px;
        }
        
        .rating-input label:hover,
        .rating-input label:hover ~ label,
        .rating-input input:checked ~ label {
          color: #f39c12;
        }
        
        /* Адаптивность */
        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            margin: 10% auto;
          }
          
          .dish-details {
            flex-direction: column;
          }
          
          .dish-image-container {
            flex: 0 0 100%;
            margin-right: 0;
            margin-bottom: 20px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  // Загрузка отзывов для блюда
  loadReviews: function(dishId) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '<div class="loading-reviews">Загрузка отзывов...</div>';
    
    fetch(`/api/dishes/${dishId}/reviews`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке отзывов');
        }
        return response.json();
      })
      .then(reviews => {
        this.renderReviews(reviews);
      })
      .catch(error => {
        console.error('Ошибка при загрузке отзывов:', error);
        reviewsList.innerHTML = '<div class="error">Не удалось загрузить отзывы</div>';
      });
  },
  
  // Отображение отзывов
  renderReviews: function(reviews) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;
    
    // Очищаем список
    reviewsList.innerHTML = '';
    
    // Если отзывов нет, показываем сообщение
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<div class="no-reviews">Нет отзывов. Будьте первым, кто оставит отзыв!</div>';
      return;
    }
    
    // Отображаем каждый отзыв
    reviews.forEach(review => {
      const reviewItem = document.createElement('div');
      reviewItem.className = 'review-item';
      
      // Форматируем дату
      const date = new Date(review.createdAt);
      const formattedDate = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      reviewItem.innerHTML = `
        <div class="review-header">
          <div class="review-author">${review.userName}</div>
          <div class="review-date">${formattedDate}</div>
        </div>
        <div class="review-rating">
          ${this.generateStarRating(review.rating)}
        </div>
        ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
      `;
      
      reviewsList.appendChild(reviewItem);
    });
  },
  
  // Отправка нового отзыва
  submitReview: function(dishId, form) {
    // Получаем данные формы
    const formData = new FormData(form);
    const userName = formData.get('userName');
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment');
    
    // Проверяем заполнение обязательных полей
    if (!userName || !rating) {
      App.showMessage('Пожалуйста, заполните все обязательные поля', 'warning');
      return;
    }
    
    // Блокируем кнопку отправки
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    // Отправляем отзыв на сервер
    fetch(`/api/dishes/${dishId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName,
        rating,
        comment
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при отправке отзыва');
      }
      return response.json();
    })
    .then(data => {
      // Обновляем список отзывов
      this.loadReviews(dishId);
      
      // Обновляем данные о блюде
      this.loadDishes();
      
      // Очищаем форму
      form.reset();
      
      // Показываем сообщение об успехе
      App.showMessage('Спасибо за ваш отзыв!', 'success');
    })
    .catch(error => {
      console.error('Ошибка при отправке отзыва:', error);
      App.showMessage('Произошла ошибка при отправке отзыва', 'error');
    })
    .finally(() => {
      // Разблокируем кнопку
      submitButton.disabled = false;
      submitButton.innerHTML = 'Отправить отзыв';
    });
  },
  
  // Добавление блюда в корзину
  addToCart: function(dish) {
    Cart.addItem(dish);
    App.showMessage(`"${dish.name}" добавлено в корзину`, 'success');
  }
};