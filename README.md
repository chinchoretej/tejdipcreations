# TejDipCreations — Handcrafted Art & Decor E-Commerce

A modern, responsive e-commerce web app for handcrafted products like nose pins, hair pins, decorative plates, and pots. Built with vanilla HTML/CSS/JavaScript and Firebase.

## Features

- **Home Page** — Hero section, category cards, featured products
- **Product Listing** — Filter by category, responsive grid
- **Product Details** — Image gallery, video preview, star ratings, buy button
- **Checkout** — Customer form, UPI QR code payment, order confirmation
- **Admin Panel** — Login with Firebase Auth, add/delete products, view orders

## Project Structure

```
TejDipCreations/
├── index.html            # Home page
├── products.html         # Product listing with filters
├── product.html          # Single product detail
├── checkout.html         # Checkout / Buy Now flow
├── admin/
│   ├── index.html        # Admin login
│   └── dashboard.html    # Admin dashboard
├── css/
│   └── style.css         # All styles
├── js/
│   ├── firebase-config.js  # Firebase setup (edit this!)
│   ├── utils.js            # Shared utilities
│   ├── app.js              # Home page logic
│   ├── products.js         # Product listing logic
│   ├── product-detail.js   # Product detail logic
│   ├── checkout.js         # Checkout logic
│   ├── admin-auth.js       # Admin login logic
│   └── admin-dashboard.js  # Admin dashboard logic
└── assets/               # Static assets
```

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** and follow the setup wizard
3. Once created, go to **Project Settings > General > Your apps**
4. Click the web icon (`</>`) to register a web app
5. Copy the `firebaseConfig` object

### 2. Configure Firebase in the App

Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 3. Enable Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location and click **Enable**

### 4. Enable Authentication

1. Go to **Build > Authentication**
2. Click **Get started**
3. Enable **Email/Password** sign-in method
4. Go to the **Users** tab and click **Add user**
5. Add your admin credentials (e.g., `admin@tejdipcreations.com` / `your-password`)

### 5. Update UPI Payment Details

In `js/checkout.js`, find the UPI link and replace `9168140277@ybl` with your actual UPI ID:

```javascript
const upiLink = `upi://pay?pa=YOUR_UPI_ID@bank&pn=TejDipCreations&am=${currentProduct.price}&cu=INR`;
```

Also update the default QR code URL in `checkout.html`.

### 6. Deploy to GitHub Pages

1. Create a GitHub repository
2. Push all files to the `main` branch
3. Go to **Settings > Pages**
4. Under Source, select **Deploy from a branch** > `main` / `/ (root)`
5. Your site will be live at `https://yourusername.github.io/TejDipCreations/`

## Firestore Security Rules (Production)

For production, update your Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /trash/{trashId} {
      allow read, write: if request.auth != null;
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Hosting**: GitHub Pages compatible (static files)
- **Fonts**: Google Fonts (Inter)
- **QR Codes**: goqr.me API

## License

This project is for personal/commercial use by TejDipCreations.
