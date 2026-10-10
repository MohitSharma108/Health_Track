'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'nourish_local.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      users: [],
      profiles: [],
      nutritionGoals: [],
      meals: [],
      mealItems: [],
      weightLogs: [],
      waterLogs: [],
      favorites: [],
      notifications: [],
      notificationPreferences: [],
      recipes: [],
      customFoods: [],
      aiRecommendations: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return data;
  } catch (err) {
    console.warn('[LocalDB] Warning: Could not parse local DB file, initializing fresh store.', err.message);
    return {
      users: [],
      profiles: [],
      nutritionGoals: [],
      meals: [],
      mealItems: [],
      weightLogs: [],
      waterLogs: [],
      favorites: [],
      notifications: [],
      notificationPreferences: [],
      recipes: [],
      customFoods: [],
      aiRecommendations: [],
    };
  }
}

function saveDb(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[LocalDB] Error writing DB file:', err.message);
  }
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36));
}

// User Model
const user = {
  async findUnique({ where }) {
    const db = loadDb();
    if (where.id) return db.users.find(u => u.id === where.id) || null;
    if (where.email) return db.users.find(u => u.email.toLowerCase() === where.email.toLowerCase()) || null;
    return null;
  },
  async create({ data }) {
    const db = loadDb();
    const id = data.id || uuid();
    const newUser = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    db.users.push(newUser);

    if (data.profile && data.profile.create) {
      db.profiles.push({
        userId: id,
        name: data.profile.create.name || 'User',
        goal: 'maintain',
        diet: 'balanced',
        aiEnabled: true,
        waterGoalMl: 2000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    db.nutritionGoals.push({
      userId: id,
      calories: (data.goals && data.goals.create && data.goals.create.calories) || 2000,
      proteinG: (data.goals && data.goals.create && data.goals.create.proteinG) || 120,
      carbsG: (data.goals && data.goals.create && data.goals.create.carbsG) || 220,
      fatG: (data.goals && data.goals.create && data.goals.create.fatG) || 65,
      fibreG: (data.goals && data.goals.create && data.goals.create.fibreG) || 30,
      updatedAt: new Date().toISOString(),
    });

    if (data.notifPrefs && data.notifPrefs.create && Array.isArray(data.notifPrefs.create)) {
      for (const pref of data.notifPrefs.create) {
        db.notificationPreferences.push({
          id: uuid(),
          userId: id,
          type: pref.type,
          enabled: pref.enabled !== false,
        });
      }
    }

    saveDb(db);
    return newUser;
  },
  async update({ where, data }) {
    const db = loadDb();
    const u = db.users.find(x => (where.id && x.id === where.id) || (where.email && x.email.toLowerCase() === where.email.toLowerCase()));
    if (u) {
      Object.assign(u, data);
      saveDb(db);
      return u;
    }
    return null;
  },
  async delete({ where }) {
    const db = loadDb();
    const idx = db.users.findIndex(u => u.id === where.id);
    if (idx !== -1) {
      db.users.splice(idx, 1);
      db.profiles = db.profiles.filter(p => p.userId !== where.id);
      db.nutritionGoals = db.nutritionGoals.filter(g => g.userId !== where.id);
      db.meals = db.meals.filter(m => m.userId !== where.id);
      db.mealItems = db.mealItems.filter(i => i.userId !== where.id);
      db.weightLogs = db.weightLogs.filter(w => w.userId !== where.id);
      db.waterLogs = db.waterLogs.filter(w => w.userId !== where.id);
      db.favorites = db.favorites.filter(f => f.userId !== where.id);
      saveDb(db);
    }
    return { id: where.id };
  },
};

// Profile Model
const profile = {
  async findUnique({ where }) {
    const db = loadDb();
    return db.profiles.find(p => p.userId === where.userId) || null;
  },
  async upsert({ where, update, create }) {
    const db = loadDb();
    let p = db.profiles.find(x => x.userId === where.userId);
    if (p) {
      Object.assign(p, update, { updatedAt: new Date().toISOString() });
    } else {
      p = {
        userId: where.userId,
        name: create.name || 'User',
        goal: 'maintain',
        diet: 'balanced',
        aiEnabled: true,
        waterGoalMl: 2000,
        ...create,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.profiles.push(p);
    }
    saveDb(db);
    return p;
  },
  async update({ where, data }) {
    const db = loadDb();
    const p = db.profiles.find(x => x.userId === where.userId);
    if (p) {
      Object.assign(p, data, { updatedAt: new Date().toISOString() });
      saveDb(db);
      return p;
    }
    return this.upsert({ where, update: data, create: { userId: where.userId, ...data } });
  },
};

// NutritionGoal Model
const nutritionGoal = {
  async findUnique({ where }) {
    const db = loadDb();
    return db.nutritionGoals.find(g => g.userId === where.userId) || null;
  },
  async upsert({ where, update, create }) {
    const db = loadDb();
    let g = db.nutritionGoals.find(x => x.userId === where.userId);
    if (g) {
      Object.assign(g, update, { updatedAt: new Date().toISOString() });
    } else {
      g = {
        userId: where.userId,
        calories: 2000,
        proteinG: 120,
        carbsG: 220,
        fatG: 65,
        fibreG: 30,
        ...create,
        updatedAt: new Date().toISOString(),
      };
      db.nutritionGoals.push(g);
    }
    saveDb(db);
    return g;
  },
};

// Meal Model
const meal = {
  async findMany({ where = {}, include = {}, orderBy = [] }) {
    const db = loadDb();
    let list = db.meals.filter(m => {
      if (where.userId && m.userId !== where.userId) return false;
      if (where.deletedAt === null && m.deletedAt !== null) return false;
      if (where.date) {
        const dStr = typeof where.date === 'string' ? where.date : (where.date instanceof Date ? where.date.toISOString().slice(0, 10) : null);
        if (dStr && m.date !== dStr) return false;
        if (where.date.gte || where.date.lte) {
          const gteStr = where.date.gte ? (typeof where.date.gte === 'string' ? where.date.gte : where.date.gte.toISOString().slice(0, 10)) : null;
          const lteStr = where.date.lte ? (typeof where.date.lte === 'string' ? where.date.lte : where.date.lte.toISOString().slice(0, 10)) : null;
          if (gteStr && m.date < gteStr) return false;
          if (lteStr && m.date > lteStr) return false;
        }
      }
      return true;
    });

    if (include.items) {
      list = list.map(m => ({
        ...m,
        date: new Date(m.date + 'T00:00:00Z'),
        items: db.mealItems.filter(i => i.mealId === m.id),
      }));
    } else {
      list = list.map(m => ({ ...m, date: new Date(m.date + 'T00:00:00Z') }));
    }

    list.sort((a, b) => (b.date > a.date ? 1 : (b.date < a.date ? -1 : (a.time || '').localeCompare(b.time || ''))));
    return list;
  },
  async findFirst({ where = {}, include = {} }) {
    const list = await this.findMany({ where, include });
    return list[0] || null;
  },
  async findUnique({ where = {}, include = {} }) {
    const db = loadDb();
    const m = db.meals.find(x => x.id === where.id);
    if (!m) return null;
    const res = { ...m, date: new Date(m.date + 'T00:00:00Z') };
    if (include.items) {
      res.items = db.mealItems.filter(i => i.mealId === m.id);
    }
    return res;
  },
  async create({ data }) {
    const db = loadDb();
    const id = data.id || uuid();
    const dateStr = typeof data.date === 'string' ? data.date.slice(0, 10) : (data.date instanceof Date ? data.date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const newMeal = {
      id,
      userId: data.userId,
      date: dateStr,
      time: data.time || '12:00',
      mealType: data.mealType || 'Lunch',
      source: data.source || 'manual',
      note: data.note || '',
      imageAssetUrl: data.imageAssetUrl || null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    db.meals.push(newMeal);

    const createdItems = [];
    if (data.items && data.items.create && Array.isArray(data.items.create)) {
      for (const it of data.items.create) {
        const itemId = uuid();
        const itemRecord = {
          id: itemId,
          mealId: id,
          userId: data.userId,
          foodId: it.foodId || null,
          name: it.name || 'Food',
          qty: it.qty || 1,
          unit: it.unit || 'serving',
          calories: it.calories || 0,
          proteinG: it.proteinG || 0,
          carbsG: it.carbsG || 0,
          fatG: it.fatG || 0,
          fibreG: it.fibreG || 0,
          sugarG: it.sugarG || 0,
          satFatG: it.satFatG || 0,
          sodiumMg: it.sodiumMg || 0,
          source: it.source || 'manual',
          confidence: it.confidence || null,
        };
        db.mealItems.push(itemRecord);
        createdItems.push(itemRecord);
      }
    }
    saveDb(db);
    return { ...newMeal, date: new Date(dateStr + 'T00:00:00Z'), items: createdItems };
  },
  async update({ where, data }) {
    const db = loadDb();
    const m = db.meals.find(x => x.id === where.id);
    if (m) {
      Object.assign(m, data);
      saveDb(db);
      return { ...m, date: new Date(m.date + 'T00:00:00Z') };
    }
    return null;
  },
};

// MealItem Model
const mealItem = {
  async findMany({ where = {} }) {
    const db = loadDb();
    return db.mealItems.filter(i => (!where.mealId || i.mealId === where.mealId) && (!where.userId || i.userId === where.userId));
  },
  async create({ data }) {
    const db = loadDb();
    const id = data.id || uuid();
    const record = { id, ...data };
    db.mealItems.push(record);
    saveDb(db);
    return record;
  },
  async createMany({ data }) {
    const db = loadDb();
    let count = 0;
    for (const d of data) {
      db.mealItems.push({ id: d.id || uuid(), ...d });
      count++;
    }
    saveDb(db);
    return { count };
  },
};

// WeightLog Model
const weightLog = {
  async findMany({ where = {}, orderBy = [] }) {
    const db = loadDb();
    let list = db.weightLogs.filter(w => {
      if (where.userId && w.userId !== where.userId) return false;
      if (where.date) {
        if (where.date.gte || where.date.lte) {
          const gteStr = where.date.gte ? (where.date.gte instanceof Date ? where.date.gte.toISOString().slice(0, 10) : String(where.date.gte).slice(0, 10)) : null;
          const lteStr = where.date.lte ? (where.date.lte instanceof Date ? where.date.lte.toISOString().slice(0, 10) : String(where.date.lte).slice(0, 10)) : null;
          if (gteStr && w.date < gteStr) return false;
          if (lteStr && w.date > lteStr) return false;
        } else {
          const dStr = where.date instanceof Date ? where.date.toISOString().slice(0, 10) : String(where.date).slice(0, 10);
          if (w.date !== dStr) return false;
        }
      }
      return true;
    });
    list = list.map(w => ({ ...w, date: new Date(w.date + 'T00:00:00Z') }));
    list.sort((a, b) => a.date - b.date);
    return list;
  },
  async upsert({ where, update, create }) {
    const db = loadDb();
    const dateStr = create.date instanceof Date ? create.date.toISOString().slice(0, 10) : String(create.date).slice(0, 10);
    const userId = where.userId_date ? where.userId_date.userId : (create.userId || update.userId);
    let item = db.weightLogs.find(w => w.userId === userId && w.date === dateStr);
    if (item) {
      Object.assign(item, update);
    } else {
      item = {
        id: uuid(),
        userId,
        date: dateStr,
        weightKg: create.weightKg || update.weightKg || 70,
        note: create.note || update.note || '',
      };
      db.weightLogs.push(item);
    }
    saveDb(db);
    return { ...item, date: new Date(item.date + 'T00:00:00Z') };
  },
  async create({ data }) {
    return this.upsert({ where: { userId_date: { userId: data.userId, date: data.date } }, update: data, create: data });
  },
};

// WaterLog Model
const waterLog = {
  async findMany({ where = {} }) {
    const db = loadDb();
    const dateStr = where.date instanceof Date ? where.date.toISOString().slice(0, 10) : (where.date ? String(where.date).slice(0, 10) : null);
    return db.waterLogs
      .filter(w => (!where.userId || w.userId === where.userId) && (!dateStr || w.date === dateStr))
      .map(w => ({ ...w, date: new Date(w.date + 'T00:00:00Z') }));
  },
  async findFirst({ where = {} }) {
    const list = await this.findMany({ where });
    return list[0] || null;
  },
  async create({ data }) {
    const db = loadDb();
    const dateStr = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date).slice(0, 10);
    const item = {
      id: uuid(),
      userId: data.userId,
      date: dateStr,
      amountMl: Number(data.amountMl) || 0,
      createdAt: new Date().toISOString(),
    };
    db.waterLogs.push(item);
    saveDb(db);
    return { ...item, date: new Date(item.date + 'T00:00:00Z') };
  },
  async upsert({ where, update, create }) {
    const db = loadDb();
    const dateStr = create.date instanceof Date ? create.date.toISOString().slice(0, 10) : String(create.date).slice(0, 10);
    const userId = where.userId_date ? where.userId_date.userId : (create.userId || update.userId);
    let item = db.waterLogs.find(w => w.userId === userId && w.date === dateStr);
    if (item) {
      Object.assign(item, update);
    } else {
      item = {
        id: uuid(),
        userId,
        date: dateStr,
        amountMl: create.amountMl || update.amountMl || 0,
        createdAt: new Date().toISOString(),
      };
      db.waterLogs.push(item);
    }
    saveDb(db);
    return { ...item, date: new Date(item.date + 'T00:00:00Z') };
  },
};

// Favorite Model
const favorite = {
  async findMany({ where = {}, orderBy = [] }) {
    const db = loadDb();
    return db.favorites.filter(f => !where.userId || f.userId === where.userId);
  },
  async create({ data }) {
    const db = loadDb();
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString() };
    db.favorites.push(item);
    saveDb(db);
    return item;
  },
  async delete({ where }) {
    const db = loadDb();
    const idx = db.favorites.findIndex(f => f.id === where.id);
    if (idx !== -1) db.favorites.splice(idx, 1);
    saveDb(db);
    return { id: where.id };
  },
};

// Notification Model
const notification = {
  async findFirst({ where = {} }) {
    const list = await this.findMany({ where });
    return list[0] || null;
  },
  async findUnique({ where = {} }) {
    const list = await this.findMany({ where });
    return list[0] || null;
  },
  async findMany({ where = {}, orderBy = [], take }) {
    const db = loadDb();
    let list = db.notifications.filter(n => {
      if (where.userId && n.userId !== where.userId) return false;
      if (where.type && n.type !== where.type) return false;
      if (where.id && n.id !== where.id) return false;
      return true;
    });
    if (take) list = list.slice(0, take);
    return list;
  },
  async updateMany({ where = {}, data = {} }) {
    const db = loadDb();
    let count = 0;
    for (const n of db.notifications) {
      if (!where.userId || n.userId === where.userId) {
        Object.assign(n, data);
        count++;
      }
    }
    saveDb(db);
    return { count };
  },
  async create({ data }) {
    const db = loadDb();
    const item = { id: uuid(), ...data, read: false, createdAt: new Date().toISOString() };
    db.notifications.push(item);
    saveDb(db);
    return item;
  },
};

// NotificationPreference Model
const notificationPreference = {
  async findMany({ where = {} }) {
    const db = loadDb();
    return db.notificationPreferences.filter(p => !where.userId || p.userId === where.userId);
  },
  async upsert({ where, update, create }) {
    const db = loadDb();
    const userId = where.userId_type ? where.userId_type.userId : create.userId;
    const type = where.userId_type ? where.userId_type.type : create.type;
    let item = db.notificationPreferences.find(p => p.userId === userId && p.type === type);
    if (item) {
      Object.assign(item, update);
    } else {
      item = { id: uuid(), userId, type, enabled: create.enabled !== false, time: create.time || null };
      db.notificationPreferences.push(item);
    }
    saveDb(db);
    return item;
  },
};

// Recipe Model
const recipe = {
  async findMany({ where = {} }) {
    const db = loadDb();
    return db.recipes.filter(r => !where.userId || r.userId === where.userId);
  },
  async create({ data }) {
    const db = loadDb();
    const id = uuid();
    const item = { id, ...data, createdAt: new Date().toISOString() };
    db.recipes.push(item);
    saveDb(db);
    return item;
  },
};

// CustomFood Model
const customFood = {
  async findMany({ where = {} }) {
    const db = loadDb();
    return db.customFoods.filter(c => !where.userId || c.userId === where.userId);
  },
  async create({ data }) {
    const db = loadDb();
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString() };
    db.customFoods.push(item);
    saveDb(db);
    return item;
  },
};

// Food Model
const food = {
  async findMany({ where = {}, take = 200 }) {
    return [];
  },
};

// AiRecommendation Model
const aiRecommendation = {
  async create({ data }) {
    const db = loadDb();
    const item = { id: uuid(), ...data, createdAt: new Date().toISOString() };
    db.aiRecommendations.push(item);
    saveDb(db);
    return item;
  },
};

module.exports = {
  user,
  profile,
  nutritionGoal,
  meal,
  mealItem,
  weightLog,
  waterLog,
  favorite,
  notification,
  notificationPreference,
  recipe,
  customFood,
  food,
  aiRecommendation,
};
