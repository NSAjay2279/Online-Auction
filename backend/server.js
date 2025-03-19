const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const app = express();

// Environment variables with fallbacks
const SECRET_KEY = process.env.SECRET_KEY || 'my_super_secret_123!';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auctionDB';
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

// Password validation
const validatePassword = (password) => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password);
};

// Connect to MongoDB with proper error handling
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema with timestamps
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  password: { 
    type: String, 
    required: true 
  },
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Auction Item Schema with improved validation
const auctionItemSchema = new mongoose.Schema({
  itemName: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  currentBid: { 
    type: Number, 
    required: true,
    min: 0 
  },
  highestBidder: { 
    type: String,
    default: '' 
  },
  closingTime: { 
    type: Date,
    required: true 
  },
  isClosed: { 
    type: Boolean, 
    default: false 
  },
  seller: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true
});

const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

// Enhanced authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Signup Route with enhanced validation
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password required',
        errors: {
          username: !username ? 'Username is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters long' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers' 
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      username: newUser.username
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Signin Route with proper password comparison
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Signin successful', 
      token,
      username: user.username
    });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Create Auction Item (Protected) with enhanced validation
app.post('/auction', authenticate, async (req, res) => {
  try {
    const { itemName, description, startingBid, closingTime } = req.body;

    // Input validation
    if (!itemName || !description || !startingBid || !closingTime) {
      return res.status(400).json({ 
        message: 'All fields are required',
        errors: {
          itemName: !itemName ? 'Item name is required' : null,
          description: !description ? 'Description is required' : null,
          startingBid: !startingBid ? 'Starting bid is required' : null,
          closingTime: !closingTime ? 'Closing time is required' : null
        }
      });
    }

    if (startingBid < 0) {
      return res.status(400).json({ message: 'Starting bid cannot be negative' });
    }

    if (new Date(closingTime) <= new Date()) {
      return res.status(400).json({ message: 'Closing time must be in the future' });
    }

    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: '',
      closingTime,
      seller: req.user.username
    });

    await newItem.save();
    res.status(201).json({ 
      message: 'Auction item created',
      item: newItem 
    });
  } catch (error) {
    console.error('Auction Post Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all auction items with optional filters
app.get('/auctions', async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};
    
    if (active === 'true') {
      query.isClosed = false;
      query.closingTime = { $gt: new Date() };
    }

    const auctions = await AuctionItem.find(query)
      .sort({ closingTime: 1 });
    
    res.json(auctions);
  } catch (error) {
    console.error('Fetching Auctions Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get a single auction item by ID with improved error handling
app.get('/auctions/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid auction ID format' });
    }

    const auctionItem = await AuctionItem.findById(req.params.id);
    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auctionItem);
  } catch (error) {
    console.error('Fetching Auction Item Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Bidding on an item (Protected) with enhanced validation
app.post('/bid/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid auction ID format' });
    }

    if (!bid || typeof bid !== 'number') {
      return res.status(400).json({ message: 'Valid bid amount required' });
    }

    const item = await AuctionItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Auction item not found' });
    }

    if (item.seller === req.user.username) {
      return res.status(400).json({ message: 'Cannot bid on your own auction' });
    }

    if (item.isClosed) {
      return res.status(400).json({ message: 'Auction is closed' });
    }

    if (new Date() > new Date(item.closingTime)) {
      item.isClosed = true;
      await item.save();
      return res.json({ 
        message: 'Auction closed',
        winner: item.highestBidder || 'No winner' 
      });
    }

    if (bid <= item.currentBid) {
      return res.status(400).json({ 
        message: 'Bid too low',
        currentBid: item.currentBid 
      });
    }

    item.currentBid = bid;
    item.highestBidder = req.user.username;
    await item.save();

    res.json({ 
      message: 'Bid successful',
      item 
    });
  } catch (error) {
    console.error('Bidding Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
