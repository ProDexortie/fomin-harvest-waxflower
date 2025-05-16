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
  image: { type: String, default: '/images/default-dish.jpg' }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Принят', 'Готовится', 'В доставке', 'Доставлен'], default: 'Принят' },
  createdAt: { type: Date, default: Date.now }
});

const Dish = mongoose.model('Dish', dishSchema);
const Order = mongoose.model('Order', orderSchema);

// Начальные данные для блюд (если база пуста)
const initializeData = async () => {
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

// Создание нового заказа
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, address, phone, items, totalAmount } = req.body;
    
    // Генерация уникального номера заказа (6 цифр)
    const orderNumber = crypto.randomInt(100000, 1000000).toString();
    
    const newOrder = new Order({
      orderNumber,
      customerName,
      address,
      phone,
      items,
      totalAmount
    });
    
    await newOrder.save();
    res.status(201).json({ 
      success: true, 
      orderNumber, 
      message: 'Заказ успешно создан' 
    });
  } catch (err) {
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