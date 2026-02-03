
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { userAuthMiddleware, UserContext } from '../middleware/auth';

// Define Bindings locally to avoid circular dependency
type Bindings = {
    DB: D1Database
    PHOTOS_BUCKET: R2Bucket
    JWT_SECRET: string
    GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: UserContext } }>();

// Schema for creating an order
const createOrderSchema = z.object({
    items: z.array(z.object({
        itemId: z.string().optional(), // Optional if custom
        quantity: z.number().min(1),
        // Custom item fields
        isCustom: z.boolean().optional(),
        customUrl: z.string().optional(),
        customNote: z.string().optional(),
        customSource: z.string().optional(),
        // Snapshot of custom name if provided (or derived from item)
        itemName: z.string().optional(),
    })),
    notes: z.string().optional(),
});

// Create Order
app.post('/', userAuthMiddleware, zValidator('json', createOrderSchema), async (c) => {
    const user = c.get('user');
    const { items, notes } = c.req.valid('json');
    const db = c.env.DB;

    // 1. Calculate totals and validate items
    let totalPriceYen = 0;
    let totalPriceRp = 0;
    let totalWeightGrams = 0;
    const orderItemsData = [];

    for (const itemRequest of items) {
        let priceYen = 0;
        let priceRp = 0;
        let weightGrams = 0;
        let name = itemRequest.itemName || 'Custom Item';

        if (itemRequest.itemId && !itemRequest.isCustom) {
            // Fetch item details from DB
            const item = await db.prepare('SELECT * FROM items WHERE id = ?').bind(itemRequest.itemId).first();
            if (!item) {
                return c.json({ error: `Item not found: ${itemRequest.itemId}` }, 400);
            }
            // @ts-ignore
            priceYen = item.base_price_yen || 0;
            // @ts-ignore
            priceRp = item.selling_price_rp || 0; // Use selling price
            // @ts-ignore
            weightGrams = item.weight_grams || 0;
            // @ts-ignore
            name = item.name;
        }

        totalPriceYen += priceYen * itemRequest.quantity;
        totalPriceRp += priceRp * itemRequest.quantity;
        totalWeightGrams += weightGrams * itemRequest.quantity;

        orderItemsData.push({
            id: crypto.randomUUID(),
            itemId: itemRequest.itemId || null,
            name,
            quantity: itemRequest.quantity,
            priceYen,
            priceRp,
            weightGrams,
            isCustom: itemRequest.isCustom ? 1 : 0,
            customUrl: itemRequest.customUrl || null,
            customNote: itemRequest.customNote || null,
            customSource: itemRequest.customSource || null,
        });
    }

    const orderId = crypto.randomUUID();

    // 2. Insert Order
    await db.prepare(`
    INSERT INTO orders (id, user_id, status, total_price_yen, total_price_rp, total_weight_grams, notes)
    VALUES (?, ?, 'waiting_payment', ?, ?, ?, ?)
  `).bind(orderId, user.userId, totalPriceYen, totalPriceRp, totalWeightGrams, notes || null).run();

    // 3. Insert Order Items
    const stmt = db.prepare(`
    INSERT INTO order_items (id, order_id, item_id, name, quantity, price_yen, price_rp, weight_grams, is_custom, custom_url, custom_note, custom_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const batch = orderItemsData.map(item => stmt.bind(
        item.id,
        orderId,
        item.itemId,
        item.name,
        item.quantity,
        item.priceYen,
        item.priceRp,
        item.weightGrams,
        item.isCustom,
        item.customUrl,
        item.customNote,
        item.customSource
    ));

    await db.batch(batch);

    return c.json({ id: orderId, message: 'Order created successfully' }, 201);
});

// List Orders
app.get('/', userAuthMiddleware, async (c) => {
    const user = c.get('user');
    const status = c.req.query('status');

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params: any[] = [user.userId];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = await c.env.DB.prepare(query).bind(...params).all();

    // For each order, fetch items (N+1 but okay for MVP/small scale)
    const results = [];
    for (const order of orders.results) {
        const items = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(order.id).all();
        results.push({
            ...order,
            // @ts-ignore
            totalPriceYen: order.total_price_yen,
            // @ts-ignore
            totalPriceRp: order.total_price_rp,
            // @ts-ignore
            totalWeightGrams: order.total_weight_grams,
            // @ts-ignore
            createdAt: order.created_at,
            // @ts-ignore
            updatedAt: order.updated_at,
            items: items.results.map(i => ({
                ...i,
                // @ts-ignore
                itemId: i.item_id,
                // @ts-ignore
                orderId: i.order_id,
                // @ts-ignore
                priceYen: i.price_yen,
                // @ts-ignore
                priceRp: i.price_rp,
                // @ts-ignore
                weightGrams: i.weight_grams,
                // @ts-ignore
                isCustom: i.is_custom === 1,
                // @ts-ignore
                customUrl: i.custom_url,
                // @ts-ignore
                customNote: i.custom_note,
                // @ts-ignore
                customSource: i.custom_source,
                // @ts-ignore
                createdAt: i.created_at
            }))
        });
    }

    return c.json(results);
});

// ADMIN ROUTES
import { authMiddleware } from '../middleware/auth';

// Admin: List All Orders
app.get('/admin/all', authMiddleware, async (c) => {
    const status = c.req.query('status');
    const db = c.env.DB;

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = await db.prepare(query).bind(...params).all();

    // Fetch items for each order
    const results = [];
    for (const order of orders.results) {
        const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(order.id).all();
        results.push({
            ...order,
            // @ts-ignore
            totalPriceYen: order.total_price_yen,
            // @ts-ignore
            totalPriceRp: order.total_price_rp,
            // @ts-ignore
            totalWeightGrams: order.total_weight_grams,
            // @ts-ignore
            createdAt: order.created_at,
            // @ts-ignore
            updatedAt: order.updated_at,
            items: items.results.map(i => ({
                ...i,
                // @ts-ignore
                itemId: i.item_id,
                // @ts-ignore
                orderId: i.order_id,
                // @ts-ignore
                priceYen: i.price_yen,
                // @ts-ignore
                priceRp: i.price_rp,
                // @ts-ignore
                weightGrams: i.weight_grams,
                // @ts-ignore
                isCustom: i.is_custom === 1,
                // @ts-ignore
                customUrl: i.custom_url,
                // @ts-ignore
                customNote: i.custom_note,
                // @ts-ignore
                customSource: i.custom_source,
                // @ts-ignore
                createdAt: i.created_at
            }))
        });
    }

    return c.json(results);
});

// Admin: Get specific order
app.get('/admin/:id', authMiddleware, async (c) => {
    const orderId = c.req.param('id');
    const db = c.env.DB;

    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();

    if (!order) {
        return c.json({ error: 'Order not found' }, 404);
    }

    const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();

    return c.json({
        ...order,
        // @ts-ignore
        totalPriceYen: order.total_price_yen,
        // @ts-ignore
        totalPriceRp: order.total_price_rp,
        // @ts-ignore
        totalWeightGrams: order.total_weight_grams,
        // @ts-ignore
        createdAt: order.created_at,
        // @ts-ignore
        updatedAt: order.updated_at,
        items: items.results.map(i => ({
            ...i,
            // @ts-ignore
            itemId: i.item_id,
            // @ts-ignore
            orderId: i.order_id,
            // @ts-ignore
            priceYen: i.price_yen,
            // @ts-ignore
            priceRp: i.price_rp,
            // @ts-ignore
            weightGrams: i.weight_grams,
            // @ts-ignore
            isCustom: i.is_custom === 1,
            // @ts-ignore
            customUrl: i.custom_url,
            // @ts-ignore
            customNote: i.custom_note,
            // @ts-ignore
            customSource: i.custom_source,
            // @ts-ignore
            createdAt: i.created_at
        }))
    });
});

// Get Order Detail (User)
app.get('/:id', userAuthMiddleware, async (c) => {
    const user = c.get('user');
    const orderId = c.req.param('id');

    const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').bind(orderId, user.userId).first();

    if (!order) {
        return c.json({ error: 'Order not found' }, 404);
    }

    const items = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();

    return c.json({
        ...order,
        // @ts-ignore
        totalPriceYen: order.total_price_yen,
        // @ts-ignore
        totalPriceRp: order.total_price_rp,
        // @ts-ignore
        totalWeightGrams: order.total_weight_grams,
        // @ts-ignore
        createdAt: order.created_at,
        // @ts-ignore
        updatedAt: order.updated_at,
        items: items.results.map(i => ({
            ...i,
            // @ts-ignore
            itemId: i.item_id,
            // @ts-ignore
            orderId: i.order_id,
            // @ts-ignore
            priceYen: i.price_yen,
            // @ts-ignore
            priceRp: i.price_rp,
            // @ts-ignore
            weightGrams: i.weight_grams,
            // @ts-ignore
            isCustom: i.is_custom === 1,
            // @ts-ignore
            customUrl: i.custom_url,
            // @ts-ignore
            customNote: i.custom_note,
            // @ts-ignore
            customSource: i.custom_source,
            // @ts-ignore
            createdAt: i.created_at
        }))
    });
});

// Update Order Status (Admin only)
// Note: For MVP we might need to use the shared admin middleware or checking user role
// Let's assume we use the legacy authMiddleware for admin actions for now
import { authMiddleware } from '../middleware/auth';

app.patch('/:id/status', authMiddleware, zValidator('json', z.object({
    status: z.enum(['confirmed', 'waiting_payment', 'purchased', 'shipped', 'delivered', 'cancelled'])
})), async (c) => {
    const orderId = c.req.param('id');
    const { status } = c.req.valid('json');

    const { success } = await c.env.DB.prepare(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, orderId).run();

    if (!success) {
        return c.json({ error: 'Failed to update order' }, 500);
    }

    return c.json({ message: 'Order status updated' });
});

// Update Order Payment Custom (Admin only - e.g. update weights/prices)
// This effectively confirms the order values
app.patch('/:id/details', authMiddleware, zValidator('json', z.object({
    totalPriceRp: z.number().optional(),
    totalWeightGrams: z.number().optional(),
    items: z.array(z.object({
        id: z.string(),
        priceRp: z.number().optional(),
        weightGrams: z.number().optional(),
    })).optional()
})), async (c) => {
    const orderId = c.req.param('id');
    const { items, totalPriceRp, totalWeightGrams } = c.req.valid('json');
    const db = c.env.DB;

    // Transaction-like batch update
    const statements = [];

    if (totalPriceRp !== undefined || totalWeightGrams !== undefined) {
        const updates = [];
        const params = [];
        if (totalPriceRp !== undefined) { updates.push('total_price_rp = ?'); params.push(totalPriceRp); }
        if (totalWeightGrams !== undefined) { updates.push('total_weight_grams = ?'); params.push(totalWeightGrams); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(orderId);

        statements.push(db.prepare(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...params));
    }

    if (items && items.length > 0) {
        for (const item of items) {
            const itemUpdates = [];
            const itemParams = [];
            if (item.priceRp !== undefined) { itemUpdates.push('price_rp = ?'); itemParams.push(item.priceRp); }
            if (item.weightGrams !== undefined) { itemUpdates.push('weight_grams = ?'); itemParams.push(item.weightGrams); }

            if (itemUpdates.length > 0) {
                itemParams.push(item.id);
                itemParams.push(orderId); // Extra safety check
                statements.push(db.prepare(
                    `UPDATE order_items SET ${itemUpdates.join(', ')} WHERE id = ? AND order_id = ?`
                ).bind(...itemParams));
            }
        }
    }

    if (statements.length > 0) {
        await db.batch(statements);
    }

    return c.json({ message: 'Order details updated' });
});

export default app;
