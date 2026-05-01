// Хранилище растений
let plants = [];
let completedTasksCount = 0;

// Загрузка данных из localStorage
function loadData() {
    const saved = localStorage.getItem('plants');
    if (saved) {
        plants = JSON.parse(saved);
    }
    
    const savedCompleted = localStorage.getItem('completedTasksWeek');
    const lastReset = localStorage.getItem('lastResetDate');
    const today = getToday();
    
    if (lastReset !== today) {
        completedTasksCount = 0;
        localStorage.setItem('lastResetDate', today);
    } else if (savedCompleted) {
        completedTasksCount = parseInt(savedCompleted);
    }
    
    renderAll();
}

// Сохранение в localStorage
function saveData() {
    localStorage.setItem('plants', JSON.stringify(plants));
    localStorage.setItem('completedTasksWeek', completedTasksCount.toString());
}

// Получить сегодняшнюю дату
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Добавление растения
function addPlant(event) {
    event.preventDefault();
    
    const today = getToday();
    
    const plant = {
        id: Date.now(),
        name: document.getElementById('name').value.trim(),
        species: document.getElementById('species').value.trim() || 'Не указан',
        wateringInterval: parseInt(document.getElementById('wateringInterval').value),
        fertilizingInterval: parseInt(document.getElementById('fertilizingInterval').value),
        repottingInterval: parseInt(document.getElementById('repottingInterval').value),
        lastWatered: document.getElementById('lastWatered').value || today,
        lastFertilized: document.getElementById('lastFertilized').value || today,
        lastRepotted: document.getElementById('lastRepotted').value || today,
        notes: document.getElementById('notes').value,
        createdAt: new Date().toISOString()
    };
    
    if (!plant.name) {
        alert('Пожалуйста, введите название растения');
        return;
    }
    
    plants.push(plant);
    saveData();
    renderAll();
    document.getElementById('plantForm').reset();
    
    // Показываем уведомление
    showNotification(`Растение "${plant.name}" добавлено!`, 'success');
}

// Получение напоминаний
function getReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminders = [];
    
    plants.forEach(plant => {
        // Полив
        const lastWatered = new Date(plant.lastWatered);
        const daysSinceWater = Math.floor((today - lastWatered) / (1000 * 60 * 60 * 24));
        if (daysSinceWater >= plant.wateringInterval) {
            reminders.push({
                plantId: plant.id,
                plantName: plant.name,
                type: 'Полив',
                emoji: '💧',
                daysOverdue: daysSinceWater - plant.wateringInterval,
                urgency: daysSinceWater - plant.wateringInterval >= 3
            });
        }
        
        // Подкормка
        const lastFertilized = new Date(plant.lastFertilized);
        const daysSinceFert = Math.floor((today - lastFertilized) / (1000 * 60 * 60 * 24));
        if (daysSinceFert >= plant.fertilizingInterval) {
            reminders.push({
                plantId: plant.id,
                plantName: plant.name,
                type: 'Подкормка',
                emoji: '🌿',
                daysOverdue: daysSinceFert - plant.fertilizingInterval,
                urgency: daysSinceFert - plant.fertilizingInterval >= 7
            });
        }
        
        // Пересадка
        const lastRepotted = new Date(plant.lastRepotted);
        const daysSinceRepot = Math.floor((today - lastRepotted) / (1000 * 60 * 60 * 24));
        if (daysSinceRepot >= plant.repottingInterval) {
            reminders.push({
                plantId: plant.id,
                plantName: plant.name,
                type: 'Пересадка',
                emoji: '🏺',
                daysOverdue: daysSinceRepot - plant.repottingInterval,
                urgency: daysSinceRepot - plant.repottingInterval >= 30
            });
        }
    });
    
    return reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// Выполнить задачу
function completeTask(plantId, taskType) {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
        const today = getToday();
        switch(taskType) {
            case 'Полив':
                plant.lastWatered = today;
                break;
            case 'Подкормка':
                plant.lastFertilized = today;
                break;
            case 'Пересадка':
                plant.lastRepotted = today;
                break;
        }
        
        completedTasksCount++;
        saveData();
        renderAll();
        showNotification(`✅ ${taskType} для "${plant.name}" отмечен!`, 'success');
    }
}

// Удалить растение
function deletePlant(id) {
    const plant = plants.find(p => p.id === id);
    if (confirm(`Вы уверены, что хотите удалить "${plant?.name}"?`)) {
        plants = plants.filter(p => p.id !== id);
        saveData();
        renderAll();
        showNotification(`Растение удалено`, 'info');
    }
}

