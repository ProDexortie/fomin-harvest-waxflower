// router.js - Модуль маршрутизации

const Router = {
  // Текущая отображаемая страница
  currentPage: null,
  
  // Инициализация маршрутизатора
  init: function() {
    // Обработка клика по навигационным ссылкам
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        const href = link.getAttribute('href');
        history.pushState({ page }, '', href);
        this.loadPage(page);
      });
    });
    
    // Обработка изменений в истории браузера
    window.addEventListener('popstate', e => {
      const page = e.state ? e.state.page : this.getPageFromUrl();
      this.loadPage(page);
    });
    
    // Загрузка начальной страницы
    this.loadPage(this.getPageFromUrl());
  },
  
  // Получаем название страницы из URL
  getPageFromUrl: function() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html') {
      return 'menu';
    } else if (path === '/cart') {
      return 'cart';
    } else if (path === '/checkout') {
      return 'checkout';
    } else if (path === '/tracking') {
      return 'tracking';
    } else if (path === '/admin') {
      return 'admin';
    } else if (path.startsWith('/order-success')) {
      return 'order-success';
    }
    
    return 'menu'; // По умолчанию показываем меню
  },
  
  // Загрузить страницу по названию
  loadPage: function(page) {
    console.log(`Загрузка страницы: ${page}`);
    
    // Проверяем, что страница изменилась
    if (this.currentPage === page) {
      return;
    }
    
    // Обновляем активное состояние в навигации
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Получаем контейнер для содержимого
    const contentContainer = document.getElementById('page-content');
    
    // Получаем шаблон страницы
    const template = document.getElementById(`${page}-template`);
    
    if (!template) {
      console.error(`Шаблон для страницы ${page} не найден`);
      return;
    }
    
    // Клонируем содержимое шаблона
    const content = document.importNode(template.content, true);
    
    // Очищаем и добавляем новое содержимое
    contentContainer.innerHTML = '';
    contentContainer.appendChild(content);
    
    // Обновляем текущую страницу
    this.currentPage = page;
    
    // Вызываем соответствующие функции инициализации в зависимости от страницы
    switch (page) {
      case 'menu':
        Menu.initPage();
        break;
      case 'cart':
        Cart.initPage();
        break;
      case 'checkout':
        Checkout.initPage();
        break;
      case 'tracking':
        Tracking.initPage();
        break;
      case 'admin':
        Admin.initPage();
        break;
      case 'order-success':
        // Получаем номер заказа из URL
        const orderNumber = new URLSearchParams(window.location.search).get('order');
        if (orderNumber) {
          document.querySelector('.order-number').textContent = orderNumber;
        }
        break;
    }
    
    // Прокрутка вверх страницы
    window.scrollTo(0, 0);
  },
  
  // Перейти на другую страницу
  navigateTo: function(page, params = {}) {
    let url = '/';
    
    switch (page) {
      case 'menu':
        url = '/';
        break;
      case 'cart':
        url = '/cart';
        break;
      case 'checkout':
        url = '/checkout';
        break;
      case 'tracking':
        url = '/tracking';
        break;
      case 'admin':
        url = '/admin';
        break;
      case 'order-success':
        url = `/order-success?order=${params.orderNumber}`;
        break;
    }
    
    history.pushState({ page }, '', url);
    this.loadPage(page);
  }
};