// server.js - Основной серверный файл для приложения доставки еды

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'foodDeliverySecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Для production рекомендуется установить true с HTTPS
}));

// MongoDB подключение
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://user:password@cluster.mongodb.net/delivery';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB подключено'))
.catch(err => console.log('Ошибка подключения к MongoDB:', err));

// Определение схем и моделей
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '/images/default-dish.jpg' },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
});

const reviewSchema = new mongoose.Schema({
  dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, // процент скидки (от 0 до 100)
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number },
  promoCode: { type: String },
  status: { type: String, enum: ['Принят', 'Готовится', 'В доставке', 'Доставлен', 'Отменен'], default: 'Принят' },
  createdAt: { type: Date, default: Date.now }
});

// Добавляем пре-сейв хук для расчета finalAmount
orderSchema.pre('save', function(next) {
  if (!this.finalAmount) {
    this.finalAmount = this.totalAmount - this.discountAmount;
  }
  next();
});

const Dish = mongoose.model('Dish', dishSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

// Начальные данные для блюд (если база пуста)
const initializeData = async () => {
  // Инициализация блюд
  const dishCount = await Dish.countDocuments();
  if (dishCount === 0) {
    const initialDishes = [
      {
        name: 'Пицца "Маргарита"',
        description: 'Классическая итальянская пицца с томатами и моцареллой',
        price: 450,
        image: '/images/pizza-margherita.jpg'
      },
      {
        name: 'Бургер "Классический"',
        description: 'Сочная говяжья котлета с сыром, свежими овощами и соусом',
        price: 350,
        image: '/images/classic-burger.jpg'
      },
      {
        name: 'Паста "Карбонара"',
        description: 'Спагетти с беконом, сыром пармезан, яйцом и сливочным соусом',
        price: 400,
        image: '/images/pasta-carbonara.jpg'
      },
      {
        name: 'Салат "Цезарь"',
        description: 'Римский салат с курицей, гренками, пармезаном и соусом',
        price: 320,
        image: '/images/caesar-salad.jpg'
      },
      {
        name: 'Суши сет "Филадельфия"',
        description: 'Набор из 18 роллов с лососем, авокадо и сливочным сыром',
        price: 850,
        image: '/images/philadelphia-set.jpg'
      },
      {
        name: 'Суп "Том Ям"',
        description: 'Острый тайский суп с креветками, грибами и кокосовым молоком',
        price: 380,
        image: '/images/tom-yum.jpg'
      }
    ];
    await Dish.insertMany(initialDishes);
    console.log('Начальные данные блюд добавлены');
  }

  // Инициализация промокодов
  const promoCount = await PromoCode.countDocuments();
  if (promoCount === 0) {
    const initialPromoCodes = [
      {
        code: 'WELCOME10',
        discount: 10,
        active: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Годен в течение года
      },
      {
        code: 'SUMMER25',
        discount: 25,
        active: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Годен в течение 90 дней
      }
    ];
    await PromoCode.insertMany(initialPromoCodes);
    console.log('Начальные промокоды добавлены');
  }
};

// Вызов инициализации данных при запуске
initializeData().catch(err => console.error('Ошибка инициализации данных:', err));

// API эндпоинты

// Получение всех блюд
app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await Dish.find();
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении блюд' });
  }
});

// Получение конкретного блюда по ID
app.get('/api/dishes/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    res.json(dish);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении информации о блюде' });
  }
});

// Получение отзывов для блюда
app.get('/api/dishes/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ dish: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
});

// Добавление отзыва
app.post('/api/dishes/:id/reviews', async (req, res) => {
  try {
    const { userName, rating, comment } = req.body;
    const dishId = req.params.id;
    
    // Проверяем, существует ли блюдо
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    
    // Создаем новый отзыв
    const review = new Review({
      dish: dishId,
      userName,
      rating,
      comment
    });
    
    await review.save();
    
    // Обновляем средний рейтинг блюда
    const reviews = await Review.find({ dish: dishId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    dish.rating = parseFloat(averageRating.toFixed(1));
    dish.reviewCount = reviews.length;
    await dish.save();
    
    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error('Ошибка при добавлении отзыва:', err);
    res.status(500).json({ error: 'Ошибка при добавлении отзыва' });
  }
});

// Проверка промокода
app.post('/api/promo-check', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Проверяем существование промокода
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      active: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    if (!promoCode) {
      return res.status(404).json({ valid: false, error: 'Промокод недействителен или истек срок действия' });
    }
    
    res.json({ 
      valid: true, 
      discount: promoCode.discount,
      message: `Промокод применен! Скидка ${promoCode.discount}%` 
    });
  } catch (err) {
    console.error('Ошибка при проверке промокода:', err);
    res.status(500).json({ valid: false, error: 'Ошибка при проверке промокода' });
  }
});