// Открыть модальное окно
function editPlant(id) {
    const plant = plants.find(p => p.id === id);
    if (plant) {
        document.getElementById('editId').value = plant.id;
        document.getElementById('editName').value = plant.name;
        document.getElementById('editSpecies').value = plant.species;
        document.getElementById('editWateringInterval').value = plant.wateringInterval;
        document.getElementById('editFertilizingInterval').value = plant.fertilizingInterval;
        document.getElementById('editRepottingInterval').value = plant.repottingInterval;
        document.getElementById('editModal').style.display = 'block';
    }
}

// Сохранить изменения
function saveEdit(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const plant = plants.find(p => p.id === id);
    
    if (plant) {
        plant.name = document.getElementById('editName').value;
        plant.species = document.getElementById('editSpecies').value;
        plant.wateringInterval = parseInt(document.getElementById('editWateringInterval').value);
        plant.fertilizingInterval = parseInt(document.getElementById('editFertilizingInterval').value);
        plant.repottingInterval = parseInt(document.getElementById('editRepottingInterval').value);
        saveData();
        renderAll();
        closeModal();
        showNotification(`Изменения сохранены`, 'success');
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Показать уведомление
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        border-radius: 10px;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(plants, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plants_backup_${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Данные экспортированы!', 'success');
}

// Рендер растений
function renderPlants() {
    const container = document.getElementById('plantsList');
    if (plants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="emoji">🌱</span>
                <p>Пока нет растений</p>
                <small>Добавьте своё первое растение в форму справа</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = plants.map(plant => `
        <div class="plant-item">
            <div class="plant-header">
                <div>
                    <span class="plant-name">🌿 ${plant.name}</span>
                    <span class="plant-species">${plant.species}</span>
                </div>
            </div>
            <div class="plant-details">
                <div class="detail-item">
                    <span class="detail-label">💧 Полив:</span> каждые ${plant.wateringInterval} дн.
                </div>
                <div class="detail-item">
                    <span class="detail-label">🌿 Подкормка:</span> каждые ${plant.fertilizingInterval} дн.
                </div>
                <div class="detail-item">
                    <span class="detail-label">🏺 Пересадка:</span> каждые ${plant.repottingInterval} дн.
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Последний полив:</span> ${plant.lastWatered}
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Последняя подкормка:</span> ${plant.lastFertilized}
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Последняя пересадка:</span> ${plant.lastRepotted}
                </div>
            </div>
            ${plant.notes ? `<div class="plant-notes">📝 ${plant.notes}</div>` : ''}
            <div class="plant-actions">
                <button class="btn btn-primary" onclick="editPlant(${plant.id})">✏️ Редактировать</button>
                <button class="delete-btn btn" onclick="deletePlant(${plant.id})">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

// Рендер напоминаний
function renderReminders() {
    const reminders = getReminders();
    const container = document.getElementById('remindersList');
    
    if (reminders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="emoji">✨</span>
                <p>Все задачи выполнены!</p>
                <small>Отличная работа по уходу за растениями</small>
            </div>
        `;
        document.getElementById('pendingTasks').textContent = '0';
        return;
    }
    
    document.getElementById('pendingTasks').textContent = reminders.length;
    
    container.innerHTML = reminders.map(reminder => `
        <div class="reminder-item ${reminder.urgency ? 'urgent' : ''}">
            <div class="reminder-content">
                <div class="reminder-text">
                    ${reminder.emoji} ${reminder.type}: ${reminder.plantName}
                </div>
                <div class="reminder-date">
                    ${reminder.daysOverdue > 0 ? 
                        `<span class="reminder-urgent">⚠️ Просрочено на ${reminder.daysOverdue} дн.</span>` : 
                        'Нужно сделать сегодня'}
                </div>
            </div>
            <button class="complete-btn" onclick="completeTask(${reminder.plantId}, '${reminder.type}')">
                ✅ Выполнено
            </button>
        </div>
    `).join('');
}

// Обновить статистику
function updateStats() {
    document.getElementById('totalPlants').textContent = plants.length;
    document.getElementById('completedTasks').textContent = completedTasksCount;
}

// Полный рендер
function renderAll() {
    renderPlants();
    renderReminders();
    updateStats();
}

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Назначение обработчиков
document.getElementById('plantForm').addEventListener('submit', addPlant);
document.getElementById('editForm').addEventListener('submit', saveEdit);
document.getElementById('exportBtn')?.addEventListener('click', exportData);

// Закрытие модального окна
document.querySelector('.close')?.addEventListener('click', closeModal);
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Загрузка данных
loadData();

// Автообновление каждые 5 минут
setInterval(() => {
    renderReminders();
}, 300000);
