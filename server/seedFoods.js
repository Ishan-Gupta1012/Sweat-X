require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('./models/Food');

const MONGODB_URI = process.env.MONGODB_URI;

// Indian Foods Database
const indianFoods = [
    // BREAKFAST
    { name: 'Poha', nameHindi: 'पोहा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 110, proteinPer100g: 2.5, carbsPer100g: 23, fatsPer100g: 1.5, defaultServing: 'bowl', servingDescription: '1 medium bowl', keywords: ['poha', 'flattened rice'] },
    { name: 'Upma', nameHindi: 'उपमा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 130, proteinPer100g: 3.5, carbsPer100g: 22, fatsPer100g: 3, defaultServing: 'bowl', keywords: ['upma', 'semolina'] },
    { name: 'Idli', nameHindi: 'इडली', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 58, proteinPer100g: 2, carbsPer100g: 12, fatsPer100g: 0.2, defaultServing: 'piece', keywords: ['idli', 'rice cake'], servingSizes: { piece: 40 } },
    { name: 'Dosa', nameHindi: 'डोसा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 168, proteinPer100g: 4, carbsPer100g: 28, fatsPer100g: 4.5, defaultServing: 'piece', keywords: ['dosa', 'crepe'], servingSizes: { piece: 80 } },
    { name: 'Masala Dosa', nameHindi: 'मसाला डोसा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 175, proteinPer100g: 4, carbsPer100g: 26, fatsPer100g: 6, defaultServing: 'piece', servingSizes: { piece: 150 } },
    { name: 'Aloo Paratha', nameHindi: 'आलू पराठा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 260, proteinPer100g: 6, carbsPer100g: 35, fatsPer100g: 11, defaultServing: 'paratha', keywords: ['paratha', 'stuffed'] },
    { name: 'Plain Paratha', nameHindi: 'सादा पराठा', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 280, proteinPer100g: 7, carbsPer100g: 40, fatsPer100g: 10, defaultServing: 'paratha' },
    { name: 'Puri', nameHindi: 'पूरी', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 6, carbsPer100g: 45, fatsPer100g: 16, defaultServing: 'piece', servingSizes: { piece: 25 } },
    { name: 'Chole Bhature', nameHindi: 'छोले भटूरे', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 185, proteinPer100g: 8, carbsPer100g: 30, fatsPer100g: 12, defaultServing: 'plate', servingDescription: '2 Bhature + 1 Katori Chole' },
    { name: 'Thepla', nameHindi: 'थेपला', category: 'breakfast', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 290, proteinPer100g: 8, carbsPer100g: 38, fatsPer100g: 12, defaultServing: 'piece', servingSizes: { piece: 35 } },

    // DALS
    { name: 'Dal Makhani', nameHindi: 'दाल मखनी', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 130, proteinPer100g: 5, carbsPer100g: 14, fatsPer100g: 6, defaultServing: 'katori', keywords: ['dal', 'lentils', 'creamy'] },
    { name: 'Toor Dal', nameHindi: 'तुअर दाल', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 105, proteinPer100g: 7, carbsPer100g: 15, fatsPer100g: 2, defaultServing: 'katori' },
    { name: 'Chana Dal', nameHindi: 'चना दाल', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 115, proteinPer100g: 8, carbsPer100g: 16, fatsPer100g: 2, defaultServing: 'katori' },
    { name: 'Moong Dal', nameHindi: 'मूंग दाल', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 95, proteinPer100g: 7, carbsPer100g: 13, fatsPer100g: 1.5, defaultServing: 'katori' },
    { name: 'Masoor Dal', nameHindi: 'मसूर दाल', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 100, proteinPer100g: 7.5, carbsPer100g: 14, fatsPer100g: 1, defaultServing: 'katori' },
    { name: 'Dal Fry', nameHindi: 'दाल फ्राई', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 120, proteinPer100g: 6, carbsPer100g: 14, fatsPer100g: 4.5, defaultServing: 'katori' },
    { name: 'Dal Tadka', nameHindi: 'दाल तड़का', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 118, proteinPer100g: 6.5, carbsPer100g: 13, fatsPer100g: 4, defaultServing: 'katori' },

    // CURRIES - VEG
    { name: 'Rajma', nameHindi: 'राजमा', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 125, proteinPer100g: 8, carbsPer100g: 18, fatsPer100g: 2.5, defaultServing: 'katori', keywords: ['kidney beans'] },
    { name: 'Chole', nameHindi: 'छोले', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 140, proteinPer100g: 9, carbsPer100g: 20, fatsPer100g: 3, defaultServing: 'katori', servingDescription: '1 medium katori', keywords: ['chickpea curry'] },
    { name: 'Kadhi Pakora', nameHindi: 'कढ़ी पकोड़ा', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 95, proteinPer100g: 4, carbsPer100g: 8, fatsPer100g: 5, defaultServing: 'katori' },
    { name: 'Paneer Butter Masala', nameHindi: 'पनीर बटर मसाला', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 220, proteinPer100g: 12, carbsPer100g: 8, fatsPer100g: 16, defaultServing: 'katori' },
    { name: 'Shahi Paneer', nameHindi: 'शाही पनीर', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 245, proteinPer100g: 14, carbsPer100g: 7, fatsPer100g: 18, defaultServing: 'katori' },
    { name: 'Palak Paneer', nameHindi: 'पालक पनीर', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 180, proteinPer100g: 11, carbsPer100g: 6, fatsPer100g: 13, defaultServing: 'katori' },
    { name: 'Matar Paneer', nameHindi: 'मटर पनीर', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 195, proteinPer100g: 12, carbsPer100g: 10, fatsPer100g: 13, defaultServing: 'katori' },
    { name: 'Aloo Gobi', nameHindi: 'आलू गोभी', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 90, proteinPer100g: 2.5, carbsPer100g: 12, fatsPer100g: 4, defaultServing: 'katori' },
    { name: 'Bhindi Masala', nameHindi: 'भिंडी मसाला', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 85, proteinPer100g: 2, carbsPer100g: 8, fatsPer100g: 5, defaultServing: 'katori' },
    { name: 'Baingan Bharta', nameHindi: 'बैंगन भर्ता', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 75, proteinPer100g: 2, carbsPer100g: 7, fatsPer100g: 4.5, defaultServing: 'katori' },
    { name: 'Aloo Matar', nameHindi: 'आलू मटर', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 95, proteinPer100g: 3, carbsPer100g: 14, fatsPer100g: 3, defaultServing: 'katori' },
    { name: 'Mix Veg Curry', nameHindi: 'मिक्स वेज', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 85, proteinPer100g: 3, carbsPer100g: 10, fatsPer100g: 4, defaultServing: 'katori' },

    // NON-VEG CURRIES
    { name: 'Butter Chicken', nameHindi: 'बटर चिकन', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 240, proteinPer100g: 18, carbsPer100g: 8, fatsPer100g: 15, defaultServing: 'katori' },
    { name: 'Chicken Curry', nameHindi: 'चिकन करी', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 185, proteinPer100g: 20, carbsPer100g: 5, fatsPer100g: 10, defaultServing: 'katori' },
    { name: 'Kadai Chicken', nameHindi: 'कड़ाई चिकन', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 195, proteinPer100g: 19, carbsPer100g: 6, fatsPer100g: 11, defaultServing: 'katori' },
    { name: 'Chicken Tikka Masala', nameHindi: 'चिकन टिक्का मसाला', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 210, proteinPer100g: 17, carbsPer100g: 7, fatsPer100g: 13, defaultServing: 'katori' },
    { name: 'Mutton Curry', nameHindi: 'मटन करी', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 250, proteinPer100g: 22, carbsPer100g: 4, fatsPer100g: 16, defaultServing: 'katori' },
    { name: 'Rogan Josh', nameHindi: 'रोगन जोश', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 245, proteinPer100g: 21, carbsPer100g: 5, fatsPer100g: 15, defaultServing: 'katori' },
    { name: 'Fish Curry', nameHindi: 'मछली करी', category: 'dinner', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 145, proteinPer100g: 18, carbsPer100g: 4, fatsPer100g: 6, defaultServing: 'katori' },
    { name: 'Egg Curry', nameHindi: 'अंडा करी', category: 'lunch', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 155, proteinPer100g: 12, carbsPer100g: 5, fatsPer100g: 10, defaultServing: 'katori' },

    // RICE DISHES
    { name: 'Jeera Rice', nameHindi: 'जीरा राइस', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 145, proteinPer100g: 3, carbsPer100g: 28, fatsPer100g: 2.5, defaultServing: 'katori' },
    { name: 'Plain Rice', nameHindi: 'सादा चावल', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, defaultServing: 'katori' },
    { name: 'Veg Pulao', nameHindi: 'वेज पुलाव', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 155, proteinPer100g: 3.5, carbsPer100g: 26, fatsPer100g: 4, defaultServing: 'katori' },
    { name: 'Veg Biryani', nameHindi: 'वेज बिरयानी', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 170, proteinPer100g: 4, carbsPer100g: 28, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Chicken Biryani', nameHindi: 'चिकन बिरयानी', category: 'lunch', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 200, proteinPer100g: 12, carbsPer100g: 25, fatsPer100g: 6, defaultServing: 'plate' },
    { name: 'Mutton Biryani', nameHindi: 'मटन बिरयानी', category: 'lunch', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 230, proteinPer100g: 14, carbsPer100g: 24, fatsPer100g: 9, defaultServing: 'plate' },
    { name: 'Egg Biryani', nameHindi: 'अंडा बिरयानी', category: 'lunch', cuisine: 'indian', isVegetarian: false, caloriesPer100g: 185, proteinPer100g: 9, carbsPer100g: 26, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Khichdi', nameHindi: 'खिचड़ी', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 115, proteinPer100g: 4, carbsPer100g: 20, fatsPer100g: 2, defaultServing: 'bowl' },

    // BREADS
    { name: 'Roti', nameHindi: 'रोटी', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 264, proteinPer100g: 9, carbsPer100g: 52, fatsPer100g: 3, defaultServing: 'roti', servingDescription: '1 medium phulka', keywords: ['chapati'] },
    { name: 'Naan', nameHindi: 'नान', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 310, proteinPer100g: 9, carbsPer100g: 50, fatsPer100g: 8, defaultServing: 'piece', servingSizes: { piece: 90 } },
    { name: 'Butter Naan', nameHindi: 'बटर नान', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 9, carbsPer100g: 48, fatsPer100g: 13, defaultServing: 'piece', servingSizes: { piece: 100 } },
    { name: 'Garlic Naan', nameHindi: 'गार्लिक नान', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 330, proteinPer100g: 10, carbsPer100g: 48, fatsPer100g: 11, defaultServing: 'piece', servingSizes: { piece: 95 } },
    { name: 'Tandoori Roti', nameHindi: 'तंदूरी रोटी', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 275, proteinPer100g: 9, carbsPer100g: 54, fatsPer100g: 3, defaultServing: 'piece', servingSizes: { piece: 50 } },
    { name: 'Missi Roti', nameHindi: 'मिस्सी रोटी', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 285, proteinPer100g: 11, carbsPer100g: 45, fatsPer100g: 7, defaultServing: 'piece', servingSizes: { piece: 60 } },

    // SNACKS
    { name: 'Samosa', nameHindi: 'समोसा', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 310, proteinPer100g: 5, carbsPer100g: 32, fatsPer100g: 18, defaultServing: 'piece', servingSizes: { piece: 80 } },
    { name: 'Pakora', nameHindi: 'पकोड़ा', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 280, proteinPer100g: 6, carbsPer100g: 28, fatsPer100g: 16, defaultServing: 'piece', servingSizes: { piece: 25 } },
    { name: 'Bhel Puri', nameHindi: 'भेल पूरी', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 160, proteinPer100g: 4, carbsPer100g: 28, fatsPer100g: 4, defaultServing: 'bowl', servingSizes: { bowl: 150 } },
    { name: 'Pani Puri', nameHindi: 'पानी पूरी', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 135, proteinPer100g: 3, carbsPer100g: 22, fatsPer100g: 4, defaultServing: 'piece', servingSizes: { piece: 20 }, keywords: ['golgappa'] },
    { name: 'Vada Pav', nameHindi: 'वड़ा पाव', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 290, proteinPer100g: 6, carbsPer100g: 38, fatsPer100g: 12, defaultServing: 'piece', servingSizes: { piece: 150 } },
    { name: 'Dhokla', nameHindi: 'ढोकला', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 145, proteinPer100g: 6, carbsPer100g: 24, fatsPer100g: 3, defaultServing: 'piece', servingSizes: { piece: 40 } },
    { name: 'Kachori', nameHindi: 'कचौरी', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 7, carbsPer100g: 35, fatsPer100g: 20, defaultServing: 'piece', servingSizes: { piece: 60 } },
    { name: 'Aloo Tikki', nameHindi: 'आलू टिक्की', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 175, proteinPer100g: 3, carbsPer100g: 22, fatsPer100g: 8, defaultServing: 'piece', servingSizes: { piece: 80 } },

    // SWEETS
    { name: 'Gulab Jamun', nameHindi: 'गुलाब जामुन', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 320, proteinPer100g: 4, carbsPer100g: 50, fatsPer100g: 12, defaultServing: 'piece', servingSizes: { piece: 40 } },
    { name: 'Rasgulla', nameHindi: 'रसगुल्ला', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 185, proteinPer100g: 5, carbsPer100g: 38, fatsPer100g: 2, defaultServing: 'piece', servingSizes: { piece: 50 } },
    { name: 'Jalebi', nameHindi: 'जलेबी', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 380, proteinPer100g: 2, carbsPer100g: 60, fatsPer100g: 15, defaultServing: 'piece', servingSizes: { piece: 30 } },
    { name: 'Ladoo', nameHindi: 'लड्डू', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 420, proteinPer100g: 8, carbsPer100g: 55, fatsPer100g: 20, defaultServing: 'piece', servingSizes: { piece: 40 } },
    { name: 'Kheer', nameHindi: 'खीर', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 140, proteinPer100g: 4, carbsPer100g: 22, fatsPer100g: 4.5, defaultServing: 'katori' },
    { name: 'Halwa', nameHindi: 'हलवा', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 280, proteinPer100g: 3, carbsPer100g: 35, fatsPer100g: 14, defaultServing: 'katori' },
    { name: 'Gajar Halwa', nameHindi: 'गाजर हलवा', category: 'dessert', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 215, proteinPer100g: 4, carbsPer100g: 28, fatsPer100g: 10, defaultServing: 'katori' },

    // BEVERAGES
    { name: 'Chai', nameHindi: 'चाय', category: 'beverage', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 35, proteinPer100g: 1, carbsPer100g: 5, fatsPer100g: 1.2, defaultServing: 'cup', keywords: ['tea'] },
    { name: 'Lassi', nameHindi: 'लस्सी', category: 'beverage', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 75, proteinPer100g: 3, carbsPer100g: 12, fatsPer100g: 2, defaultServing: 'glass' },
    { name: 'Mango Lassi', nameHindi: 'आम लस्सी', category: 'beverage', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 95, proteinPer100g: 3, carbsPer100g: 16, fatsPer100g: 2.5, defaultServing: 'glass' },
    { name: 'Buttermilk', nameHindi: 'छाछ', category: 'beverage', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 40, proteinPer100g: 3, carbsPer100g: 5, fatsPer100g: 1, defaultServing: 'glass', keywords: ['chaas'] },
    { name: 'Nimbu Pani', nameHindi: 'नींबू पानी', category: 'beverage', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 25, proteinPer100g: 0.1, carbsPer100g: 6, fatsPer100g: 0, defaultServing: 'glass', keywords: ['lemonade'] },

    // ACCOMPANIMENTS
    { name: 'Raita', nameHindi: 'रायता', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 65, proteinPer100g: 3, carbsPer100g: 5, fatsPer100g: 4, defaultServing: 'katori' },
    { name: 'Papad', nameHindi: 'पापड़', category: 'snack', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 18, carbsPer100g: 45, fatsPer100g: 10, defaultServing: 'piece', servingSizes: { piece: 15 } },
    { name: 'Pickle', nameHindi: 'अचार', category: 'lunch', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 180, proteinPer100g: 2, carbsPer100g: 8, fatsPer100g: 15, defaultServing: 'spoon' },
];

// Foreign Foods
const foreignFoods = [
    // ITALIAN
    { name: 'Pasta Alfredo', category: 'dinner', cuisine: 'italian', isVegetarian: true, caloriesPer100g: 180, proteinPer100g: 6, carbsPer100g: 22, fatsPer100g: 8, defaultServing: 'plate' },
    { name: 'Spaghetti Bolognese', category: 'dinner', cuisine: 'italian', isVegetarian: false, caloriesPer100g: 160, proteinPer100g: 8, carbsPer100g: 20, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Margherita Pizza', category: 'dinner', cuisine: 'italian', isVegetarian: true, caloriesPer100g: 250, proteinPer100g: 11, carbsPer100g: 28, fatsPer100g: 10, defaultServing: 'slice', servingSizes: { slice: 100 } },
    { name: 'Pepperoni Pizza', category: 'dinner', cuisine: 'italian', isVegetarian: false, caloriesPer100g: 280, proteinPer100g: 12, carbsPer100g: 26, fatsPer100g: 13, defaultServing: 'slice', servingSizes: { slice: 100 } },
    { name: 'Lasagna', category: 'dinner', cuisine: 'italian', isVegetarian: false, caloriesPer100g: 165, proteinPer100g: 10, carbsPer100g: 15, fatsPer100g: 7, defaultServing: 'piece', servingSizes: { piece: 200 } },
    { name: 'Garlic Bread', category: 'snack', cuisine: 'italian', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 8, carbsPer100g: 42, fatsPer100g: 16, defaultServing: 'slice', servingSizes: { slice: 40 } },

    // AMERICAN
    { name: 'Burger', category: 'lunch', cuisine: 'american', isVegetarian: false, caloriesPer100g: 250, proteinPer100g: 14, carbsPer100g: 20, fatsPer100g: 12, defaultServing: 'piece', servingSizes: { piece: 200 }, keywords: ['hamburger'] },
    { name: 'Veggie Burger', category: 'lunch', cuisine: 'american', isVegetarian: true, caloriesPer100g: 200, proteinPer100g: 10, carbsPer100g: 24, fatsPer100g: 8, defaultServing: 'piece', servingSizes: { piece: 180 } },
    { name: 'French Fries', category: 'snack', cuisine: 'american', isVegetarian: true, caloriesPer100g: 312, proteinPer100g: 3, carbsPer100g: 41, fatsPer100g: 15, defaultServing: 'bowl' },
    { name: 'Hot Dog', category: 'snack', cuisine: 'american', isVegetarian: false, caloriesPer100g: 290, proteinPer100g: 11, carbsPer100g: 24, fatsPer100g: 17, defaultServing: 'piece', servingSizes: { piece: 100 } },
    { name: 'Grilled Chicken Sandwich', category: 'lunch', cuisine: 'american', isVegetarian: false, caloriesPer100g: 195, proteinPer100g: 18, carbsPer100g: 18, fatsPer100g: 6, defaultServing: 'piece', servingSizes: { piece: 200 } },
    { name: 'Caesar Salad', category: 'lunch', cuisine: 'american', isVegetarian: true, caloriesPer100g: 95, proteinPer100g: 4, carbsPer100g: 5, fatsPer100g: 7, defaultServing: 'bowl' },
    { name: 'Pancakes', category: 'breakfast', cuisine: 'american', isVegetarian: true, caloriesPer100g: 225, proteinPer100g: 6, carbsPer100g: 35, fatsPer100g: 7, defaultServing: 'piece', servingSizes: { piece: 75 } },
    { name: 'Waffles', category: 'breakfast', cuisine: 'american', isVegetarian: true, caloriesPer100g: 290, proteinPer100g: 8, carbsPer100g: 38, fatsPer100g: 12, defaultServing: 'piece', servingSizes: { piece: 90 } },

    // CHINESE
    { name: 'Fried Rice', category: 'lunch', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 165, proteinPer100g: 4, carbsPer100g: 28, fatsPer100g: 4, defaultServing: 'plate' },
    { name: 'Chicken Fried Rice', category: 'lunch', cuisine: 'chinese', isVegetarian: false, caloriesPer100g: 185, proteinPer100g: 10, carbsPer100g: 26, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Veg Noodles', category: 'lunch', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 150, proteinPer100g: 4, carbsPer100g: 25, fatsPer100g: 4, defaultServing: 'plate', keywords: ['hakka noodles'] },
    { name: 'Chicken Noodles', category: 'lunch', cuisine: 'chinese', isVegetarian: false, caloriesPer100g: 170, proteinPer100g: 10, carbsPer100g: 24, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Manchurian', category: 'dinner', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 185, proteinPer100g: 5, carbsPer100g: 18, fatsPer100g: 10, defaultServing: 'katori' },
    { name: 'Spring Roll', category: 'snack', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 265, proteinPer100g: 5, carbsPer100g: 28, fatsPer100g: 14, defaultServing: 'piece', servingSizes: { piece: 40 } },
    { name: 'Momos', category: 'snack', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 160, proteinPer100g: 6, carbsPer100g: 22, fatsPer100g: 5, defaultServing: 'piece', servingSizes: { piece: 25 }, keywords: ['dumpling'] },
    { name: 'Chicken Momos', category: 'snack', cuisine: 'chinese', isVegetarian: false, caloriesPer100g: 180, proteinPer100g: 10, carbsPer100g: 20, fatsPer100g: 6, defaultServing: 'piece', servingSizes: { piece: 30 } },
    { name: 'Sweet Corn Soup', category: 'dinner', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 55, proteinPer100g: 2, carbsPer100g: 10, fatsPer100g: 1, defaultServing: 'bowl' },
    { name: 'Hot and Sour Soup', category: 'dinner', cuisine: 'chinese', isVegetarian: true, caloriesPer100g: 45, proteinPer100g: 2, carbsPer100g: 6, fatsPer100g: 1.5, defaultServing: 'bowl' },

    // MEXICAN
    { name: 'Burrito', category: 'lunch', cuisine: 'mexican', isVegetarian: false, caloriesPer100g: 175, proteinPer100g: 9, carbsPer100g: 22, fatsPer100g: 6, defaultServing: 'piece', servingSizes: { piece: 300 } },
    { name: 'Tacos', category: 'snack', cuisine: 'mexican', isVegetarian: false, caloriesPer100g: 210, proteinPer100g: 10, carbsPer100g: 18, fatsPer100g: 11, defaultServing: 'piece', servingSizes: { piece: 100 } },
    { name: 'Nachos', category: 'snack', cuisine: 'mexican', isVegetarian: true, caloriesPer100g: 350, proteinPer100g: 8, carbsPer100g: 40, fatsPer100g: 18, defaultServing: 'bowl' },
    { name: 'Quesadilla', category: 'snack', cuisine: 'mexican', isVegetarian: true, caloriesPer100g: 280, proteinPer100g: 12, carbsPer100g: 25, fatsPer100g: 15, defaultServing: 'piece', servingSizes: { piece: 150 } },

    // JAPANESE
    { name: 'Sushi Roll', category: 'dinner', cuisine: 'japanese', isVegetarian: false, caloriesPer100g: 150, proteinPer100g: 6, carbsPer100g: 28, fatsPer100g: 1.5, defaultServing: 'piece', servingSizes: { piece: 30 } },
    { name: 'Ramen', category: 'dinner', cuisine: 'japanese', isVegetarian: false, caloriesPer100g: 95, proteinPer100g: 6, carbsPer100g: 12, fatsPer100g: 3, defaultServing: 'bowl' },
    { name: 'Teriyaki Chicken', category: 'dinner', cuisine: 'japanese', isVegetarian: false, caloriesPer100g: 190, proteinPer100g: 22, carbsPer100g: 10, fatsPer100g: 7, defaultServing: 'plate' },

    // THAI
    { name: 'Pad Thai', category: 'dinner', cuisine: 'thai', isVegetarian: false, caloriesPer100g: 165, proteinPer100g: 8, carbsPer100g: 22, fatsPer100g: 5, defaultServing: 'plate' },
    { name: 'Green Curry', category: 'dinner', cuisine: 'thai', isVegetarian: false, caloriesPer100g: 145, proteinPer100g: 10, carbsPer100g: 8, fatsPer100g: 9, defaultServing: 'katori' },
    { name: 'Tom Yum Soup', category: 'dinner', cuisine: 'thai', isVegetarian: false, caloriesPer100g: 35, proteinPer100g: 3, carbsPer100g: 3, fatsPer100g: 1.5, defaultServing: 'bowl' },

    // COMMON FOODS
    { name: 'Oats', category: 'breakfast', cuisine: 'other', isVegetarian: true, caloriesPer100g: 370, proteinPer100g: 13, carbsPer100g: 66, fatsPer100g: 7, defaultServing: 'bowl', servingSizes: { bowl: 40 } },
    { name: 'Cornflakes', category: 'breakfast', cuisine: 'other', isVegetarian: true, caloriesPer100g: 360, proteinPer100g: 7, carbsPer100g: 84, fatsPer100g: 0.5, defaultServing: 'bowl', servingSizes: { bowl: 30 } },
    { name: 'Bread', category: 'staple', cuisine: 'other', isVegetarian: true, caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatsPer100g: 3, defaultServing: 'slice', servingSizes: { slice: 30 } },
    { name: 'Eggs Boiled', category: 'breakfast', cuisine: 'other', isVegetarian: false, caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, defaultServing: 'piece', servingSizes: { piece: 50 } },
    { name: 'Eggs Scrambled', category: 'breakfast', cuisine: 'other', isVegetarian: false, caloriesPer100g: 170, proteinPer100g: 11, carbsPer100g: 2, fatsPer100g: 13, defaultServing: 'bowl' },
    { name: 'Omelette', category: 'breakfast', cuisine: 'other', isVegetarian: false, caloriesPer100g: 185, proteinPer100g: 12, carbsPer100g: 1.5, fatsPer100g: 15, defaultServing: 'piece', servingSizes: { piece: 100 } },
    { name: 'Milk', category: 'beverage', cuisine: 'other', isVegetarian: true, caloriesPer100g: 60, proteinPer100g: 3.2, carbsPer100g: 4.8, fatsPer100g: 3.2, defaultServing: 'glass' },
    { name: 'Coffee', category: 'beverage', cuisine: 'other', isVegetarian: true, caloriesPer100g: 2, proteinPer100g: 0.1, carbsPer100g: 0, fatsPer100g: 0, defaultServing: 'cup' },
    { name: 'Coffee with Milk', category: 'beverage', cuisine: 'other', isVegetarian: true, caloriesPer100g: 30, proteinPer100g: 1.5, carbsPer100g: 3, fatsPer100g: 1.5, defaultServing: 'cup' },
    { name: 'Banana', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, defaultServing: 'piece', servingSizes: { piece: 120 } },
    { name: 'Apple', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatsPer100g: 0.2, defaultServing: 'piece', servingSizes: { piece: 180 } },
    { name: 'Orange', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatsPer100g: 0.1, defaultServing: 'piece', servingSizes: { piece: 150 } },
    { name: 'Mango', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatsPer100g: 0.4, defaultServing: 'piece', servingSizes: { piece: 200 } },
    { name: 'Grapes', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatsPer100g: 0.2, defaultServing: 'bowl', servingSizes: { bowl: 150 } },
    { name: 'Watermelon', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 8, fatsPer100g: 0.2, defaultServing: 'bowl', servingSizes: { bowl: 200 } },
    { name: 'Almonds', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, defaultServing: 'spoon', servingSizes: { spoon: 10 } },
    { name: 'Peanuts', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatsPer100g: 49, defaultServing: 'spoon', servingSizes: { spoon: 15 } },
    { name: 'Yogurt', category: 'snack', cuisine: 'other', isVegetarian: true, caloriesPer100g: 60, proteinPer100g: 4, carbsPer100g: 5, fatsPer100g: 3, defaultServing: 'katori', keywords: ['curd', 'dahi'] },
    { name: 'Paneer', category: 'staple', cuisine: 'indian', isVegetarian: true, caloriesPer100g: 265, proteinPer100g: 18, carbsPer100g: 3, fatsPer100g: 21, defaultServing: 'piece', servingSizes: { piece: 50 }, keywords: ['cottage cheese'] },
    { name: 'Chicken Breast', category: 'staple', cuisine: 'other', isVegetarian: false, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, defaultServing: 'piece', servingSizes: { piece: 150 } },
    { name: 'Fish Grilled', category: 'dinner', cuisine: 'other', isVegetarian: false, caloriesPer100g: 130, proteinPer100g: 26, carbsPer100g: 0, fatsPer100g: 3, defaultServing: 'piece', servingSizes: { piece: 150 } },
    { name: 'Protein Shake', category: 'beverage', cuisine: 'other', isVegetarian: true, caloriesPer100g: 120, proteinPer100g: 20, carbsPer100g: 5, fatsPer100g: 2, defaultServing: 'glass', keywords: ['whey'] },
];

const allFoods = [...indianFoods, ...foreignFoods];

async function seedFoods() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing foods
        await Food.deleteMany({});
        console.log('🗑️ Cleared existing foods');

        // Insert foods with popularity scores
        const foodsWithPopularity = allFoods.map((food, index) => ({
            ...food,
            popularity: allFoods.length - index, // First items more popular
        }));

        await Food.insertMany(foodsWithPopularity);
        console.log(`✅ Seeded ${allFoods.length} foods (${indianFoods.length} Indian + ${foreignFoods.length} Foreign)`);

        await mongoose.disconnect();
        console.log('✅ Done! Database seeded successfully.');
    } catch (error) {
        console.error('❌ Error seeding foods:', error);
        process.exit(1);
    }
}

seedFoods();
