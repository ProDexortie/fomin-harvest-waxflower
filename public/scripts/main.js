// main.js - Основной JavaScript файл

// Объект приложения
const App = {
  // Инициализация приложения
  init: function() {
    // Выполнить при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Приложение FoodExpress инициализировано');
      
      // Инициализация модулей
      Router.init();
      Cart.init();
      Menu.init();
      Tracking.init();
      Checkout.init();
      Admin.init();
      ActiveOrders.init();
    });
  },
  
  // Показать модальное окно с сообщением
  showMessage: function(message, type = 'info') {
    // Создаем элемент модального окна, если его нет
    let messageBox = document.getElementById('message-box');
    if (!messageBox) {
      messageBox = document.createElement('div');
      messageBox.id = 'message-box';
      messageBox.className = 'message-box';
      document.body.appendChild(messageBox);
      
      // Стили для модального окна
      messageBox.style.position = 'fixed';
      messageBox.style.top = '20px';
      messageBox.style.left = '50%';
      messageBox.style.transform = 'translateX(-50%)';
      messageBox.style.zIndex = '1000';
      messageBox.style.padding = '15px 20px';
      messageBox.style.borderRadius = '5px';
      messageBox.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      messageBox.style.transition = 'all 0.3s ease';
      messageBox.style.opacity = '0';
      messageBox.style.maxWidth = '400px';
      messageBox.style.textAlign = 'center';
    }
    
    // Устанавливаем цвет фона в зависимости от типа сообщения
    switch (type) {
      case 'success':
        messageBox.style.backgroundColor = '#badc58';
        messageBox.style.color = '#2d3436';
        break;
      case 'error':
        messageBox.style.backgroundColor = '#e74c3c';
        messageBox.style.color = 'white';
        break;
      case 'warning':
        messageBox.style.backgroundColor = '#f39c12';
        messageBox.style.color = 'white';
        break;
      default:
        messageBox.style.backgroundColor = '#e67e22';
        messageBox.style.color = 'white';
    }
    
    // Установка текста сообщения
    messageBox.textContent = message;
    
    // Показываем сообщение
    messageBox.style.opacity = '1';
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
      messageBox.style.opacity = '0';
      setTimeout(() => {
        messageBox.remove();
      }, 300);
    }, 3000);
  },
  
  // Вспомогательные функции
  formatPrice: function(price) {
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').replace('.00', '');
  },
  
  formatDate: function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Инициализируем приложение
App.init();