// Создание нового заказа
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, email, address, phone, items, totalAmount, promoCode, discountAmount } = req.body;
    
    // Генерация уникального номера заказа (6 цифр)
    const orderNumber = crypto.randomInt(100000, 1000000).toString();
    
    const newOrder = new Order({
      orderNumber,
      customerName,
      email,
      address,
      phone,
      items,
      totalAmount,
      promoCode: promoCode || null,
      discountAmount: discountAmount || 0,
      finalAmount: totalAmount - (discountAmount || 0)
    });
    
    await newOrder.save();
    res.status(201).json({ 
      success: true, 
      orderNumber, 
      message: 'Заказ успешно создан' 
    });
  } catch (err) {
    console.error('Ошибка при создании заказа:', err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// Получение информации о заказе по номеру
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении информации о заказе' });
  }
});

// Получение всех заказов (для админ-панели)
app.get('/api/admin/orders', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  Order.find().sort({ createdAt: -1 })
    .then(orders => res.json(orders))
    .catch(err => res.status(500).json({ error: 'Ошибка при получении заказов' }));
});

// Обновление статуса заказа (для админ-панели)
app.put('/api/admin/orders/:id', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  const { status } = req.body;
  Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .then(order => {
      if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }
      res.json(order);
    })
    .catch(err => res.status(500).json({ error: 'Ошибка при обновлении статуса заказа' }));
});

// Удаление заказа (для админ-панели)
app.delete('/api/admin/orders/:id', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  Order.findByIdAndDelete(req.params.id)
    .then(order => {
      if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }
      res.json({ success: true, message: 'Заказ успешно удален' });
    })
    .catch(err => res.status(500).json({ error: 'Ошибка при удалении заказа' }));
});

// Получение всех промокодов (для админ-панели)
app.get('/api/admin/promo-codes', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  PromoCode.find().sort({ createdAt: -1 })
    .then(promoCodes => res.json(promoCodes))
    .catch(err => res.status(500).json({ error: 'Ошибка при получении промокодов' }));
});

// Создание нового промокода (для админ-панели)
app.post('/api/admin/promo-codes', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  const { code, discount, expiresAt } = req.body;
  
  // Преобразуем в верхний регистр для единообразия
  const formattedCode = code.toUpperCase();
  
  const newPromoCode = new PromoCode({
    code: formattedCode,
    discount,
    expiresAt: expiresAt || null
  });
  
  newPromoCode.save()
    .then(promoCode => res.status(201).json(promoCode))
    .catch(err => {
      if (err.code === 11000) { // Ошибка уникальности (дубликат)
        return res.status(400).json({ error: 'Промокод с таким кодом уже существует' });
      }
      res.status(500).json({ error: 'Ошибка при создании промокода' });
    });
});

// Деактивация/активация промокода (для админ-панели)
app.put('/api/admin/promo-codes/:id', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  const { active } = req.body;
  
  PromoCode.findByIdAndUpdate(req.params.id, { active }, { new: true })
    .then(promoCode => {
      if (!promoCode) {
        return res.status(404).json({ error: 'Промокод не найден' });
      }
      res.json(promoCode);
    })
    .catch(err => res.status(500).json({ error: 'Ошибка при обновлении промокода' }));
});

// Удаление промокода (для админ-панели)
app.delete('/api/admin/promo-codes/:id', (req, res) => {
  // Простая проверка аутентификации
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  
  PromoCode.findByIdAndDelete(req.params.id)
    .then(promoCode => {
      if (!promoCode) {
        return res.status(404).json({ error: 'Промокод не найден' });
      }
      res.json({ success: true, message: 'Промокод успешно удален' });
    })
    .catch(err => res.status(500).json({ error: 'Ошибка при удалении промокода' }));
});

// Авторизация администратора
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Простая статическая авторизация
  if (username === 'admin' && password === '12345') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Неверные учетные данные' });
  }
});

// Проверка статуса авторизации администратора
app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

// Выход из админ-панели
app.post('/api/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

// Маршрутизация для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});