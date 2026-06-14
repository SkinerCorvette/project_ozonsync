document.addEventListener('DOMContentLoaded', () => {
    const shopNav = document.getElementById('shopNav');
    const navCatalogBtn = document.getElementById('navCatalogBtn');
    const navCartBtn = document.getElementById('navCartBtn');
    const navMyOrdersBtn = document.getElementById('navMyOrdersBtn');
    const navSupportBtn = document.getElementById('navSupportBtn');
    const navDashboardBtn = document.getElementById('navDashboardBtn');
    const navAdminOrdersBtn = document.getElementById('navAdminOrdersBtn');
    const navAdminUsersBtn = document.getElementById('navAdminUsersBtn');
    const navAdminSupportBtn = document.getElementById('navAdminSupportBtn');
    const navActivityBtn = document.getElementById('navActivityBtn');
    const navCatalogControlBtn = document.getElementById('navCatalogControlBtn');

    const dashboardSection = document.getElementById('mainDashboardSection');
    const cartSection = document.getElementById('cartSection');
    const ordersSection = document.getElementById('ordersSection');
    const activitySection = document.getElementById('activitySection');
    const catalogControlSection = document.getElementById('catalogControlSection');
    const usersSection = document.getElementById('usersSection');
    const supportSection = document.getElementById('supportSection');
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const cartBadge = document.getElementById('cartBadge');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartEmpty = document.getElementById('cartEmpty');
    const ordersBody = document.getElementById('ordersBody');
    const ordersTitle = document.getElementById('ordersTitle');
    const activityBody = document.getElementById('activityBody');
    const catalogControlBody = document.getElementById('catalogControlBody');
    const controlTotalIssues = document.getElementById('controlTotalIssues');
    const refreshCatalogControlBtn = document.getElementById('refreshCatalogControlBtn');
    const exportWarningsBtn = document.getElementById('exportWarningsBtn');
    const exportProductsBtn = document.getElementById('exportProductsBtn');
    const exportArchiveBtn = document.getElementById('exportArchiveBtn');
    const exportOrdersBtn = document.getElementById('exportOrdersBtn');
    const cartUnavailableNotice = document.getElementById('cartUnavailableNotice');

    const supportHintBtn = document.getElementById('supportHintBtn');
    const supportBadge = document.getElementById('supportBadge');
    const adminSupportBadge = document.getElementById('adminSupportBadge');
    const supportTitle = document.getElementById('supportTitle');
    const supportSubtitle = document.getElementById('supportSubtitle');
    const supportNewTicketBtn = document.getElementById('supportNewTicketBtn');
    const supportCreatePanel = document.getElementById('supportCreatePanel');
    const supportCancelCreateBtn = document.getElementById('supportCancelCreateBtn');
    const supportTicketForm = document.getElementById('supportTicketForm');
    const supportTicketTitleInput = document.getElementById('supportTicketTitleInput');
    const supportTicketCategorySelect = document.getElementById('supportTicketCategorySelect');
    const supportTicketDescriptionInput = document.getElementById('supportTicketDescriptionInput');
    const supportTicketFilesInput = document.getElementById('supportTicketFilesInput');
    const supportTicketFormError = document.getElementById('supportTicketFormError');
    const supportTicketsList = document.getElementById('supportTicketsList');
    const supportTicketDetail = document.getElementById('supportTicketDetail');
    const supportMessageForm = document.getElementById('supportMessageForm');
    const supportMessageInput = document.getElementById('supportMessageInput');
    const supportMessageFilesInput = document.getElementById('supportMessageFilesInput');
    const supportMessageError = document.getElementById('supportMessageError');
    const supportCloseTicketBtn = document.getElementById('supportCloseTicketBtn');
    const refreshSupportBtn = document.getElementById('refreshSupportBtn');

    const adminUserForm = document.getElementById('adminUserForm');
    const adminUserId = document.getElementById('adminUserId');
    const adminUserFormTitle = document.getElementById('adminUserFormTitle');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminUserRoleSelect = document.getElementById('adminUserRoleSelect');
    const adminUserPasswordInput = document.getElementById('adminUserPasswordInput');
    const adminUserFormError = document.getElementById('adminUserFormError');
    const adminUserResetBtn = document.getElementById('adminUserResetBtn');
    const adminUsersBody = document.getElementById('adminUsersBody');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');

    const productsContainer = document.getElementById('productsContainer');
    const filtersDiv = document.getElementById('filters');
    const loadFromDbBtn = document.getElementById('loadFromDbBtn');
    const getProductsBtn = document.getElementById('getProductsBtn');
    const syncLogsContainer = document.getElementById('syncLogsContainer');
    const catalogControlsBar = document.getElementById('catalogControlsBar');
    const authStatus = document.getElementById('authStatus');
    const authForms = document.getElementById('authForms');
    const productsList = document.getElementById('productsList');
    const catalogCommandEyebrow = document.getElementById('catalogCommandEyebrow');
    const catalogCommandTitle = document.getElementById('catalogCommandTitle');
    const catalogCommandDescription = document.getElementById('catalogCommandDescription');
    const catalogHero = document.getElementById('catalogHero');
    const catalogHeroTitle = document.getElementById('catalogHeroTitle');
    const catalogHeroSubtitle = document.getElementById('catalogHeroSubtitle');

    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutClose = document.getElementById('checkoutClose');
    const checkoutCancelBtn = document.getElementById('checkoutCancelBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutError = document.getElementById('checkoutError');
    const customerNameInput = document.getElementById('customerNameInput');
    const customerPhoneInput = document.getElementById('customerPhoneInput');
    const customerCommentInput = document.getElementById('customerCommentInput');
    const checkoutPaymentMethodSelect = document.getElementById('checkoutPaymentMethodSelect');
    const checkoutPreviewTotal = document.getElementById('checkoutPreviewTotal');

    const paymentModal = document.getElementById('paymentModal');
    const paymentClose = document.getElementById('paymentClose');
    const paymentCancelBtn = document.getElementById('paymentCancelBtn');
    const paymentForm = document.getElementById('paymentForm');
    const paymentOrderId = document.getElementById('paymentOrderId');
    const paymentAmount = document.getElementById('paymentAmount');
    const paymentCardNumberInput = document.getElementById('paymentCardNumberInput');
    const paymentCardHolderInput = document.getElementById('paymentCardHolderInput');
    const paymentExpiryInput = document.getElementById('paymentExpiryInput');
    const paymentCvvInput = document.getElementById('paymentCvvInput');
    const paymentError = document.getElementById('paymentError');

    let currentRole = 'user';
    let currentUserId = null;
    let activeSection = 'catalog';
    let bootstrapped = false;
    let selectedSupportTicketId = null;
    let activePaymentOrder = null;

    const toast = (message, type = 'info') => {
        if (typeof window.showAppToast === 'function') window.showAppToast(message, type);
    };

    const statusMap = {
        new: 'Новый',
        processing: 'В обработке',
        confirmed: 'Подтверждён',
        cancelled: 'Отменён',
        completed: 'Завершён'
    };

    const paymentStatusMap = {
        pending: 'Ожидает оплаты',
        paid: 'Оплачен',
        failed: 'Ошибка оплаты',
        refunded: 'Возврат',
        cancelled: 'Отменён',
        cash_on_delivery: 'При получении',
        not_paid: 'Не оплачен'
    };

    const paymentMethodMap = {
        test_card: 'Онлайн-оплата',
        cash_on_delivery: 'При получении'
    };

    function money(value) {
        const num = Number(value || 0);
        return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
    }

    function dateTime(value) {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU');
    }

    async function api(url, options = {}) {
        const isFormData = options.body instanceof FormData;
        const headers = isFormData
            ? { ...(options.headers || {}) }
            : { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            headers
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `Ошибка запроса: ${response.status}`);
        return data;
    }

    async function syncAuthState() {
        try {
            const data = await api('/api/auth_status');
            if (data.is_authenticated) {
                currentRole = data.role || 'user';
                currentUserId = data.user_id || null;
                showShell();
                applyRoleView();
                if (!bootstrapped) {
                    bootstrapped = true;
                    showSection(currentRole === 'admin' ? 'dashboard' : 'catalog');
                }
                refreshCartBadge();
                refreshSupportBadge();
            } else {
                currentUserId = null;
                hideShell();
            }
        } catch (e) {
            currentUserId = null;
            hideShell();
        }
    }

    function showShell() {
        if (shopNav) shopNav.classList.remove('hidden');
    }

    function hideShell() {
        bootstrapped = false;
        if (shopNav) shopNav.classList.add('hidden');
        if (supportHintBtn) supportHintBtn.classList.add('hidden');
        if (supportBadge) supportBadge.classList.add('hidden');
        if (adminSupportBadge) adminSupportBadge.classList.add('hidden');
        hideExtraSections();
        hideCatalogSections();
    }

    function applyRoleView() {
        const isAdmin = currentRole === 'admin';
        document.body.classList.toggle('is-admin', isAdmin);
        document.body.classList.toggle('is-shop-user', !isAdmin);

        if (navDashboardBtn) navDashboardBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (navCartBtn) navCartBtn.style.display = isAdmin ? 'none' : 'inline-flex';
        if (navMyOrdersBtn) navMyOrdersBtn.style.display = isAdmin ? 'none' : 'inline-flex';
        if (navSupportBtn) navSupportBtn.style.display = isAdmin ? 'none' : 'inline-flex';
        if (navAdminOrdersBtn) navAdminOrdersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (navAdminUsersBtn) navAdminUsersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (navAdminSupportBtn) navAdminSupportBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (navActivityBtn) navActivityBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (navCatalogControlBtn) navCatalogControlBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (supportHintBtn) supportHintBtn.classList.toggle('hidden', isAdmin);

        if (getProductsBtn) getProductsBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        if (loadFromDbBtn) {
            loadFromDbBtn.textContent = isAdmin ? 'Загрузить товары из базы' : 'Открыть каталог';
            loadFromDbBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }
        if (catalogCommandEyebrow) catalogCommandEyebrow.textContent = isAdmin ? 'Каталог товаров' : 'Витрина магазина';
        if (catalogCommandTitle) catalogCommandTitle.textContent = isAdmin ? 'Управление локальным каталогом' : 'Каталог автокомплектующих';
        if (catalogCommandDescription) catalogCommandDescription.textContent = isAdmin
            ? 'Загружайте товары из локальной базы или выполняйте синхронизацию с Ozon прямо из каталога.'
            : 'Просматривайте ассортимент магазина, добавляйте товары в корзину и оформляйте заказы.';
        if (catalogHeroTitle) catalogHeroTitle.textContent = isAdmin
            ? 'Панель каталога и синхронизации'
            : 'Автокомплектующие с актуальными остатками';
        if (catalogHeroSubtitle) catalogHeroSubtitle.textContent = isAdmin
            ? 'Контролируйте витрину, локальные правки и качество товарных данных в едином рабочем пространстве.'
            : 'Подберите товары из локального каталога, добавьте их в корзину и оформите заказ удобным способом.';
    }

    function hideExtraSections() {
        [dashboardSection, cartSection, ordersSection, activitySection, catalogControlSection, usersSection, supportSection].forEach(section => {
            if (section) section.classList.add('hidden');
        });
    }

    function hideCatalogSections() {
        if (catalogControlsBar) catalogControlsBar.classList.add('hidden');
        if (productsContainer) productsContainer.classList.add('hidden');
        if (filtersDiv) filtersDiv.classList.add('hidden');
        if (syncLogsContainer) syncLogsContainer.classList.add('hidden');
        if (catalogHero) catalogHero.classList.add('hidden');
    }

    function showCatalogSections() {
        if (catalogHero) catalogHero.classList.add('hidden');
        if (catalogControlsBar) catalogControlsBar.classList.remove('hidden');
        if (loadFromDbBtn && currentRole === 'admin') loadFromDbBtn.classList.remove('hidden');
        if (getProductsBtn) getProductsBtn.style.display = currentRole === 'admin' ? 'inline-flex' : 'none';
        if (productsContainer) productsContainer.classList.remove('hidden');
        if (filtersDiv) filtersDiv.classList.remove('hidden');
        if (syncLogsContainer && currentRole === 'admin') syncLogsContainer.classList.remove('hidden');
    }

    function setActiveNav(section) {
        const map = {
            catalog: navCatalogBtn,
            cart: navCartBtn,
            myOrders: navMyOrdersBtn,
            support: navSupportBtn,
            dashboard: navDashboardBtn,
            adminOrders: navAdminOrdersBtn,
            adminUsers: navAdminUsersBtn,
            adminSupport: navAdminSupportBtn,
            activity: navActivityBtn,
            catalogControl: navCatalogControlBtn
        };
        Object.values(map).forEach(btn => btn && btn.classList.remove('shop-nav-active'));
        if (map[section]) map[section].classList.add('shop-nav-active');
    }

    async function showSection(section) {
        activeSection = section;
        setActiveNav(section);
        hideExtraSections();

        if (section === 'catalog') {
            showCatalogSections();
            if (loadFromDbBtn && (!productsList || productsList.children.length === 0)) {
                loadFromDbBtn.click();
            }
            return;
        }

        hideCatalogSections();

        if (section === 'cart') {
            cartSection.classList.remove('hidden');
            await loadCart();
        } else if (section === 'myOrders') {
            ordersSection.classList.remove('hidden');
            ordersTitle.textContent = 'Мои заказы';
            await loadOrders(false);
        } else if (section === 'dashboard') {
            dashboardSection.classList.remove('hidden');
            await loadMainDashboard();
        } else if (section === 'adminOrders') {
            ordersSection.classList.remove('hidden');
            ordersTitle.textContent = 'Заказы покупателей';
            await loadOrders(true);
        } else if (section === 'adminUsers') {
            usersSection.classList.remove('hidden');
            await loadAdminUsers();
        } else if (section === 'support' || section === 'adminSupport') {
            supportSection.classList.remove('hidden');
            await loadSupportTickets();
        } else if (section === 'activity') {
            activitySection.classList.remove('hidden');
            await loadActivityLogs();
        } else if (section === 'catalogControl') {
            catalogControlSection.classList.remove('hidden');
            await loadCatalogControl();
        }
    }

    async function refreshCartBadge() {
        if (!cartBadge) return;
        try {
            const data = await api('/api/cart');
            const count = (data.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            cartBadge.textContent = count;
            cartBadge.classList.toggle('hidden', count === 0);
        } catch (e) {
            cartBadge.classList.add('hidden');
        }
    }
    window.refreshShopCartBadge = refreshCartBadge;

    function enhanceProductCards() {
        if (!productsList || currentRole === 'admin') return;
        productsList.querySelectorAll('li[data-offer-id]').forEach(item => {
            if (item.querySelector('.add-cart-btn')) return;
            const offerId = item.dataset.offerId;
            const stock = Number(item.dataset.stock || '0');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'add-cart-btn';

            if (stock <= 0) {
                btn.textContent = 'Не в наличии';
                btn.disabled = true;
                btn.classList.add('btn-disabled-stock');
            } else {
                btn.textContent = 'В корзину';
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.disabled = true;
                    const old = btn.textContent;
                    btn.textContent = 'Добавляем...';
                    try {
                        await api('/api/cart', {
                            method: 'POST',
                            body: JSON.stringify({ offer_id: offerId, quantity: 1 })
                        });
                        btn.textContent = 'Добавлено ✓';
                        await refreshCartBadge();
                        setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
                    } catch (err) {
                        toast(err.message, 'error');
                        btn.textContent = old;
                        btn.disabled = false;
                    }
                });
            }
            item.appendChild(btn);
        });
    }

    function recalcCartTotals() {
        if (!cartList || !cartTotal) return;
        let total = 0;
        cartList.querySelectorAll('.cart-item').forEach(row => {
            const qtyInput = row.querySelector('.cart-qty');
            const qty = Number(qtyInput?.value || 0);
            const price = Number(row.dataset.price || 0);
            const lineTotal = Math.max(0, qty * price);
            const lineEl = row.querySelector('.cart-line-total');
            if (lineEl) lineEl.textContent = money(lineTotal);
            total += lineTotal;
        });
        cartTotal.textContent = money(total);
    }

    async function loadCart() {
        cartList.innerHTML = '<div class="shop-muted">Загрузка корзины...</div>';
        try {
            const data = await api('/api/cart');
            const items = data.items || [];
            const hasUnavailable = Boolean(data.has_unavailable);
            cartTotal.textContent = money(data.total || 0);
            if (checkoutPreviewTotal) checkoutPreviewTotal.textContent = `Итого: ${money(data.total || 0)}`;
            cartEmpty.classList.toggle('hidden', items.length > 0);
            if (cartUnavailableNotice) cartUnavailableNotice.classList.toggle('hidden', !hasUnavailable);
            checkoutBtn.disabled = items.length === 0 || hasUnavailable;

            if (items.length === 0) {
                cartList.innerHTML = '';
                return;
            }

            cartList.innerHTML = items.map(item => {
                const unavailable = !item.is_available;
                const canUpdate = Boolean(item.can_update_quantity);
                const maxAttr = item.available_stock !== null && item.available_stock !== undefined ? `max="${item.available_stock}"` : '';
                return `
                <div class="cart-item ${unavailable ? 'cart-item-unavailable' : ''}" data-cart-id="${item.id}" data-price="${Number(item.price || 0)}" data-prev-qty="${item.quantity}">
                    <div class="cart-thumb">${item.image_url ? `<img src="${item.image_url}" alt="">` : '🚗'}</div>
                    <div class="cart-info">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${escapeHtml(item.offer_id || '—')}</span>
                        ${unavailable ? `<em class="cart-unavailable-label">${escapeHtml(item.unavailable_reason || 'Недоступен для заказа')}</em>` : ''}
                    </div>
                    <div class="cart-price">${money(item.price)} за шт.</div>
                    <input class="cart-qty" type="number" min="1" ${maxAttr} value="${item.quantity}" ${(!canUpdate && unavailable) ? 'disabled' : ''}>
                    <div class="cart-line-total">${unavailable ? '—' : money(item.total_price)}</div>
                    <button class="cart-delete-btn" type="button">Удалить</button>
                </div>`;
            }).join('');
        } catch (err) {
            cartList.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    async function loadOrders(adminMode) {
        ordersBody.innerHTML = '<div class="shop-muted">Загрузка заказов...</div>';
        try {
            const data = await api('/api/orders?limit=100');
            const orders = data.orders || [];
            if (orders.length === 0) {
                ordersBody.innerHTML = '<div class="empty-state empty-state-rich"><b>Заказов пока нет</b><span>После оформления покупки заказ появится в этом разделе.</span></div>';
                return;
            }

            ordersBody.innerHTML = orders.map(order => {
                const paymentStatus = order.payment_status || 'pending';
                const paymentMethod = order.payment_method || 'test_card';
                const isOrderLocked = ['completed', 'cancelled'].includes(order.status);
                const isPaymentLocked = paymentStatus === 'paid';
                const canPay = !adminMode
                    && paymentMethod === 'test_card'
                    && ['pending', 'failed'].includes(paymentStatus)
                    && order.status !== 'cancelled';

                return `
                <div class="order-card modern-order-card" data-order-id="${order.id}" data-order-total="${Number(order.total_amount || 0)}">
                    <div class="order-head">
                        <div>
                            <strong>Заказ №${order.id}</strong>
                            <span>${dateTime(order.created_at)}</span>
                        </div>
                        <div class="order-status-stack">
                            <span class="order-status order-status-${order.status}">${statusMap[order.status] || order.status}</span>
                            <span class="payment-status payment-status-${paymentStatus}">${paymentStatusMap[paymentStatus] || paymentStatus}</span>
                        </div>
                    </div>
                    <div class="order-meta order-meta-modern">
                        ${adminMode ? `<span>Пользователь: <b>${escapeHtml(order.username || '—')}</b></span>` : ''}
                        <span>Клиент: <b>${escapeHtml(order.customer_name || '—')}</b></span>
                        <span>Телефон: <b>${escapeHtml(order.customer_phone || '—')}</b></span>
                        <span>Оплата: <b>${paymentMethodMap[paymentMethod] || paymentMethod}</b></span>
                        <span>Сумма: <b>${money(order.total_amount)}</b></span>
                    </div>
                    <div class="order-items">
                        ${(order.items || []).map(item => `
                            <div class="order-item-row">
                                <span>${escapeHtml(item.product_name)}</span>
                                <span>${escapeHtml(item.offer_id)}</span>
                                <span>${item.quantity} × ${money(item.price)}</span>
                                <b>${money(item.total_price)}</b>
                            </div>
                        `).join('')}
                    </div>
                    ${order.customer_comment ? `<p class="order-comment">Комментарий: ${escapeHtml(order.customer_comment)}</p>` : ''}
                    ${adminMode ? `
                        <div class="order-admin-actions order-admin-actions-modern">
                            <label>Статус заказа
                                <select class="order-status-select" ${isOrderLocked ? 'disabled' : ''}>
                                    ${Object.entries(statusMap).map(([value, label]) => `<option value="${value}" ${value === order.status ? 'selected' : ''}>${label}</option>`).join('')}
                                </select>
                            </label>
                            <label>Статус оплаты
                                <select class="payment-status-select" ${isPaymentLocked ? 'disabled' : ''}>
                                    ${Object.entries(paymentStatusMap).map(([value, label]) => `<option value="${value}" ${value === paymentStatus ? 'selected' : ''}>${label}</option>`).join('')}
                                </select>
                            </label>
                            <button class="save-order-status-btn" type="button">Сохранить заказ</button>
                        </div>
                    ` : `
                        <div class="order-user-actions order-user-actions-modern">
                            ${canPay ? `<button class="pay-order-btn" type="button">Оплатить</button>` : ''}
                            ${(order.status === 'new' || order.status === 'processing') ? `<button class="secondary-btn cancel-order-btn" type="button">Отменить заказ</button>` : ''}
                        </div>
                    `}
                </div>`;
            }).join('');
        } catch (err) {
            ordersBody.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    async function loadActivityLogs() {
        activityBody.innerHTML = '<div class="shop-muted">Загрузка журнала...</div>';
        try {
            const data = await api('/api/activity_logs?limit=80');
            const logs = data.logs || [];
            if (logs.length === 0) {
                activityBody.innerHTML = '<div class="empty-state">Журнал действий пока пуст.</div>';
                return;
            }
            activityBody.innerHTML = logs.map(log => `
                <div class="activity-row">
                    <div class="activity-dot"></div>
                    <div>
                        <strong>${escapeHtml(log.description)}</strong>
                        <span>${dateTime(log.created_at)} · ${escapeHtml(log.username || 'система')} · ${escapeHtml(log.action)}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            activityBody.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    async function loadMainDashboard() {
        try {
            const data = await api('/api/dashboard_stats');
            setText('dashTotalProducts', data.total);
            setText('dashActiveProducts', data.active);
            setText('dashHiddenProducts', data.hidden);
            setText('dashNoImageProducts', data.without_image);
            setText('dashOutOfStockProducts', data.out_of_stock);
            setText('dashWithoutPriceProducts', data.without_price);
            setText('dashAvgPrice', money(data.avg_price));
            setText('dashOrdersTotal', data.orders_total);
            setText('dashOrdersNew', data.orders_new);
            setText('dashRevenue', money(data.revenue));
            setText('dashOrdersPaid', data.orders_paid);
            setText('dashPaymentsPending', data.payments_pending);
            setText('dashPaidRevenue', money(data.paid_revenue));
            setText('dashSupportOpen', data.support_open);
        } catch (err) {
            console.error(err);
        }

        if (currentRole === 'admin') {
            await loadDashboardPreviewOrders();
            await loadDashboardPreviewActivity();
        }
    }

    async function loadDashboardPreviewOrders() {
        const box = document.getElementById('dashboardRecentOrders');
        if (!box) return;
        try {
            const data = await api('/api/orders?limit=5');
            const orders = data.orders || [];
            box.innerHTML = orders.length ? orders.map(order => `
                <div class="mini-row">
                    <span>Заказ №${order.id}</span>
                    <b>${money(order.total_amount)}</b>
                    <small>${statusMap[order.status] || order.status} · ${paymentStatusMap[order.payment_status] || order.payment_status || '—'}</small>
                </div>
            `).join('') : '<div class="shop-muted">Заказов пока нет.</div>';
        } catch (err) {
            box.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    async function loadDashboardPreviewActivity() {
        const box = document.getElementById('dashboardRecentActivity');
        if (!box) return;
        try {
            const data = await api('/api/activity_logs?limit=5');
            const logs = data.logs || [];
            box.innerHTML = logs.length ? logs.map(log => `
                <div class="mini-row">
                    <span>${escapeHtml(log.description)}</span>
                    <small>${dateTime(log.created_at)}</small>
                </div>
            `).join('') : '<div class="shop-muted">Действий пока нет.</div>';
        } catch (err) {
            box.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }



    async function loadCatalogControl() {
        if (!catalogControlBody) return;
        catalogControlBody.innerHTML = '<div class="shop-muted">Проверяем состояние каталога...</div>';
        try {
            const data = await api('/api/catalog_warnings?limit=6');
            const categories = data.categories || [];
            if (controlTotalIssues) controlTotalIssues.textContent = data.total_issues || 0;

            if (categories.length === 0) {
                catalogControlBody.innerHTML = '<div class="empty-state">Проблемы не найдены.</div>';
                return;
            }

            catalogControlBody.innerHTML = categories.map(category => `
                <article class="control-card severity-${escapeHtml(category.severity)}">
                    <div class="control-card-head">
                        <div>
                            <h3>${escapeHtml(category.title)}</h3>
                            <p>${escapeHtml(category.description)}</p>
                        </div>
                        <strong>${category.count}</strong>
                    </div>
                    <div class="control-items">
                        ${(category.items || []).length ? category.items.map(item => `
                            <button class="control-product-row" type="button" data-offer-id="${escapeHtml(item.offer_id)}" title="Открыть карточку товара">
                                <span>${escapeHtml(item.name || 'Без названия')}</span>
                                <small>${escapeHtml(item.offer_id || '—')} · ${money(item.price || 0)} · ост. ${item.stock ?? '—'}</small>
                                <em>Открыть</em>
                            </button>
                        `).join('') : '<div class="shop-muted">Нет товаров в этой категории.</div>'}
                    </div>
                </article>
            `).join('');
        } catch (err) {
            catalogControlBody.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }


    const supportCategoryMap = {
        catalog: 'Каталог товаров',
        cart: 'Корзина',
        order: 'Заказы',
        account: 'Учётная запись',
        sync: 'Синхронизация',
        other: 'Другое'
    };

    const supportStatusMap = {
        open: 'Открыто',
        closed: 'Закрыто'
    };

    function toggleSupportCreatePanel(forceOpen = null) {
        if (!supportCreatePanel) return;
        const shouldOpen = forceOpen === null ? supportCreatePanel.classList.contains('hidden') : Boolean(forceOpen);
        supportCreatePanel.classList.toggle('hidden', !shouldOpen);
        if (supportNewTicketBtn) supportNewTicketBtn.textContent = shouldOpen ? 'Свернуть' : 'Новое';
        if (shouldOpen && supportTicketTitleInput) {
            setTimeout(() => supportTicketTitleInput.focus(), 0);
        }
    }

    function setFormError(el, message) {
        if (!el) return;
        el.textContent = message || '';
        el.classList.toggle('hidden', !message);
    }

    async function refreshSupportBadge() {
        try {
            const data = await api('/api/support/unread_count');
            const unread = Number(data.unread || 0);
            const badge = currentRole === 'admin' ? adminSupportBadge : supportBadge;
            const otherBadge = currentRole === 'admin' ? supportBadge : adminSupportBadge;
            if (badge) {
                badge.textContent = unread;
                badge.classList.toggle('hidden', unread === 0);
            }
            if (otherBadge) otherBadge.classList.add('hidden');
        } catch (err) {
            if (supportBadge) supportBadge.classList.add('hidden');
            if (adminSupportBadge) adminSupportBadge.classList.add('hidden');
        }
    }

    function renderSupportTickets(tickets) {
        if (!supportTicketsList) return;
        if (!tickets.length) {
            supportTicketsList.innerHTML = '<div class="empty-state">Обращений пока нет.</div>';
            return;
        }
        supportTicketsList.innerHTML = tickets.map(ticket => `
            <button class="support-ticket-row ${ticket.id === selectedSupportTicketId ? 'support-ticket-active' : ''}" type="button" data-ticket-id="${ticket.id}">
                <span class="support-ticket-main">
                    <strong>№${ticket.id} · ${escapeHtml(ticket.title)}</strong>
                    <small>${escapeHtml(supportCategoryMap[ticket.category] || ticket.category)} · ${dateTime(ticket.updated_at)}</small>
                    ${currentRole === 'admin' ? `<small>Пользователь: ${escapeHtml(ticket.username || '—')}</small>` : ''}
                </span>
                <span class="support-ticket-side">
                    <em class="support-status support-status-${ticket.status}">${supportStatusMap[ticket.status] || ticket.status}</em>
                    ${Number(ticket.unread_count || 0) > 0 ? `<b class="support-unread">${ticket.unread_count}</b>` : ''}
                </span>
            </button>
        `).join('');
    }

    async function loadSupportTickets() {
        if (!supportTicketsList) return;
        if (supportTitle) supportTitle.textContent = currentRole === 'admin' ? 'Обращения пользователей' : 'Техническая поддержка';
        if (supportSubtitle) supportSubtitle.textContent = currentRole === 'admin'
            ? 'Просматривайте обращения, отвечайте пользователям и закрывайте решённые тикеты.'
            : 'Создайте обращение, приложите скриншоты и ожидайте ответа администратора.';
        if (supportNewTicketBtn) supportNewTicketBtn.classList.toggle('hidden', currentRole === 'admin');
        if (currentRole === 'admin') toggleSupportCreatePanel(false);
        if (supportCloseTicketBtn) supportCloseTicketBtn.classList.toggle('hidden', currentRole !== 'admin' || !selectedSupportTicketId);

        supportTicketsList.innerHTML = '<div class="shop-muted">Загрузка обращений...</div>';
        try {
            const data = await api('/api/support/tickets');
            const tickets = data.tickets || [];
            renderSupportTickets(tickets);
            await refreshSupportBadge();
            if (selectedSupportTicketId && !tickets.some(t => t.id === selectedSupportTicketId)) {
                selectedSupportTicketId = null;
                if (supportTicketDetail) supportTicketDetail.innerHTML = 'Выберите обращение из списка.';
                if (supportMessageForm) supportMessageForm.classList.add('hidden');
            }
        } catch (err) {
            supportTicketsList.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    function renderAttachmentLinks(attachments) {
        if (!attachments || !attachments.length) return '';
        return `<div class="support-attachments">${attachments.map(file => `
            <a href="${escapeHtml(file.file_url)}" target="_blank" rel="noopener">📎 ${escapeHtml(file.original_filename)}</a>
        `).join('')}</div>`;
    }

    function renderSupportDetail(ticket) {
        if (!supportTicketDetail) return;
        const closed = ticket.status === 'closed';
        supportTicketDetail.classList.remove('empty-state');
        supportTicketDetail.innerHTML = `
            <div class="support-detail-head">
                <div>
                    <h3>№${ticket.id} · ${escapeHtml(ticket.title)}</h3>
                    <p>${escapeHtml(supportCategoryMap[ticket.category] || ticket.category)} · ${supportStatusMap[ticket.status] || ticket.status} · ${dateTime(ticket.created_at)}</p>
                    ${currentRole === 'admin' ? `<p>Автор: <b>${escapeHtml(ticket.username || '—')}</b></p>` : ''}
                </div>
            </div>
            <div class="support-messages">
                ${(ticket.messages || []).map(message => `
                    <div class="support-message ${message.is_admin ? 'support-message-admin' : 'support-message-user'}">
                        <div class="support-message-meta">
                            <strong>${message.is_admin ? 'Администратор' : escapeHtml(message.username || 'Пользователь')}</strong>
                            <span>${dateTime(message.created_at)}</span>
                        </div>
                        ${message.body ? `<p>${escapeHtml(message.body).replace(/\n/g, '<br>')}</p>` : ''}
                        ${renderAttachmentLinks(message.attachments)}
                    </div>
                `).join('')}
            </div>
            ${closed ? '<div class="cart-unavailable-notice">Обращение закрыто. Новые сообщения недоступны.</div>' : ''}
        `;
        if (supportMessageForm) supportMessageForm.classList.toggle('hidden', closed);
        if (supportCloseTicketBtn) supportCloseTicketBtn.classList.toggle('hidden', currentRole !== 'admin' || closed);
    }

    async function openSupportTicket(ticketId) {
        selectedSupportTicketId = Number(ticketId);
        if (supportTicketDetail) supportTicketDetail.innerHTML = '<div class="shop-muted">Загрузка переписки...</div>';
        try {
            const ticket = await api(`/api/support/tickets/${selectedSupportTicketId}`);
            renderSupportDetail(ticket);
            await loadSupportTickets();
            await refreshSupportBadge();
        } catch (err) {
            if (supportTicketDetail) supportTicketDetail.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    function appendFilesToFormData(formData, input) {
        if (!input || !input.files) return;
        Array.from(input.files).forEach(file => formData.append('attachments', file));
    }

    async function loadAdminUsers() {
        if (!adminUsersBody) return;
        adminUsersBody.innerHTML = '<div class="shop-muted">Загрузка пользователей...</div>';
        try {
            const data = await api('/api/admin/users');
            const users = data.users || [];
            if (!users.length) {
                adminUsersBody.innerHTML = '<div class="empty-state">Пользователей пока нет.</div>';
                return;
            }
            adminUsersBody.innerHTML = users.map(user => `
                <div class="admin-user-row ${Number(user.id) === Number(currentUserId) ? 'admin-user-self' : ''}" data-user-id="${user.id}">
                    <div>
                        <strong>${escapeHtml(user.username)}${Number(user.id) === Number(currentUserId) ? ' <em class="self-user-badge">это вы</em>' : ''}</strong>
                        <span>${user.role === 'admin' ? 'Администратор' : 'Пользователь'} · создан: ${dateTime(user.created_at)}</span>
                    </div>
                    <div class="admin-user-actions">
                        <button class="secondary-btn edit-user-btn" type="button">Редактировать</button>
                        <button class="danger-btn delete-user-btn" type="button" ${Number(user.id) === Number(currentUserId) ? 'disabled title="Нельзя удалить собственную учётную запись"' : ''}>Удалить</button>
                    </div>
                </div>
            `).join('');
            adminUsersBody.querySelectorAll('.admin-user-row').forEach(row => {
                const user = users.find(item => String(item.id) === row.dataset.userId);
                row.querySelector('.edit-user-btn')?.addEventListener('click', () => fillAdminUserForm(user));
                row.querySelector('.delete-user-btn')?.addEventListener('click', () => deleteAdminUser(user));
            });
        } catch (err) {
            adminUsersBody.innerHTML = `<div class="shop-error">${escapeHtml(err.message)}</div>`;
        }
    }

    function resetAdminUserForm() {
        if (!adminUserForm) return;
        adminUserForm.reset();
        if (adminUserId) adminUserId.value = '';
        if (adminUserFormTitle) adminUserFormTitle.textContent = 'Новая учётная запись';
        if (adminUserRoleSelect) adminUserRoleSelect.disabled = false;
        if (adminUserPasswordInput) adminUserPasswordInput.required = true;
        setFormError(adminUserFormError, '');
    }

    function fillAdminUserForm(user) {
        if (!user) return;
        if (adminUserId) adminUserId.value = user.id;
        if (adminUsernameInput) adminUsernameInput.value = user.username || '';
        if (adminUserRoleSelect) {
            adminUserRoleSelect.value = user.role || 'user';
            adminUserRoleSelect.disabled = Number(user.id) === Number(currentUserId);
        }
        if (adminUserPasswordInput) {
            adminUserPasswordInput.value = '';
            adminUserPasswordInput.required = false;
        }
        if (adminUserFormTitle) adminUserFormTitle.textContent = `Редактирование: ${user.username}`;
        setFormError(adminUserFormError, '');
    }

    async function deleteAdminUser(user) {
        if (!user) return;
        if (Number(user.id) === Number(currentUserId)) {
            toast('Нельзя удалить собственную учётную запись.', 'error');
            return;
        }
        const confirmed = typeof window.showAppConfirm === 'function'
            ? await window.showAppConfirm({
                title: 'Удаление учётной записи',
                message: `Удалить пользователя ${user.username}? Заказы и аудит останутся в системе.`,
                confirmText: 'Удалить',
                confirmClass: 'danger-btn'
            })
            : window.confirm(`Удалить пользователя ${user.username}?`);
        if (!confirmed) return;
        try {
            await api(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            toast('Учётная запись удалена.', 'success');
            resetAdminUserForm();
            await loadAdminUsers();
            if (activeSection === 'activity') await loadActivityLogs();
        } catch (err) {
            toast(err.message, 'error');
        }
    }

    function downloadCsv(url) {
        window.location.href = url;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '0';
    }

    function openCheckoutModal() {
        if (checkoutError) checkoutError.classList.add('hidden');
        if (checkoutModal) checkoutModal.classList.remove('hidden');
    }

    function closeCheckoutModal() {
        if (checkoutModal) checkoutModal.classList.add('hidden');
    }

    function openPaymentModal(order) {
        if (!paymentModal || !order) return;
        activePaymentOrder = order;
        if (paymentError) paymentError.classList.add('hidden');
        if (paymentOrderId) paymentOrderId.textContent = order.id || '—';
        if (paymentAmount) paymentAmount.textContent = money(order.total_amount || 0);
        if (paymentForm) paymentForm.reset();
        paymentModal.classList.remove('hidden');
        setTimeout(() => paymentCardNumberInput?.focus(), 0);
    }

    function closePaymentModal() {
        if (paymentModal) paymentModal.classList.add('hidden');
        activePaymentOrder = null;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[ch]));
    }

    function formatPaymentCardNumber(value) {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    }

    function formatPaymentExpiry(value) {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
        if (digits.length <= 2) return digits;
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    function formatPaymentCvv(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 4);
    }

    function paymentValidationMessage() {
        const cardDigits = String(paymentCardNumberInput?.value || '').replace(/\D/g, '');
        const expiry = paymentExpiryInput?.value || '';
        const cvv = String(paymentCvvInput?.value || '').replace(/\D/g, '');
        const month = Number(expiry.slice(0, 2));

        if (cardDigits.length !== 16) {
            return 'Введите 16 цифр номера карты. Пример: 4111 1111 1111 1111.';
        }
        if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12) {
            return 'Введите срок действия в формате ММ/ГГ. Пример: 12/28.';
        }
        if (cvv.length < 3 || cvv.length > 4) {
            return 'Введите CVV/CVC из 3 или 4 цифр. Пример: 123.';
        }
        if (!String(paymentCardHolderInput?.value || '').trim()) {
            return 'Введите имя держателя карты. Пример: IVAN IVANOV.';
        }
        return '';
    }


    if (paymentCardNumberInput) {
        paymentCardNumberInput.addEventListener('input', () => {
            paymentCardNumberInput.value = formatPaymentCardNumber(paymentCardNumberInput.value);
        });
    }
    if (paymentExpiryInput) {
        paymentExpiryInput.addEventListener('input', () => {
            paymentExpiryInput.value = formatPaymentExpiry(paymentExpiryInput.value);
        });
    }
    if (paymentCvvInput) {
        paymentCvvInput.addEventListener('input', () => {
            paymentCvvInput.value = formatPaymentCvv(paymentCvvInput.value);
        });
    }

    if (navCatalogBtn) navCatalogBtn.addEventListener('click', () => showSection('catalog'));
    if (navCartBtn) navCartBtn.addEventListener('click', () => showSection('cart'));
    if (navMyOrdersBtn) navMyOrdersBtn.addEventListener('click', () => showSection('myOrders'));
    if (navSupportBtn) navSupportBtn.addEventListener('click', () => showSection('support'));
    if (supportHintBtn) supportHintBtn.addEventListener('click', async () => {
        await showSection('support');
        toggleSupportCreatePanel(true);
    });
    if (supportNewTicketBtn) supportNewTicketBtn.addEventListener('click', () => toggleSupportCreatePanel());
    if (supportCancelCreateBtn) supportCancelCreateBtn.addEventListener('click', () => toggleSupportCreatePanel(false));
    if (navDashboardBtn) navDashboardBtn.addEventListener('click', () => showSection('dashboard'));
    if (navAdminOrdersBtn) navAdminOrdersBtn.addEventListener('click', () => showSection('adminOrders'));
    if (navAdminUsersBtn) navAdminUsersBtn.addEventListener('click', () => showSection('adminUsers'));
    if (navAdminSupportBtn) navAdminSupportBtn.addEventListener('click', () => showSection('adminSupport'));
    if (navActivityBtn) navActivityBtn.addEventListener('click', () => showSection('activity'));
    if (navCatalogControlBtn) navCatalogControlBtn.addEventListener('click', () => showSection('catalogControl'));


    if (refreshSupportBtn) refreshSupportBtn.addEventListener('click', loadSupportTickets);
    if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadAdminUsers);
    if (adminUserResetBtn) adminUserResetBtn.addEventListener('click', resetAdminUserForm);

    if (supportTicketsList) {
        supportTicketsList.addEventListener('click', (e) => {
            const row = e.target.closest('.support-ticket-row');
            if (!row) return;
            openSupportTicket(row.dataset.ticketId);
        });
    }

    if (supportTicketForm) {
        supportTicketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setFormError(supportTicketFormError, '');
            const formData = new FormData();
            formData.append('title', supportTicketTitleInput.value.trim());
            formData.append('category', supportTicketCategorySelect.value);
            formData.append('description', supportTicketDescriptionInput.value.trim());
            appendFilesToFormData(formData, supportTicketFilesInput);
            try {
                const ticket = await api('/api/support/tickets', { method: 'POST', body: formData });
                supportTicketForm.reset();
                toggleSupportCreatePanel(false);
                toast('Обращение отправлено администратору.', 'success');
                await loadSupportTickets();
                await openSupportTicket(ticket.id);
            } catch (err) {
                setFormError(supportTicketFormError, err.message);
            }
        });
    }

    if (supportMessageForm) {
        supportMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setFormError(supportMessageError, '');
            if (!selectedSupportTicketId) return;
            const formData = new FormData();
            formData.append('message', supportMessageInput.value.trim());
            appendFilesToFormData(formData, supportMessageFilesInput);
            try {
                await api(`/api/support/tickets/${selectedSupportTicketId}/messages`, { method: 'POST', body: formData });
                supportMessageForm.reset();
                await openSupportTicket(selectedSupportTicketId);
                await refreshSupportBadge();
            } catch (err) {
                setFormError(supportMessageError, err.message);
            }
        });
    }

    if (supportCloseTicketBtn) {
        supportCloseTicketBtn.addEventListener('click', async () => {
            if (!selectedSupportTicketId) return;
            const confirmed = typeof window.showAppConfirm === 'function'
                ? await window.showAppConfirm({
                    title: 'Закрытие обращения',
                    message: 'Закрыть обращение как решённое?',
                    confirmText: 'Закрыть',
                    confirmClass: 'danger-btn'
                })
                : window.confirm('Закрыть обращение?');
            if (!confirmed) return;
            try {
                await api(`/api/support/tickets/${selectedSupportTicketId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'closed' })
                });
                toast('Обращение закрыто.', 'success');
                await openSupportTicket(selectedSupportTicketId);
            } catch (err) {
                toast(err.message, 'error');
            }
        });
    }

    if (adminUserForm) {
        adminUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setFormError(adminUserFormError, '');
            const editingId = adminUserId.value;
            const payload = {
                username: adminUsernameInput.value.trim(),
                role: adminUserRoleSelect.disabled ? 'admin' : adminUserRoleSelect.value,
                password: adminUserPasswordInput.value
            };
            if (editingId && !payload.password) delete payload.password;
            try {
                await api(editingId ? `/api/admin/users/${editingId}` : '/api/admin/users', {
                    method: editingId ? 'PUT' : 'POST',
                    body: JSON.stringify(payload)
                });
                toast(editingId ? 'Учётная запись обновлена.' : 'Учётная запись создана.', 'success');
                resetAdminUserForm();
                await loadAdminUsers();
            } catch (err) {
                setFormError(adminUserFormError, err.message);
            }
        });
    }

    if (refreshCatalogControlBtn) refreshCatalogControlBtn.addEventListener('click', loadCatalogControl);
    if (exportWarningsBtn) exportWarningsBtn.addEventListener('click', () => downloadCsv('/api/export/catalog_warnings'));
    if (exportProductsBtn) exportProductsBtn.addEventListener('click', () => downloadCsv('/api/export/products?mode=active'));
    if (exportArchiveBtn) exportArchiveBtn.addEventListener('click', () => downloadCsv('/api/export/products?mode=archive'));
    if (exportOrdersBtn) exportOrdersBtn.addEventListener('click', () => downloadCsv('/api/export/orders'));

    if (catalogControlBody) {
        catalogControlBody.addEventListener('click', (e) => {
            const row = e.target.closest('.control-product-row');
            if (!row) return;
            const offerId = row.dataset.offerId;
            if (offerId && typeof window.loadProductDetail === 'function') {
                window.loadProductDetail(offerId);
            } else if (offerId) {
                document.getElementById('navCatalogBtn')?.click();
            }
        });
    }

    if (cartList) {
        cartList.addEventListener('change', async (e) => {
            if (!e.target.classList.contains('cart-qty')) return;
            const row = e.target.closest('.cart-item');
            const input = e.target;
            const prevQty = Number(row.dataset.prevQty || input.defaultValue || 1);
            const nextQty = Math.max(1, Number(input.value || 1));
            input.value = nextQty;
            row.classList.add('cart-item-updating');
            recalcCartTotals();
            try {
                await api(`/api/cart/${row.dataset.cartId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity: nextQty })
                });
                row.classList.remove('cart-item-updating');
                await loadCart();
                await refreshCartBadge();
            } catch (err) {
                input.value = prevQty;
                row.classList.remove('cart-item-updating');
                recalcCartTotals();
                toast(err.message, 'error');
            }
        });

        cartList.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('cart-delete-btn')) return;
            const row = e.target.closest('.cart-item');
            try {
                await api(`/api/cart/${row.dataset.cartId}`, { method: 'DELETE' });
                await loadCart();
                await refreshCartBadge();
            } catch (err) {
                toast(err.message, 'error');
            }
        });
    }

        if (ordersBody) {
            ordersBody.addEventListener('click', async (e) => {
                const saveBtn = e.target.closest('.save-order-status-btn');
                const cancelBtn = e.target.closest('.cancel-order-btn');
                const payBtn = e.target.closest('.pay-order-btn');

                if (saveBtn) {
                    const card = saveBtn.closest('.order-card');
                    const orderSelect = card.querySelector('.order-status-select');
                    const paymentSelect = card.querySelector('.payment-status-select');

                    try {
                        await api(`/api/orders/${card.dataset.orderId}/admin_update`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                status: orderSelect.value,
                                payment_status: paymentSelect.value
                            })
                        });

                        await loadOrders(true);
                        await loadMainDashboard();
                        toast('Заказ обновлён.', 'success');
                    } catch (err) {
                        toast(err.message, 'error');
                    }

                    return;
        }

            if (payBtn) {
                const card = payBtn.closest('.order-card');
                openPaymentModal({ id: card.dataset.orderId, total_amount: Number(card.dataset.orderTotal || 0) });
                return;
            }

            if (cancelBtn) {
                const card = cancelBtn.closest('.order-card');
                const orderId = card.dataset.orderId;
                const confirmed = typeof window.showAppConfirm === 'function'
                    ? await window.showAppConfirm({
                        title: 'Отмена заказа',
                        message: 'Вы действительно хотите отменить этот заказ?',
                        confirmText: 'Отменить заказ',
                        confirmClass: 'danger-btn'
                    })
                    : window.confirm('Вы действительно хотите отменить этот заказ?');
                if (!confirmed) return;
                try {
                    await api(`/api/orders/${orderId}/cancel`, { method: 'PUT' });
                    await loadOrders(false);
                    await loadCart();
                    toast('Заказ отменён.', 'success');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        });
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
    if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);
    if (checkoutCancelBtn) checkoutCancelBtn.addEventListener('click', closeCheckoutModal);
    if (checkoutModal) checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) closeCheckoutModal();
    });

    if (paymentClose) paymentClose.addEventListener('click', closePaymentModal);
    if (paymentCancelBtn) paymentCancelBtn.addEventListener('click', closePaymentModal);
    if (paymentModal) paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) closePaymentModal();
    });

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (checkoutError) checkoutError.classList.add('hidden');
            try {
                const order = await api('/api/orders', {
                    method: 'POST',
                    body: JSON.stringify({
                        customer_name: customerNameInput.value,
                        customer_phone: customerPhoneInput.value,
                        customer_comment: customerCommentInput.value,
                        payment_method: checkoutPaymentMethodSelect?.value || 'test_card'
                    })
                });
                checkoutForm.reset();
                closeCheckoutModal();
                await refreshCartBadge();
                await showSection('myOrders');
                if (order.payment_method === 'test_card' && order.payment_status === 'pending') {
                    toast('Заказ создан. Перейдите к демонстрационной оплате.', 'success');
                    openPaymentModal(order);
                } else {
                    toast('Заказ успешно оформлен. Оплата будет выполнена при получении.', 'success');
                }
            } catch (err) {
                checkoutError.textContent = err.message;
                checkoutError.classList.remove('hidden');
            }
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!activePaymentOrder) return;
            if (paymentError) paymentError.classList.add('hidden');
            const validationError = paymentValidationMessage();
            if (validationError) {
                if (paymentError) {
                    paymentError.textContent = validationError;
                    paymentError.classList.remove('hidden');
                } else {
                    toast(validationError, 'error');
                }
                return;
            }
            try {
                await api(`/api/orders/${activePaymentOrder.id}/pay`, {
                    method: 'POST',
                    body: JSON.stringify({
                        card_number: paymentCardNumberInput.value,
                        card_holder: paymentCardHolderInput.value,
                        expiry: paymentExpiryInput.value,
                        cvv: paymentCvvInput.value
                    })
                });
                closePaymentModal();
                await loadOrders(currentRole === 'admin');
                await loadMainDashboard();
                toast('Оплата прошла успешно. Заказ передан в обработку.', 'success');
            } catch (err) {
                if (paymentError) {
                    paymentError.textContent = err.message;
                    paymentError.classList.remove('hidden');
                } else {
                    toast(err.message, 'error');
                }
            }
        });
    }

    // Кнопки карточек теперь рендерятся сразу в renderProducts(), без MutationObserver.

    if (authStatus) {
        new MutationObserver(() => syncAuthState()).observe(authStatus, { attributes: true, childList: true, subtree: true });
    }
    if (authForms) {
        new MutationObserver(() => syncAuthState()).observe(authForms, { attributes: true });
    }

    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'logoutBtn')) {
            setTimeout(() => hideShell(), 300);
        }
    });

    setTimeout(syncAuthState, 250);
    setInterval(() => {
        if (shopNav && !shopNav.classList.contains('hidden')) {
            refreshSupportBadge();
            if ((activeSection === 'support' || activeSection === 'adminSupport') && !selectedSupportTicketId) {
                loadSupportTickets();
            }
        }
    }, 30000);
});
