document.addEventListener('DOMContentLoaded', () => {
    // --- Получаем элементы DOM ---
    const getProductsBtn = document.getElementById('getProductsBtn');
    const loadFromDbBtn = document.getElementById('loadFromDbBtn');
    const emptyDbMessage = document.getElementById('emptyDbMessage');
    const productsList = document.getElementById('productsList');
    const catalogCommandEyebrow = document.getElementById('catalogCommandEyebrow');
    const catalogCommandTitle = document.getElementById('catalogCommandTitle');
    const catalogCommandDescription = document.getElementById('catalogCommandDescription');
    const productsSectionTitle = document.getElementById('productsSectionTitle');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const productsContainer = document.getElementById('productsContainer');

    // Авторизация / статус
    const authStatusDiv = document.getElementById('authStatus');
    const welcomeMessageSpan = document.getElementById('welcomeMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const authFormsDiv = document.getElementById('authForms');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const loginErrorDiv = document.getElementById('loginError');
    const registerErrorDiv = document.getElementById('registerError');

    //Модальное окно товара
    const productModal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalOfferId = document.getElementById('modalOfferId');
    const modalProductId = document.getElementById('modalProductId');
    const modalPrice = document.getElementById('modalPrice');
    const modalLastSynced = document.getElementById('modalLastSynced');

    // Фильтры
    const filtersDiv = document.getElementById('filters');
    const searchInput = document.getElementById('searchInput');
    const minPriceInput = document.getElementById('minPriceInput');
    const maxPriceInput = document.getElementById('maxPriceInput');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    // Пагинация
    const paginationDiv = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfoSpan = document.getElementById('pageInfo');

    //Сортировка
    const sortBySelect = document.getElementById('sortBySelect');
    const sortDirSelect = document.getElementById('sortDirSelect');

    //Логи синхнронизации
    const syncLogsContainer = document.getElementById('syncLogsContainer');
    const syncLogsBody = document.getElementById('syncLogsBody');

    const addProductBtn = document.getElementById('addProductBtn');

    const modalTitle = document.getElementById('modalTitle');
    const modalNameInput = document.getElementById('modalNameInput');
    const modalOfferIdInput = document.getElementById('modalOfferIdInput');
    const modalProductIdInput = document.getElementById('modalProductIdInput');
    const modalPriceInput = document.getElementById('modalPriceInput');
    const modalStockInput = document.getElementById('modalStockInput');
    const modalImageUrlInput = document.getElementById('modalImageUrlInput');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    //вкладки в списке
    const tabActive = document.getElementById('tabActive');
    const tabArchive = document.getElementById('tabArchive');
    const archiveEmpty = document.getElementById('archiveEmpty');

    //модалка параметров синхронизации
    const syncOptionsModal = document.getElementById('syncOptionsModal');
    const syncOptionsClose = document.getElementById('syncOptionsClose');
    const confirmSyncBtn = document.getElementById('confirmSyncBtn');
    const cancelSyncBtn = document.getElementById('cancelSyncBtn');
    const overwriteManualCheckbox = document.getElementById('overwriteManualCheckbox');
    const overwriteHiddenCheckbox = document.getElementById('overwriteHiddenCheckbox');

    //вкладки
    const catalogControlsBar = document.getElementById('catalogControlsBar');
    const catalogHero = document.getElementById('catalogHero');

    //модалка истории
    const modalHistoryBtn = document.getElementById('modalHistoryBtn');
    const historyModal = document.getElementById('historyModal');
    const historyBody = document.getElementById('historyBody');
    const historyClose = document.getElementById('historyClose');
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    
    //предупреждение о количестве символов
    const modalFormError = document.getElementById('modalFormError');
    //счётчик подстветка
    const nameCounter = document.getElementById('nameCounter');
    const urlCounter = document.getElementById('urlCounter');

    const authPanelTitle = document.getElementById('authPanelTitle');
    const toastViewport = document.getElementById('toastViewport');
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalText = document.getElementById('confirmModalText');
    const confirmModalAccept = document.getElementById('confirmModalAccept');
    const confirmModalCancel = document.getElementById('confirmModalCancel');
    const confirmModalClose = document.getElementById('confirmModalClose');

    let modalMode = 'view'; 
    let modalCurrentOfferId = null;
    let currentUserRole = "user";
    let currentListMode = 'active';

    let currentPage = 1;
    let totalPages = 1;
    const PER_PAGE = 10;

    //Вспомогательные функции UI

    function showCatalogToolbar() {
        if (catalogControlsBar) catalogControlsBar.classList.remove('hidden');
    }

    function hideCatalogToolbar() {
        if (catalogControlsBar) catalogControlsBar.classList.add('hidden');
    }

    function showToast(message, type = 'info', duration = 3200) {
        if (!toastViewport) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<strong>${type === 'success' ? 'Готово' : type === 'error' ? 'Ошибка' : 'Уведомление'}</strong><span>${message}</span>`;
        toastViewport.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
        const removeToast = () => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 220);
        };
        setTimeout(removeToast, duration);
        toast.addEventListener('click', removeToast);
    }
    window.showAppToast = showToast;

    function openConfirmModal({ title = 'Подтверждение', message = 'Подтвердите действие', confirmText = 'Подтвердить', confirmClass = '' } = {}) {
        return new Promise((resolve) => {
            if (!confirmModal) {
                resolve(window.confirm(message));
                return;
            }
            confirmModalTitle.textContent = title;
            confirmModalText.textContent = message;
            confirmModalAccept.textContent = confirmText;
            confirmModalAccept.className = confirmClass ? confirmClass : '';
            confirmModalAccept.classList.add('btn-confirm');
            confirmModal.classList.remove('hidden');

            const cleanup = (result) => {
                confirmModal.classList.add('hidden');
                confirmModalAccept.removeEventListener('click', onAccept);
                confirmModalCancel.removeEventListener('click', onCancel);
                confirmModalClose.removeEventListener('click', onCancel);
                confirmModal.removeEventListener('click', onBackdrop);
                document.removeEventListener('keydown', onEsc);
                resolve(result);
            };
            const onAccept = () => cleanup(true);
            const onCancel = () => cleanup(false);
            const onBackdrop = (e) => { if (e.target === confirmModal) cleanup(false); };
            const onEsc = (e) => { if (e.key === 'Escape') cleanup(false); };

            confirmModalAccept.addEventListener('click', onAccept);
            confirmModalCancel.addEventListener('click', onCancel);
            confirmModalClose.addEventListener('click', onCancel);
            confirmModal.addEventListener('click', onBackdrop);
            document.addEventListener('keydown', onEsc);
        });
    }
    window.showAppConfirm = openConfirmModal;

    function openHistoryModal() {
    historyModal.classList.remove('hidden');
    }

    function closeHistoryModal() {
    historyModal.classList.add('hidden');
    }

    if (historyClose) historyClose.addEventListener('click', closeHistoryModal);
    if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistoryModal);

    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) closeHistoryModal();
    });
    }

    function updateCounter(inputEl, counterEl, maxLen) {
        if (!inputEl || !counterEl) return;

        const len = (inputEl.value || '').length;
        counterEl.textContent = `${len} / ${maxLen}`;

        // сбрасываем классы
        counterEl.classList.remove('warn', 'danger');
        inputEl.classList.remove('input-warn', 'input-danger');

        // пороги
        const warnAt = Math.floor(maxLen * 0.85);

        if (len > maxLen) {
        counterEl.classList.add('danger');
        inputEl.classList.add('input-danger');
        } else if (len >= warnAt) {
        counterEl.classList.add('warn');
        inputEl.classList.add('input-warn');
    }
    }

    function validateModalFormLive() {
        // базовые правила
        const nameVal = modalNameInput.value.trim();
        const nameLen = modalNameInput.value.length;
        const nameMax = parseInt(modalNameInput.getAttribute('maxlength') || '120', 10);

        const urlMax = modalImageUrlInput
        ? parseInt(modalImageUrlInput.getAttribute('maxlength') || '400', 10)
        : 0;
        const urlLen = modalImageUrlInput ? modalImageUrlInput.value.length : 0;

        const nameOk = nameVal.length > 0 && nameLen <= nameMax;
        const urlOk = !modalImageUrlInput || urlLen <= urlMax;

        // если форма невалидна — блокируем сохранение
        if (modalSaveBtn) {
            modalSaveBtn.disabled = !(nameOk && urlOk);
    }
    }

    if (modalNameInput) {
        modalNameInput.addEventListener('input', () => {
        updateCounter(modalNameInput, nameCounter, 120);
        validateModalFormLive();
    });
    }

    if (modalImageUrlInput && urlCounter) {
        modalImageUrlInput.addEventListener('input', () => {
        updateCounter(modalImageUrlInput, urlCounter, 400);
        validateModalFormLive();
    });
    }

    function formatAction(action) {
        const map = {
            create_local: 'Создан локально',
            update: 'Изменён',
            delete: 'Удалён (в архив)',
            restore: 'Восстановлен',
        };
        return map[action] || action;
    }

    function showModalError(msg) {
        if (!modalFormError) return;
        modalFormError.textContent = msg;
        modalFormError.classList.remove('hidden');
    }

    function hideModalError() {
        if (!modalFormError) return;
        modalFormError.textContent = '';
        modalFormError.classList.add('hidden');
    }

    function renderHistory(changes) {
        historyBody.innerHTML = '';

        if (!changes || changes.length === 0) {
            historyBody.innerHTML = `<div class="history-empty">История пуста.</div>`;
            return;
    }

    changes.forEach(c => {
        const when = c.changed_at ? new Date(c.changed_at).toLocaleString() : '—';
        const actionText = formatAction(c.action);

    
        const beforeName = c.before?.name;
        const afterName = c.after?.name;

        const beforePrice = c.before?.price;
        const afterPrice = c.after?.price;

        const diffLines = [];
        if (beforeName !== undefined && afterName !== undefined && beforeName !== afterName) {
            diffLines.push(`Название: "${beforeName}" → "${afterName}"`);
        }
        if (beforePrice !== undefined && afterPrice !== undefined && beforePrice !== afterPrice) {
            diffLines.push(`Цена: ${beforePrice} → ${afterPrice}`);
        }

        const beforeStock = c.before?.stock;
        const afterStock = c.after?.stock;

        if (beforeStock !== undefined && afterStock !== undefined && beforeStock !== afterStock) {
            const b = (beforeStock === null) ? "—" : beforeStock;
            const a = (afterStock === null) ? "—" : afterStock;
            diffLines.push(`Остаток: ${b} → ${a}`);
        }

        const beforeHidden = c.before?.is_hidden;
        const afterHidden = c.after?.is_hidden;

        if (beforeHidden !== undefined && afterHidden !== undefined && beforeHidden !== afterHidden) {
            const human = (v) => (v ? "Да" : "Нет");
            diffLines.push(`Скрыт: ${human(beforeHidden)} → ${human(afterHidden)}`);
        }

        const beforeImg = c.before?.image_url;
        const afterImg  = c.after?.image_url;

        if (beforeImg !== undefined && afterImg !== undefined && beforeImg !== afterImg) {
            diffLines.push(`URL изображения изменён`);
        }

        let diffHtml = '';

        if (diffLines.length) {
            diffHtml = diffLines.map(x => `<div>• ${x}</div>`).join('');
        } else {
            
        if (c.action !== 'create_local') {
            diffHtml = `<div>• Детали изменений не отображены</div>`;
        }
    }   
        const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
            <div class="history-top">
                <span class="history-action">${actionText}</span>
                <span class="history-time">${when}</span>
            </div>
            <div class="history-diff">${diffHtml}</div>
            `;
            historyBody.appendChild(el);
        });
    }

    if (modalHistoryBtn) {
        modalHistoryBtn.addEventListener('click', async () => {
        if (!modalCurrentOfferId) return;

        try {
            historyBody.innerHTML = 'Загрузка...';

            const resp = await fetch(`/api/products/${encodeURIComponent(modalCurrentOfferId)}/changes?limit=50`, {
                credentials: 'include'
        });

        const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                historyBody.innerHTML = `<div class="history-empty">Не удалось загрузить историю.</div>`;
                openHistoryModal();
            return;
        }

            renderHistory(data.changes || []);
            openHistoryModal();
            } catch (e) {
            console.error('History load error', e);
            historyBody.innerHTML = `<div class="history-empty">Ошибка загрузки истории.</div>`;
            openHistoryModal();
        }
        });
    }

    function showAuthForms() {
        document.body.classList.remove('authenticated');
        authFormsDiv.classList.remove('hidden');
        authStatusDiv.classList.add('hidden');
        productsContainer.classList.add('hidden');
        filtersDiv.classList.add('hidden');
        paginationDiv.classList.add('hidden');
        hideCatalogToolbar();
        if (catalogHero) catalogHero.classList.add('hidden');

        if (syncLogsContainer) {
        syncLogsContainer.classList.add('hidden');
        }
        if (syncLogsBody) {
        syncLogsBody.innerHTML = '';
        }
        if (loadFromDbBtn) loadFromDbBtn.classList.add('hidden');
        if (emptyDbMessage) emptyDbMessage.classList.add('hidden');
        hideCatalogToolbar();
    }

    function applyRoleUI() {
    const isAdmin = currentUserRole === "admin";

     const addBtn = document.getElementById("addProductBtn");
     const logsContainer = document.getElementById("syncLogsContainer");
     const myOrdersBtn = document.getElementById("navMyOrdersBtn");
     const navCartBtn = document.getElementById("navCartBtn");
     const tabsContainer = document.querySelector('.tabs');

     if (addBtn) addBtn.style.display = (isAdmin && currentListMode === 'active') ? "inline-flex" : "none";
     if (logsContainer) logsContainer.style.display = isAdmin ? "block" : "none";
     if (tabArchive) tabArchive.style.display = isAdmin ? "inline-flex" : "none";
     if (myOrdersBtn) myOrdersBtn.style.display = isAdmin ? "none" : "inline-flex";
     if (navCartBtn) navCartBtn.style.display = isAdmin ? "none" : "inline-flex";
     if (archiveEmpty) archiveEmpty.classList.add('hidden');
     if (tabsContainer) tabsContainer.style.display = isAdmin ? "inline-flex" : "inline-flex";

     if (catalogCommandEyebrow) catalogCommandEyebrow.textContent = isAdmin ? 'Каталог товаров' : 'Витрина магазина';
     if (catalogCommandTitle) catalogCommandTitle.textContent = isAdmin ? 'Управление локальным каталогом' : 'Каталог автокомплектующих';
     if (catalogCommandDescription) catalogCommandDescription.textContent = isAdmin
        ? 'Загружайте товары из локальной базы или выполняйте синхронизацию с Ozon прямо из каталога.'
        : 'Просматривайте ассортимент магазина, добавляйте товары в корзину и оформляйте заказы.';
     if (productsSectionTitle) productsSectionTitle.textContent = isAdmin ? 'Список товаров' : 'Список товаров';

     if (!isAdmin && currentListMode !== 'active') {
        setTab('active');
        return;
     }
    }

    function applyRoleToModal() {
    const isAdmin = currentUserRole === "admin";

    const saveBtn = document.getElementById("modalSaveBtn");
    const deleteBtn = document.getElementById("modalDeleteBtn");
    const historyBtn = document.getElementById("modalHistoryBtn");

    if (saveBtn) saveBtn.style.display = isAdmin ? "inline-block" : "none";
    if (deleteBtn) deleteBtn.style.display = isAdmin ? "inline-block" : "none";
    if (historyBtn) historyBtn.style.display = isAdmin ? "inline-block" : "none";
    
    
    }

    function showLoggedInState(username) {

        showCatalogToolbar();
        if (loadFromDbBtn) loadFromDbBtn.classList.toggle('hidden', currentUserRole !== 'admin');
        if (getProductsBtn) getProductsBtn.classList.toggle('hidden', currentUserRole !== 'admin');

        if (emptyDbMessage) emptyDbMessage.classList.add('hidden');
        document.body.classList.add('authenticated');
        authFormsDiv.classList.add('hidden');
        if (loadFromDbBtn) loadFromDbBtn.classList.toggle('hidden', currentUserRole !== 'admin');
        if (emptyDbMessage) emptyDbMessage.classList.add('hidden');
        authStatusDiv.classList.remove('hidden');
        welcomeMessageSpan.textContent = `Добро пожаловать, ${username}!`;

        errorMessage.classList.add('hidden');
        loginErrorDiv.style.display = 'none';
        registerErrorDiv.style.display = 'none';

    }

    function displayError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }


    async function refreshCartBadgeFromCatalog() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        try {
            const response = await fetch('/api/cart', { credentials: 'include' });
            if (!response.ok) return;
            const data = await response.json().catch(() => ({}));
            const count = (data.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        } catch (e) {
            // не блокируем каталог из-за бейджа корзины
        }
    }

    async function addProductToCartFromCatalog(offerId, button) {
        if (!offerId || !button) return;
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = 'Добавляем...';

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ offer_id: offerId, quantity: 1 })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Не удалось добавить товар в корзину.');
            }

            button.textContent = 'Добавлено ✓';
            if (typeof window.refreshShopCartBadge === 'function') {
                await window.refreshShopCartBadge();
            } else {
                await refreshCartBadgeFromCatalog();
            }

            setTimeout(() => {
                button.textContent = oldText;
                button.disabled = false;
            }, 850);
        } catch (error) {
            showToast(error.message || 'Не удалось добавить товар в корзину.', 'error');
            button.textContent = oldText;
            button.disabled = false;
        }
    }

    function renderProducts(products) {
        productsList.innerHTML = '';

        if (!products || products.length === 0) {
            productsList.innerHTML = '<li class="catalog-empty-card">Товары не найдены.</li>';
            return;
        }

        const isAdmin = currentUserRole === 'admin';
        const fragment = document.createDocumentFragment();

        products.forEach(product => {
            const listItem = document.createElement('li');
            listItem.className = `product-card ${isAdmin ? 'product-card-admin' : 'product-card-user'}`;
            const imageUrl = product.image_url;
            const isLocal = (product.source === 'local') || String(product.offer_id || '').startsWith('LOCAL-');
            const stockNumber = Number(product.stock ?? 0);
            const stockValue = product.stock ?? '—';
            const stockClass = stockNumber === 0 ? 'stock-zero' : '';

            const badges = [
                isAdmin && product.is_manual ? '<span class="product-chip product-chip-manual">Ручное</span>' : '',
                isAdmin && isLocal ? '<span class="product-chip product-chip-local">LOCAL</span>' : '',
                isAdmin && !isLocal ? '<span class="product-chip product-chip-ozon">Ozon</span>' : '',
                currentListMode === 'archive' ? '<span class="product-chip product-chip-archive">Архив</span>' : ''
            ].filter(Boolean).join('');

            const stockLabel = stockNumber > 0
                ? `В наличии, остаток: ${stockValue}`
                : `Нет в наличии, остаток: ${stockValue}`;

            const safeName = String(product.name ?? '');
            const thumbHtml = imageUrl
              ? `<img src="${imageUrl}" alt="${safeName}" class="product-thumbnail" loading="lazy" decoding="async"
                    onerror="this.closest('.product-thumb').classList.add('no-image'); this.remove();">`
              : `<div class="no-image-icon"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><path d="M21 15l-5-5L5 21"></path></svg></div>`;

            const userCartButton = (!isAdmin && currentListMode === 'active')
                ? (stockNumber > 0
                    ? '<button type="button" class="add-cart-btn">В корзину</button>'
                    : '<button type="button" class="add-cart-btn btn-disabled-stock" disabled>Не в наличии</button>')
                : '';

            listItem.innerHTML = `
                <div class="product-card-status-row">
                    <div class="product-card-badges">${badges}</div>
                    <span class="product-stock-badge ${stockClass}">${stockLabel}</span>
                </div>
                <div class="product-card-media">
                    <div class="product-thumb ${imageUrl ? '' : 'no-image'}">${thumbHtml}</div>
                </div>
                <div class="product-card-body">
                    ${isAdmin ? `<div class="product-card-top"><span class="product-offer-id">Offer ID: ${product.offer_id || '—'}</span></div>` : ''}
                    <span class="product-name">${safeName}</span>
                    <div class="product-card-meta ${isAdmin ? '' : 'product-card-meta-user'}">
                        <span>Product ID: ${product.product_id ?? '—'}</span>
                        ${isAdmin ? `<span>Источник: ${product.source || 'ozon'}</span>` : ''}
                    </div>
                    <div class="product-card-footer">
                        <span class="product-price">${product.price != null ? product.price + ' ₽' : 'Цена не указана'}</span>
                        ${isAdmin && currentListMode === 'archive' ? '<button type="button" class="secondary-btn product-restore-btn">Восстановить</button>' : ''}
                    </div>
                    ${userCartButton}
                </div>`;

            listItem.dataset.offerId = product.offer_id || '';
            listItem.dataset.stock = String(stockNumber);

            const restoreBtn = listItem.querySelector('.product-restore-btn');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await restoreProductFromArchive(product.offer_id);
                });
            }

            const cartBtn = listItem.querySelector('.add-cart-btn:not(.btn-disabled-stock)');
            if (cartBtn) {
                cartBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await addProductToCartFromCatalog(product.offer_id, cartBtn);
                });
            }

            listItem.addEventListener('click', (e) => {
                if (e.target.closest('.product-restore-btn') || e.target.closest('.add-cart-btn')) return;
                if (product.offer_id) loadProductDetail(product.offer_id);
            });

            fragment.appendChild(listItem);
        });

        productsList.appendChild(fragment);
    }

    async function restoreProductFromArchive(offerId) {
        const confirmed = await openConfirmModal({
            title: 'Восстановление товара',
            message: 'Вернуть этот товар из архива в активный каталог?',
            confirmText: 'Восстановить'
        });
        if (!confirmed) return;
        try {
            const response = await fetch(`/api/products_local/${encodeURIComponent(offerId)}/restore`, {
                method: 'PUT',
                credentials: 'include'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Не удалось восстановить товар.');
            showToast('Товар восстановлен из архива.', 'success');
            await loadProductsWithFilters(currentPage);
            if (typeof window.loadMainDashboardStats === 'function') window.loadMainDashboardStats();
        } catch (error) {
            console.error('Ошибка восстановления товара:', error);
            showToast(error.message || 'Не удалось восстановить товар.', 'error');
        }
    }

    function updatePaginationControls(page, total) {
        currentPage = page;
        totalPages = total;

        if (totalPages <= 1) {
            paginationDiv.classList.add('hidden');
            return;
        }

        paginationDiv.classList.remove('hidden');
        pageInfoSpan.textContent = `Страница ${page} из ${total}`;

        prevPageBtn.disabled = page <= 1;
        nextPageBtn.disabled = page >= total;
    }

    async function loadSyncLogs() {
    try {
        const response = await fetch('/api/sync_logs?limit=10', {
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('Не удалось загрузить логи синхронизации, статус:', response.status);
            return;
        }

        const data = await response.json();
        const logs = data.logs || [];

        syncLogsBody.innerHTML = '';

        if (logs.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'История синхронизаций пока пуста.';
            cell.classList.add('sync-empty');
            row.appendChild(cell);
            syncLogsBody.appendChild(row);
        } else {
            logs.forEach(log => {
                const tr = document.createElement('tr');

                const tdStart = document.createElement('td');
                const tdFinish = document.createElement('td');
                const tdStatus = document.createElement('td');
                const tdCount = document.createElement('td');
                const tdError = document.createElement('td');

                tdStart.textContent = log.started_at
                    ? new Date(log.started_at).toLocaleString()
                    : '—';

                tdFinish.textContent = log.finished_at
                    ? new Date(log.finished_at).toLocaleString()
                    : '—';

                const statusText = log.status === 'success'
                    ? 'Успех'
                    : (log.status === 'error' ? 'Ошибка' : log.status);

                tdStatus.textContent = statusText;
                tdStatus.classList.add('sync-status');
                if (log.status === 'success') {
                    tdStatus.classList.add('sync-status-success');
                } else if (log.status === 'error') {
                    tdStatus.classList.add('sync-status-error');
                }

                tdCount.textContent = log.updated_count ?? 0;

                if (log.error_message) {
                    tdError.textContent =
                        log.error_message.length > 120
                            ? log.error_message.slice(0, 117) + '…'
                            : log.error_message;
                } else {
                    tdError.textContent = '—';
                }

                tr.appendChild(tdStart);
                tr.appendChild(tdFinish);
                tr.appendChild(tdStatus);
                tr.appendChild(tdCount);
                tr.appendChild(tdError);

                syncLogsBody.appendChild(tr);
            });
        }

        if (currentUserRole === "admin") {
            syncLogsContainer.classList.remove('hidden');
        } else {
            syncLogsContainer.classList.add('hidden');
        }
    } catch (e) {
        console.error('Ошибка при загрузке логов синхронизации:', e);
    }
}

    function openProductModal() {
        productModal.classList.remove('hidden');
    }

    function closeProductModal() {
        productModal.classList.add('hidden');
    }

    modalClose.addEventListener('click', closeProductModal);

    // Закрытие по клику на фон
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            closeProductModal();
        }
    });

    // Закрытие по Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !productModal.classList.contains('hidden')) {
            closeProductModal();
        }
    });

    async function loadProductDetail(offerId) {
    try {
        const response = await fetch(`/api/products/${encodeURIComponent(offerId)}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        modalMode = (currentListMode === 'archive') ? 'view' : 'edit';
        modalCurrentOfferId = data.offer_id;

        modalNameInput.value = data.name || '';
        modalOfferIdInput.value = data.offer_id || '';
        modalProductIdInput.value = data.product_id || '';
        modalPriceInput.value = data.price != null ? data.price : '';
        if (modalStockInput) {
            const stockValue = (data.stock !== null && data.stock !== undefined) ? data.stock : '';
            modalStockInput.value = stockValue;

            if (Number(stockValue) === 0) {
                modalStockInput.classList.add('out-of-stock');
            } else {
                modalStockInput.classList.remove('out-of-stock');
            }
        }
        modalImageUrlInput.value = data.image_url || '';

        updateCounter(modalNameInput, nameCounter, 120);
        if (modalImageUrlInput) updateCounter(modalImageUrlInput, urlCounter, 400);
        validateModalFormLive();

        if (data.image_url) {
            modalImage.src = data.image_url;
            modalImage.style.display = 'block';
        } else {
            modalImage.style.display = 'none';
        }

        if (data.last_synced) {
            const d = new Date(data.last_synced);
            modalLastSynced.textContent = d.toLocaleString();
        } else {
            modalLastSynced.textContent = '—';
        }

        const isAdmin = currentUserRole === "admin";
        const isArchiveView = modalMode === 'view';
        const isViewOnly = isArchiveView || !isAdmin;

        // Заголовок
        modalTitle.textContent = isArchiveView
            ? 'Просмотр товара (архив)'
            : (isAdmin ? 'Редактирование товара' : 'Информация о товаре');

        // readonly режим
        modalNameInput.readOnly = isViewOnly;
        modalOfferIdInput.readOnly = true;   // всегда readonly
        modalProductIdInput.readOnly = true; // всегда readonly
        modalPriceInput.readOnly = isViewOnly;
        if (modalStockInput) modalStockInput.readOnly = isViewOnly;
        modalImageUrlInput.readOnly = isViewOnly;

        // Счётчики лимита символов нужны только в режиме редактирования
        if (nameCounter) nameCounter.style.display = isViewOnly ? 'none' : '';
        if (urlCounter) urlCounter.style.display = isViewOnly ? 'none' : '';

        // Кнопки
        if (isViewOnly) {
            modalSaveBtn.style.display = 'none';
            modalDeleteBtn.style.display = 'none';
            if (modalHistoryBtn) {
                modalHistoryBtn.style.display = currentUserRole === "admin" ? "inline-flex" : "none";
            }
        } else {
            applyRoleToModal();
        }
        openProductModal();
    } catch (error) {
        console.error('Ошибка при загрузке детального товара:', error);
        showToast('Не удалось загрузить подробную информацию о товаре.', 'error');
    }
}

    function closeSyncOptionsModal() {
        if (syncOptionsModal) syncOptionsModal.classList.add('hidden');
    }

    if (syncOptionsClose) {
        syncOptionsClose.addEventListener('click', closeSyncOptionsModal);
    }

    if (cancelSyncBtn) {
        cancelSyncBtn.addEventListener('click', closeSyncOptionsModal);
    }

    // закрытие по клику на фон
    if (syncOptionsModal) {
        syncOptionsModal.addEventListener('click', (e) => {
            if (e.target === syncOptionsModal) {
                closeSyncOptionsModal();
            }
        });
    }

// закрытие по Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && syncOptionsModal && !syncOptionsModal.classList.contains('hidden')) {
        closeSyncOptionsModal();
    }
});

    async function isDbEmpty() {
        const params = new URLSearchParams();
        params.append('page', 1);
        params.append('per_page', 1);

        // сортировка любая, пусть будет как по умолчанию
        try {
            const response = await fetch(`/api/products_local?${params.toString()}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                return null; // не смогли проверить
            }

            const data = await response.json().catch(() => ({}));
            const totalItems = typeof data.total_items === 'number' ? data.total_items : null;
            return totalItems === 0;
        } catch (e) {
            console.error('Ошибка проверки пустоты БД:', e);
            return null;
        }
    }

    //Загрузка товаров из БД с фильтрами и пагинацией
    async function loadProductsWithFilters(page = 1) {
        hideError(errorMessage);
        loadingMessage.classList.remove('hidden');
        if (productsList) productsList.classList.add('catalog-loading-soft');

        const params = new URLSearchParams();

        if (searchInput.value.trim() !== '') {
            params.append('q', searchInput.value.trim());
        }
        if (minPriceInput.value !== '') {
            params.append('min_price', minPriceInput.value);
        }
        if (maxPriceInput.value !== '') {
            params.append('max_price', maxPriceInput.value);
        }

        params.append('include_hidden', currentListMode === 'archive' ? 1 : 0);
        params.append('sort_by', sortBySelect.value);
        params.append('sort_dir', sortDirSelect.value);

        params.append('page', page);
        params.append('per_page', PER_PAGE);

        try {
            const response = await fetch(`/api/products_local?${params.toString()}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            loadingMessage.classList.add('hidden');
            if (productsList) productsList.classList.remove('catalog-loading-soft');
            productsContainer.classList.remove('hidden');
            filtersDiv.classList.remove('hidden');

            if (archiveEmpty) {
                if (currentListMode === 'archive' && (!data.products || data.products.length === 0)) {
                    archiveEmpty.classList.remove('hidden');
                } else {
                    archiveEmpty.classList.add('hidden');
                }
            }

            renderProducts(data.products);
            updatePaginationControls(data.page, data.total_pages);
        } catch (error) {
            console.error('Ошибка при получении товаров:', error);
            loadingMessage.classList.add('hidden');
            if (productsList) productsList.classList.remove('catalog-loading-soft');
            displayError(errorMessage, 'Произошла ошибка при загрузке товаров: ' + error.message);
            paginationDiv.classList.add('hidden');
        }
    }

    if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener('change', () => {
        loginPasswordInput.type = toggleLoginPassword.checked ? 'text' : 'password';
    });
    }

    function setTab(mode) {
        currentListMode = mode; // 'active' or 'archive'
        currentPage = 1;

    // кнопки вкладок
        if (tabActive && tabArchive) {
            tabActive.classList.toggle('tab-active', mode === 'active');
            tabArchive.classList.toggle('tab-active', mode === 'archive');
        }

    // кнопка "Добавить товар" только в обычном списке и только админу
        const isAdmin = currentUserRole === "admin";
        if (addProductBtn) {
            addProductBtn.style.display = (mode === 'active' && isAdmin) ? "inline-flex" : "none";
        }

    // грузим список
        loadProductsWithFilters(1);
    }

    if (tabActive) tabActive.addEventListener('click', () => setTab('active'));
    if (tabArchive) tabArchive.addEventListener('click', () => setTab('archive'));

    // Проверка статуса авторизации при загрузке страницы 
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth_status', {
                credentials: 'include'
            });

            if (!response.ok) {
                showAuthForms();
                return;
            }

            const data = await response.json();

            if (data.is_authenticated) {
                currentUserRole = data.role || "user";
                showLoggedInState(data.username);
                applyRoleUI();
            } else {
                currentUserRole = "user";
                showAuthForms();
            }
        } catch (error) {
            console.error('Ошибка проверки статуса авторизации:', error);
            currentUserRole = "user";
            showAuthForms();
        }
    }

    //Обработчики событий авторизации / регистрации 

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        hideError(loginErrorDiv);
        hideError(registerErrorDiv);
        if (authPanelTitle) authPanelTitle.textContent = 'Регистрация';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        hideError(loginErrorDiv);
        hideError(registerErrorDiv);
        if (authPanelTitle) authPanelTitle.textContent = 'Авторизация';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(loginErrorDiv);

        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                await checkAuthStatus();
            } else {
                displayError(loginErrorDiv, data.message || 'Ошибка входа.');
            }
        } catch (error) {
            console.error('Login error:', error);
            displayError(loginErrorDiv, 'Произошла ошибка при попытке входа.');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(registerErrorDiv);

        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            displayError(registerErrorDiv, 'Пароли не совпадают.');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showToast('Регистрация прошла успешно! Теперь вы можете войти.', 'success');
                showLoginLink.click(); 
                registerUsernameInput.value = '';
                registerPasswordInput.value = '';
                confirmPasswordInput.value = '';
            } else {
                displayError(registerErrorDiv, data.message || 'Ошибка регистрации.');
            }
        } catch (error) {
            console.error('Register error:', error);
            displayError(registerErrorDiv, 'Произошла ошибка при попытке регистрации.');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/logout', {
                credentials: 'include'
            });

            if (response.ok) {
                showAuthForms();
                productsList.innerHTML = '';
                showToast('Вы вышли из аккаунта.', 'success');
            } else {
                showToast('Не удалось выйти из аккаунта.', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Произошла ошибка при выходе.', 'error');
        }
    });

    if (confirmSyncBtn) {
        confirmSyncBtn.addEventListener('click', async () => {
            const overwriteManual = (overwriteManualCheckbox && overwriteManualCheckbox.checked) ? 1 : 0;
            const overwriteHidden = (overwriteHiddenCheckbox && overwriteHiddenCheckbox.checked) ? 1 : 0;

            closeSyncOptionsModal();

            // прячем сообщение "БД пустая", если было
            if (emptyDbMessage) emptyDbMessage.classList.add('hidden');

            hideError(errorMessage);
            loadingMessage.classList.remove('hidden');
            productsList.innerHTML = '';

            try {
                const url = `/api/products?overwrite_manual=${overwriteManual}&overwrite_hidden=${overwriteHidden}`;

                const response = await fetch(url, {
                    credentials: 'include'
                });

                if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}));
                    displayError(errorMessage, errorData.message || 'Вы не авторизованы. Пожалуйста, войдите.');
                    showAuthForms();
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }

                await response.json().catch(() => ({}));

                // после синхры — показываем актуальные (не архив)
                currentListMode = 'active';
                if (tabActive && tabArchive) {
                    tabActive.classList.add('tab-active');
                    tabArchive.classList.remove('tab-active');
                }

                await loadProductsWithFilters(1);
                await loadSyncLogs();
                filtersDiv.classList.remove('hidden');

            } catch (error) {
                console.error('Ошибка при синхронизации товаров:', error);
                displayError(errorMessage, 'Произошла ошибка при синхронизации: ' + error.message);
            } finally {
                loadingMessage.classList.add('hidden');

                // оставляем обе кнопки видимыми
                if (loadFromDbBtn) loadFromDbBtn.classList.toggle('hidden', currentUserRole !== 'admin');
                if (getProductsBtn) getProductsBtn.classList.remove('hidden');
            }
        });
    }

    window.loadProductDetail = loadProductDetail;

    // --- Синхронизация товаров с Ozon ---
    getProductsBtn.addEventListener('click', () => {
    if (overwriteManualCheckbox) overwriteManualCheckbox.checked = false;
    if (overwriteHiddenCheckbox) overwriteHiddenCheckbox.checked = false;

    if (syncOptionsModal) syncOptionsModal.classList.remove('hidden');
    });

    // Обработчики фильтров и пагинации
    applyFiltersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadProductsWithFilters(1);
    });

    prevPageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            loadProductsWithFilters(currentPage - 1);
        }
    });

    nextPageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            loadProductsWithFilters(currentPage + 1);
        }
    });

    addProductBtn.addEventListener('click', () => {
        modalMode = 'create';
        modalCurrentOfferId = null;

        modalTitle.textContent = 'Новый товар';
        modalNameInput.value = '';
        modalOfferIdInput.value = '';
        modalProductIdInput.value = '';
        modalPriceInput.value = '';

        if (modalStockInput) {
            modalStockInput.value = '';
            modalStockInput.classList.remove('out-of-stock'); 
        }

        modalImageUrlInput.value = '';
        modalLastSynced.textContent = '—';
        modalImage.style.display = 'none';

        updateCounter(modalNameInput, nameCounter, 120);
        if (modalImageUrlInput) updateCounter(modalImageUrlInput, urlCounter, 400);

        if (nameCounter) nameCounter.style.display = '';
        if (urlCounter) urlCounter.style.display = '';

        validateModalFormLive();

        applyRoleToModal();

        if (modalHistoryBtn) modalHistoryBtn.style.display = 'none';
        if (modalDeleteBtn) modalDeleteBtn.style.display = 'none';

        openProductModal();
    });

    modalSaveBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    hideModalError();

    const nameVal = modalNameInput.value.trim();
    const offerVal = modalOfferIdInput.value.trim();
    const productIdVal = modalProductIdInput.value.trim();
    const imageUrlVal = modalImageUrlInput.value.trim();
    const stockValRaw = modalStockInput ? modalStockInput.value.trim() : "";

    if (nameVal.length === 0) {
        showModalError('Название товара обязательно.');
        return;
    }
    if (nameVal.length > 120) {
        showModalError('Название слишком длинное. Максимум 120 символов.');
        return;
    }
    if (offerVal.length > 80) {
        showModalError('Offer ID слишком длинный. Максимум 80 символов.');
        return;
    }
    if (productIdVal.length > 20) {
        showModalError('Product ID слишком длинный. Максимум 20 символов.');
        return;
    }
    if (imageUrlVal.length > 400) {
        showModalError('URL изображения слишком длинный. Максимум 400 символов.');
        return;
    }
    if (stockValRaw.length > 0) {
        const n = Number(stockValRaw);
    if (!Number.isInteger(n) || n < 0) {
        showModalError('Остаток должен быть целым числом (0 или больше).');
        return;
    }
    }

    const payload = {
        name: modalNameInput.value.trim(),
        offer_id: modalOfferIdInput.value.trim() || null,
        product_id: modalProductIdInput.value.trim() || null,
        price: modalPriceInput.value !== '' ? parseFloat(modalPriceInput.value) : null,
        stock: (modalStockInput && modalStockInput.value !== '')
            ? parseInt(modalStockInput.value, 10)
            : null,
        image_url: modalImageUrlInput.value.trim() || null,
    };

    if (!payload.name) {
        showModalError('Название товара обязательно.');
        return;
    }

    try {
        let url;
        let method;

        if (modalMode === 'create') {
            url = '/api/products_local';
            method = 'POST';
        } else {
            url = `/api/products_local/${encodeURIComponent(modalCurrentOfferId)}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showToast(data.message || 'Ошибка при сохранении товара.', 'error');
            return;
        }

        closeProductModal();
        await loadProductsWithFilters(currentPage);
    } catch (err) {
        console.error('Ошибка при сохранении товара:', err);
        showToast('Произошла ошибка при сохранении товара.', 'error');
    }
    });

    modalDeleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!modalCurrentOfferId) {
        return;
    }

    const confirmed = await openConfirmModal({ title: 'Удаление товара', message: 'Вы действительно хотите переместить товар в архив?', confirmText: 'Удалить', confirmClass: 'danger-btn' });
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `/api/products_local/${encodeURIComponent(modalCurrentOfferId)}`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showToast(data.message || 'Ошибка при удалении товара.', 'error');
            return;
        }

        closeProductModal();
        await loadProductsWithFilters(currentPage);
    } catch (err) {
        console.error('Ошибка при удалении товара:', err);
        showToast('Произошла ошибка при удалении товара.', 'error');
    }
    });

    if (loadFromDbBtn) {
    loadFromDbBtn.addEventListener('click', async () => {
        hideError(errorMessage);
        if (emptyDbMessage) emptyDbMessage.classList.add('hidden');

        loadingMessage.classList.remove('hidden');

        const empty = await isDbEmpty();

        loadingMessage.classList.add('hidden');

        if (empty === true) {
            // База пустая — предлагаем синхронизацию
            if (emptyDbMessage) emptyDbMessage.classList.remove('hidden');
            getProductsBtn.classList.remove('hidden');
            productsContainer.classList.add('hidden');
            filtersDiv.classList.add('hidden');
            paginationDiv.classList.add('hidden');
            return;
        }

        if (empty === null) {
            displayError(errorMessage, 'Не удалось проверить базу данных. Попробуйте ещё раз.');
            return;
        }

        // В базе есть данные — показываем список
        await loadProductsWithFilters(1);
        await loadSyncLogs();
    });
    }


    checkAuthStatus();
});
